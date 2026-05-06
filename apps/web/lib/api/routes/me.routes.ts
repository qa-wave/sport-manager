import { Hono } from 'hono';
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

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      locale: true,
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
  });

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
    avatarUrl: full.avatarUrl,
    locale: full.locale,
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

export { me as meRoutes };
