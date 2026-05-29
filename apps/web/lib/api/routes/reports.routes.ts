import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/reports — aggregated season reports.
 */
const reports = new Hono<HonoEnv>();
reports.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// GET /v1/reports/season?from=ISO&to=ISO
// ---------------------------------------------------------------------------
const SeasonQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

reports.get(
  '/season',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('query', SeasonQuerySchema),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

    const { from, to } = c.req.valid('query');

    const dateFilter: Record<string, unknown> = {};
    if (from || to) {
      dateFilter.startsAt = {} as Record<string, unknown>;
      if (from) (dateFilter.startsAt as Record<string, unknown>).gte = new Date(from);
      if (to) (dateFilter.startsAt as Record<string, unknown>).lte = new Date(to);
    }

    // ── Events ────────────────────────────────────────────────────────────
    const eventRows = await prisma.withClub(clubId, async (tx) =>
      tx.event.findMany({
        where: dateFilter,
        include: {
          attendances: { select: { status: true } },
          team: { select: { id: true, name: true, sport: true } },
        },
        orderBy: { startsAt: 'asc' },
      }),
    );

    const byType: Record<string, number> = {};
    let totalAttendanceYes = 0;
    let totalAttendanceTotal = 0;

    for (const e of eventRows) {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
      const yes = e.attendances.filter((a) => a.status === 'YES').length;
      totalAttendanceYes += yes;
      totalAttendanceTotal += e.attendances.length;
    }

    const avgAttendance =
      eventRows.length > 0 ? Math.round(totalAttendanceYes / eventRows.length) : 0;

    const eventStats = {
      total: eventRows.length,
      byType,
      avgAttendance,
    };

    // ── Team stats ────────────────────────────────────────────────────────
    const teamMap = new Map<string, { name: string; sport: string; yes: number; total: number }>();

    for (const e of eventRows) {
      if (!e.teamId || !e.team) continue;
      const existing = teamMap.get(e.teamId) ?? {
        name: e.team.name,
        sport: e.team.sport,
        yes: 0,
        total: 0,
      };
      existing.yes += e.attendances.filter((a) => a.status === 'YES').length;
      existing.total += e.attendances.length;
      teamMap.set(e.teamId, existing);
    }

    const teamStats = Array.from(teamMap.entries()).map(([id, data]) => ({
      teamId: id,
      teamName: data.name,
      sport: data.sport,
      attendanceRate:
        data.total > 0 ? Math.round((data.yes / data.total) * 100) : 0,
      eventsCount: eventRows.filter((e) => e.teamId === id).length,
    }));

    // ── Top members by attendance ─────────────────────────────────────────
    const attendanceRows = await prisma.withClub(clubId, async (tx) =>
      tx.eventAttendance.findMany({
        where: {
          event: { clubId, ...dateFilter },
        },
        select: {
          status: true,
          member: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      }),
    );

    const memberAttendanceMap = new Map<
      string,
      { name: string; avatarUrl: string | null; yes: number; total: number }
    >();

    for (const row of attendanceRows) {
      const key = row.member.id;
      const existing = memberAttendanceMap.get(key) ?? {
        name: `${row.member.user.firstName} ${row.member.user.lastName}`,
        avatarUrl: row.member.user.avatarUrl,
        yes: 0,
        total: 0,
      };
      existing.total++;
      if (row.status === 'YES') existing.yes++;
      memberAttendanceMap.set(key, existing);
    }

    const topMembers = Array.from(memberAttendanceMap.entries())
      .map(([memberId, data]) => ({
        memberId,
        name: data.name,
        avatarUrl: data.avatarUrl,
        attendedCount: data.yes,
        totalCount: data.total,
        attendanceRate: data.total > 0 ? Math.round((data.yes / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.attendedCount - a.attendedCount)
      .slice(0, 10);

    // ── Payment summary ───────────────────────────────────────────────────
    const paymentRows = await prisma.withClub(clubId, (tx) =>
      tx.payment.findMany({
        where: { clubId },
        select: { amountCents: true, currency: true, status: true },
      }),
    );

    const collected = paymentRows
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amountCents, 0);

    const outstanding = paymentRows
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amountCents, 0);

    const currency = paymentRows[0]?.currency ?? 'CZK';

    const paymentSummary = {
      totalCollectedCents: collected,
      totalOutstandingCents: outstanding,
      currency,
      paidCount: paymentRows.filter((p) => p.status === 'PAID').length,
      pendingCount: paymentRows.filter((p) => p.status === 'PENDING').length,
    };

    return c.json({
      generatedAt: new Date().toISOString(),
      period: { from: from ?? null, to: to ?? null },
      eventStats,
      teamStats,
      topMembers,
      paymentSummary,
    });
  },
);

export { reports as reportsRoutes };
