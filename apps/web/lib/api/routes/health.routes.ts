import { Hono } from 'hono';
import { prisma } from '../prisma';
import type { HonoEnv } from '../../types/hono';

const health = new Hono<HonoEnv>();

/**
 * GET /v1/health — liveness + DB connectivity check.
 * Public — no auth required.
 */
health.get('/', async (c) => {
  let db: 'ok' | 'down' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'down';
  }
  return c.json({ status: 'ok', db, ts: new Date().toISOString() });
});

export { health as healthRoutes };
