import type { ClubRoleType, TeamRole } from '@prisma/client';

export interface MemberContext {
  userId: string;
  memberId: string;
  clubId: string;
  isMinor: boolean;
  clubRoles: ClubRoleType[];
  teamRoles: Array<{ teamId: string; role: TeamRole }>;
  guardianOf: Array<{
    childMemberId: string;
    canViewPayments: boolean;
    canViewMedical: boolean;
    canSignWaivers: boolean;
    canRsvp: boolean;
  }>;
}

export type HonoVariables = {
  user: { id: string; email: string } | undefined;
  member: MemberContext | undefined;
  clubId: string | undefined;
};

export type HonoEnv = { Variables: HonoVariables };
