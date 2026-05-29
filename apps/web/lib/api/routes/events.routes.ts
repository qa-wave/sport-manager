import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SignJWT } from 'jose';
import { EventType, HomeAway, RSVPStatus } from '@prisma/client';
import {
  CreateEventInput,
  UpdateEventInput,
  RsvpInput,
  MarkAttendanceInput,
} from '@sport-manager/contracts';
import { prisma } from '../prisma';
import {
  requireAuth,
  requireRole,
  canActOnBehalfOf,
} from '../middleware/rbac.middleware';
import { sendEmail, rsvpReminderEmail, getNotifiableMembers } from '../services/email.service';
import {
  newEventEmail as buildNewEventEmail,
  rsvpReminderEmail as buildRsvpReminderEmail,
} from '../services/email-templates';
import { sendPushToUser } from '../services/push.service';
import { generateEventSummary } from '../services/ai-summary.service';
import type { HonoEnv } from '../../types/hono';
import { APP_BASE_URL } from '../../constants';
import type { MemberContext } from '../../types/hono';

/**
 * /v1/events — event CRUD, RSVP, attendance, detach.
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

function canManageEventAttendance(
  member: MemberContext,
  event: { teamId: string | null },
): boolean {
  if (member.clubRoles.some((r) => ['ADMIN', 'OWNER'].includes(r))) {
    return true;
  }

  if (!event.teamId) return false;

  return member.teamRoles.some(
    (tr) =>
      tr.teamId === event.teamId &&
      ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(tr.role),
  );
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

    // Strip null bytes — PostgreSQL rejects strings containing \u0000
    const sanitizeStr = (s: string | undefined) => s?.replace(/\u0000/g, '') ?? s;

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.create({
        data: {
          clubId: member.clubId,
          createdById: member.memberId,
          teamId: input.teamId ?? null,
          type: input.type as EventType,
          title: sanitizeStr(input.title) ?? input.title,
          description: sanitizeStr(input.description),
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          location: input.location,
          locationUrl: input.locationUrl,
          opponent: input.opponent,
          homeAway: input.homeAway as HomeAway | null,
          rsvpDeadline: input.rsvpDeadline ? new Date(input.rsvpDeadline) : null,
        },
      });
      return { id: event.id, teamId: event.teamId };
    });

    // Send new-event emails to notifiable team members (fire-and-forget)
    if (result.teamId) {
      const startsAt = new Date(input.startsAt);
      const endsAt = new Date(input.endsAt);
      const eventDateLabel = startsAt.toLocaleDateString('cs-CZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const eventTimeLabel = `${startsAt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} – ${endsAt.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;

      void sendNewEventEmailsForTeam({
        eventId: result.id,
        teamId: result.teamId,
        clubId: member.clubId,
        eventTitle: input.title,
        eventType: input.type,
        eventDate: eventDateLabel,
        eventTime: eventTimeLabel,
        location: input.location ?? null,
      });

      // Legacy: RSVP emails to guardians with canRsvp
      void sendRsvpEmailsForEvent({
        eventId: result.id,
        teamId: result.teamId,
        clubId: member.clubId,
        eventTitle: input.title,
        eventDate: eventDateLabel,
      });

      // Push notification to all team members (fire-and-forget)
      void sendPushNotificationsForEvent({
        eventId: result.id,
        teamId: result.teamId,
        eventTitle: input.title,
        startsAt: new Date(input.startsAt),
      });
    }

    return c.json({ id: result.id }, 201);
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
// DELETE /v1/events/:eventId
// ---------------------------------------------------------------------------
events.delete(
  '/:eventId',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      // Delete attendances first (FK constraint)
      await tx.eventAttendance.deleteMany({ where: { eventId } });
      await tx.event.delete({ where: { id: eventId } });
      return { id: eventId };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.body(null, 204);
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

  // Build note: if reason provided (absence excuse), prepend it to note
  const REASON_LABEL: Record<string, string> = {
    ILLNESS: 'Nemoc',
    SCHOOL: 'Škola',
    FAMILY: 'Rodinné důvody',
    OTHER: 'Jiné',
  };
  const resolvedNote = input.reason
    ? [REASON_LABEL[input.reason] ?? input.reason, input.note].filter(Boolean).join(' — ')
    : (input.note ?? null);

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    // Authorization: self, verified guardian, club admin, or coach/manager
    // for this event's team. The last case powers coach bulk RSVP.
    if (member.memberId !== input.memberId) {
      const canManage = canManageEventAttendance(member as MemberContext, event);
      if (!canManage && !canActOnBehalfOf(member as MemberContext, input.memberId, 'canRsvp')) {
        return { forbidden: true as const };
      }
    }

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
        status: input.status as RSVPStatus,
        note: resolvedNote,
      },
      update: {
        respondedById: member.memberId,
        status: input.status as RSVPStatus,
        note: resolvedNote,
        respondedAt: new Date(),
      },
    });

    return { ok: true };
  });

  if (result?.forbidden) {
    return c.json(
      { error: 'Forbidden', message: 'You cannot RSVP on behalf of this member' },
      403,
    );
  }

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

      if (!canManageEventAttendance(member as MemberContext, event)) {
        return { forbidden: true as const };
      }

      for (const { memberId, attended } of attendances) {
        await tx.eventAttendance.upsert({
          where: { eventId_memberId: { eventId, memberId } },
          create: {
            eventId,
            memberId,
            respondedById: member.memberId,
            status: 'PENDING',
            attended,
          },
          update: { attended },
        });
      }

      return { ok: true };
    });

    if (result?.forbidden) {
      return c.json({ error: 'Forbidden', message: 'Insufficient role for this event' }, 403);
    }

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

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/magic-rsvp-link
// Coach/admin generates a magic link for a specific member.
// ---------------------------------------------------------------------------
events.post(
  '/:eventId/magic-rsvp-link',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');
    const body = await c.req.json<{ memberId: string; status?: string }>();

    if (!body.memberId) {
      return c.json({ error: 'Bad Request', message: 'memberId is required' }, 400);
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return c.json({ error: 'Internal Server Error' }, 500);
    }

    // Verify event exists within the club
    const eventExists = await prisma.withClub(member.clubId, async (tx) => {
      return tx.event.findUnique({ where: { id: eventId }, select: { id: true } });
    });

    if (!eventExists) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    const status = body.status ?? 'YES';
    const token = await new SignJWT({
      eventId,
      memberId: body.memberId,
      status,
      purpose: 'rsvp',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(secret));

    const url = `${APP_BASE_URL}/rsvp/${token}`;

    return c.json({ url });
  },
);

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/qr-token
// Coach/admin generates a QR attendance token for an event.
// ---------------------------------------------------------------------------
events.post(
  '/:eventId/qr-token',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return c.json({ error: 'Internal Server Error' }, 500);
    }

    const event = await prisma.withClub(member.clubId, async (tx) => {
      return tx.event.findUnique({
        where: { id: eventId },
        select: { id: true, endsAt: true, title: true },
      });
    });

    if (!event) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    // Token expires when the event ends (or in 24h if endsAt is in the past)
    const expiry = event.endsAt > new Date() ? event.endsAt : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiresInSeconds = Math.floor((expiry.getTime() - Date.now()) / 1000);

    const token = await new SignJWT({
      eventId,
      purpose: 'attend',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiry.getTime() / 1000))
      .sign(new TextEncoder().encode(secret));

    const url = `${APP_BASE_URL}/attend/${token}`;

    return c.json({ token, url, eventTitle: event.title, expiresAt: expiry });
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/events/:eventId/score
// Store live score in event description marker.
// ---------------------------------------------------------------------------
const SCORE_STATUSES = ['not_started', 'first_half', 'half_time', 'second_half', 'full_time'] as const;
type ScoreStatus = (typeof SCORE_STATUSES)[number];

const SCORE_MARKER_RE = /<!--\s*score:\s*(\{.*?\})\s*-->/s;

function parseScoreMarker(description: string | null): { home: number; away: number; status: ScoreStatus; updatedAt: string } | null {
  if (!description) return null;
  const match = SCORE_MARKER_RE.exec(description);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function updateScoreMarker(description: string | null, data: { home: number; away: number; status: ScoreStatus; updatedAt: string }): string {
  const marker = `<!-- score: ${JSON.stringify(data)} -->`;
  const base = description ?? '';
  if (SCORE_MARKER_RE.test(base)) {
    return base.replace(SCORE_MARKER_RE, marker);
  }
  return base ? `${base}\n\n${marker}` : marker;
}

events.patch(
  '/:eventId/score',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');
    const body = await c.req.json<{ homeScore?: number; awayScore?: number; status?: string }>();

    if (body.homeScore === undefined || body.awayScore === undefined || !body.status) {
      return c.json({ error: 'Bad Request', message: 'homeScore, awayScore and status are required' }, 400);
    }
    if (!SCORE_STATUSES.includes(body.status as ScoreStatus)) {
      return c.json({ error: 'Bad Request', message: `status must be one of: ${SCORE_STATUSES.join(', ')}` }, 400);
    }

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      const scoreData = {
        home: body.homeScore!,
        away: body.awayScore!,
        status: body.status as ScoreStatus,
        updatedAt: new Date().toISOString(),
      };
      const newDescription = updateScoreMarker(event.description, scoreData);

      await tx.event.update({
        where: { id: eventId },
        data: { description: newDescription },
      });

      return scoreData;
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.json({ homeScore: result.home, awayScore: result.away, status: result.status });
  },
);

// ---------------------------------------------------------------------------
// Internal helper — send new-event notification emails to team members.
// Uses getNotifiableMembers to respect emailEvents preference.
// Called fire-and-forget after event creation.
// ---------------------------------------------------------------------------
async function sendNewEventEmailsForTeam(opts: {
  eventId: string;
  teamId: string;
  clubId: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  location?: string | null;
}): Promise<void> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return;

  try {
    // Fetch club name for email branding
    const club = await prisma.club.findUnique({
      where: { id: opts.clubId },
      select: { name: true, slug: true },
    });
    const clubName = club?.name ?? 'Sport Manager';

    // Fetch team name
    const team = await prisma.team.findUnique({
      where: { id: opts.teamId },
      select: { name: true },
    });
    const teamName = team?.name ?? null;

    const notifiable = await getNotifiableMembers(opts.clubId, opts.teamId, 'emailEvents');
    const eventUrl = `${APP_BASE_URL}/admin/events/${opts.eventId}`;

    for (const member of notifiable) {
      // Generate member-specific magic RSVP tokens
      const [tokenYes, tokenNo] = await Promise.all([
        new SignJWT({ eventId: opts.eventId, memberId: member.memberId, status: 'YES', purpose: 'rsvp' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(new TextEncoder().encode(secret)),
        new SignJWT({ eventId: opts.eventId, memberId: member.memberId, status: 'NO', purpose: 'rsvp' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(new TextEncoder().encode(secret)),
      ]);

      const { subject, html } = buildNewEventEmail({
        recipientName: member.firstName,
        clubName,
        eventTitle: opts.eventTitle,
        eventType: opts.eventType,
        eventDate: opts.eventDate,
        eventTime: opts.eventTime,
        location: opts.location,
        teamName,
        eventUrl,
        rsvpYesUrl: `${APP_BASE_URL}/rsvp/${tokenYes}`,
        rsvpNoUrl: `${APP_BASE_URL}/rsvp/${tokenNo}`,
      });

      await sendEmail({ to: member.email, subject, html });
    }
  } catch (err) {
    console.error('[email] Failed to send new-event emails:', err);
  }
}

// ---------------------------------------------------------------------------
// Internal helper — send RSVP emails to guardians of team members.
// Called fire-and-forget after event creation.
// ---------------------------------------------------------------------------
async function sendRsvpEmailsForEvent(opts: {
  eventId: string;
  teamId: string;
  clubId: string;
  eventTitle: string;
  eventDate: string;
}): Promise<void> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return;

  try {
    const memberships = await prisma.teamMembership.findMany({
      where: { teamId: opts.teamId, leftAt: null },
      select: {
        member: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
            childLinks: {
              where: { verifiedAt: { not: null }, canRsvp: true },
              select: {
                guardian: {
                  select: { user: { select: { email: true } } },
                },
              },
            },
          },
        },
      },
    });

    for (const { member } of memberships) {
      const playerName = `${member.user.firstName} ${member.user.lastName}`;

      // Generate magic link token for this member (YES by default)
      const token = await new SignJWT({
        eventId: opts.eventId,
        memberId: member.id,
        status: 'YES',
        purpose: 'rsvp',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(new TextEncoder().encode(secret));

      const rsvpUrl = `${APP_BASE_URL}/rsvp/${token}`;

      // Send to each verified guardian with canRsvp
      for (const link of member.childLinks) {
        const guardianEmail = link.guardian.user.email;

        // Generate NO-RSVP token for this member
        const noToken = await new SignJWT({
          eventId: opts.eventId,
          memberId: member.id,
          status: 'NO',
          purpose: 'rsvp',
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(new TextEncoder().encode(secret));
        const rsvpNoUrl = `${APP_BASE_URL}/rsvp/${noToken}`;

        const { subject, html } = buildRsvpReminderEmail({
          recipientName: playerName,
          playerName,
          clubName: '',
          eventTitle: opts.eventTitle,
          eventDate: opts.eventDate,
          eventTime: '',
          rsvpYesUrl: rsvpUrl,
          rsvpNoUrl,
          eventUrl: rsvpUrl,
        });

        await sendEmail({ to: guardianEmail, subject, html });
      }
    }
  } catch (err) {
    console.error('[rsvp] Failed to send RSVP emails:', err);
  }
}

// ---------------------------------------------------------------------------
// Carpool helpers — stores structured offers in event description marker.
// Format: <!-- carpool: [...] -->
// ---------------------------------------------------------------------------

interface CarpoolOffer {
  id: string;
  memberId: string;
  memberName: string;
  seats: number;
  takenSeats: string[]; // array of memberId
  departureTime: string;
  departureLocation: string;
  note?: string;
}

const CARPOOL_MARKER_RE = /<!--\s*carpool:\s*([\s\S]*?)\s*-->/;

function parseCarpoolMarker(description: string | null): CarpoolOffer[] {
  if (!description) return [];
  const match = CARPOOL_MARKER_RE.exec(description);
  if (!match || !match[1]) return [];
  try {
    return JSON.parse(match[1]) as CarpoolOffer[];
  } catch {
    return [];
  }
}

function updateCarpoolMarker(description: string | null, offers: CarpoolOffer[]): string {
  const marker = `<!-- carpool: ${JSON.stringify(offers)} -->`;
  const base = description ?? '';
  if (CARPOOL_MARKER_RE.test(base)) {
    return base.replace(CARPOOL_MARKER_RE, marker);
  }
  return base ? `${base}\n\n${marker}` : marker;
}

// ---------------------------------------------------------------------------
// GET /v1/events/:eventId/carpool
// Returns array of carpool offers for the event.
// ---------------------------------------------------------------------------
events.get('/:eventId/carpool', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }
  const eventId = c.req.param('eventId');

  const offers = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: { description: true },
    });
    if (!event) return null;
    return parseCarpoolMarker(event.description);
  });

  if (offers === null) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(offers);
});

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/carpool
// Create a new carpool offer.
// Body: { seats, departureTime, departureLocation, note? }
// ---------------------------------------------------------------------------
/** Strip HTML comment terminators so user text can't break the carpool marker. */
function sanitizeMarkerText(s: string): string {
  return s.replace(/-->/g, '-- >').replace(/<!--/g, '<!- -');
}

