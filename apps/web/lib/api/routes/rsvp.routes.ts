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
// Shared helper — verify and decode the RSVP token.
// ---------------------------------------------------------------------------
async function decodeRsvpToken(token: string) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('misconfigured');

  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  if (
    payload['purpose'] !== 'rsvp' ||
    typeof payload['eventId'] !== 'string' ||
    typeof payload['memberId'] !== 'string' ||
    typeof payload['status'] !== 'string'
  ) {
    throw new Error('invalid payload');
  }
  return {
    eventId: payload['eventId'] as string,
    memberId: payload['memberId'] as string,
    status: payload['status'] as string,
  };
}

// ---------------------------------------------------------------------------
// GET /v1/rsvp/:token
// Public endpoint — verifies the magic-link JWT and returns event info
// WITHOUT recording the RSVP yet (user must confirm via POST).
// ---------------------------------------------------------------------------
rsvp.get('/:token', async (c) => {
  const token = c.req.param('token');

  try {
    const { eventId, status } = await decodeRsvpToken(token);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, startsAt: true, endsAt: true, location: true },
    });

    if (!event) {
      return c.json({ error: 'Not Found', message: 'Událost nebyla nalezena' }, 404);
    }

    return c.json({
      success: true,
      eventTitle: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location ?? null,
      suggestedStatus: status,
    });
  } catch {
    return c.json(
      { error: 'Bad Request', message: 'Odkaz je neplatný nebo vypršel' },
      400,
    );
  }
});

// ---------------------------------------------------------------------------
// POST /v1/rsvp/:token
// Public endpoint — records the RSVP with the status supplied in the body
// (or falls back to the status embedded in the token).
// ---------------------------------------------------------------------------
rsvp.post('/:token', async (c) => {
  const token = c.req.param('token');

  let decoded: { eventId: string; memberId: string; status: string };
  try {
    decoded = await decodeRsvpToken(token);
  } catch {
    return c.json(
      { error: 'Bad Request', message: 'Odkaz je neplatný nebo vypršel' },
      400,
    );
  }

  // Allow the caller to override the status (e.g. user clicked a different button)
  let chosenStatus = decoded.status;
  try {
    const body = await c.req.json<{ status?: string }>();
    if (body.status && ['YES', 'NO', 'MAYBE'].includes(body.status)) {
      chosenStatus = body.status;
    }
  } catch {
    // body is optional — ignore parse errors
  }

  const event = await prisma.event.findUnique({
    where: { id: decoded.eventId },
    select: { id: true, title: true, clubId: true },
  });

  if (!event) {
    return c.json({ error: 'Not Found', message: 'Událost nebyla nalezena' }, 404);
  }

  await prisma.withClub(event.clubId, async (tx) => {
    await tx.eventAttendance.upsert({
      where: { eventId_memberId: { eventId: decoded.eventId, memberId: decoded.memberId } },
      create: {
        eventId: decoded.eventId,
        memberId: decoded.memberId,
        respondedById: decoded.memberId,
        status: chosenStatus as any,
        note: null,
      },
      update: {
        respondedById: decoded.memberId,
        status: chosenStatus as any,
        respondedAt: new Date(),
      },
    });
  });

  return c.json({
    success: true,
    eventTitle: event.title,
    status: chosenStatus,
  });
});

export { rsvp as rsvpRoutes };
