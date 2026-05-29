import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ClubConfig, ClubTheme, CreateClubInput, UpdateClubThemeInput, UpdateClubSettingsInput } from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { ClubRoleType } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { invalidateFeatureCache } from '../middleware/feature-flag.middleware';
import { sendEmail } from '../services/email.service';
import { getClubUsage } from '../services/limits.service';
import type { HonoEnv } from '../../types/hono';
import { APP_BASE_URL } from '../../constants';

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
 * GET /v1/clubs/public/invite-info
 *
 * Returns club name + active teams from an invite JWT. Public — no auth.
 * The token itself authorizes access (anyone with the link).
 *
 * NOTE: Must be registered BEFORE `/public/:slug` so Hono doesn't match
 * "invite-info" as a slug.
 */
clubs.get('/public/invite-info', async (c) => {
  const token = c.req.query('token');
  if (!token) {
    return c.json({ error: 'Bad Request', message: 'token query param required' }, 400);
  }

  const { jwtVerify } = await import('jose');
  const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

  let payload: { clubId?: string; purpose?: string };
  try {
    const { payload: p } = await jwtVerify(token, secret);
    payload = p as typeof payload;
  } catch {
    return c.json({ error: 'Bad Request', message: 'Invalid or expired invite link' }, 400);
  }

  if (payload.purpose !== 'invite' || !payload.clubId) {
    return c.json({ error: 'Bad Request', message: 'Invalid invite token' }, 400);
  }

  // Nested teams are RLS-protected; this is a token-gated public read of one club.
  const club = await prisma.withPlatformAdmin((tx) =>
    tx.club.findUnique({
      where: { id: payload.clubId },
      select: {
        id: true,
        name: true,
        slug: true,
        teams: {
          select: { id: true, name: true, sport: true, ageGroup: true },
          orderBy: { name: 'asc' },
        },
      },
    }),
  );

  if (!club) {
    return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
  }

  return c.json({
    clubId: club.id,
    clubName: club.name,
    slug: club.slug,
    teams: club.teams,
  });
});

/**
 * GET /v1/clubs/public/:slug
 *
 * Public club info — no auth required. Returns name, sport, teams, member count.
 */
