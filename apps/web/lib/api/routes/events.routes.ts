import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  CreateEventInput,
  UpdateEventInput,
  RsvpInput,
  MarkAttendanceInput,
} from '@branik/contracts';
import { prisma } from '../prisma';
import {
  requireAuth,
  requireRole,
  canActOnBehalfOf,
} from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';
import type { MemberContext } from '../../types/hono';

/**
 * /v1/events — event CRUD, RSVP, attendance, detach.
 * Ported from apps/api/src/events/events.service.ts + events.controller.ts.
 */
const events = new Hono<HonoEnv>();

events.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// Helpers (ported from events.service.ts)
// ---------------------------------------------------------------------------
function buildRsvpSummary(
  attendances: Array<{ status: string }>,
): { yes: number; no: number; maybe: number; pending: number; total: number } {
  const summary = { yes: 0, no: 0, maybe: 0, pending: 0, total: attendances.length };
  for (const a of attendances) {
    if (a.status === 'YES') summary.yes++;
    else if (a.status === 'NO') summary.no++;
    else if (a.status === 'MAYBE') summary.maybe++;
    else summary.pending++;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// GET /v1/events
// ---------------------------------------------------------------------------
events.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const from = c.req.query('from');
  const to = c.req.query('to');
  const teamId = c.req.query('teamId');

  const result = await prisma.withClub(clubId, async (tx) => {
    const where: Record<string, unknown> = {};
    if (from || to) {
      where.startsAt = {};
      if (from) (where.startsAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.startsAt as Record<string, unknown>).lte = new Date(to);
    }
    if (teamId) where.teamId = teamId;

    const eventList = await tx.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        team: { select: { id: true, name: true } },
        attendances: { select: { status: true } },
      },
    });

    return eventList.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      location: e.location,
      teamId: e.teamId,
      teamName: e.team?.name ?? null,
      opponent: e.opponent,
      homeAway: e.homeAway,
      rsvpSummary: buildRsvpSummary(e.attendances),
    }));
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /v1/events/:eventId
// ---------------------------------------------------------------------------
events.get('/:eventId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }
  const eventId = c.req.param('eventId');

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: {
        team: { select: { id: true, name: true } },
        createdBy: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!event) return null;

    // Get all team members to show who hasn't responded
    let allTeamMembers: Array<{ id: string; firstName: string; lastName: string }> = [];
    if (event.teamId) {
      const memberships = await tx.teamMembership.findMany({
        where: { teamId: event.teamId, leftAt: null },
        select: {
          member: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      allTeamMembers = memberships.map((m) => ({
        id: m.member.id,
        firstName: m.member.user.firstName,
        lastName: m.member.user.lastName,
      }));
    }

    // Build attendee map from existing RSVPs
    const attendanceMap = new Map(
      event.attendances.map((a) => [
        a.memberId,
        {
          memberId: a.memberId,
          name: `${a.member.user.firstName} ${a.member.user.lastName}`,
          status: a.status,
          note: a.note,
          respondedAt: a.respondedAt,
          attended: a.attended,
        },
      ]),
    );

    // Merge: all team members + RSVPs from non-team members
    const attendees: Array<{
      memberId: string;
      name: string;
      status: string;
      note: string | null;
      respondedAt: Date | null;
      attended: boolean | null;
    }> = [];

    for (const tm of allTeamMembers) {
      const existing = attendanceMap.get(tm.id);
      if (existing) {
        attendees.push(existing);
        attendanceMap.delete(tm.id);
      } else {
        attendees.push({
          memberId: tm.id,
          name: `${tm.firstName} ${tm.lastName}`,
          status: 'PENDING',
          note: null,
          respondedAt: null,
          attended: null,
        });
      }
    }
    // Add any RSVPs from members not currently on the team roster
    for (const remaining of attendanceMap.values()) {
      attendees.push(remaining);
    }

    return {
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      locationUrl: event.locationUrl,
      teamId: event.teamId,
      teamName: event.team?.name ?? null,
      opponent: event.opponent,
      homeAway: event.homeAway,
      rsvpDeadline: event.rsvpDeadline,
      createdBy: `${event.createdBy.user.firstName} ${event.createdBy.user.lastName}`,
      rsvpSummary: buildRsvpSummary(attendees),
      attendees,
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /v1/events
// ---------------------------------------------------------------------------
events.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'),
  zValidator('json', CreateEventInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.create({
        data: {
          clubId: member.clubId,
          createdById: member.memberId,
          teamId: input.teamId ?? null,
          type: input.type as any,
          title: input.title,
          description: input.description,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          location: input.location,
          locationUrl: input.locationUrl,
          opponent: input.opponent,
          homeAway: input.homeAway as any,
          rsvpDeadline: input.rsvpDeadline ? new Date(input.rsvpDeadline) : null,
        },
      });
      return { id: event.id };
    });

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/events/:eventId
// ---------------------------------------------------------------------------
events.patch(
  '/:eventId',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', UpdateEventInput),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');
    const input = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.type !== undefined) data.type = input.type;
      if (input.teamId !== undefined) data.teamId = input.teamId;
      if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
      if (input.endsAt !== undefined) data.endsAt = new Date(input.endsAt);
      if (input.location !== undefined) data.location = input.location;
      if (input.locationUrl !== undefined) data.locationUrl = input.locationUrl;
      if (input.opponent !== undefined) data.opponent = input.opponent;
      if (input.homeAway !== undefined) data.homeAway = input.homeAway;
      if (input.rsvpDeadline !== undefined) {
        data.rsvpDeadline = input.rsvpDeadline ? new Date(input.rsvpDeadline) : null;
      }

      // Implicit detach: if this event came from a training template and
      // the caller moved its start/end time, mark it as manually adjusted
      // so the next template regeneration leaves it alone.
      if (event.templateId && !event.detached) {
        const movedStart =
          input.startsAt !== undefined &&
          new Date(input.startsAt).getTime() !== event.startsAt.getTime();
        const movedEnd =
          input.endsAt !== undefined &&
          new Date(input.endsAt).getTime() !== event.endsAt.getTime();
        if (movedStart || movedEnd) {
          data.detached = true;
        }
      }

      await tx.event.update({ where: { id: eventId }, data });
      return { id: eventId };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.json(result);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/rsvp
// ---------------------------------------------------------------------------
events.post('/:eventId/rsvp', requireAuth(), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');

  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const eventId = c.req.param('eventId');
  const body = await c.req.json();
  const input = RsvpInput.parse({ ...body, eventId });

  // Check authorization: self or guardian with canRsvp
  if (member.memberId !== input.memberId) {
    if (!canActOnBehalfOf(member as MemberContext, input.memberId, 'canRsvp')) {
      return c.json(
        { error: 'Forbidden', message: 'You cannot RSVP on behalf of this member' },
        403,
      );
    }
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
      throw Object.assign(new Error('RSVP deadline has passed'), {
        statusCode: 400,
        code: 'RSVP_DEADLINE_PASSED',
      });
    }

    await tx.eventAttendance.upsert({
      where: { eventId_memberId: { eventId, memberId: input.memberId } },
      create: {
        eventId,
        memberId: input.memberId,
        respondedById: member.memberId,
        status: input.status as any,
        note: input.note ?? null,
      },
      update: {
        respondedById: member.memberId,
        status: input.status as any,
        note: input.note ?? null,
        respondedAt: new Date(),
      },
    });

    return { ok: true };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PATCH /v1/events/:eventId/attendance
// ---------------------------------------------------------------------------
events.patch(
  '/:eventId/attendance',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  zValidator('json', MarkAttendanceInput),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');
    const { attendances } = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      for (const { memberId, attended } of attendances) {
        await tx.eventAttendance.upsert({
          where: { eventId_memberId: { eventId, memberId } },
          create: {
            eventId,
            memberId,
            respondedById: memberId,
            status: 'PENDING',
            attended,
          },
          update: { attended },
        });
      }

      return { ok: true };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.json(result);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/detach
// Flips detached=true. templateId stays for audit trail.
// ---------------------------------------------------------------------------
events.post(
  '/:eventId/detach',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      // If event belongs to a team, check team access
      if (event.teamId) {
        const hasTeamAccess =
          member.clubRoles.some((r) => ['ADMIN', 'OWNER'].includes(r)) ||
          member.teamRoles.some(
            (tr) =>
              tr.teamId === event.teamId &&
              ['HEAD_COACH', 'TEAM_MANAGER'].includes(tr.role),
          );
        if (!hasTeamAccess) {
          throw Object.assign(
            new Error('You do not have permission to detach events from this team'),
            { statusCode: 403, code: 'FORBIDDEN' },
          );
        }
      }

      await tx.event.update({
        where: { id: eventId },
        data: { detached: true },
      });

      return { ok: true };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.json(result);
  },
);

export { events as eventsRoutes };
