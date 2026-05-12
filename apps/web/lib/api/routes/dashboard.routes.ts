import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv, MemberContext } from '../../types/hono';

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

    // 5. Guardian view: data about children
    const member = c.get('member') as MemberContext | undefined;
    let children: Array<{
      childMemberId: string;
      name: string;
      teamName: string | null;
      nextEvent: { id: string; title: string; startsAt: Date; type: string } | null;
      rsvpStatus: string | null;
      pendingPaymentsCount: number;
      attendanceRate: number;
      streak: number;
    }> = [];

    if (member && member.guardianOf.length > 0) {
      const childIds = member.guardianOf.map((g) => g.childMemberId);

      const childMembers = await tx.member.findMany({
        where: { id: { in: childIds } },
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
          teamMemberships: {
            where: { leftAt: null },
            take: 1,
            select: {
              team: { select: { id: true, name: true } },
            },
          },
        },
      });

      for (const child of childMembers) {
        const teamId = child.teamMemberships[0]?.team?.id ?? null;
        const teamName = child.teamMemberships[0]?.team?.name ?? null;

        // Next event for this child's team
        const nextEvent = teamId
          ? await tx.event.findFirst({
              where: { teamId, startsAt: { gte: now } },
              orderBy: { startsAt: 'asc' },
              select: { id: true, title: true, startsAt: true, type: true },
            })
          : null;

        // RSVP status for next event
        let rsvpStatus: string | null = null;
        if (nextEvent) {
          const attendance = await tx.eventAttendance.findUnique({
            where: { eventId_memberId: { eventId: nextEvent.id, memberId: child.id } },
            select: { status: true },
          });
          rsvpStatus = attendance?.status ?? 'PENDING';
        }

        // Pending payments for this child (as payer or on behalf of)
        const pendingPaymentsCount = await tx.payment.count({
          where: {
            OR: [{ payerId: child.id }, { onBehalfOfId: child.id }],
            status: { in: ['PENDING', 'PROCESSING'] },
          },
        });

        // Quick attendance stats for child
        const childAttendances = await tx.eventAttendance.findMany({
          where: { memberId: child.id, event: { startsAt: { lte: now } } },
          select: { attended: true },
          orderBy: { event: { startsAt: 'desc' } },
        });
        const attTotal = childAttendances.length;
        const attAttended = childAttendances.filter((a) => a.attended === true).length;
        const attendanceRate = attTotal > 0 ? Math.round((attAttended / attTotal) * 100) : 0;

        // Current streak
        let streak = 0;
        for (const a of childAttendances) {
          if (a.attended === true) {
            streak++;
          } else if (a.attended === false) {
            break;
          }
        }

        children.push({
          childMemberId: child.id,
          name: `${child.user.firstName} ${child.user.lastName}`,
          teamName,
          nextEvent: nextEvent
            ? { id: nextEvent.id, title: nextEvent.title, startsAt: nextEvent.startsAt, type: nextEvent.type }
            : null,
          rsvpStatus,
          pendingPaymentsCount,
          attendanceRate,
          streak,
        });
      }
    }

    return {
      thisWeek,
      needsAttention,
      recentActivity,
      stats: {
        members: memberCount,
        teams: teamCount,
        upcomingEvents: upcomingCount,
      },
      children,
    };
  });

  return c.json(result);
});

/**
 * GET /v1/dashboard/activity?limit=20
 * Returns a club-wide activity feed merging recent events, RSVPs, and members.
 * Accessible by admins and coaches.
 */
dashboard.get('/activity', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const limitParam = parseInt(c.req.query('limit') ?? '20', 10);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  const result = await prisma.withClub(clubId, async (tx) => {
    const [recentEvents, recentRsvps, recentMembers, recentMessages] = await Promise.all([
      // Newly created events
      tx.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          type: true,
          startsAt: true,
          createdAt: true,
          createdBy: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      // Recent RSVP responses
      tx.eventAttendance.findMany({
        where: { status: { not: 'PENDING' } },
        orderBy: { respondedAt: 'desc' },
        take: limit,
        include: {
          member: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
          event: { select: { id: true, title: true } },
        },
      }),
      // Recently joined members
      tx.member.findMany({
        orderBy: { joinedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          joinedAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      // Recent messages (excluding soft-deleted)
      tx.message.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          sender: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          conversation: {
            select: { id: true, title: true, type: true },
          },
        },
      }),
    ]);

    const RSVP_LABEL: Record<string, string> = {
      YES: 'ANO',
      NO: 'NE',
      MAYBE: 'MOŽNÁ',
      PENDING: 'čeká',
    };

    const EVENT_LABEL: Record<string, string> = {
      PRACTICE: 'trénink',
      MATCH: 'zápas',
      TOURNAMENT: 'turnaj',
      MEETING: 'schůzku',
      SOCIAL: 'akci',
    };

    type ActivityItem = {
      id: string;
      type: 'event_created' | 'rsvp' | 'member_joined' | 'message';
      message: string;
      timestamp: string;
      link: string | null;
    };

    const items: ActivityItem[] = [];

    for (const e of recentEvents) {
      const creatorName = e.createdBy
        ? `${e.createdBy.user.firstName} ${e.createdBy.user.lastName}`
        : 'Administrátor';
      const typeLabel = EVENT_LABEL[e.type] ?? e.type.toLowerCase();
      const dateStr = new Date(e.startsAt).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'numeric',
      });
      items.push({
        id: `event-${e.id}`,
        type: 'event_created',
        message: `${creatorName} přidal ${typeLabel} „${e.title}" na ${dateStr}`,
        timestamp: e.createdAt.toISOString(),
        link: `/admin/events/${e.id}`,
      });
    }

    for (const r of recentRsvps) {
      if (!r.respondedAt) continue;
      const name = `${r.member.user.firstName} ${r.member.user.lastName}`;
      const rsvpLabel = RSVP_LABEL[r.status] ?? r.status;
      items.push({
        id: `rsvp-${r.event.id}-${r.member.user.firstName}`,
        type: 'rsvp',
        message: `${name} RSVPl(a) ${rsvpLabel} na „${r.event.title}"`,
        timestamp: r.respondedAt.toISOString(),
        link: `/admin/events/${r.event.id}`,
      });
    }

    for (const m of recentMembers) {
      const name = `${m.user.firstName} ${m.user.lastName}`;
      items.push({
        id: `member-${m.id}`,
        type: 'member_joined',
        message: `Nový člen: ${name}`,
        timestamp: m.joinedAt.toISOString(),
        link: `/admin/members/${m.id}`,
      });
    }

    for (const msg of recentMessages) {
      const senderName = `${msg.sender.user.firstName} ${msg.sender.user.lastName}`;
      const convLabel = msg.conversation.title ?? msg.conversation.type;
      items.push({
        id: `msg-${msg.id}`,
        type: 'message',
        message: `${senderName} napsal(a) zprávu v „${convLabel}"`,
        timestamp: msg.createdAt.toISOString(),
        link: `/admin/messages/${msg.conversation.id}`,
      });
    }

    // Merge, deduplicate, sort by timestamp descending, take limit
    const seen = new Set<string>();
    const sorted = items
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return sorted;
  });

  return c.json(result);
});

export { dashboard as dashboardRoutes };
