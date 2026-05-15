import { prisma } from '../prisma';
import { getFeaturesState } from '../middleware/feature-flag.middleware';
import { PLAN_LIMITS, type ClubTier } from '@sport-manager/contracts';

/**
 * Enforces Level-2 tenant config limits based on the club's pricing plan.
 *
 * Plan limits (hard caps):
 *   free        → 25 members, 2 teams
 *   pro / club  → unlimited (999 999 sentinel)
 *   legacy tiers (basic, enterprise) → unlimited
 *
 * Call assertMemberLimit / assertTeamLimit before inserting new rows.
 * Violation throws HTTP 402 Payment Required.
 * Platform admins bypass all limit checks.
 *
 * Feature gating (pro / club only features) is enforced via assertPlan().
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function isPlatformAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true },
  });
  return u?.isPlatformAdmin === true;
}

/** Resolve effective limits for a club — plan wins, config.limits is fallback. */
async function getEffectiveLimits(
  clubId: string,
): Promise<{ maxMembers: number; maxTeams: number; tier: ClubTier }> {
  const { config } = await getFeaturesState(clubId);
  const tier = (config.tier ?? 'free') as ClubTier;

  // Plan-level hard limits take precedence over the legacy config.limits field.
  const planCaps = PLAN_LIMITS[tier] ?? PLAN_LIMITS['free'];

  return {
    maxMembers: planCaps.maxMembers,
    maxTeams: planCaps.maxTeams,
    tier,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function assertMemberLimit(
  clubId: string,
  actingUserId?: string,
): Promise<void> {
  if (await isPlatformAdmin(actingUserId)) return;

  const { tier, maxMembers } = await getEffectiveLimits(clubId);
  const current = await prisma.member.count({ where: { clubId } });

  if (current >= maxMembers) {
    throw Object.assign(
      new Error(
        `Member limit exceeded (plan: ${tier}, max: ${maxMembers})`,
      ),
      { statusCode: 402, code: 'MEMBER_LIMIT_EXCEEDED' },
    );
  }
}

export async function assertTeamLimit(
  clubId: string,
  actingUserId?: string,
): Promise<void> {
  if (await isPlatformAdmin(actingUserId)) return;

  const { tier, maxTeams } = await getEffectiveLimits(clubId);
  const current = await prisma.team.count({ where: { clubId } });

  if (current >= maxTeams) {
    throw Object.assign(
      new Error(
        `Team limit exceeded (plan: ${tier}, max: ${maxTeams})`,
      ),
      { statusCode: 402, code: 'TEAM_LIMIT_EXCEEDED' },
    );
  }
}

/**
 * Feature-gate by required pricing plan.
 *
 * Usage (in a route handler):
 *   await assertPlan(clubId, 'pro', 'push notifications');
 *
 * PRO features:  push notifikace, Stripe platby, gallery, CSV export, waivers
 * CLUB features: multi-klub, custom branding, API přístup, FAČR sync
 *
 * Hierarchy: CLUB ⊇ PRO ⊇ FREE.
 * Legacy tiers 'basic' and 'enterprise' are treated as PRO/CLUB respectively.
 */

const TIER_RANK: Record<ClubTier, number> = {
  free: 0,
  basic: 1,    // legacy — equivalent to pro
  pro: 1,
  club: 2,
  enterprise: 2, // legacy — equivalent to club
};

export async function assertPlan(
  clubId: string,
  requiredPlan: Extract<ClubTier, 'pro' | 'club'>,
  featureName: string,
  actingUserId?: string,
): Promise<void> {
  if (await isPlatformAdmin(actingUserId)) return;

  const { tier } = await getEffectiveLimits(clubId);

  const required = TIER_RANK[requiredPlan];
  const current = TIER_RANK[tier] ?? 0;

  if (current < required) {
    throw Object.assign(
      new Error(
        `Feature '${featureName}' requires plan '${requiredPlan}' (current: ${tier})`,
      ),
      {
        statusCode: 402,
        code: 'PLAN_UPGRADE_REQUIRED',
        requiredPlan,
        currentPlan: tier,
        feature: featureName,
      },
    );
  }
}

/**
 * Returns current usage stats for a club — used by the upgrade banner.
 * Does NOT throw; purely informational.
 */
export async function getClubUsage(
  clubId: string,
): Promise<{
  tier: ClubTier;
  members: { current: number; max: number };
  teams: { current: number; max: number };
}> {
  const { tier, maxMembers, maxTeams } = await getEffectiveLimits(clubId);
  const [members, teams] = await Promise.all([
    prisma.member.count({ where: { clubId } }),
    prisma.team.count({ where: { clubId } }),
  ]);

  return {
    tier,
    members: { current: members, max: maxMembers },
    teams: { current: teams, max: maxTeams },
  };
}