clubs.get('/public/:slug', async (c) => {
  const slug = c.req.param('slug');

  // Public read of one club's public info; nested teams/members are RLS-protected
  // so run under platform scope. Keyed by unique slug → single club only.
  const club = await prisma.withPlatformAdmin((tx) =>
    tx.club.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        config: true,
        teams: {
          select: { id: true, name: true, sport: true, ageGroup: true, season: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { members: true } },
      },
    }),
  );

  if (!club) {
    throw Object.assign(new Error('Club not found'), { statusCode: 404, code: 'CLUB_NOT_FOUND' });
  }

  const config = ClubConfig.parse(club.config ?? {});

  return c.json({
    slug: club.slug,
    name: club.name,
    theme: config.theme,
    memberCount: club._count.members,
    teams: club.teams,
  });
});

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

      // Scope the rest of the tx to the new club so RLS WITH CHECK passes when
      // inserting the owner Member / ClubRole / Team (Club itself is not RLS'd).
      await tx.$executeRaw`SELECT set_config('app.club_id', ${newClub.id}, true)`;

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

    const updated = await prisma.withClub(clubId, async (tx) => {
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

/**
 * PATCH /v1/clubs/settings
 *
 * Update basic club settings: name, timezone, currentSeason.
 * Requires OWNER or ADMIN club role.
 */
const UpdateClubSettingsExtendedInput = UpdateClubSettingsInput.extend({
  currentSeason: z.string().min(1).max(20).optional(),
});

clubs.patch(
  '/settings',
  requireRole('OWNER', 'ADMIN'),
  zValidator('json', UpdateClubSettingsExtendedInput),
  async (c) => {
    const clubId = c.get('clubId')!;
    const input = c.req.valid('json');

    if (!input.name && !input.timezone && !input.currentSeason) {
      return c.json({ error: 'Bad Request', message: 'At least one field required' }, 400);
    }

    const updated = await prisma.withClub(clubId, async (tx) => {
      // If updating currentSeason, merge into config
      if (input.currentSeason) {
        const current = await tx.club.findUnique({ where: { id: clubId }, select: { config: true } });
        const currentConfig = (current?.config as Record<string, unknown>) ?? {};
        const newConfig = { ...currentConfig, currentSeason: input.currentSeason };
        await tx.club.update({
          where: { id: clubId },
          data: { config: asJson(newConfig) },
        });
      }

      const row = await tx.club.update({
        where: { id: clubId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.timezone ? { timezone: input.timezone } : {}),
        },
        select: { id: true, name: true, timezone: true, config: true },
      });
      return row;
    });

    return c.json({ club: { id: updated.id, name: updated.name, timezone: updated.timezone } });
  },
);

/**
 * POST /v1/clubs/archive-season
 *
 * Close the current season: store new season name in club config.
 * Requires OWNER role.
 */
const ArchiveSeasonInput = z.object({
  newSeason: z.string().min(1).max(20),
});

clubs.post(
  '/archive-season',
  requireRole('OWNER'),
  zValidator('json', ArchiveSeasonInput),
  async (c) => {
    const clubId = c.get('clubId')!;
    const { newSeason } = c.req.valid('json');

    await prisma.withClub(clubId, async (tx) => {
      const current = await tx.club.findUnique({ where: { id: clubId }, select: { config: true } });
      const currentConfig = (current?.config as Record<string, unknown>) ?? {};
      const archivedSeasons = Array.isArray(currentConfig.archivedSeasons)
        ? [...(currentConfig.archivedSeasons as string[])]
        : [];

      const previousSeason = (currentConfig.currentSeason as string | undefined) ?? null;
      if (previousSeason && !archivedSeasons.includes(previousSeason)) {
        archivedSeasons.push(previousSeason);
      }

      const newConfig = {
        ...currentConfig,
        currentSeason: newSeason,
        archivedSeasons,
      };

      await tx.club.update({
        where: { id: clubId },
        data: { config: asJson(newConfig) },
      });
    });

    return c.json({ newSeason });
  },
);

/**
 * POST /v1/clubs/invite-link
 *
 * Generate an invite link for the club. Anyone with the link can
 * join the club after registration. Token is a JWT valid for 7 days.
 * Requires OWNER or ADMIN role.
 */
clubs.post(
  '/invite-link',
  requireRole('OWNER', 'ADMIN'),
  async (c) => {
    const clubId = c.get('clubId')!;
    const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true, slug: true } });
    if (!club) {
      throw Object.assign(new Error('Club not found'), { statusCode: 404, code: 'CLUB_NOT_FOUND' });
    }

    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const token = await new SignJWT({ clubId, slug: club.slug, purpose: 'invite' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const link = `${APP_BASE_URL}/join?token=${token}`;

    return c.json({ link, expiresIn: '7 dní' });
  },
);

/**
 * POST /v1/clubs/join
 *
 * Join a club using an invite token. Authenticated user is added
 * as a member of the club. Optionally takes a team role + team to
 * create the team membership in a single step (e.g. "I'm a player on U13").
 */
clubs.post(
  '/join',
  requireAuth(),
  async (c) => {
    const user = c.get('user')!;
    const body = await c.req.json() as {
      token: string;
      teamRole?: 'PLAYER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'TEAM_MANAGER' | 'MEDIC';
      teamId?: string;
    };

    const ALLOWED_TEAM_ROLES = new Set([
      'PLAYER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER', 'MEDIC',
    ]);

    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

    let payload: { clubId?: string; purpose?: string };
    try {
      const { payload: p } = await jwtVerify(body.token, secret);
      payload = p as typeof payload;
    } catch {
      return c.json({ error: 'Bad Request', message: 'Invalid or expired invite link', code: 'INVALID_TOKEN' }, 400);
    }

    if (payload.purpose !== 'invite' || !payload.clubId) {
      return c.json({ error: 'Bad Request', message: 'Invalid invite token', code: 'INVALID_TOKEN' }, 400);
    }

    const clubId = payload.clubId;

    // Resolve member + optional team membership inside a single withClub transaction.
    const { teamNotFound, invalidRole } = await prisma.withClub(clubId, async (tx) => {
      let m = await tx.member.findUnique({
        where: { userId_clubId: { userId: user.id, clubId } },
        select: { id: true },
      });
      if (!m) {
        m = await tx.member.create({
          data: { userId: user.id, clubId },
          select: { id: true },
        });
      }

      // Optional: attach team role in one step.
      if (body.teamRole && body.teamId) {
        if (!ALLOWED_TEAM_ROLES.has(body.teamRole)) {
          return { member: m, teamNotFound: false, invalidRole: true };
        }

        const team = await tx.team.findFirst({
          where: { id: body.teamId, clubId },
          select: { id: true },
        });
        if (!team) {
          return { member: m, teamNotFound: true };
        }

        await tx.teamMembership.upsert({
          where: {
            memberId_teamId_role: {
              memberId: m.id,
              teamId: body.teamId,
              role: body.teamRole,
            },
          },
          create: {
            memberId: m.id,
            teamId: body.teamId,
            role: body.teamRole,
          },
          update: { leftAt: null },
        });
      }

      return { member: m, teamNotFound: false };
    });

    if (invalidRole) {
      return c.json({ error: 'Bad Request', message: 'Invalid team role', code: 'INVALID_ROLE' }, 400);
    }
    if (teamNotFound) {
      return c.json({ error: 'Not Found', message: 'Team not found in this club', code: 'TEAM_NOT_FOUND' }, 404);
    }

    return c.json({ clubId, message: 'Joined successfully' }, 201);
  },
);

