import { randomBytes, createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '../prisma';
import type { LoginInput, RegisterInput } from '@sport-manager/contracts';
import { APP_BASE_URL } from '../../constants';
import { sendEmail } from './email.service';

const BCRYPT_ROUNDS = 12;
const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET env var not set');
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET env var not set');
  return new TextEncoder().encode(secret);
}

/**
 * Hash the refresh token for at-rest storage.
 * SHA-256 is appropriate because the token itself is already high-entropy
 * (JWT-signed); we're guarding against DB-leak reuse, not offline cracking.
 */
function hashRefresh(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function randomId(length = 32): string {
  return randomBytes(length).toString('hex');
}

// ---------------------------------------------------------------------------
// issueTokens — create session, sign JWT access + refresh tokens.
// ---------------------------------------------------------------------------
async function issueTokens(
  userId: string,
  email: string,
  ctx: { ip?: string; userAgent?: string },
) {
  // Sign access token
  const accessToken = await new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getAccessSecret());

  // Pre-generate session id so we can sign the refresh token with `sid`
  // BEFORE writing the row — no orphan 'pending' sessions if anything fails.
  const sessionId = randomId();

  const refreshToken = await new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getRefreshSecret());

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshHash: hashRefresh(refreshToken),
      userAgent: ctx.userAgent,
      ip: ctx.ip,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

// ---------------------------------------------------------------------------
// register — hash password, create user, issue tokens.
// ---------------------------------------------------------------------------
export async function register(
  dto: RegisterInput,
  ctx: { ip?: string; userAgent?: string },
) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), {
      statusCode: 409,
      code: 'EMAIL_CONFLICT',
    });
  }

  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    },
  });

  return issueTokens(user.id, user.email, ctx);
}

// ---------------------------------------------------------------------------
// login — verify credentials, issue tokens.
// ---------------------------------------------------------------------------
export async function login(
  dto: LoginInput,
  ctx: { ip?: string; userAgent?: string },
) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  // Same error for both to avoid user enumeration.
  if (!user || !user.passwordHash) {
    throw Object.assign(new Error('Invalid credentials'), {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  const ok = await bcrypt.compare(dto.password, user.passwordHash);
  if (!ok) {
    throw Object.assign(new Error('Invalid credentials'), {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  return issueTokens(user.id, user.email, ctx);
}

// ---------------------------------------------------------------------------
// refresh — verify RT, detect reuse, rotate.
// ---------------------------------------------------------------------------
export async function refresh(
  refreshToken: string,
  ctx: { ip?: string; userAgent?: string },
) {
  let payload: { sub: string; sid: string };
  try {
    const result = await jwtVerify(refreshToken, getRefreshSecret());
    payload = result.payload as { sub: string; sid: string };
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), {
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.userId !== payload.sub) {
    throw Object.assign(new Error('Session not found'), {
      statusCode: 401,
      code: 'SESSION_NOT_FOUND',
    });
  }
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw Object.assign(new Error('Session expired'), {
      statusCode: 401,
      code: 'SESSION_EXPIRED',
    });
  }

  const presentedHash = hashRefresh(refreshToken);
  if (presentedHash !== session.refreshHash) {
    // Token reuse detected — nuke all sessions for this user as precaution.
    console.warn(
      `[auth] Refresh reuse detected for user ${session.userId}; revoking all sessions`,
    );
    await prisma.session.deleteMany({ where: { userId: session.userId } });
    throw Object.assign(new Error('Refresh token reuse detected'), {
      statusCode: 401,
      code: 'REFRESH_REUSE',
    });
  }

  // Delete the consumed session before issuing new tokens (rotation).
  await prisma.session.delete({ where: { id: session.id } });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    throw Object.assign(new Error('User no longer exists'), {
      statusCode: 401,
      code: 'USER_NOT_FOUND',
    });
  }

  return issueTokens(user.id, user.email, ctx);
}

// ---------------------------------------------------------------------------
// forgotPassword — issue a short-lived reset JWT (no DB changes needed).
// ---------------------------------------------------------------------------
export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always succeed — don't reveal whether the email exists.
  if (!user) return;

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET env var not set');

  const resetToken = await new SignJWT({ sub: user.id, purpose: 'reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));

  const resetUrl = `${APP_BASE_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: 'Obnova hesla — Sport Manager',
    html: `
      <h2>Obnovení hesla</h2>
      <p>Obdrželi jsme žádost o reset hesla pro váš účet.</p>
      <p><a href="${resetUrl}" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Nastavit nové heslo</a></p>
      <p style="color:#666;font-size:12px">Odkaz je platný 1 hodinu. Pokud jste o reset nežádali, tento email ignorujte.</p>
      <p style="color:#666;font-size:12px">Nebo zkopírujte odkaz: ${resetUrl}</p>
    `,
  });
}

// ---------------------------------------------------------------------------
// resetPassword — verify reset JWT, update password, invalidate sessions.
// ---------------------------------------------------------------------------
export async function resetPassword(token: string, password: string): Promise<void> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET env var not set');

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload['purpose'] !== 'reset' || !payload.sub) {
      throw new Error('invalid purpose');
    }
    userId = payload.sub as string;
  } catch {
    throw Object.assign(new Error('Neplatný nebo vypršelý token pro reset hesla'), {
      statusCode: 400,
      code: 'INVALID_RESET_TOKEN',
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Update password and invalidate all existing sessions atomically.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);
}

// ---------------------------------------------------------------------------
// logout — idempotent session delete.
// ---------------------------------------------------------------------------
export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  try {
    const result = await jwtVerify(refreshToken, getRefreshSecret());
    const payload = result.payload as { sid?: string };
    if (payload.sid) {
      await prisma.session.deleteMany({ where: { id: payload.sid } });
    }
  } catch {
    // Silently ignore — logout is idempotent.
  }
}
