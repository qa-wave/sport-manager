import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ClubConfig, ClubTheme, CreateClubInput, UpdateClubThemeInput } from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { ClubRoleType } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { invalidateFeatureCache } from '../middleware/feature-flag.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/clubs — club management endpoints.
 *
 * POST / is auth-only (no club context needed — creating a new club).
 * Other routes require x-club-id header and are role-gated.
 */
const clubs = new Hono<HonoEnv>();

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * POST /v1/clubs
 *
 * Create a new club. The authenticated user becomes the OWNER.
 * Used during self-service signup / onboarding.
 */
clubs.post(
  '/',
  requireAuth(),
  zValidator('json', CreateClubInput),
  async (c) => {
    const user = c.get('user')!;
    const input = c.req.valid('json');

    // Generate slug from name
    const slug = input.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing) {
      throw Object.assign(new Error('Club with this name already exists'), {
        statusCode: 409,
        code: 'EMAIL_CONFLICT',
      });
    }

    const club = await prisma.$transaction(async (tx) => {
      const newClub = await tx.club.create({
        data: {
          slug,
          name: input.name,
          country: input.country,
          timezone: input.timezone,
          features: {},
          config: asJson({
            tier: 'free',
            limits: { maxMembers: 50, maxTeams: 3 },
            theme: { primary: '#609bc6', secondary: '#f59e0b', tertiary: '#0f172a', styleId: 1 },
          }),
        },
      });

      // Create member + OWNER role
      const member = await tx.member.create({
        data: { userId: user.id, clubId: newClub.id },
      });

      await tx.clubRole.create({
        data: { memberId: member.id, role: ClubRoleType.OWNER },
      });

      // Create default team if sport is provided
      if (input.sport) {
        await tx.team.create({
          data: {
            clubId: newClub.id,
            name: `${input.name} — hlavní tým`,
            sport: input.sport,
            season: '2025/26',
          },
        });
      }

      return newClub;
    });

    return c.json({ club: { id: club.id, slug: club.slug, name: club.name } }, 201);
  },
);

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
