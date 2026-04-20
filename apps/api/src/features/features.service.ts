import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ClubConfig,
  CONFIG_DEFAULTS,
  FeatureFlags,
  FEATURE_DEFAULTS,
} from '@branik/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from './redis-cache.service';

/**
 * Resolver + cache for per-club `features` and `config`.
 *
 *   - `getFeatures(clubId)` is called from FeaturesGuard on every gated
 *     request. That's the hot path -> Redis cache with a 60 s TTL.
 *   - Writes (platform-admin) call `invalidate(clubId)` so the next read
 *     picks up fresh state immediately (no 60s stale-read window).
 *
 * The Zod schemas in `@branik/contracts` are the source of truth: we always
 * `.parse(...)` the raw JSON columns so defaults are applied and unknown /
 * bad values can't leak into business logic.
 */
const CACHE_TTL_SECONDS = 60;

export interface ClubFeatureState {
  clubId: string;
  features: FeatureFlags;
  config: ClubConfig;
}

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Returns `{ features, config }` for the given club. Throws NotFound if
   * the club doesn't exist (defensive — TenantMiddleware should already
   * have stopped garbage clubIds). Cached for 60s.
   */
  async getState(clubId: string): Promise<ClubFeatureState> {
    const key = this.key(clubId);
    const cached = await this.cache.get(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ClubFeatureState;
        return {
          clubId,
          features: FeatureFlags.parse(parsed.features ?? {}),
          config: ClubConfig.parse(parsed.config ?? {}),
        };
      } catch (err) {
        this.logger.warn(
          `Corrupted cache for ${key} (${(err as Error).message}) — refetching`,
        );
        await this.cache.del(key);
      }
    }

    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, features: true, config: true },
    });
    if (!club) {
      throw new NotFoundException(`Club ${clubId} not found`);
    }

    const state: ClubFeatureState = {
      clubId,
      features: FeatureFlags.parse(club.features ?? {}),
      config: ClubConfig.parse(club.config ?? {}),
    };

    await this.cache.set(key, JSON.stringify(state), CACHE_TTL_SECONDS);
    return state;
  }

  /** Shortcut when callers only care about flags. */
  async getFeatures(clubId: string): Promise<FeatureFlags> {
    return (await this.getState(clubId)).features;
  }

  /** Shortcut when callers only care about config/tier/limits. */
  async getConfig(clubId: string): Promise<ClubConfig> {
    return (await this.getState(clubId)).config;
  }

  /**
   * Drop the cache for one club. Called from platform-admin mutations
   * right after writing the new `features`/`config` to Postgres, so the
   * next request sees the new value instead of waiting up to 60s.
   */
  async invalidate(clubId: string): Promise<void> {
    await this.cache.del(this.key(clubId));
  }

  /** Canonical "empty club" defaults (useful for tests / onboarding). */
  static defaults(): { features: FeatureFlags; config: ClubConfig } {
    return { features: FEATURE_DEFAULTS, config: CONFIG_DEFAULTS };
  }

  private key(clubId: string): string {
    return `club:${clubId}:features`;
  }
}
