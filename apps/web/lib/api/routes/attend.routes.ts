import { Hono } from 'hono';
import { jwtVerify } from 'jose';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/attend — QR-code attendance check-in.
 *
 * POST /v1/attend/:token (requires auth)
 * Verifies the QR JWT and marks the authenticated user's member as attended.
 */
const attend = new Hono<HonoEnv>();

attend.post('/:token', requireAuth(), async (c) => {
  const token = c.req.param('token');
  const member = c.get('member');
  const clubId = c.get('clubId');

  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  let eventId: string;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (
      payload['purpose'] !== 'attend' ||
      typeof payload['eventId'] !== 'string'
    ) {
      throw new Error('invalid payload');
    }
    eventId = payload['eventId'];
  } catch {
    return c.json(
      { error: 'Bad Request', message: 'Neplatný nebo expirovaný kód' },
      400,
    );
  }

  const event = await prisma.withClub(clubId, (tx) =>
    tx.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, clubId: true, endsAt: true },
    }),
  );

  if (!event) {
    return c.json({ error: 'Not Found', message: 'Událost nebyla nalezena' }, 404);
  }

  // Defense-in-depth: RLS already scopes to clubId, but verify explicitly.
  if (event.clubId !== clubId) {
    return c.json({ error: 'Forbidden', message: 'Neplatný kód pro tento klub' }, 403);
  }

  await prisma.withClub(clubId, async (tx) => {
    await tx.eventAttendance.upsert({
      where: { eventId_memberId: { eventId, memberId: member.memberId } },
      create: {
        eventId,
        memberId: member.memberId,
        respondedById: member.memberId,
        status: 'YES',
        attended: true,
        note: null,
      },
      update: {
        status: 'YES',
        attended: true,
        respondedAt: new Date(),
      },
    });
  });

  return c.json({
    success: true,
    eventTitle: event.title,
  });
});

export { attend as attendRoutes };
