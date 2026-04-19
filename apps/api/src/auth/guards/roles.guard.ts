import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ClubRoleType, TeamRole } from '@club/db';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RbacService } from '../rbac.service';
import type { AuthenticatedUser } from '../types';

/**
 * Role-based access guard.
 *
 *   1. Skip if @Public().
 *   2. Skip if no @Roles() on the route (authenticated endpoints without
 *      specific role requirements still pass).
 *   3. Resolve the clubId from `x-club-id` header (set by TenantMiddleware)
 *      OR from the `clubId`/`clubSlug` route param.
 *   4. Resolve the MemberContext via RbacService.
 *   5. Scope team-role checks to the teamId in the route, if present.
 *   6. Attach the MemberContext to req.member for downstream handlers.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Array<TeamRole | ClubRoleType>>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) throw new UnauthorizedException();

    const clubId = this.resolveClubId(req);
    if (!clubId) {
      // No club context -> nothing to RBAC against. If the route required
      // roles, reject; otherwise let it through (authenticated but scopeless).
      if (required && required.length > 0) {
        throw new ForbiddenException('Club context required (x-club-id header or clubId param)');
      }
      return true;
    }

    const member = await this.rbac.resolve(user.id, clubId);
    if (!member) throw new ForbiddenException('Not a member of this club');

    req.member = member;

    if (!required || required.length === 0) return true;

    const teamId = (req.params?.teamId as string | undefined) ?? undefined;
    const ok = this.rbac.check(member, required, { teamId });
    if (!ok) throw new ForbiddenException('Insufficient role');

    return true;
  }

  private resolveClubId(req: {
    headers: Record<string, string | string[] | undefined>;
    params?: Record<string, string>;
  }): string | undefined {
    const header = req.headers['x-club-id'];
    if (typeof header === 'string' && header.length > 0) return header;
    return req.params?.clubId;
  }
}
