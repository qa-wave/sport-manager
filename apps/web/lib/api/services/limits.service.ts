import { prisma } from '../prisma';
import { getFeaturesState } from '../middleware/feature-flag.middleware';

/**
 * Enforces Level-2 tenant config `limits` (tier, maxMembers, maxTeams).
 * Mirrors apps/api/src/clubs/limits.service.ts exactly.
 *
 * Call before inserting new Member / Team rows.
 * Violation throws HTTP 402 Payment Required.
 * Platform admins bypass the limit check.
 */

async function isPlatformAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true },
  });
  return u?.isPlatformAdmin === true;
}

export async function assertMemberLimit(
  clubId: string,
  actingUserId?: string,
): Promise<void> {
  if (await isPlatformAdmin(actingUserId)) return;
  const { config } = await getFeaturesState(clubId);
  const current = await prisma.member.count({ where: { clubId } });
  if (current >= config.limits.maxMembers) {
    throw Object.assign(
      new Error(
        `Member limit exceeded (tier: ${config.tier}, max: ${config.limits.maxMembers})`,
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
  const { config } = await getFeaturesState(clubId);
  const current = await prisma.team.count({ where: { clubId } });
  if (current >= config.limits.maxTeams) {
    throw Object.assign(
      new Error(
        `Team limit exceeded (tier: ${config.tier}, max: ${config.limits.maxTeams})`,
      ),
      { statusCode: 402, code: 'TEAM_LIMIT_EXCEEDED' },
    );
  }
}
