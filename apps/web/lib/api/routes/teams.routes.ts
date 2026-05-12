import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import { assertTeamLimit } from '../services/limits.service';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/teams — team list, team detail, create team.
 */
const teams = new Hono<HonoEnv>();

teams.use('/*', requireAuth());

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  sport: z.string().min(1).max(50),
  ageGroup: z.string().max(20).optional(),
  season: z.string().min(1).max(20),
});

/**
 * GET /v1/teams
 * Lists all teams visible to the club (via RLS), sorted by ageGroup + name.
 * Includes current head/assistant coaches.
 */
teams.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const teamList = await tx.team.findMany({
      orderBy: [{ ageGroup: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { memberships: true } },
        memberships: {
          where: {
            role: { in: ['HEAD_COACH', 'ASSISTANT_COACH'] },
            leftAt: null,
          },
          select: {
            role: true,
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

    return teamList.map((t) => ({
      id: t.id,
      name: t.name,
      sport: t.sport,
      ageGroup: t.ageGroup,
      season: t.season,
      memberCount: t._count.memberships,
      coaches: t.memberships.map((m) => ({
        memberId: m.member.id,
        role: m.role,
        name: `${m.member.user.firstName} ${m.member.user.lastName}`,
      })),
    }));
  });

  return c.json(result);
});

/**
 * GET /v1/teams/:teamId
 * Returns team detail with full roster.
 */
teams.get('/:teamId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const { teamId } = c.req.param();

  const result = await prisma.withClub(clubId, async (tx) => {
    const team = await tx.team.findFirst({
      where: { id: teamId },
      include: {
        _count: { select: { memberships: true } },
        memberships: {
          where: { leftAt: null },
          orderBy: [{ role: 'asc' }, { member: { user: { lastName: 'asc' } } }],
          select: {
            id: true,
            role: true,
            joinedAt: true,
            member: {
              select: {
                id: true,
                jerseyNumber: true,
                position: true,
                status: true,
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!team) return null;

    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      ageGroup: team.ageGroup,
      season: team.season,
      memberCount: team._count.memberships,
      roster: team.memberships.map((m) => ({
        membershipId: m.id,
        memberId: m.member.id,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        firstName: m.member.user.firstName,
        lastName: m.member.user.lastName,
        email: m.member.user.email,
        avatarUrl: m.member.user.avatarUrl,
        jerseyNumber: m.member.jerseyNumber,
        position: m.member.position,
        status: m.member.status,
      })),
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Team not found', code: 'TEAM_NOT_FOUND' }, 404);
  }

  return c.json(result);
});

/**
 * POST /v1/teams
 * Creates a new team. Checks team limit.
 */
teams.post('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const userId = c.get('user')?.id;
  await assertTeamLimit(clubId, userId);

  const body = createTeamSchema.parse(await c.req.json());

  const team = await prisma.withClub(clubId, async (tx) => {
    return tx.team.create({
      data: {
        clubId,
        name: body.name,
        sport: body.sport,
        ageGroup: body.ageGroup ?? null,
        season: body.season,
      },
      select: { id: true, name: true, sport: true, ageGroup: true, season: true },
    });
  });

  return c.json(team, 201);
});

/**
 * GET /v1/teams/:teamId/attendance-stats
 * Returns attendance heatmap data for all team members over the last 3 months.
 */
teams.get('/:teamId/attendance-stats', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const { teamId } = c.req.param();

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const result = await prisma.withClub(clubId, async (tx) => {
    // Verify team belongs to this club
    const team = await tx.team.findFirst({ where: { id: teamId }, select: { id: true } });
    if (!team) return null;

    // Active members of the team (players only)
    const memberships = await tx.teamMembership.findMany({
      where: { teamId, leftAt: null },
      select: {
        member: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Events for this team in the last 3 months, sorted by date
    const events = await tx.event.findMany({
      where: {
        teamId,
        startsAt: { gte: threeMonthsAgo },
      },
      orderBy: { startsAt: 'asc' },
      select: { id: true, title: true, startsAt: true },
    });

    if (events.length === 0) {
      return {
        members: memberships.map((m) => ({
          memberId: m.member.id,
          name: `${m.member.user.firstName} ${m.member.user.lastName}`,
          events: [],
          attendanceRate: 0,
        })),
        events: [],
      };
    }

    const eventIds = events.map((e) => e.id);
    const memberIds = memberships.map((m) => m.member.id);

    // All attendance records for these events and members
    const attendances = await tx.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        memberId: { in: memberIds },
      },
      select: { eventId: true, memberId: true, attended: true },
    });

    // Build a lookup: memberId -> eventId -> attended
    const lookup = new Map<string, Map<string, boolean | null>>();
    for (const a of attendances) {
      if (!lookup.has(a.memberId)) lookup.set(a.memberId, new Map());
      lookup.get(a.memberId)!.set(a.eventId, a.attended);
    }

    // Take last 15 events for display
    const displayEvents = events.slice(-15);

    const members = memberships.map((m) => {
      const memberMap = lookup.get(m.member.id) ?? new Map<string, boolean | null>();
      const memberEvents = displayEvents.map((e) => ({
        eventId: e.id,
        date: e.startsAt.toISOString(),
        attended: memberMap.has(e.id) ? memberMap.get(e.id)! : null,
      }));

      const attended = memberEvents.filter((e) => e.attended === true).length;
      const total = memberEvents.filter((e) => e.attended !== null).length;
      const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        memberId: m.member.id,
        name: `${m.member.user.firstName} ${m.member.user.lastName}`,
        events: memberEvents,
        attendanceRate,
      };
    });

    // Sort by attendance rate descending
    members.sort((a, b) => b.attendanceRate - a.attendanceRate);

    return {
      members,
      events: displayEvents.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.startsAt.toISOString(),
      })),
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Team not found', code: 'TEAM_NOT_FOUND' }, 404);
  }

  return c.json(result);
});

/**
 * GET /v1/teams/:teamId/stats
 * Coaching statistics: event counts, attendance rates, top/bottom attenders, monthly trend.
 */
teams.get('/:teamId/stats', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const { teamId } = c.req.param();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = await prisma.withClub(clubId, async (tx) => {
    const team = await tx.team.findFirst({ where: { id: teamId }, select: { id: true } });
    if (!team) return null;

    // Active members of the team
    const memberships = await tx.teamMembership.findMany({
      where: { teamId, leftAt: null },
      select: {
        member: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // All events for this team in the last 6 months
    const events = await tx.event.findMany({
      where: { teamId, startsAt: { gte: sixMonthsAgo } },
      orderBy: { startsAt: 'asc' },
      select: { id: true, type: true, startsAt: true },
    });

    const totalEvents = events.length;
    const totalPractices = events.filter((e) => e.type === 'PRACTICE').length;
    const totalMatches = events.filter((e) => e.type === 'MATCH' || e.type === 'TOURNAMENT').length;

    if (totalEvents === 0 || memberships.length === 0) {
      return {
        totalEvents,
        totalPractices,
        totalMatches,
        avgAttendance: 0,
        rsvpReliability: 0,
        topAttenders: [],
        worstAttenders: [],
        monthlyTrend: [],
      };
    }

    const eventIds = events.map((e) => e.id);
    const memberIds = memberships.map((m) => m.member.id);

    const attendances = await tx.eventAttendance.findMany({
      where: { eventId: { in: eventIds }, memberId: { in: memberIds } },
      select: { eventId: true, memberId: true, attended: true, status: true },
    });

    // Per-member stats
    const memberStats = memberships.map((m) => {
      const memberAtt = attendances.filter((a) => a.memberId === m.member.id);
      const recorded = memberAtt.filter((a) => a.attended !== null);
      const attended = recorded.filter((a) => a.attended === true).length;
      const rate = recorded.length > 0 ? Math.round((attended / recorded.length) * 100) : 0;

      // RSVP reliability: said YES and actually attended / total YES RSVPs
      const rsvpYes = memberAtt.filter((a) => a.status === 'YES');
      const rsvpYesAttended = rsvpYes.filter((a) => a.attended === true).length;
      const memberReliability = rsvpYes.length > 0 ? (rsvpYesAttended / rsvpYes.length) * 100 : 0;

      return {
        memberId: m.member.id,
        name: `${m.member.user.firstName} ${m.member.user.lastName}`,
        rate,
        rsvpYesCount: rsvpYes.length,
        rsvpYesAttended,
        memberReliability,
        recordedCount: recorded.length,
      };
    });

    // Overall avg attendance
    const totalRecorded = memberStats.reduce((s, m) => s + m.recordedCount, 0);
    const totalAttended = memberStats.reduce((s, m) => {
      const memberAtt = attendances.filter((a) => a.memberId === m.memberId && a.attended === true);
      return s + memberAtt.length;
    }, 0);
    const avgAttendance = totalRecorded > 0 ? Math.round((totalAttended / totalRecorded) * 100) : 0;

    // Overall RSVP reliability
    const totalRsvpYes = memberStats.reduce((s, m) => s + m.rsvpYesCount, 0);
    const totalRsvpYesAttended = memberStats.reduce((s, m) => s + m.rsvpYesAttended, 0);
    const rsvpReliability = totalRsvpYes > 0 ? Math.round((totalRsvpYesAttended / totalRsvpYes) * 100) : 0;

    // Sort for top/bottom
    const withRecords = memberStats.filter((m) => m.recordedCount >= 3);
    const sorted = [...withRecords].sort((a, b) => b.rate - a.rate);
    const topAttenders = sorted.slice(0, 5).map((m) => ({ name: m.name, rate: m.rate }));
    const worstAttenders = sorted.slice(-5).reverse().map((m) => ({ name: m.name, rate: m.rate }));

    // Monthly trend — last 6 months
    const monthlyTrend: Array<{ month: string; attendance: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthEvents = events.filter((e) => {
        const d = new Date(e.startsAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      if (monthEvents.length === 0) {
        const label = date.toLocaleDateString('cs-CZ', { month: 'short' });
        monthlyTrend.push({ month: label, attendance: 0 });
        continue;
      }

      const monthEventIds = monthEvents.map((e) => e.id);
      const monthAtt = attendances.filter((a) => monthEventIds.includes(a.eventId) && a.attended !== null);
      const monthAttended = monthAtt.filter((a) => a.attended === true).length;
      const monthRate = monthAtt.length > 0 ? Math.round((monthAttended / monthAtt.length) * 100) : 0;

      const label = date.toLocaleDateString('cs-CZ', { month: 'short' });
      monthlyTrend.push({ month: label, attendance: monthRate });
    }

    return {
      totalEvents,
      totalPractices,
      totalMatches,
      avgAttendance,
      rsvpReliability,
      topAttenders,
      worstAttenders,
      monthlyTrend,
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Team not found', code: 'TEAM_NOT_FOUND' }, 404);
  }

  return c.json(result);
});

/**
 * PATCH /v1/teams/:teamId
 * Update team name, sport, ageGroup, season.
 */
const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sport: z.string().min(1).max(50).optional(),
  ageGroup: z.string().max(20).optional().nullable(),
  season: z.string().min(1).max(20).optional(),
});

teams.patch('/:teamId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);
  const member = c.get('member');
  if (!member || !(member.clubRoles.includes('OWNER') || member.clubRoles.includes('ADMIN'))) {
    return c.json({ error: 'Forbidden', message: 'Insufficient role' }, 403);
  }

  const teamId = c.req.param('teamId');
  const body = updateTeamSchema.parse(await c.req.json());

  const team = await prisma.team.findFirst({ where: { id: teamId, clubId } });
  if (!team) return c.json({ error: 'Not Found', message: 'Team not found' }, 404);

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sport !== undefined && { sport: body.sport }),
      ...(body.ageGroup !== undefined && { ageGroup: body.ageGroup }),
      ...(body.season !== undefined && { season: body.season }),
    },
    select: { id: true, name: true, sport: true, ageGroup: true, season: true },
  });

  return c.json(updated);
});

export { teams as teamsRoutes };
