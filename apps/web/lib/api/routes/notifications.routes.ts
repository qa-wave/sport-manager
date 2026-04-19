import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/notifications — list, unread count, mark read.
 * Ported from apps/api/src/notifications/notifications.service.ts.
 */
const notifications = new Hono<HonoEnv>();

notifications.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// GET /v1/notifications
// List notifications for the current member, newest first.
// ---------------------------------------------------------------------------
notifications.get('/', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const unreadOnly = c.req.query('unreadOnly') === 'true';
  const limitParam = c.req.query('limit');
  const cursor = c.req.query('cursor');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const where: Record<string, unknown> = { memberId: member.memberId };
    if (unreadOnly) where.read = false;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const items = await tx.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
      })),
      hasMore: items.length === limit,
      nextCursor:
        items.length > 0
          ? items[items.length - 1]!.createdAt.toISOString()
          : null,
    };
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /v1/notifications/unread-count
// ---------------------------------------------------------------------------
notifications.get('/unread-count', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const count = await tx.notification.count({
      where: { memberId: member.memberId, read: false },
    });
    return { count };
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PATCH /v1/notifications/:notificationId/read
// ---------------------------------------------------------------------------
notifications.patch('/:notificationId/read', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const notificationId = c.req.param('notificationId');

  await prisma.withClub(member.clubId, async (tx) => {
    await tx.notification.updateMany({
      where: { id: notificationId, memberId: member.memberId },
      data: { read: true },
    });
  });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// PATCH /v1/notifications/read-all
// ---------------------------------------------------------------------------
notifications.patch('/read-all', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const res = await tx.notification.updateMany({
      where: { memberId: member.memberId, read: false },
      data: { read: true },
    });
    return { marked: res.count };
  });

  return c.json(result);
});

export { notifications as notificationsRoutes };