/**
 * GET /v1/clubs/audit
 *
 * Club-scoped audit log. Requires OWNER or ADMIN role.
 * Returns the ClubFeatureAudit rows for the active club.
 */
clubs.get('/audit', requireRole('OWNER', 'ADMIN'), async (c) => {
  const clubId = c.get('clubId')!;
  const limitParam = c.req.query('limit');
  const cursor = c.req.query('cursor');
  const limit = Math.min(Math.max(limitParam ? parseInt(limitParam, 10) : 20, 1), 100);

  const rows = await prisma.withClub(clubId, (tx) =>
    tx.clubFeatureAudit.findMany({
      where: { clubId },
      orderBy: { changedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        changedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }),
  );

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
    id: r.id,
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

  return c.json({ items, hasMore, nextCursor: hasMore ? items[items.length - 1]!.id : null });
});

/**
 * GET /v1/clubs/referral-code
 *
 * Returns a short referral code for the club (first 8 chars of club ID).
 * Requires OWNER or ADMIN role.
 */
clubs.get('/referral-code', requireRole('OWNER', 'ADMIN'), async (c) => {
  const clubId = c.get('clubId')!;
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, slug: true, config: true },
  });
  if (!club) {
    throw Object.assign(new Error('Club not found'), { statusCode: 404, code: 'CLUB_NOT_FOUND' });
  }

  const code = club.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  const link = `${APP_BASE_URL}/signup?ref=${code}`;

  const cfg = (club.config as Record<string, unknown>) ?? {};
  const referredClubs: string[] = Array.isArray(cfg.referredClubs)
    ? (cfg.referredClubs as string[])
    : [];

  return c.json({ code, link, referredCount: referredClubs.length });
});

/**
 * POST /v1/clubs/apply-referral
 *
 * Apply a referral code from another club. Stores the referrer in club config.
 * Requires OWNER role.
 */
const ApplyReferralInput = z.object({ code: z.string().min(1).max(20) });

clubs.post('/apply-referral', requireRole('OWNER'), zValidator('json', ApplyReferralInput), async (c) => {
  const clubId = c.get('clubId')!;
  const { code } = c.req.valid('json');

  // Find the referrer club by matching code (first 8 chars of ID, uppercased, no dashes)
  const allClubs = await prisma.club.findMany({ select: { id: true } });
  const referrer = allClubs.find(
    (cl) => cl.id.replace(/-/g, '').slice(0, 8).toUpperCase() === code.toUpperCase(),
  );

  if (!referrer) {
    return c.json({ error: 'Not Found', message: 'Referral code not found' }, 404);
  }
  if (referrer.id === clubId) {
    return c.json({ error: 'Bad Request', message: 'Cannot apply own referral code' }, 400);
  }

  // Store referredBy in current club config, add current club to referrer's referredClubs
  await prisma.withClub(clubId, async (tx) => {
    const [currentClub, referrerClub] = await Promise.all([
      tx.club.findUnique({ where: { id: clubId }, select: { config: true } }),
      tx.club.findUnique({ where: { id: referrer.id }, select: { config: true } }),
    ]);

    const currentCfg = (currentClub?.config as Record<string, unknown>) ?? {};
    await tx.club.update({
      where: { id: clubId },
      data: { config: asJson({ ...currentCfg, referredBy: referrer.id }) },
    });

    const referrerCfg = (referrerClub?.config as Record<string, unknown>) ?? {};
    const referredClubs: string[] = Array.isArray(referrerCfg.referredClubs)
      ? [...(referrerCfg.referredClubs as string[])]
      : [];
    if (!referredClubs.includes(clubId)) referredClubs.push(clubId);
    await tx.club.update({
      where: { id: referrer.id },
      data: { config: asJson({ ...referrerCfg, referredClubs }) },
    });
  });

  return c.json({ message: 'Referral applied', referrerId: referrer.id });
});

