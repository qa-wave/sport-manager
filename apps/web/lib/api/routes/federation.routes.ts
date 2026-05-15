import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { getAllFederations, getAdapter } from '../services/federation-sync/registry';
import { assertPlan } from '../services/limits.service';
import type { FederationFixture } from '../services/federation-sync/types';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/federation — federation/league sync plugin system.
 *
 * GET  /v1/federation/adapters                    — list all federations (active + coming_soon)
 * GET  /v1/federation/config                      — get club federation config
 * PUT  /v1/federation/config                      — save/update club federation config
 * GET  /v1/federation/:adapterId/search?q=...     — search teams via adapter (free)
 * GET  /v1/federation/:adapterId/fixtures/:teamId — fetch upcoming fixtures (free)
 * POST /v1/federation/sync                        — import selected fixtures as MATCH events (pro+)
 * POST /v1/federation/auto-sync                   — batch sync all clubs with autoSync=true (pro+)
 */
const federation = new Hono<HonoEnv>();

federation.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// GET /v1/federation/adapters
// ---------------------------------------------------------------------------
federation.get('/adapters', (c) => {
  const federations = getAllFederations();
  return c.json(federations);
});

// ---------------------------------------------------------------------------
// GET /v1/federation/config
// Returns the federation config stored in club.config.federation
// ---------------------------------------------------------------------------
federation.get('/config', async (c) => {
  const member = c.get('member')!;

  const club = await prisma.club.findUnique({
    where: { id: member.clubId },
    select: { config: true },
  });

  if (!club) {
    return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
  }

  const config = (club.config as Record<string, unknown>) ?? {};
  const federationConfig = config.federation ?? null;

  return c.json({ federation: federationConfig });
});

// ---------------------------------------------------------------------------
// PUT /v1/federation/config
// Saves/updates federation config in club.config.federation
// ---------------------------------------------------------------------------
const FederationConfigInput = z.object({
  adapterId: z.string().min(1),
  teamId: z.string().min(1),
  teamName: z.string().min(1),
  internalTeamId: z.string().min(1),
  autoSync: z.boolean().default(false),
});

federation.put(
  '/config',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', FederationConfigInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    const club = await prisma.club.findUnique({
      where: { id: member.clubId },
      select: { config: true },
    });

    if (!club) {
      return c.json({ error: 'Not Found', message: 'Club not found' }, 404);
    }

    const existingConfig = (club.config as Record<string, unknown>) ?? {};

    const updatedFederationConfig = {
      adapterId: input.adapterId,
      teamId: input.teamId,
      teamName: input.teamName,
      internalTeamId: input.internalTeamId,
      autoSync: input.autoSync,
      lastSyncAt: (existingConfig.federation as Record<string, unknown> | null)?.lastSyncAt ?? null,
    };

    await prisma.club.update({
      where: { id: member.clubId },
      data: {
        config: {
          ...existingConfig,
          federation: updatedFederationConfig,
        },
      },
    });

    return c.json({ federation: updatedFederationConfig });
  },
);

// ---------------------------------------------------------------------------
// GET /v1/federation/:adapterId/search?q=teamName  (free — no gate)
// ---------------------------------------------------------------------------
federation.get('/:adapterId/search', async (c) => {
  const { adapterId } = c.req.param();
  const q = c.req.query('q');

  if (!q || q.trim().length < 2) {
    return c.json(
      { error: 'Bad Request', message: 'Query parameter q must be at least 2 characters' },
      400,
    );
  }

  const adapter = getAdapter(adapterId);
  if (!adapter) {
    return c.json(
      { error: 'Not Found', message: `Federation adapter '${adapterId}' not found or not yet implemented` },
      404,
    );
  }

  try {
    const teams = await adapter.searchTeams(q.trim());
    return c.json(teams);
  } catch (err) {
    console.error(`[federation] searchTeams error (${adapterId}):`, err);
    return c.json(
      { error: 'Internal Server Error', message: 'Failed to search teams' },
      500,
    );
  }
});

// ---------------------------------------------------------------------------
// GET /v1/federation/:adapterId/fixtures/:teamId  (free — no gate)
// ---------------------------------------------------------------------------
federation.get('/:adapterId/fixtures/:teamId', async (c) => {
  const { adapterId, teamId } = c.req.param();
  const seasonId = c.req.query('seasonId');

  const adapter = getAdapter(adapterId);
  if (!adapter) {
    return c.json(
      { error: 'Not Found', message: `Federation adapter '${adapterId}' not found or not yet implemented` },
      404,
    );
  }

  try {
    const fixtures = await adapter.getFixtures(teamId, seasonId);
    return c.json(fixtures);
  } catch (err) {
    console.error(`[federation] getFixtures error (${adapterId}, team=${teamId}):`, err);
    return c.json(
      { error: 'Internal Server Error', message: 'Failed to fetch fixtures' },
      500,
    );
  }
});

