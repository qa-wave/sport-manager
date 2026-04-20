import { Injectable } from '@nestjs/common';
import type { ClubRoleType, TeamRole } from '@branik/db';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The shape of "who am I in this club right now?"
 *
 * Populated by RolesGuard after authentication. Lives on `req.member`.
 */
export interface MemberContext {
  userId: string;
  memberId: string;
  clubId: string;
  isMinor: boolean;
  /** Club-level administrative roles (ADMIN/FINANCE/etc.). */
  clubRoles: ClubRoleType[];
  /** Team-scoped roles — a user can have multiple rows per team. */
  teamRoles: Array<{ teamId: string; role: TeamRole }>;
  /** The children this member is a guardian of, with per-link permissions. */
  guardianOf: Array<{
    childMemberId: string;
    canViewPayments: boolean;
    canViewMedical: boolean;
    canSignWaivers: boolean;
    canRsvp: boolean;
  }>;
}

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the full MemberContext for (userId, clubId).
   * Returns null if the user is not a Member of the club.
   *
   * This is the single authoritative source of "what can this user do?".
   * Call it once per request (RolesGuard does) and cache on req.member.
   */
  async resolve(userId: string, clubId: string): Promise<MemberContext | null> {
    const member = await this.prisma.member.findUnique({
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
      clubRoles: member.clubRoles.map((cr) => cr.role),
      teamRoles: member.teamMemberships.map((tm) => ({
        teamId: tm.teamId,
        role: tm.role,
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

  /**
   * Does the member satisfy ANY of the required roles?
   *
   * - ClubRole check is global-per-club.
   * - TeamRole check is scoped to `teamId` if provided; otherwise matches
   *   if the member has that team role on ANY team in the club.
   */
  check(
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

  /**
   * Can this member act on behalf of this child?
   *
   * True if:
   *   - the member IS the child (self), OR
   *   - the member has a verified GuardianLink to the child with the
   *     requested permission, OR
   *   - the member is a club admin.
   */
  canActOnBehalfOf(
    ctx: MemberContext,
    childMemberId: string,
    permission: 'canViewPayments' | 'canViewMedical' | 'canSignWaivers' | 'canRsvp',
  ): boolean {
    if (ctx.memberId === childMemberId) return true;
    if (ctx.clubRoles.includes('ADMIN') || ctx.clubRoles.includes('OWNER')) return true;
    const link = ctx.guardianOf.find((g) => g.childMemberId === childMemberId);
    return link ? link[permission] : false;
  }
}