const CreateCarpoolInput = z.object({
  seats: z.number().int().min(1).max(20),
  departureTime: z.string().min(1),
  departureLocation: z.string().min(1).max(200).transform(sanitizeMarkerText),
  note: z.string().max(300).optional().transform((v) => (v ? sanitizeMarkerText(v) : v)),
});

events.post(
  '/:eventId/carpool',
  requireAuth(),
  zValidator('json', CreateCarpoolInput),
  async (c) => {
    const member = c.get('member');
    const clubId = c.get('clubId');
    if (!member || !clubId) {
      return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
    }

    const eventId = c.req.param('eventId');
    const { seats, departureTime, departureLocation, note } = c.req.valid('json');

    const result = await prisma.withClub(clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      const memberRecord = await tx.member.findUnique({
        where: { id: member.memberId },
        select: { user: { select: { firstName: true, lastName: true } } },
      });
      const memberName = memberRecord
        ? `${memberRecord.user.firstName} ${memberRecord.user.lastName}`
        : 'Neznámý';

      const existing = parseCarpoolMarker(event.description);

      // Member can only have one offer at a time — remove previous if exists
      const filtered = existing.filter((o) => o.memberId !== member.memberId);

      const newOffer: CarpoolOffer = {
        id: crypto.randomUUID(),
        memberId: member.memberId,
        memberName,
        seats,
        takenSeats: [],
        departureTime,
        departureLocation,
        ...(note ? { note } : {}),
      };
      filtered.push(newOffer);

      const newDesc = updateCarpoolMarker(event.description, filtered);
      await tx.event.update({ where: { id: eventId }, data: { description: newDesc } });

      return newOffer;
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/carpool/:offerId/join
// Join a carpool offer (claim a seat).
// ---------------------------------------------------------------------------
events.post('/:eventId/carpool/:offerId/join', requireAuth(), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const eventId = c.req.param('eventId');
  const offerId = c.req.param('offerId');

  const result = await prisma.withClub(clubId, async (tx) => {
    // SELECT ... FOR UPDATE locks the event row for the duration of the
    // transaction — prevents two concurrent joins from each reading the same
    // takenSeats array, both passing the capacity check, and overbooking.
    const rows = await tx.$queryRaw<Array<{ id: string; description: string | null }>>`
      SELECT id, description FROM "Event" WHERE id = ${eventId} FOR UPDATE
    `;
    const event = rows[0];
    if (!event) return null;

    const offers = parseCarpoolMarker(event.description);
    const offer = offers.find((o) => o.id === offerId);

    if (!offer) {
      throw Object.assign(new Error('Carpool offer not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    if (offer.memberId === member.memberId) {
      throw Object.assign(new Error('Cannot join your own carpool offer'), {
        statusCode: 400,
        code: 'CANNOT_JOIN_OWN',
      });
    }
    if (offer.takenSeats.includes(member.memberId)) {
      throw Object.assign(new Error('Already joined this carpool'), {
        statusCode: 400,
        code: 'ALREADY_JOINED',
      });
    }
    if (offer.takenSeats.length >= offer.seats) {
      throw Object.assign(new Error('No seats available'), {
        statusCode: 409,
        code: 'NO_SEATS',
      });
    }

    offer.takenSeats.push(member.memberId);
    const newDesc = updateCarpoolMarker(event.description, offers);
    await tx.event.update({ where: { id: eventId }, data: { description: newDesc } });

    return { ok: true };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// DELETE /v1/events/:eventId/carpool/:offerId/leave
// Leave a carpool offer (free up your seat).
// ---------------------------------------------------------------------------
events.delete('/:eventId/carpool/:offerId/leave', requireAuth(), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const eventId = c.req.param('eventId');
  const offerId = c.req.param('offerId');

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    const offers = parseCarpoolMarker(event.description);
    const offer = offers.find((o) => o.id === offerId);

    if (!offer) {
      throw Object.assign(new Error('Carpool offer not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    offer.takenSeats = offer.takenSeats.filter((id) => id !== member.memberId);
    const newDesc = updateCarpoolMarker(event.description, offers);
    await tx.event.update({ where: { id: eventId }, data: { description: newDesc } });

    return { ok: true };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// DELETE /v1/events/:eventId/carpool/:offerId
// Delete a carpool offer — only the author can do this.
// ---------------------------------------------------------------------------
events.delete('/:eventId/carpool/:offerId', requireAuth(), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const eventId = c.req.param('eventId');
  const offerId = c.req.param('offerId');

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    const offers = parseCarpoolMarker(event.description);
    const offer = offers.find((o) => o.id === offerId);

    if (!offer) {
      throw Object.assign(new Error('Carpool offer not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    // Only the author or admin/coach can delete
    const isAuthor = offer.memberId === member.memberId;
    const isAdmin = member.clubRoles.some((r: string) => ['ADMIN', 'OWNER'].includes(r));
    const isCoach = member.teamRoles.some((tr: { role: string }) =>
      ['HEAD_COACH', 'ASSISTANT_COACH'].includes(tr.role),
    );

    if (!isAuthor && !isAdmin && !isCoach) {
      throw Object.assign(new Error('Only the offer author can delete this offer'), {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    const updated = offers.filter((o) => o.id !== offerId);
    const newDesc = updateCarpoolMarker(event.description, updated);
    await tx.event.update({ where: { id: eventId }, data: { description: newDesc } });

    return { ok: true };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.body(null, 204);
});

// ---------------------------------------------------------------------------
// PATCH /v1/events/:eventId/carpool
// Legacy: Stores carpool offer/request in the RSVP note field using a 🚗 prefix.
// Kept for backward compatibility with existing PRACTICE tab.
// ---------------------------------------------------------------------------
const CarpoolInput = z.object({
  type: z.enum(['offer', 'request', 'none']),
  seats: z.number().int().min(1).max(20).optional(),
  note: z.string().max(300).optional(),
});

events.patch('/:eventId/carpool', requireAuth(), zValidator('json', CarpoolInput), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const eventId = c.req.param('eventId');
  const { type, seats, note } = c.req.valid('json');

  // Build the carpool note value
  let carpoolNote: string | null = null;
  if (type === 'offer') {
    carpoolNote = `🚗 Nabízím ${seats ?? 1} míst${seats && seats > 1 ? 'a' : 'o'}${note ? ` | ${note}` : ''}`;
  } else if (type === 'request') {
    carpoolNote = `🚗 Potřebuji svézt${note ? ` | ${note}` : ''}`;
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    await tx.eventAttendance.upsert({
      where: { eventId_memberId: { eventId, memberId: member.memberId } },
      create: {
        eventId,
        memberId: member.memberId,
        respondedById: member.memberId,
        status: 'PENDING',
        note: carpoolNote,
      },
      update: { note: carpoolNote },
    });

    return { ok: true };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// PATCH /v1/events/:eventId/stats
// Stores match stats as a marker in event description.
// Format: <!-- stats: [{"memberId":"...","goals":1,"assists":0,"yellowCards":0,"redCards":0}] -->
// ---------------------------------------------------------------------------

const StatEntrySchema = z.object({
  memberId: z.string(),
  goals: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  yellowCards: z.number().int().min(0).max(2).default(0),
  redCards: z.number().int().min(0).max(1).default(0),
});

const StatsInput = z.object({
  stats: z.array(StatEntrySchema),
});

const STATS_MARKER_RE = /<!--\s*stats:\s*([\s\S]*?)\s*-->/;

events.patch(
  '/:eventId/stats',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  zValidator('json', StatsInput),
  async (c) => {
    const member = c.get('member')!;
    const eventId = c.req.param('eventId');
    const { stats } = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      const marker = `<!-- stats: ${JSON.stringify(stats)} -->`;
      let newDesc = event.description ?? '';
      if (STATS_MARKER_RE.test(newDesc)) {
        newDesc = newDesc.replace(STATS_MARKER_RE, marker);
      } else {
        newDesc = newDesc ? `${newDesc}\n\n${marker}` : marker;
      }

      await tx.event.update({ where: { id: eventId }, data: { description: newDesc } });
      return { ok: true };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
    }

    return c.json(result);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/events/:eventId/comments
// Stores comments as a marker in event description.
// Format: <!-- comments: [{"id":"...","authorId":"...","author":"...","text":"...","at":"..."}] -->
// ---------------------------------------------------------------------------

const CommentInput = z.object({
  text: z.string().min(1).max(1000),
});

const COMMENTS_MARKER_RE = /<!--\s*comments:\s*([\s\S]*?)\s*-->/;

events.post('/:eventId/comments', requireAuth(), zValidator('json', CommentInput), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const eventId = c.req.param('eventId');
  const { text } = c.req.valid('json');

  const result = await prisma.withClub(clubId, async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return null;

    // Get author name
    const memberRecord = await tx.member.findUnique({
      where: { id: member.memberId },
      select: { user: { select: { firstName: true, lastName: true } } },
    });
    const authorName = memberRecord
      ? `${memberRecord.user.firstName} ${memberRecord.user.lastName}`
      : 'Neznámý';

    // Parse existing comments
    let existing: Array<{ id: string; authorId: string; author: string; text: string; at: string }> = [];
    const match = COMMENTS_MARKER_RE.exec(event.description ?? '');
    if (match && match[1]) {
      try {
        existing = JSON.parse(match[1]) as typeof existing;
      } catch {
        existing = [];
      }
    }

    const newComment = {
      id: crypto.randomUUID(),
      authorId: member.memberId,
      author: authorName,
      text,
      at: new Date().toISOString(),
    };
    existing.push(newComment);

    const marker = `<!-- comments: ${JSON.stringify(existing)} -->`;
    let newDesc = event.description ?? '';
    if (COMMENTS_MARKER_RE.test(newDesc)) {
      newDesc = newDesc.replace(COMMENTS_MARKER_RE, marker);
    } else {
      newDesc = newDesc ? `${newDesc}\n\n${marker}` : marker;
    }

    await tx.event.update({ where: { id: eventId }, data: { description: newDesc } });
    return newComment;
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Event not found' }, 404);
  }

  return c.json(result, 201);
});

// ---------------------------------------------------------------------------
// Internal helper — send push notifications to team members after event creation.
// ---------------------------------------------------------------------------
async function sendPushNotificationsForEvent(opts: {
  eventId: string;
  teamId: string;
  eventTitle: string;
  startsAt: Date;
}): Promise<void> {
  try {
    const memberships = await prisma.teamMembership.findMany({
      where: { teamId: opts.teamId, leftAt: null },
      select: { member: { select: { userId: true } } },
    });

    const timeStr = opts.startsAt.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = opts.startsAt.toLocaleDateString('cs-CZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    });

    await Promise.all(
      memberships.map(({ member }) =>
        sendPushToUser(member.userId, {
          title: 'Nova udalost',
          body: `${opts.eventTitle} — ${dateStr} v ${timeStr}`,
          url: `/admin/events/${opts.eventId}`,
          tag: `event-${opts.eventId}`,
        }),
      ),
    );
  } catch (err) {
    console.error('[push] Failed to send event push notifications:', err);
  }
}

// ---------------------------------------------------------------------------
// GET /v1/events/:eventId/summary
// Template-based AI summary — generated on-demand after event + attendance.
// Restricted to admins/coaches/managers (attendance + RSVP data are sensitive).
// ---------------------------------------------------------------------------
events.get(
  '/:eventId/summary',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }
    const eventId = c.req.param('eventId');

    const summary = await generateEventSummary(eventId, clubId);

    if (!summary) {
      return c.json(
        { error: 'Not Found', message: 'Event not found or no attendance data yet' },
        404,
      );
    }

    return c.json(summary);
  },
);

export { events as eventsRoutes };
