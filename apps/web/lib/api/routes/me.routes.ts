import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { FeatureFlags, ClubConfig } from '@sport-manager/contracts';
import { prisma } from '../prisma';
import { requireAuth, requireRole, resolveMemberContext } from '../middleware/rbac.middleware';
import { getFeaturesState } from '../middleware/feature-flag.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/me — identity + RBAC smoke-test routes.
 *
 * GET /           — identity only, any authenticated user (no club scope)
 * GET /context    — identity + full MemberContext for the active club
 * GET /coach-only — gated: HEAD_COACH / ASSISTANT_COACH / ADMIN / OWNER
 */
const me = new Hono<HonoEnv>();

me.use('/*', requireAuth());

/**
 * GET /v1/me
 * Returns the current user's identity + all club memberships with
 * Zod-parsed features/config (so defaults are applied).
 */
me.get('/', async (c) => {
  const user = c.get('user')!;

  // Cross-club bootstrap: a user's own memberships span multiple clubs, so the
  // nested (RLS-protected) Member/Club rows are read under platform scope. The
  // query is keyed by the authenticated user's id, so only their own data is
  // ever returned — no cross-tenant leak.
  const full = await prisma.withPlatformAdmin((tx) =>
    tx.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        avatarUrl: true,
        locale: true,
        topics: true,
        isPlatformAdmin: true,
        members: {
          select: {
            id: true,
            clubId: true,
            club: {
              select: {
                id: true,
                slug: true,
                name: true,
                timezone: true,
                features: true,
                config: true,
              },
            },
          },
        },
      },
    }),
  );

  if (!full) {
    return c.json({ error: 'Not Found', message: 'User not found' }, 404);
  }

  const members = full.members.map((m) => ({
    id: m.id,
    clubId: m.clubId,
    club: {
      id: m.club.id,
      slug: m.club.slug,
      name: m.club.name,
      timezone: m.club.timezone,
      features: FeatureFlags.parse(m.club.features ?? {}),
      config: ClubConfig.parse(m.club.config ?? {}),
    },
  }));

  return c.json({
    id: full.id,
    email: full.email,
    firstName: full.firstName,
    lastName: full.lastName,
    nickname: full.nickname,
    avatarUrl: full.avatarUrl,
    locale: full.locale,
    topics: full.topics,
    isPlatformAdmin: full.isPlatformAdmin,
    members,
  });
});

/**
 * GET /v1/me/context
 * Returns resolved MemberContext + active club's features + config.
 * Requires x-club-id header and club membership.
 */
me.get('/context', async (c) => {
  const user = c.get('user')!;
  const clubId = c.get('clubId');

  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  let member = c.get('member');
  if (!member) {
    const resolved = await resolveMemberContext(user.id, clubId);
    if (!resolved) {
      return c.json({ error: 'Forbidden', message: 'Not a member of this club' }, 403);
    }
    member = resolved;
    c.set('member', member);
  }

  const state = await getFeaturesState(clubId);

  return c.json({
    ...member,
    features: state.features,
    config: state.config,
  });
});

/**
 * PATCH /v1/me
 * Update the current user's profile (name, locale).
 */
const UpdateProfileInput = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  nickname: z.string().max(40).nullable().optional(),
  locale: z.string().max(10).optional(),
  topics: z.array(z.string().max(40)).max(20).optional(),
});

me.patch('/', zValidator('json', UpdateProfileInput), async (c) => {
  const user = c.get('user')!;
  const input = c.req.valid('json');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.nickname !== undefined && { nickname: input.nickname?.trim() || null }),
      ...(input.locale !== undefined && { locale: input.locale }),
      ...(input.topics !== undefined && { topics: input.topics }),
    },
    select: { id: true, firstName: true, lastName: true, nickname: true, email: true, locale: true, topics: true },
  });

  return c.json(updated);
});

/**
 * GET /v1/me/search?q=query
 * Global search across members, events, teams, conversations.
 * Requires auth + club context. Max 5 results per category.
 */
