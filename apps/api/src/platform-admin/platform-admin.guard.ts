import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types';

/**
 * Gate for `/platform-admin/*` routes.
 *
 * Requires `User.isPlatformAdmin === true`. This is a GLOBAL role that
 * lives outside the club scope — a club OWNER cannot grant it; only a
 * DBA / existing platform admin can.
 *
 * Runs after JwtAuthGuard (via APP_GUARD ordering in PlatformAdminModule),
 * so `req.user` is already populated. We hit the DB on every request
 * (platform-admin routes are rare; caching isn't worth the complexity).
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) throw new UnauthorizedException();

    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isPlatformAdmin: true },
    });
    if (!row?.isPlatformAdmin) {
      throw new ForbiddenException('Platform admin access required');
    }
    return true;
  }
}
