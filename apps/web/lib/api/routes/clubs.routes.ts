import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ClubConfig, ClubTheme, UpdateClubThemeInput } from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requireRole } from '../middleware/rbac.middleware';
import { invalidateFeatureCache } from '../middleware/feature-flag.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/clubs — club-scoped management endpoints.
 *
 * Requires x-club-id header (club context middleware).
 * Routes are role-gated per handler.
 */
const clubs = new Hono<HonoEnv>();

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * PATCH /v1/clubs/theme
 *
 * Update the club's visual theme (colors + style).
 * Merges into existing config — does not overwrite tier/limits/logoSvg.
 * Requires OWNER or ADMIN club role.
 */
clubs.patch(
  '/theme',
  requireRole('OWNER', 'ADMIN'),
  zValidator('json', UpdateClubThemeInput),
  async (c) => {
    const user = c.get('user')!;
    const clubId = c.get('clubId')!;
    const input = c.req.valid('json');
    const parsedTheme = ClubTheme.parse(input.theme);

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.club.findUnique({
        where: { id: clubId },
        select: { config: true },
      });
      if (!current) {
        throw Object.assign(new Error('Club not found'), {
          statusCode: 404,
          code: 'CLUB_NOT_FOUND',
        });
      }

      const currentConfig = (current.config as Record<string, unknown>) ?? {};
      const newConfig = { ...currentConfig, theme: parsedTheme };

      const row = await tx.club.update({
        where: { id: clubId },
        data: { config: asJson(newConfig) },
        select: { config: true },
      });

      await tx.clubFeatureAudit.create({
        data: {
          clubId,
          changedByUserId: user.id,
          before: asJson({ theme: currentConfig.theme ?? null }),
          after: asJson({ theme: parsedTheme }),
          reason: 'Theme updated by club admin',
        },
      });

      return ClubConfig.parse(row.config ?? {});
    });

    await invalidateFeatureCache(clubId);
    return c.json({ config: updated });
  },
);

export { clubs as clubsRoutes };
