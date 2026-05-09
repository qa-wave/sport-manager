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

export { teams as teamsRoutes };
