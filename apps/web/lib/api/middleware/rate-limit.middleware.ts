import { createMiddleware } from 'hono/factory';
import { cache } from '../redis';
import type { HonoEnv } from '../../types/hono';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  const forwarded = c.req.header('x-forwarded-for');
  return forwarded ? (forwarded.split(',')[0] ?? 'unknown').trim() : 'unknown';
}

/**
 * Sliding-window counter in the shared cache. Returns true if the request is
 * within the limit, false if it should be rejected.
 */
async function consume(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const raw = await cache.get(key);
  let entry: { count: number; resetAt: number } | null = null;
  if (raw) {
    try {
      entry = JSON.parse(raw);
    } catch {
      entry = null;
    }
  }

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowSeconds * 1000 };
  } else {
    entry.count++;
  }

  const remainingMs = Math.max(entry.resetAt - now, 1000);
  await cache.set(key, JSON.stringify(entry), Math.ceil(remainingMs / 1000));
  return entry.count <= max;
}

/**
 * Global rate limiter — backed by Vercel Runtime Cache (shared per region),
 * with in-memory fallback. Per-IP, sliding 60s window, 100 req.
 */
export const rateLimitMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  try {
    const ok = await consume(`rl:ip:${clientIp(c)}`, MAX_REQUESTS, WINDOW_SECONDS);
    if (!ok) {
      return c.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again in a minute.' },
        429,
      );
    }
  } catch {
    // Rate limiter must never crash — if the store fails, just pass through
  }
  return next();
});

/**
 * Strict per-endpoint limiter for sensitive auth flows (login, register,
 * password reset). Mitigates credential brute-force and email/SMTP flooding.
 *
 * NOTE: keyed on x-forwarded-for, which an attacker behind a non-Vercel proxy
 * could spoof. On Vercel the edge overwrites this header, so it's trustworthy
 * in prod; for defense-in-depth pair with Arcjet/WAF (see ARCJET_MODE=LIVE).
 */
export function strictRateLimit(opts: { max: number; windowSeconds: number; name: string }) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    try {
      const ok = await consume(
        `rl:${opts.name}:${clientIp(c)}`,
        opts.max,
        opts.windowSeconds,
      );
      if (!ok) {
        return c.json(
          { error: 'Too Many Requests', message: 'Příliš mnoho pokusů. Zkuste to za chvíli znovu.' },
          429,
        );
      }
    } catch {
      // fail-open — never block legitimate traffic on limiter failure
    }
    return next();
  });
}
