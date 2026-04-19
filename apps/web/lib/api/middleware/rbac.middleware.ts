import { createMiddleware } from 'hono/factory';
import type { ClubRoleType, TeamRole } from '@prisma/client';
import { prisma } from '../prisma';
import type { HonoEnv, MemberContext } from '../../types/hono';

// ---------------------------------------------------------------------------
// resolve() — single Prisma query that builds a full MemberContext.
// Mirrors RbacService.resolve() from apps/api/src/auth/rbac.service.ts.
// ---------------------------------------------------------------------------
export async function resolveMemberContext(
  userId: string,
  clubId: string,
): Promise<MemberContext | null> {
  const member = await prisma.member.findUnique({
    where: { userId_clubId: { userId, clubId } },
    include: {
      clubRoles: true,
      teamMemberships: {
        where: { leftAt: null },
        select: { teamId: true, role: true },
      },
      guardianLinks: {
        where: { verifiedAt: { not: null } },
        select: {
          childId: true,
          canViewPayments: true,
          canViewMedical: true,
          canSignWaivers: true,
          canRsvp: true,
        },
      },
    },
  });

  if (!member) return null;

  return {
    userId,
    memberId: member.id,
    clubId,
    isMinor: member.isMinor,
    clubRoles: member.clubRoles.map((cr) => cr.role) as ClubRoleType[],
    teamRoles: member.teamMemberships.map((tm) => ({
      teamId: tm.teamId,
      role: tm.role as TeamRole,
    })),
    guardianOf: member.guardianLinks.map((gl) => ({
      childMemberId: gl.childId,
      canViewPayments: gl.canViewPayments,
      canViewMedical: gl.canViewMedical,
      canSignWaivers: gl.canSignWaivers,
      canRsvp: gl.canRsvp,
    })),
  };
}

// ---------------------------------------------------------------------------
// check() — does the member satisfy ANY of the required roles?
// Mirrors RbacService.check() exactly.
// ---------------------------------------------------------------------------
export function checkRoles(
  ctx: MemberContext,
  required: Array<TeamRole | ClubRoleType>,
  scope?: { teamId?: string },
): boolean {
  if (required.length === 0) return true;

  const clubRoleSet = new Set(ctx.clubRoles as string[]);
  const teamRolesForScope = scope?.teamId
    ? ctx.teamRoles.filter((tr) => tr.teamId === scope.teamId).map((tr) => tr.role)
    : ctx.teamRoles.map((tr) => tr.role);
  const teamRoleSet = new Set(teamRolesForScope as string[]);

  return required.some((r) => clubRoleSet.has(r) || teamRoleSet.has(r));
}

// ---------------------------------------------------------------------------
// canActOnBehalfOf() — mirrors RbacService.canActOnBehalfOf() exactly.
// ---------------------------------------------------------------------------
export function canActOnBehalfOf(
  ctx: MemberContext,
  childMemberId: string,
  permission: 'canViewPayments' | 'canViewMedical' | 'canSignWaivers' | 'canRsvp',
): boolean {
  if (ctx.memberId === childMemberId) return true;
  if (ctx.clubRoles.includes('ADMIN' as ClubRoleType) || ctx.clubRoles.includes('OWNER' as ClubRoleType)) return true;
  const link = ctx.guardianOf.find((g) => g.childMemberId === childMemberId);
  return link ? link[permission] : false;
}

// ---------------------------------------------------------------------------
// requireAuth() — middleware factory.
// Verifies user is authenticated. If clubId is present in context, also
// resolves and caches the full MemberContext on c.var.member.
// ---------------------------------------------------------------------------
export function requireAuth() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    const clubId = c.get('clubId');
    if (clubId && !c.get('member')) {
      const member = await resolveMemberContext(user.id, clubId);
      if (member) {
        c.set('member', member);
      }
    }

    return next();
  });
}

// ---------------------------------------------------------------------------
// requireRole(...roles) — middleware factory.
// Asserts auth + member context + at least one of the required roles.
// ---------------------------------------------------------------------------
export function requireRole(...roles: Array<TeamRole | ClubRoleType>) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    let member = c.get('member');
    if (!member) {
      const resolved = await resolveMemberContext(user.id, clubId);
      if (!resolved) {
        return c.json({ error: 'Forbidden', message: 'Not a member of this club' }, 403);
      }
      c.set('member', resolved);
      member = resolved;
    }

    if (!checkRoles(member, roles)) {
      return c.json({ error: 'Forbidden', message: 'Insufficient role' }, 403);
    }

    return next();
  });
}

// ---------------------------------------------------------------------------
// requirePlatformAdmin() — middleware factory.
// ---------------------------------------------------------------------------
export function requirePlatformAdmin() {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isPlatformAdmin: true },
    });

    if (!dbUser?.isPlatformAdmin) {
      return c.json({ error: 'Forbidden', message: 'Platform admin access required' }, 403);
    }

    return next();
  });
}
