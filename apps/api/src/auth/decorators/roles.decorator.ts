import { SetMetadata } from '@nestjs/common';
import type { ClubRoleType, TeamRole } from '@branik/db';

export const ROLES_KEY = 'roles';

/**
 * Any one of the listed roles is enough (OR, not AND).
 *
 * Mixing ClubRoleType and TeamRole is allowed — the guard checks both
 * sources. For team-scoped endpoints (`/teams/:teamId/...`) the guard
 * scopes TeamRole checks to the teamId in the route.
 *
 * Examples:
 *   @Roles('HEAD_COACH', 'ASSISTANT_COACH')          // either coach role
 *   @Roles('ADMIN', 'FINANCE')                       // club-level roles
 *   @Roles('HEAD_COACH', 'ADMIN')                    // coach of this team OR club admin
 */
export const Roles = (...roles: Array<TeamRole | ClubRoleType>) => SetMetadata(ROLES_KEY, roles);