// ---------------------------------------------------------------------------
// POST /v1/federation/sync  (pro+ gated)
// Body: { adapterId, teamId, fixtures: FederationFixture[], teamIdInternal: string }
// Creates MATCH events for each fixture. Skips duplicates by externalId stored
// in description marker <!-- federation:externalId -->.
// ---------------------------------------------------------------------------
const SyncInput = z.object({
  adapterId: z.string().min(1),
  teamId: z.string().min(1),
  teamIdInternal: z.string().uuid(),
  fixtures: z.array(
    z.object({
      externalId: z.string(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      date: z.string(),
      location: z.string().optional(),
      competition: z.string().optional(),
      round: z.string().optional(),
      status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
      homeScore: z.number().optional(),
      awayScore: z.number().optional(),
    }),
  ).min(1).max(100),
});

federation.post(
  '/sync',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', SyncInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    // Feature gate: pro plan required for actual sync
    await assertPlan(member.clubId, 'pro', 'federation-sync', member.userId);

    const adapter = getAdapter(input.adapterId);
    if (!adapter) {
      return c.json(
        { error: 'Not Found', message: `Federation adapter '${input.adapterId}' not found` },
        404,
      );
    }

    const result = await syncFixturesToClub({
      clubId: member.clubId,
      createdById: member.memberId,
      teamIdInternal: input.teamIdInternal,
      fixtures: input.fixtures as FederationFixture[],
    });

    // Update lastSyncAt in config
    await updateLastSyncAt(member.clubId);

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/federation/auto-sync  (pro+ gated, typically called by cron)
// Finds all clubs with autoSync=true and syncs their fixtures.
// ---------------------------------------------------------------------------
federation.post('/auto-sync', requireRole('ADMIN', 'OWNER', 'HEAD_COACH'), async (c) => {
  const member = c.get('member')!;

  // Gate for the calling club
  await assertPlan(member.clubId, 'pro', 'federation-sync', member.userId);

  const summary = await runAutoSync();
  return c.json(summary);
});

// ---------------------------------------------------------------------------
// Shared sync logic
// ---------------------------------------------------------------------------

export type SyncFixturesOptions = {
  clubId: string;
  createdById: string;
  teamIdInternal: string;
  fixtures: FederationFixture[];
};

export type SyncFixturesResult = {
  created: number;
  skipped: number;
  errors: string[];
};

/**
 * Core sync logic: import fixtures as MATCH events, deduplicating by federation marker.
 * Extracted so it can be reused by both manual sync and auto-sync cron.
 */
export async function syncFixturesToClub(
  opts: SyncFixturesOptions,
): Promise<SyncFixturesResult> {
  return prisma.withClub(opts.clubId, async (tx) => {
    // Verify team belongs to this club
    const team = await tx.team.findUnique({
      where: { id: opts.teamIdInternal },
      select: { id: true, name: true },
    });
    if (!team) {
      throw Object.assign(new Error('Team not found'), {
        statusCode: 404,
        code: 'TEAM_NOT_FOUND',
      });
    }

    // Fetch existing events that have a federation marker to detect duplicates
    const existingMarkerRe = /<!--\s*federation:([^\s]+)\s*-->/;
    const existingEvents = await tx.event.findMany({
      where: {
        teamId: opts.teamIdInternal,
        description: { contains: `<!-- federation:` },
      },
      select: { description: true },
    });
    const importedExternalIds = new Set<string>();
    for (const ev of existingEvents) {
      const match = existingMarkerRe.exec(ev.description ?? '');
      if (match?.[1]) importedExternalIds.add(match[1]);
    }

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const fixture of opts.fixtures) {
      // Skip already imported
      if (importedExternalIds.has(fixture.externalId)) {
        skipped.push(fixture.externalId);
        continue;
      }

      try {
        const startsAt = new Date(fixture.date);
        // Default match duration: 90 min
        const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);

        // Determine home/away for our club's team
        const homeTeamName = team.name.toLowerCase();
        const isHome =
          fixture.homeTeam.toLowerCase().includes(homeTeamName) ||
          homeTeamName.includes(fixture.homeTeam.toLowerCase());
        const homeAway = isHome ? 'HOME' : 'AWAY';
        const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;

        // Build title: "vs Opponent (competition round)"
        const roundSuffix = fixture.round ? ` — ${fixture.round}` : '';
        const compSuffix = fixture.competition ? ` (${fixture.competition}${roundSuffix})` : roundSuffix;
        const title = `vs ${opponent}${compSuffix}`;

        // Embed externalId as marker in description for dedup on future syncs
        const description = `<!-- federation:${fixture.externalId} -->`;

        await tx.event.create({
          data: {
            clubId: opts.clubId,
            createdById: opts.createdById,
            teamId: opts.teamIdInternal,
            type: 'MATCH',
            title,
            description,
            startsAt,
            endsAt,
            location: fixture.location ?? null,
            opponent,
            homeAway: homeAway as 'HOME' | 'AWAY',
          },
        });

        created.push(fixture.externalId);
      } catch (err) {
        console.error(`[federation] Failed to create event for fixture ${fixture.externalId}:`, err);
        errors.push(fixture.externalId);
      }
    }

    return { created: created.length, skipped: skipped.length, errors };
  });
}

