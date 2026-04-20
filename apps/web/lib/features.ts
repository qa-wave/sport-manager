/**
 * Frontend feature-flag hook.
 *
 * Mirrors `@branik/contracts` FeatureFlags — every key defined there MUST have
 * a default value here. When the API hasn't loaded yet (or the user is
 * signed out) we fall through to these defaults, matching what the Zod
 * schema would produce server-side.
 *
 * Usage:
 *   const hasMessages = useFeature('messages');
 *   if (!hasMessages) return null;
 */
import { useMemberContext } from './member-context';
import { useMe } from './use-me';

/**
 * Known feature keys. Keep in sync with `FeatureFlags` in
 * `packages/contracts/src/features.ts`. We duplicate the type here because
 * Next.js `apps/web` doesn't import from `@branik/contracts` today; swap this
 * for a direct import once the contracts package is on the FE tsconfig.
 */
export type FeatureKey =
  | 'messages'
  | 'trainingTemplates'
  | 'payments'
  | 'notifications'
  | 'waivers'
  | 'calendar'
  | 'gallery'
  | 'springCup';

/** Matches `FEATURE_DEFAULTS` in `@branik/contracts`. */
export const FEATURE_DEFAULTS: Record<FeatureKey, boolean> = {
  messages: true,
  trainingTemplates: true,
  payments: true,
  notifications: true,
  waivers: true,
  calendar: true,
  gallery: false,
  springCup: false,
};

export type FeatureFlags = Record<FeatureKey, boolean>;

/**
 * Read a single feature flag for the active club.
 *
 * Source priority:
 *   1. `/me/context` response (same clubId the user is operating in — the
 *      canonical source, includes both features and config).
 *   2. `/me` response (fallback — contains flags per member so the switcher
 *      UI can read them even before a clubId is pinned).
 *   3. Static `FEATURE_DEFAULTS`.
 */
export function useFeature(key: FeatureKey): boolean {
  const flags = useFeatures();
  return flags[key];
}

/** Same data as useFeature but returns the whole record at once. */
export function useFeatures(): FeatureFlags {
  const { data: ctx } = useMemberContext();
  const { data: me } = useMe();

  // /me/context wins — it's scoped to the current clubId and always fresh
  // after a club switch.
  const fromContext = (ctx as unknown as { features?: Partial<FeatureFlags> } | undefined)?.features;
  if (fromContext) {
    return { ...FEATURE_DEFAULTS, ...fromContext };
  }

  // Fall back to /me, which lists every club the user belongs to.
  const activeClubId = ctx?.clubId;
  const member = activeClubId
    ? me?.members.find((m) => m.clubId === activeClubId)
    : me?.members[0];
  const fromMe = member?.club?.features as Partial<FeatureFlags> | undefined;
  if (fromMe) {
    return { ...FEATURE_DEFAULTS, ...fromMe };
  }

  return { ...FEATURE_DEFAULTS };
}
