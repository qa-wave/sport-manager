import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import type { HonoEnv } from '../../types/hono';

/**
 * Public paths that bypass JWT verification.
 * Matched as prefix on the pathname after stripping /api/v1.
 */
const PUBLIC_PATHS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh',
  '/v1/auth/logout',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/health',
  '/v1/clubs/public',
  '/v1/rsvp',
  '/v1/stripe/webhook',
  '/v1/attend',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * JWT access token verification middleware.
 *
 * Uses `jose` (not `jsonwebtoken`) — runs in Node.js and Edge runtimes.
 * Verified payload is stored as c.var.user: { id, email }.
 * Public paths bypass verification completely.
 */
export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  // Strip /api prefix so pathname is /v1/...
  const url = new URL(c.req.url);
  const pathname = url.pathname.replace(/^\/api/, '');

  if (isPublicPath(pathname)) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  // Allow token via query param for SSE connections (EventSource cannot set headers)
  const queryToken = new URL(c.req.url).searchParams.get('token');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (queryToken ?? undefined);

  if (!token) {
    return c.json({ error: 'Unauthorized', message: 'Missing access token' }, 401);
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    console.error('[auth] JWT_ACCESS_SECRET env var not set');
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const sub = payload.sub as string;
    const email = payload['email'] as string;

    if (!sub || !email) {
      return c.json({ error: 'Unauthorized', message: 'Invalid token payload' }, 401);
    }

    c.set('user', { id: sub, email });
  } catch {
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired access token' }, 401);
  }

  return next();
});
