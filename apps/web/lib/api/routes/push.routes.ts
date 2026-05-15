/**
 * /v1/push — web push subscription management (VAPID)
 *
 * GET  /v1/push/vapid-key        — returns the public VAPID key (public endpoint)
 * POST /v1/push/subscribe        — saves a PushSubscription for the current user
 * POST /v1/push/unsubscribe      — removes a PushSubscription by endpoint
 */
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

const push = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// GET /v1/push/vapid-key
// Public — called by the frontend before subscribing.
// ---------------------------------------------------------------------------
push.get('/vapid-key', (c) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? null;
  if (!publicKey) {
    return c.json({ error: 'Not Configured', message: 'VAPID not set up on this server' }, 503);
  }
  return c.json({ publicKey });
});

// ---------------------------------------------------------------------------
// POST /v1/push/subscribe
// Authenticated — saves the browser push subscription for the current user.
// Body: { endpoint, keys: { p256dh, auth } }
// ---------------------------------------------------------------------------
const SubscribeInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

push.post('/subscribe', requireAuth(), zValidator('json', SubscribeInput), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized', message: 'Not authenticated' }, 401);
  }

  const { endpoint, keys } = c.req.valid('json');

  // Upsert: if the endpoint already exists for this user, update keys.
  // If it exists for a *different* user (browser recycled), delete and recreate.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.pushSubscription.findUnique({ where: { endpoint } });

    if (existing && existing.userId !== user.id) {
      await tx.pushSubscription.delete({ where: { endpoint } });
    }

    await tx.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });
  });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /v1/push/unsubscribe
// Authenticated — removes the push subscription by endpoint.
// Body: { endpoint }
// ---------------------------------------------------------------------------
const UnsubscribeInput = z.object({
  endpoint: z.string().url(),
});

push.post('/unsubscribe', requireAuth(), zValidator('json', UnsubscribeInput), async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized', message: 'Not authenticated' }, 401);
  }

  const { endpoint } = c.req.valid('json');

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });

  return c.json({ ok: true });
});

export { push as pushRoutes };
