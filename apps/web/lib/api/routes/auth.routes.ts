import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { LoginInput, RegisterInput } from '@sport-manager/contracts';
import * as authService from '../services/auth.service';
import type { HonoEnv } from '../../types/hono';

const ForgotPasswordInput = z.object({
  email: z.string().email(),
});

const ResetPasswordInput = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Heslo musí mít alespoň 8 znaků'),
});

const COOKIE_NAME = 'club_rt';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function setRefreshCookie(c: { header: (k: string, v: string) => void }, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieValue = [
    `${COOKIE_NAME}=${refreshToken}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE}`,
    'SameSite=Lax',
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');
  c.header('Set-Cookie', cookieValue);
}

function clearRefreshCookie(c: { header: (k: string, v: string) => void }): void {
  const cookieValue = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax',
  ].join('; ');
  c.header('Set-Cookie', cookieValue);
}

function getRefreshTokenFromCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`));
  return match ? match.slice(COOKIE_NAME.length + 1) : undefined;
}

function getRequestCtx(req: Request): { ip?: string; userAgent?: string } {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? (forwarded.split(',')[0] ?? '').trim() : undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;
  return { ip, userAgent };
}

const auth = new Hono<HonoEnv>();

/**
 * POST /v1/auth/register
 */
auth.post('/register', zValidator('json', RegisterInput), async (c) => {
  const dto = c.req.valid('json');
  const ctx = getRequestCtx(c.req.raw);

  const { accessToken, refreshToken } = await authService.register(dto, ctx);
  setRefreshCookie(c, refreshToken);

  return c.json({ accessToken }, 201);
});

/**
 * POST /v1/auth/login
 */
auth.post('/login', zValidator('json', LoginInput), async (c) => {
  const dto = c.req.valid('json');
  const ctx = getRequestCtx(c.req.raw);

  const { accessToken, refreshToken } = await authService.login(dto, ctx);
  setRefreshCookie(c, refreshToken);

  return c.json({ accessToken });
});

/**
 * POST /v1/auth/refresh
 * Reads the refresh token from the httpOnly cookie.
 */
auth.post('/refresh', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  const refreshToken = getRefreshTokenFromCookie(cookieHeader);

  if (!refreshToken) {
    return c.json({ error: 'Unauthorized', message: 'Missing refresh token' }, 401);
  }

  const ctx = getRequestCtx(c.req.raw);
  const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(
    refreshToken,
    ctx,
  );
  setRefreshCookie(c, newRefreshToken);

  return c.json({ accessToken });
});

/**
 * POST /v1/auth/logout
 * Idempotent — always 204, even if session was already gone.
 */
auth.post('/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  const refreshToken = getRefreshTokenFromCookie(cookieHeader);
  await authService.logout(refreshToken);
  clearRefreshCookie(c);
  return c.body(null, 204);
});

/**
 * POST /v1/auth/forgot-password
 * Always returns 200 to avoid email enumeration.
 */
auth.post('/forgot-password', zValidator('json', ForgotPasswordInput), async (c) => {
  const { email } = c.req.valid('json');
  await authService.forgotPassword(email);
  return c.json({ message: 'Pokud účet existuje, poslali jsme vám email s odkazem pro reset hesla.' });
});

/**
 * POST /v1/auth/reset-password
 */
auth.post('/reset-password', zValidator('json', ResetPasswordInput), async (c) => {
  const { token, password } = c.req.valid('json');
  await authService.resetPassword(token, password);
  return c.json({ message: 'Heslo bylo úspěšně změněno.' });
});

export { auth as authRoutes };
