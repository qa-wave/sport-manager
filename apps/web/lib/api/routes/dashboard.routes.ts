import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/dashboard — aggregated feed for the admin dashboard.
 */
const dashboard = new Hono<HonoEnv>();

dashboard.use('/*', requireAuth());

/**
 * GET /v1/dashboard/feed
 * Returns:
 *   - thisWeek: events in the next 7 days with RSVP summary
 *   - needsAttention: upcoming events (< 3 days) with low RSVP response
 *   - recentActivity: last 48h RSVPs
 *   - stats: member / team / upcoming event counts
 */
dashboard.get('/feed', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // 1. This week's events with RSVP counts
    const upcomingEvents = await tx.event.findMany({
      where: { startsAt: { gte: now, lte: weekFromNow } },
      orderBy: { startsAt: 'asc' },
      include: {
        team: { select: { id: true, name: true } },
        attendances: { select: { status: true } },
      },
    });

    const thisWeek = upcomingEvents.map((e) => {
      const rsvpSummary = {
        yes: 0, no: 0, maybe: 0, pending: 0, total: e.attendances.length,
      };
      for (const a of e.attendances) {
        if (a.status === 'YES') rsvpSummary.yes++;
        else if (a.status === 'NO') rsvpSummary.no++;
        else if (a.status === 'MAYBE') rsvpSummary.maybe++;
        else rsvpSummary.pending++;
      }
      return {
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
        rsvpSummary,
      };
    });

    // 2. Needs attention: events with low RSVP response in < 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const soonEvents = await tx.event.findMany({
      where: { startsAt: { gte: now, lte: threeDaysFromNow } },
      include: {
        team: {
          select: {
            name: true,
            _count: { select: { memberships: true } },
          },
        },
        attendances: { select: { status: true } },
      },
    });

    const needsAttention: Array<{
      type: string;
      title: string;
      description: string;
      link: string;
      severity: 'warning' | 'critical';
    }> = [];

    for (const e of soonEvents) {
      const responded = e.attendances.filter((a) => a.status !== 'PENDING').length;
      const total = e.team?._count?.memberships ?? e.attendances.length;
      if (total > 0 && responded / total < 0.5) {
        needsAttention.push({
          type: 'low_rsvp',
          title: `Low RSVP: ${e.title}`,
          description: `Only ${responded}/${total} members have responded. Event is in less than 3 days.`,
          link: `/admin/events/${e.id}`,
          severity: responded / total < 0.3 ? 'critical' : 'warning',
        });
      }
    }

    // 3. Recent activity: last 48h RSVPs
    const recentRsvps = await tx.eventAttendance.findMany({
      where: { respondedAt: { gte: twoDaysAgo } },
      orderBy: { respondedAt: 'desc' },
      take: 10,
      include: {
        member: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        event: { select: { title: true, id: true } },
      },
    });

    const recentActivity = recentRsvps.map((r) => ({
      type: 'rsvp' as const,
      message: `${r.member.user.firstName} ${r.member.user.lastName} responded ${r.status} for ${r.event.title}`,
      timestamp: r.respondedAt,
      link: `/admin/events/${r.event.id}`,
    }));

    // 4. Stats
    const [memberCount, teamCount, upcomingCount] = await Promise.all([
      tx.member.count({ where: { status: 'ACTIVE' } }),
      tx.team.count(),
      tx.event.count({ where: { startsAt: { gte: now } } }),
    ]);

    return {
      thisWeek,
      needsAttention,
      recentActivity,
      stats: {
        members: memberCount,
        teams: teamCount,
        upcomingEvents: upcomingCount,
      },
    };
  });

  return c.json(result);
});

export { dashboard as dashboardRoutes };
