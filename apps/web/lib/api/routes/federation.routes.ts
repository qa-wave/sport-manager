import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { getAllFederations, getAdapter } from '../services/federation-sync/registry';
import type { FederationFixture } from '../services/federation-sync/types';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/federation — federation/league sync plugin system.
 *
 * GET  /v1/federation/adapters                    — list all federations (active + coming_soon)
 * GET  /v1/federation/:adapterId/search?q=...     — search teams via adapter
 * GET  /v1/federation/:adapterId/fixtures/:teamId — fetch upcoming fixtures
 * POST /v1/federation/sync                        — import selected fixtures as MATCH events
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
// GET /v1/federation/:adapterId/search?q=teamName
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
// GET /v1/federation/:adapterId/fixtures/:teamId
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
// POST /v1/federation/sync
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

    const adapter = getAdapter(input.adapterId);
    if (!adapter) {
      return c.json(
        { error: 'Not Found', message: `Federation adapter '${input.adapterId}' not found` },
        404,
      );
    }

    const result = await prisma.withClub(member.clubId, async (tx) => {
      // Verify team belongs to this club
      const team = await tx.team.findUnique({
        where: { id: input.teamIdInternal },
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
          teamId: input.teamIdInternal,
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

      for (const fixture of input.fixtures as FederationFixture[]) {
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
              clubId: member.clubId,
              createdById: member.memberId,
              teamId: input.teamIdInternal,
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

    return c.json(result, 201);
  },
);

export { federation as federationRoutes };
