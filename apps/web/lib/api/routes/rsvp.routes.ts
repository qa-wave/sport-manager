import { Hono } from 'hono';
import { jwtVerify } from 'jose';
import { prisma } from '../prisma';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/rsvp — public magic-link RSVP handler.
 * No auth required — the JWT in the URL is the credential.
 */
const rsvp = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// GET /v1/rsvp/:token
// Public endpoint — verifies the magic-link JWT and upserts attendance.
// ---------------------------------------------------------------------------
rsvp.get('/:token', async (c) => {
  const token = c.req.param('token');

  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  let eventId: string;
  let memberId: string;
  let status: string;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (
      payload['purpose'] !== 'rsvp' ||
      typeof payload['eventId'] !== 'string' ||
      typeof payload['memberId'] !== 'string' ||
      typeof payload['status'] !== 'string'
    ) {
      throw new Error('invalid payload');
    }
    eventId = payload['eventId'];
    memberId = payload['memberId'];
    status = payload['status'];
  } catch {
    return c.json(
      { error: 'Bad Request', message: 'Odkaz je neplatný nebo vypršel' },
      400,
    );
  }

  // Fetch event to get clubId for RLS context
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, clubId: true, startsAt: true },
  });

  if (!event) {
    return c.json({ error: 'Not Found', message: 'Událost nebyla nalezena' }, 404);
  }

  await prisma.withClub(event.clubId, async (tx) => {
    await tx.eventAttendance.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: {
        eventId,
        memberId,
        respondedById: memberId,
        status: status as any,
        note: null,
      },
      update: {
        respondedById: memberId,
        status: status as any,
        respondedAt: new Date(),
      },
    });
  });

  return c.json({
    success: true,
    eventTitle: event.title,
    status,
  });
});

export { rsvp as rsvpRoutes };