// ---------------------------------------------------------------------------
// GET /v1/clubs/public/:slug/registration
// PUBLIC — returns registration form config
// ---------------------------------------------------------------------------
clubs.get('/public/:slug/registration', async (c) => {
  const slug = c.req.param('slug');

  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      config: true,
      teams: {
        select: { id: true, name: true, sport: true, ageGroup: true, season: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!club) {
    return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
  }

  const cfg = (club.config as Record<string, unknown>) ?? {};
  const regConfig = (cfg.registration as Record<string, unknown> | undefined) ?? {};
  const open = (regConfig.open as boolean | undefined) ?? false;

  return c.json({
    open,
    clubName: club.name,
    teams: club.teams,
    fields: [
      { name: 'childFirstName', label: 'Jméno dítěte', required: true },
      { name: 'childLastName', label: 'Příjmení dítěte', required: true },
      { name: 'dateOfBirth', label: 'Datum narození', required: true, type: 'date' },
      { name: 'parentFirstName', label: 'Jméno rodiče/zákonného zástupce', required: true },
      { name: 'parentLastName', label: 'Příjmení rodiče/zákonného zástupce', required: true },
      { name: 'parentEmail', label: 'Email rodiče', required: true, type: 'email' },
      { name: 'parentPhone', label: 'Telefon rodiče', required: false },
      { name: 'teamId', label: 'Tým (volitelné)', required: false },
      { name: 'notes', label: 'Poznámky', required: false },
    ],
  });
});

// ---------------------------------------------------------------------------
// POST /v1/clubs/public/:slug/registration
// PUBLIC — submit registration form
// ---------------------------------------------------------------------------
const RegistrationInput = z.object({
  childFirstName: z.string().min(1).max(100),
  childLastName: z.string().min(1).max(100),
  dateOfBirth: z.string().min(1),
  parentFirstName: z.string().min(1).max(100),
  parentLastName: z.string().min(1).max(100),
  parentEmail: z.string().email(),
  parentPhone: z.string().optional(),
  teamId: z.string().optional(),
  notes: z.string().optional(),
});

clubs.post('/public/:slug/registration', zValidator('json', RegistrationInput), async (c) => {
  const slug = c.req.param('slug');
  const input = c.req.valid('json');

  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true, config: true },
  });

  if (!club) {
    return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
  }

  const cfg = (club.config as Record<string, unknown>) ?? {};
  const regConfig = (cfg.registration as Record<string, unknown> | undefined) ?? {};
  const open = (regConfig.open as boolean | undefined) ?? false;

  if (!open) {
    return c.json({ error: 'Forbidden', message: 'Registrace je momentálně uzavřena' }, 403);
  }

  // Check team exists in this club if teamId provided
  if (input.teamId) {
    const team = await prisma.withClub(club.id, (tx) =>
      tx.team.findFirst({ where: { id: input.teamId!, clubId: club.id } }),
    );
    if (!team) {
      return c.json({ error: 'Bad Request', message: 'Team not found in this club' }, 400);
    }
  }

  await prisma.withClub(club.id, async (tx) => {
    // Upsert parent user
    let parentUser = await tx.user.findUnique({ where: { email: input.parentEmail } });
    if (!parentUser) {
      parentUser = await tx.user.create({
        data: {
          email: input.parentEmail,
          firstName: input.parentFirstName,
          lastName: input.parentLastName,
          phone: input.parentPhone ?? null,
        },
      });
    }

    // Upsert child user — use fake email derived from parent email + child name
    const childEmailKey = `${input.childFirstName.toLowerCase()}.${input.childLastName.toLowerCase()}+child@reg.sport-manager.internal`;
    let childUser = await tx.user.findFirst({
      where: {
        firstName: input.childFirstName,
        lastName: input.childLastName,
        dateOfBirth: new Date(input.dateOfBirth),
      },
    });
    if (!childUser) {
      // Generate a unique internal email that won't conflict
      const existing = await tx.user.count({ where: { email: childEmailKey } });
      const uniqueEmail = existing > 0 ? `${childEmailKey}.${Date.now()}` : childEmailKey;
      childUser = await tx.user.create({
        data: {
          email: uniqueEmail,
          firstName: input.childFirstName,
          lastName: input.childLastName,
          dateOfBirth: new Date(input.dateOfBirth),
        },
      });
    }

    // Upsert parent member in this club
    let parentMember = await tx.member.findUnique({
      where: { userId_clubId: { userId: parentUser.id, clubId: club.id } },
    });
    if (!parentMember) {
      parentMember = await tx.member.create({
        data: { userId: parentUser.id, clubId: club.id, isMinor: false },
      });
    }

    // Upsert child member in this club
    let childMember = await tx.member.findUnique({
      where: { userId_clubId: { userId: childUser.id, clubId: club.id } },
    });
    if (!childMember) {
      childMember = await tx.member.create({
        data: {
          userId: childUser.id,
          clubId: club.id,
          isMinor: true,
        },
      });
    }

    // Create guardian link if not exists
    const existingLink = await tx.guardianLink.findUnique({
      where: { guardianId_childId: { guardianId: parentMember.id, childId: childMember.id } },
    });
    if (!existingLink) {
      await tx.guardianLink.create({
        data: {
          guardianId: parentMember.id,
          childId: childMember.id,
          relationship: 'PARENT',
          isPrimary: true,
          canViewSchedule: true,
          canRsvp: true,
          canSignWaivers: true,
        },
      });
    }

    // Add child to team if specified
    if (input.teamId && childMember) {
      const existingMembership = await tx.teamMembership.findFirst({
        where: { memberId: childMember.id, teamId: input.teamId, leftAt: null },
      });
      if (!existingMembership) {
        await tx.teamMembership.create({
          data: { memberId: childMember.id, teamId: input.teamId, role: 'PLAYER' },
        });
      }
    }

    // Store notes in member (we reuse medicalNotes field as general notes for now)
    if (input.notes && childMember) {
      await tx.member.update({
        where: { id: childMember.id },
        data: { medicalNotes: input.notes },
      });
    }
  });

  // Send confirmation email (fire-and-forget)
  sendEmail({
    to: input.parentEmail,
    subject: `Registrace do ${club.name} — potvrzení`,
    html: `
      <h2>Registrace potvrzena</h2>
      <p>Dobrý den ${input.parentFirstName},</p>
      <p>Vaše dítě <strong>${input.childFirstName} ${input.childLastName}</strong> bylo úspěšně zaregistrováno do klubu <strong>${club.name}</strong>.</p>
      <p>Administrátor klubu Vás brzy kontaktuje s dalšími informacemi.</p>
      <p style="color:#666;font-size:12px">Sport Manager</p>
    `,
  }).catch((err) => console.error('[clubs/registration] confirmation email failed:', err));

  return c.json({ message: 'Registrace byla úspěšně odeslána' }, 201);
});

