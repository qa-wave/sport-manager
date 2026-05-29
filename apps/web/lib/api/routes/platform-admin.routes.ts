import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  ClubConfig,
  FeatureFlags,
  UpdateClubConfigInput,
  UpdateClubFeaturesInput,
} from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requirePlatformAdmin } from '../middleware/rbac.middleware';
import { invalidateFeatureCache } from '../middleware/feature-flag.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/platform-admin/clubs — platform-level club management.
 *
 * Every handler is gated by requirePlatformAdmin().
 * These routes are NOT tenant-scoped — no x-club-id required.
 * Target club is always in the path.
 *
 * Every mutation writes a ClubFeatureAudit row with before/after snapshot
 * and invalidates the Redis cache.
 */
const platformAdmin = new Hono<HonoEnv>();

platformAdmin.use('/*', requirePlatformAdmin());

/**
 * Strip runtime Json wrapper types for Prisma InputJsonValue.
 * Zod parse already validated — we only strip wrapper types.
 */
function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

// ---------------------------------------------------------------------------
// GET /v1/platform-admin/clubs
// ---------------------------------------------------------------------------
platformAdmin.get('/', async (c) => {
  const clubs = await prisma.club.findMany({
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      country: true,
      timezone: true,
      features: true,
      config: true,
      createdAt: true,
      _count: { select: { members: true, teams: true } },
    },
  });

  return c.json(
    clubs.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      country: c.country,
      timezone: c.timezone,
      features: FeatureFlags.parse(c.features ?? {}),
      config: ClubConfig.parse(c.config ?? {}),
      memberCount: c._count.members,
      teamCount: c._count.teams,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

// ---------------------------------------------------------------------------
// GET /v1/platform-admin/clubs/:clubId
// ---------------------------------------------------------------------------
platformAdmin.get('/:clubId', async (c) => {
  const clubId = c.req.param('clubId');

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      slug: true,
      name: true,
      country: true,
      timezone: true,
      features: true,
      config: true,
      createdAt: true,
      _count: { select: { members: true, teams: true } },
    },
  });

  if (!club) {
    return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
  }

  return c.json({
    id: club.id,
    slug: club.slug,
    name: club.name,
    country: club.country,
    timezone: club.timezone,
    features: FeatureFlags.parse(club.features ?? {}),
    config: ClubConfig.parse(club.config ?? {}),
    memberCount: club._count.members,
    teamCount: club._count.teams,
    createdAt: club.createdAt.toISOString(),
  });
});

