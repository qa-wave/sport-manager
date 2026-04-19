import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/teams — team list.
 * Ported from apps/api/src/teams/teams.service.ts.
 */
const teams = new Hono<HonoEnv>();

teams.use('/*', requireAuth());

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

export { teams as teamsRoutes };
