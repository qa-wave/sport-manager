/**
 * React hook for fetching and caching the current user's MemberContext.
 *
 * MemberContext contains the user's club roles, team roles, and guardian
 * relationships — everything needed for role-aware UI (nav gating, role
 * badges, parent vs coach dashboards).
 */
import { useQuery } from '@tanstack/react-query';
import { apiFetch, type ApiError } from './api';
import { useAuth } from './auth-store';

export type MemberContext = {
  userId: string;
  memberId: string;
  clubId: string;
  isMinor: boolean;
  clubRoles: string[];
  teamRoles: Array<{ teamId: string; role: string }>;
  guardianOf: Array<{
    childMemberId: string;
    canViewPayments: boolean;
    canViewMedical: boolean;
    canSignWaivers: boolean;
    canRsvp: boolean;
  }>;
};

export function useMemberContext() {
  const auth = useAuth();

  return useQuery<MemberContext, ApiError>({
    queryKey: ['member-context', auth.clubId],
    queryFn: () => apiFetch<MemberContext>('/me/context'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function getPrimaryRoleLabel(ctx: MemberContext): string {
  if (ctx.clubRoles.includes('OWNER')) return 'Owner';
  if (ctx.clubRoles.includes('ADMIN')) return 'Admin';
  if (ctx.clubRoles.includes('FINANCE')) return 'Finance';
  if (ctx.clubRoles.includes('COMMUNICATIONS')) return 'Comms';
  if (ctx.teamRoles.some((r) => r.role === 'HEAD_COACH')) return 'Head Coach';
  if (ctx.teamRoles.some((r) => r.role === 'ASSISTANT_COACH')) return 'Asst. Coach';
  if (ctx.teamRoles.some((r) => r.role === 'TEAM_MANAGER')) return 'Team Manager';
  if (ctx.guardianOf.length > 0) return 'Parent';
  if (ctx.teamRoles.some((r) => r.role === 'PLAYER')) return 'Player';
  return 'Member';
}

export function isAdmin(ctx: MemberContext): boolean {
  return ctx.clubRoles.includes('OWNER') || ctx.clubRoles.includes('ADMIN');
}

export function isCoach(ctx: MemberContext): boolean {
  return ctx.teamRoles.some((r) =>
    ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role),
  );
}

export function isGuardian(ctx: MemberContext): boolean {
  return ctx.guardianOf.length > 0;
}

export function isPlayer(ctx: MemberContext): boolean {
  return ctx.teamRoles.some((r) => r.role === 'PLAYER');
}

/**
 * Pure player = on at least one team as PLAYER and has no admin, coach,
 * finance, comms, or guardian role. Used to lock down nav/UX so a 14-year-old
 * doesn't see payments, members admin, audit logs, etc.
 */
export function isPurePlayer(ctx: MemberContext): boolean {
  return isPlayer(ctx) && !isAdmin(ctx) && !isCoach(ctx) && !isGuardian(ctx)
    && !ctx.clubRoles.includes('FINANCE')
    && !ctx.clubRoles.includes('COMMUNICATIONS');
}

export type NavAccess = 'admin' | 'admin_or_finance' | 'admin_or_coach' | 'platform_admin' | 'any' | 'not_pure_player' | 'player_only';

export function canAccessNavItem(
  ctx: MemberContext,
  access?: NavAccess,
  isPlatformAdmin?: boolean,
): boolean {
  if (!access) {
    // Default: visible to all EXCEPT pure players see a curated subset.
    // Items without `access` that should also be hidden from pure players
    // must opt-in via 'not_pure_player'.
    return true;
  }
  if (access === 'any') return true;
  switch (access) {
    case 'admin':
      return isAdmin(ctx);
    case 'admin_or_finance':
      return isAdmin(ctx) || ctx.clubRoles.includes('FINANCE');
    case 'admin_or_coach':
      return isAdmin(ctx) || isCoach(ctx);
    case 'not_pure_player':
      return !isPurePlayer(ctx);
    case 'player_only':
      return isPurePlayer(ctx);
    case 'platform_admin':
      return isPlatformAdmin === true;
    default:
      return true;
  }
}