// ---------------------------------------------------------------------------
// PATCH /v1/platform-admin/clubs/:clubId/features
// ---------------------------------------------------------------------------
platformAdmin.patch(
  '/:clubId/features',
  zValidator('json', UpdateClubFeaturesInput),
  async (c) => {
    const user = c.get('user')!;
    const clubId = c.req.param('clubId');
    const input = c.req.valid('json');

    const parsed = FeatureFlags.parse(input.features);

    const updated = await prisma.withClub(clubId, async (tx) => {
      const current = await tx.club.findUnique({
        where: { id: clubId },
        select: { features: true, config: true },
      });
      if (!current) {
        throw Object.assign(new Error('Club not found'), {
          statusCode: 404,
          code: 'CLUB_NOT_FOUND',
        });
      }

      const before = {
        features: FeatureFlags.parse(current.features ?? {}),
        config: ClubConfig.parse(current.config ?? {}),
      };

      const row = await tx.club.update({
        where: { id: clubId },
        data: { features: asJson(parsed) },
        select: { features: true, config: true },
      });

      const after = {
        features: FeatureFlags.parse(row.features ?? {}),
        config: ClubConfig.parse(row.config ?? {}),
      };

      await tx.clubFeatureAudit.create({
        data: {
          clubId,
          changedByUserId: user.id,
          before: asJson(before),
          after: asJson(after),
          reason: input.reason ?? null,
        },
      });

      return after;
    });

    // Invalidate AFTER the transaction commits.
    await invalidateFeatureCache(clubId);

    return c.json(updated);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/platform-admin/clubs/:clubId/config
// ---------------------------------------------------------------------------
platformAdmin.patch(
  '/:clubId/config',
  zValidator('json', UpdateClubConfigInput),
  async (c) => {
    const user = c.get('user')!;
    const clubId = c.req.param('clubId');
    const input = c.req.valid('json');

    const parsed = ClubConfig.parse(input.config);

    const updated = await prisma.withClub(clubId, async (tx) => {
      const current = await tx.club.findUnique({
        where: { id: clubId },
        select: { features: true, config: true },
      });
      if (!current) {
        throw Object.assign(new Error('Club not found'), {
          statusCode: 404,
          code: 'CLUB_NOT_FOUND',
        });
      }

      const before = {
        features: FeatureFlags.parse(current.features ?? {}),
        config: ClubConfig.parse(current.config ?? {}),
      };

      const row = await tx.club.update({
        where: { id: clubId },
        data: { config: asJson(parsed) },
        select: { features: true, config: true },
      });

      const after = {
        features: FeatureFlags.parse(row.features ?? {}),
        config: ClubConfig.parse(row.config ?? {}),
      };

      await tx.clubFeatureAudit.create({
        data: {
          clubId,
          changedByUserId: user.id,
          before: asJson(before),
          after: asJson(after),
          reason: input.reason ?? null,
        },
      });

      return after;
    });

    await invalidateFeatureCache(clubId);

    return c.json(updated);
  },
);

// ---------------------------------------------------------------------------
// GET /v1/platform-admin/clubs/:clubId/audit
// ---------------------------------------------------------------------------
platformAdmin.get('/:clubId/audit', async (c) => {
  const clubId = c.req.param('clubId');
  const limitParam = c.req.query('limit');
  const cursor = c.req.query('cursor');

  // Assert club exists so unknown IDs return 404 rather than empty list.
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true },
  });
  if (!club) {
    return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
  }

  const limit = Math.min(Math.max(limitParam ? parseInt(limitParam, 10) : 20, 1), 100);

  const rows = await prisma.withClub(clubId, (tx) =>
    tx.clubFeatureAudit.findMany({
      where: { clubId },
      orderBy: { changedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        changedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    }),
  );

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
    id: r.id,
    clubId: r.clubId,
    changedAt: r.changedAt.toISOString(),
    reason: r.reason,
    changedBy: {
      id: r.changedBy.id,
      email: r.changedBy.email,
      name: `${r.changedBy.firstName} ${r.changedBy.lastName}`,
    },
    before: r.before,
    after: r.after,
  }));

  return c.json({
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  });
});

// ---------------------------------------------------------------------------
// GET /v1/platform-admin/analytics
// ---------------------------------------------------------------------------
platformAdmin.get('/analytics', async (c) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Cross-club analytics — Member/Event are RLS-protected, so run under
  // platform-admin scope (sentinel app.club_id) to see all clubs at once.
  const [
    totalClubs,
    totalUsers,
    totalMembers,
    totalEvents,
    newUsersLast30Days,
    activeClubIds,
    allClubConfigs,
  ] = await prisma.withPlatformAdmin((tx) =>
    Promise.all([
      tx.club.count(),
      tx.user.count(),
      tx.member.count(),
      tx.event.count(),
      tx.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      tx.event
        .findMany({
          where: { startsAt: { gte: sevenDaysAgo } },
          select: { clubId: true },
          distinct: ['clubId'],
        })
        .then((rows) => new Set(rows.map((r) => r.clubId))),
      tx.club.findMany({ select: { config: true } }),
    ]),
  );

  const clubsByTier: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
  for (const club of allClubConfigs) {
    const cfg = (club.config as Record<string, unknown>) ?? {};
    const tier = (cfg.tier as string) ?? 'free';
    clubsByTier[tier] = (clubsByTier[tier] ?? 0) + 1;
  }

  return c.json({
    totalClubs,
    totalUsers,
    totalMembers,
    totalEvents,
    activeClubsLast7Days: activeClubIds.size,
    newUsersLast30Days,
    clubsByTier,
  });
});

export { platformAdmin as platformAdminRoutes };
