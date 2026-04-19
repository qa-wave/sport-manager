import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { MemberContext } from '../rbac.service';

/**
 * Extracts the current Member + role context for the active club.
 * Populated by RolesGuard after resolving the (userId, clubId) pair
 * through RbacService.
 *
 * Usage:
 *   @Get('team/:teamId/roster')
 *   @Roles(TeamRole.HEAD_COACH)
 *   roster(@CurrentMember() me: MemberContext) { ... }
 */
export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MemberContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.member;
  },
);
