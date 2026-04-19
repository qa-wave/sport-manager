/**
 * Per-tenant customization — feature flags + tenant config.
 *
 * See /projekty/per-tenant/architektura.md for the full design. Summary:
 *   - Level 1: `FeatureFlags`  — zap/vyp existujících modulů per klub.
 *                                Defaults = `true` for every module already
 *                                shipped, so enabling this layer on existing
 *                                clubs is a non-breaking change.
 *   - Level 2: `ClubConfig`    — tier + limits (minimální varianta — bez
 *                                labels a brandingu, ty jsou odloženy).
 *
 * Both objects are `.passthrough()` on purpose: it lets us introduce new
 * flags/config keys without a DB migration. The Zod schema is the source of
 * truth — services always call `.parse()` at the boundary so defaults are
 * applied and invalid values never land in Postgres.
 */
import { z } from 'zod';

// ---------- Feature flags (Level 1) ----------
export const FeatureFlags = z
  .object({
    /** Chat / messages module. Default on — every club gets it. */
    messages: z.boolean().default(true),
    /** Training templates (recurring practice generator). */
    trainingTemplates: z.boolean().default(true),
    /** Fee & payment management (Stripe). */
    payments: z.boolean().default(true),
    /** Push / email notification delivery. */
    notifications: z.boolean().default(true),
    /** GDPR / health / media consent waivers. */
    waivers: z.boolean().default(true),
    /** Club calendar (events UI). */
    calendar: z.boolean().default(true),
    /** Photo gallery — not shipped yet, default off. */
    gallery: z.boolean().default(false),
    /** Braník-only demo module for per-club features. */
    springCup: z.boolean().default(false),
  })
  .passthrough();
export type FeatureFlags = z.infer<typeof FeatureFlags>;

/** The canonical list of known flag keys (typed, for guards and FE). */
export type FeatureKey = keyof z.infer<typeof FeatureFlags>;

// ---------- Tenant config (Level 2, minimal MVP) ----------
export const ClubTier = z.enum(['basic', 'pro', 'enterprise']);
export type ClubTier = z.infer<typeof ClubTier>;

export const ClubLimits = z
  .object({
    maxMembers: z.number().int().positive().default(200),
    maxTeams: z.number().int().positive().default(10),
  })
  .default({});
export type ClubLimits = z.infer<typeof ClubLimits>;

export const ClubConfig = z
  .object({
    tier: ClubTier.default('basic'),
    limits: ClubLimits,
    // labels / branding are deferred — architektura.md Level 2 says MVP skips them.
  })
  .passthrough();
export type ClubConfig = z.infer<typeof ClubConfig>;

// ---------- Platform admin API contracts ----------
export const UpdateClubFeaturesInput = z.object({
  features: FeatureFlags,
  reason: z.string().max(500).optional(),
});
export type UpdateClubFeaturesInput = z.infer<typeof UpdateClubFeaturesInput>;

export const UpdateClubConfigInput = z.object({
  config: ClubConfig,
  reason: z.string().max(500).optional(),
});
export type UpdateClubConfigInput = z.infer<typeof UpdateClubConfigInput>;

// ---------- Defaults (used by both API and FE) ----------
/**
 * Re-parsing an empty object runs every `.default(...)` — useful when we need
 * the canonical defaults (FE fallback, seed initialisation, tests).
 */
export const FEATURE_DEFAULTS: FeatureFlags = FeatureFlags.parse({});
export const CONFIG_DEFAULTS: ClubConfig = ClubConfig.parse({});
