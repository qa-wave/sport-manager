import { createMiddleware } from 'hono/factory';
import { cache } from '../redis';
import type { HonoEnv } from '../../types/hono';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

/**
 * Rate limiter — backed by Vercel Runtime Cache (shared per region),
 * with in-memory fallback. Per-IP, sliding 60s window.
 *
 * Cache key: `rl:ip:<ip>` → JSON { count, resetAt }
 */
export const rateLimitMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  try {
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded ? (forwarded.split(',')[0] ?? 'unknown').trim() : 'unknown';
    const now = Date.now();
    const key = `rl:ip:${ip}`;

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
      entry = { count: 1, resetAt: now + WINDOW_SECONDS * 1000 };
    } else {
      entry.count++;
    }

    const remainingMs = Math.max(entry.resetAt - now, 1000);
    await cache.set(key, JSON.stringify(entry), Math.ceil(remainingMs / 1000));

    if (entry.count > MAX_REQUESTS) {
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