me.get('/search', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const rawQ = c.req.query('q')?.trim() ?? '';
  // Strip null bytes and other control characters that crash Prisma/Postgres
  const q = rawQ.replace(/\u0000/g, '').trim();
  if (q.length < 1) {
    return c.json({ members: [], events: [], teams: [], conversations: [] });
  }

  let results: {
    members: Array<{ id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null }>;
    events: Array<{ id: string; title: string; type: string; startsAt: Date }>;
    teams: Array<{ id: string; name: string; ageGroup: string | null; sport: string | null }>;
    conversations: Array<{ id: string; title: string; type: string }>;
  } = { members: [], events: [], teams: [], conversations: [] };
  try {
    results = await prisma.withClub(member.clubId, async (tx) => {
    const [memberResults, eventResults, teamResults, conversationResults] = await Promise.all([
      // Members: search by name / email
      tx.member.findMany({
        where: {
          OR: [
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
        take: 5,
      }),

      // Events: search by title
      tx.event.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          title: true,
          type: true,
          startsAt: true,
        },
        orderBy: { startsAt: 'desc' },
        take: 5,
      }),

      // Teams: search by name
      tx.team.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          ageGroup: true,
          sport: true,
        },
        take: 5,
      }),

      // Conversations: search by title, filtered to ones the member participates in
      tx.conversation.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
          participants: { some: { memberId: member.memberId } },
        },
        select: {
          id: true,
          title: true,
          type: true,
          team: { select: { name: true } },
        },
        take: 5,
      }),
    ]);

    return {
      members: memberResults.map((m) => ({
        id: m.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      })),
      events: eventResults.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startsAt: e.startsAt,
      })),
      teams: teamResults.map((t) => ({
        id: t.id,
        name: t.name,
        ageGroup: t.ageGroup,
        sport: t.sport,
      })),
      conversations: conversationResults.map((conv) => ({
        id: conv.id,
        title: conv.title ?? conv.team?.name ?? conv.type,
        type: conv.type,
      })),
    };
  });
  } catch {
    // Malformed query strings (e.g. special chars that confuse Postgres)
    // return empty results instead of 500
    return c.json({ members: [], events: [], teams: [], conversations: [] });
  }

  return c.json(results);
});

/**
 * GET /v1/me/coach-only
 * Proves role gating: HEAD_COACH / ASSISTANT_COACH / ADMIN / OWNER only.
 */
me.get(
  '/coach-only',
  requireRole('HEAD_COACH', 'ASSISTANT_COACH', 'ADMIN', 'OWNER'),
  (c) => {
    const member = c.get('member')!;
    return c.json({
      ok: true,
      memberId: member.memberId,
      clubRoles: member.clubRoles,
      teamRoles: member.teamRoles,
    });
  },
);

/**
 * GET /v1/me/teammates
 * Returns members from teams the current user is on (deduped, excluding self).
 * Powers the "Spoluhráči" page for players — and is useful for any member who
 * wants a quick people picker.
 */
me.get('/teammates', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const myTeamIds = member.teamRoles.map((r) => r.teamId);
  if (myTeamIds.length === 0) {
    return c.json({ items: [] });
  }

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const memberships = await tx.teamMembership.findMany({
      where: {
        teamId: { in: myTeamIds },
        leftAt: null,
        memberId: { not: member.memberId },
      },
      include: {
        member: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: [{ role: 'asc' }, { member: { user: { lastName: 'asc' } } }],
    });

    const map = new Map<string, {
      memberId: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      teams: Array<{ id: string; name: string; role: string }>;
    }>();

    for (const tm of memberships) {
      const existing = map.get(tm.memberId);
      const entry = { id: tm.team.id, name: tm.team.name, role: tm.role };
      if (existing) {
        existing.teams.push(entry);
      } else {
        map.set(tm.memberId, {
          memberId: tm.memberId,
          firstName: tm.member.user.firstName,
          lastName: tm.member.user.lastName,
          avatarUrl: tm.member.user.avatarUrl,
          teams: [entry],
        });
      }
    }

    return { items: [...map.values()] };
  });

  return c.json(result);
});

export { me as meRoutes };
