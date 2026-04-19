import { randomBytes, createHash } from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './dto/auth.dto';
import type { JwtAccessPayload, JwtRefreshPayload } from './types';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------- register ----------
  async register(dto: RegisterDto, ctx: { ip?: string; userAgent?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.issueTokens(user.id, user.email, ctx);
  }

  // ---------- login ----------
  async login(dto: LoginDto, ctx: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      // Same error for both to avoid user enumeration.
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, ctx);
  }

  // ---------- refresh (rotation) ----------
  async refresh(refreshToken: string, ctx: { ip?: string; userAgent?: string }) {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Session not found');
    }
    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Session expired');
    }

    const presentedHash = AuthService.hashRefresh(refreshToken);
    if (presentedHash !== session.refreshHash) {
      // Token reuse detected — nuke all sessions for this user as a precaution.
      this.logger.warn(`Refresh reuse detected for user ${session.userId}; revoking all sessions`);
      await this.prisma.session.deleteMany({ where: { userId: session.userId } });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    // Delete the consumed session before issuing new tokens (rotation).
    await this.prisma.session.delete({ where: { id: session.id } });

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');

    return this.issueTokens(user.id, user.email, ctx);
  }

  // ---------- logout ----------
  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      await this.prisma.session.deleteMany({ where: { id: payload.sid } });
    } catch {
      // Silently ignore — logout should be idempotent.
    }
  }

  // ---------- helpers ----------
  private async issueTokens(
    userId: string,
    email: string,
    ctx: { ip?: string; userAgent?: string },
  ) {
    const accessPayload: JwtAccessPayload = { sub: userId, email };
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    });

    // Create a session row FIRST so we can bake its id into the refresh token.
    // Use a placeholder hash and patch it after signing.
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshHash: 'pending',
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const refreshPayload: JwtRefreshPayload = { sub: userId, sid: session.id };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '30d',
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash: AuthService.hashRefresh(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Hash the refresh token for at-rest storage. SHA-256 is appropriate
   * because the token itself is already high-entropy (JWT-signed); we're
   * guarding against DB-leak reuse, not offline cracking.
   */
  private static hashRefresh(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Generate a CSRF-style random id (unused for now but handy for future flows). */
  static randomId(length = 32): string {
    return randomBytes(length).toString('hex');
  }
}