/**
 * Auto-sync runner: finds all clubs with autoSync=true and syncs each one.
 * Returns a summary of results across all clubs.
 */
export async function runAutoSync(): Promise<{
  clubsProcessed: number;
  newMatches: number;
  skipped: number;
  errors: { clubId: string; error: string }[];
}> {
  // Find all clubs that have federation config with autoSync=true
  const clubs = await prisma.club.findMany({
    where: {
      config: { path: ['federation', 'autoSync'], equals: true },
    },
    select: { id: true, name: true, config: true },
  });


  let clubsProcessed = 0;
  let newMatches = 0;
  let skippedTotal = 0;
  const errors: { clubId: string; error: string }[] = [];

  for (const club of clubs) {
    try {
      const config = club.config as Record<string, unknown>;
      const fedConfig = config.federation as {
        adapterId?: string;
        teamId?: string;
        internalTeamId?: string;
        autoSync?: boolean;
      } | null;

      if (!fedConfig?.adapterId || !fedConfig?.teamId || !fedConfig?.internalTeamId) {
        console.warn(`[federation] auto-sync: club ${club.id} has incomplete federation config, skipping`);
        continue;
      }

      const adapter = getAdapter(fedConfig.adapterId);
      if (!adapter) {
        errors.push({ clubId: club.id, error: `Adapter '${fedConfig.adapterId}' not found` });
        continue;
      }

      const fixtures = await adapter.getFixtures(fedConfig.teamId);
      const scheduledFixtures = fixtures.filter((f) => f.status !== 'completed');

      if (scheduledFixtures.length === 0) {
        clubsProcessed++;
        continue;
      }

      // Find any club member to use as createdById (prefer owner/admin)
      const adminMember = await prisma.member.findFirst({
        where: {
          clubId: club.id,
          clubRoles: { some: { role: { in: ['OWNER', 'ADMIN'] } } },
        },
        select: { id: true },
      });

      if (!adminMember) {
        errors.push({ clubId: club.id, error: 'No admin member found for createdById' });
        continue;
      }

      const result = await syncFixturesToClub({
        clubId: club.id,
        createdById: adminMember.id,
        teamIdInternal: fedConfig.internalTeamId,
        fixtures: scheduledFixtures,
      });

      newMatches += result.created;
      skippedTotal += result.skipped;
      if (result.errors.length > 0) {
        errors.push({ clubId: club.id, error: `${result.errors.length} fixture(s) failed` });
      }

      await updateLastSyncAt(club.id);
      clubsProcessed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[federation] auto-sync: error for club ${club.id}:`, err);
      errors.push({ clubId: club.id, error: msg });
    }
  }

  return { clubsProcessed, newMatches, skipped: skippedTotal, errors };
}

/** Stamp club.config.federation.lastSyncAt with current ISO timestamp. */
async function updateLastSyncAt(clubId: string): Promise<void> {
  try {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { config: true },
    });
    if (!club) return;

    const config = (club.config as Record<string, unknown>) ?? {};
    const fedConfig = (config.federation as Record<string, unknown>) ?? {};

    await prisma.club.update({
      where: { id: clubId },
      data: {
        config: {
          ...config,
          federation: {
            ...fedConfig,
            lastSyncAt: new Date().toISOString(),
          },
        },
      },
    });
  } catch (err) {
    console.error('[federation] updateLastSyncAt error:', err);
  }
}

export { federation as federationRoutes };
