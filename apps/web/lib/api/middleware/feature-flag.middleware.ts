import { createMiddleware } from 'hono/factory';
import {
  ClubConfig,
  CONFIG_DEFAULTS,
  FeatureFlags,
  FEATURE_DEFAULTS,
} from '@branik/contracts';
import { prisma } from '../prisma';
import { cache } from '../redis';
import type { HonoEnv } from '../../types/hono';

/**
 * Cache TTL for per-club features/config. Mirrors features.service.ts (60s).
 */
const CACHE_TTL_SECONDS = 60;

export interface ClubFeatureState {
  clubId: string;
  features: FeatureFlags;
  config: ClubConfig;
}

// ---------------------------------------------------------------------------
// FeaturesService — matches apps/api/src/features/features.service.ts exactly.
// ---------------------------------------------------------------------------
function cacheKey(clubId: string): string {
  return `club:${clubId}:features`;
}

export async function getFeaturesState(clubId: string): Promise<ClubFeatureState> {
  const key = cacheKey(clubId);
  const cached = await cache.get(key);

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as ClubFeatureState;
      return {
        clubId,
        features: FeatureFlags.parse(parsed.features ?? {}),
        config: ClubConfig.parse(parsed.config ?? {}),
      };
    } catch {
      await cache.del(key);
    }
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, features: true, config: true },
  });

  if (!club) {
    throw Object.assign(new Error(`Club ${clubId} not found`), {
      statusCode: 404,
      code: 'CLUB_NOT_FOUND',
    });
  }

  const state: ClubFeatureState = {
    clubId,
    features: FeatureFlags.parse(club.features ?? {}),
    config: ClubConfig.parse(club.config ?? {}),
  };

  await cache.set(key, JSON.stringify(state), CACHE_TTL_SECONDS);
  return state;
}

export async function getFeatures(clubId: string): Promise<FeatureFlags> {
  return (await getFeaturesState(clubId)).features;
}

export async function getClubConfig(clubId: string): Promise<ClubConfig> {
  return (await getFeaturesState(clubId)).config;
}

export async function invalidateFeatureCache(clubId: string): Promise<void> {
  await cache.del(cacheKey(clubId));
}

export function featuresDefaults(): { features: FeatureFlags; config: ClubConfig } {
  return { features: FEATURE_DEFAULTS, config: CONFIG_DEFAULTS };
}

// ---------------------------------------------------------------------------
// requireFeature(feature) — route-group-level middleware factory.
// Checks whether the active club has a specific feature flag enabled.
// ---------------------------------------------------------------------------
export function requireFeature(feature: keyof FeatureFlags) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    try {
      const features = await getFeatures(clubId);
      if (!features[feature]) {
        return c.json(
          {
            error: 'Forbidden',
            message: `Feature '${feature}' is not enabled for this club`,
          },
          403,
        );
      }
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      if (e.statusCode === 404) {
        return c.json({ error: 'Not Found', message: e.message }, 404);
      }
      throw err;
    }

    return next();
  });
}
