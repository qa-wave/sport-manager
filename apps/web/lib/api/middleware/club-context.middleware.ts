import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../../types/hono';

/**
 * Extract `x-club-id` header and store in context.
 * Must run after authMiddleware so that authenticated requests
 * carry their club scope into route handlers.
 *
 * The header is optional — some routes (e.g. /me, /platform-admin)
 * don't need a club scope. Route-level middleware (requireAuth / requireRole)
 * will assert clubId presence when needed.
 */
export const clubContextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const clubId = c.req.header('x-club-id');
  if (clubId) {
    c.set('clubId', clubId);
  }
  return next();
});
