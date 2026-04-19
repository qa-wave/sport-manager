import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@club/db';
import {
  ClubConfig,
  FeatureFlags,
  type UpdateClubConfigInput,
  type UpdateClubFeaturesInput,
} from '@club/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { FeaturesService } from '../features/features.service';

/**
 * Prisma's `Json` columns expect `InputJsonValue`; Zod `passthrough` output
 * widens to `{ [k: string]: unknown }` which doesn't structurally match.
 * Rather than sprinkle casts at every call-site we funnel through this helper.
 * The Zod parse above already validated — we only strip runtime wrapper types.
 */
function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Implementation of the /platform-admin/clubs/* routes.
 *
 * Every mutation:
 *   1. Loads the current `{ features, config }` state (used as the `before`
 *      snapshot).
 *   2. Writes the updated JSON via Prisma.
 *   3. Writes a `ClubFeatureAudit` row with before/after snapshots.
 *   4. Invalidates the Redis cache so the next read picks up the change.
 *
 * The whole pipeline runs in a single transaction so we never end up with
 * an updated Club but no audit record (or vice versa).
 */
@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly features: FeaturesService,
  ) {}

  async listClubs() {
    const clubs = await this.prisma.club.findMany({
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

    return clubs.map((c) => ({
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
    }));
  }

  async getClub(clubId: string) {
    const club = await this.prisma.club.findUnique({
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
    if (!club) throw new NotFoundException('Club not found');

    return {
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
    };
  }

  async updateFeatures(
    clubId: string,
    changedByUserId: string,
    input: UpdateClubFeaturesInput,
  ) {
    const parsed = FeatureFlags.parse(input.features);
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.club.findUnique({
        where: { id: clubId },
        select: { features: true, config: true },
      });
      if (!current) throw new NotFoundException('Club not found');

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
          changedByUserId,
          before: asJson(before),
          after: asJson(after),
          reason: input.reason ?? null,
        },
      });

      return after;
    });

    // Invalidate AFTER the transaction commits — if the transaction rolled
    // back, the cache still reflects the (correct) old value.
    await this.features.invalidate(clubId);

    return updated;
  }

  async updateConfig(
    clubId: string,
    changedByUserId: string,
    input: UpdateClubConfigInput,
  ) {
    const parsed = ClubConfig.parse(input.config);
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.club.findUnique({
        where: { id: clubId },
        select: { features: true, config: true },
      });
      if (!current) throw new NotFoundException('Club not found');

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
          changedByUserId,
          before: asJson(before),
          after: asJson(after),
          reason: input.reason ?? null,
        },
      });

      return after;
    });

    await this.features.invalidate(clubId);
    return updated;
  }

  async listAudit(clubId: string, opts: { limit?: number; cursor?: string }) {
    // Assert club exists so unknown IDs return 404 rather than an empty list.
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });
    if (!club) throw new NotFoundException('Club not found');

    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    const rows = await this.prisma.clubFeatureAudit.findMany({
      where: { clubId },
      orderBy: { changedAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      include: {
        changedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

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

    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]!.id : null,
    };
  }
}
