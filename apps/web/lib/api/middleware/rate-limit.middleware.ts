import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../../types/hono';

const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

// Cleanup expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 60_000);

export const rateLimitMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const forwarded = c.req.header('x-forwarded-for');
  const ip = forwarded ? (forwarded.split(',')[0] ?? 'unknown').trim() : 'unknown';
  const now = Date.now();

  let entry = store.get(ip);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, entry);
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return c.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again in a minute.' },
      429,
    );
  }

  return next();
});