// ---------------------------------------------------------------------------
// PATCH /v1/clubs/registration-config — toggle registration open/closed
// Requires OWNER role
// ---------------------------------------------------------------------------
const RegistrationConfigInput = z.object({
  open: z.boolean(),
});

clubs.patch(
  '/registration-config',
  requireRole('OWNER'),
  zValidator('json', RegistrationConfigInput),
  async (c) => {
    const clubId = c.get('clubId')!;
    const { open } = c.req.valid('json');

    await prisma.withClub(clubId, async (tx) => {
      const current = await tx.club.findUnique({ where: { id: clubId }, select: { config: true } });
      const currentConfig = (current?.config as Record<string, unknown>) ?? {};
      const regConfig = (currentConfig.registration as Record<string, unknown> | undefined) ?? {};
      const newConfig = {
        ...currentConfig,
        registration: { ...regConfig, open },
      };
      await tx.club.update({ where: { id: clubId }, data: { config: asJson(newConfig) } });
    });

    return c.json({ open });
  },
);

// ---------------------------------------------------------------------------
// GET /v1/clubs/usage
// Returns current plan + member/team usage counts for the upgrade banner.
// ---------------------------------------------------------------------------
clubs.get('/usage', requireAuth(), async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }
  try {
    const usage = await getClubUsage(clubId);
    return c.json(usage);
  } catch (err) {
    console.error('[clubs/usage] Error:', err);
    return c.json({ error: 'Internal error', message: String(err) }, 500);
  }
});

export { clubs as clubsRoutes };
