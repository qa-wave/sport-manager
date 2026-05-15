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
/**
 * Pricing tiers for billing / feature gating.
 *   free     — up to 25 members, 2 teams, core features
 *   pro      — unlimited members + teams, push, Stripe, gallery, CSV, waivers
 *   club     — everything in pro + multi-club, custom branding, FAČR sync, API
 *
 * Legacy values ('basic', 'enterprise') are kept for backwards-compatibility
 * with existing DB rows. They map to 'pro' semantics in the limits service.
 */
export const ClubTier = z.enum(['free', 'basic', 'pro', 'club', 'enterprise']);
export type ClubTier = z.infer<typeof ClubTier>;

/** Plan-specific hard limits. Returned by getLimitsForPlan(). */
export const PLAN_LIMITS: Record<ClubTier, { maxMembers: number; maxTeams: number }> = {
  free: { maxMembers: 25, maxTeams: 2 },
  basic: { maxMembers: 999_999, maxTeams: 999_999 }, // legacy → unlimited
  pro: { maxMembers: 999_999, maxTeams: 999_999 },
  club: { maxMembers: 999_999, maxTeams: 999_999 },
  enterprise: { maxMembers: 999_999, maxTeams: 999_999 }, // legacy → unlimited
};

export const ClubLimits = z
  .object({
    maxMembers: z.number().int().positive().default(999_999),
    maxTeams: z.number().int().positive().default(999_999),
  })
  .default({});
export type ClubLimits = z.infer<typeof ClubLimits>;

// ---------- Club theme (Phase C) ----------
export const ClubTheme = z.object({
  primary: z.string().regex(/^#[0-9a-f]{6}$/i).default('#609bc6'),
  secondary: z.string().regex(/^#[0-9a-f]{6}$/i).default('#f59e0b'),
  tertiary: z.string().regex(/^#[0-9a-f]{6}$/i).default('#0f172a'),
  styleId: z.number().int().min(1).max(10).default(1),
});
export type ClubTheme = z.infer<typeof ClubTheme>;

export const ClubConfig = z
  .object({
    /** Pricing tier — drives limits and feature gating. New clubs default to 'free'. */
    tier: ClubTier.default('free'),
    limits: ClubLimits,
    theme: ClubTheme.default({}),
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

export const UpdateClubThemeInput = z.object({
  theme: ClubTheme,
});
export type UpdateClubThemeInput = z.infer<typeof UpdateClubThemeInput>;

// ---------- Defaults (used by both API and FE) ----------
/**
 * Re-parsing an empty object runs every `.default(...)` — useful when we need
 * the canonical defaults (FE fallback, seed initialisation, tests).
 */
export const FEATURE_DEFAULTS: FeatureFlags = FeatureFlags.parse({});
export const CONFIG_DEFAULTS: ClubConfig = ClubConfig.parse({});
