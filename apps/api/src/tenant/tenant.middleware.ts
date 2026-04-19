import { Injectable, type NestMiddleware } from '@nestjs/common';

/**
 * Tenant middleware — resolves the active club context and stashes it on req.
 *
 * Resolution order:
 *   1. `x-club-id` header            (mobile / server-to-server)
 *   2. `clubId` route param          (e.g. /clubs/:clubId/...)
 *   3. JWT claim                     (not yet — would require baking clubId
 *                                     into the access token; deferred)
 *
 * The resolved clubId is attached to req.clubId and subsequently used by:
 *   - RolesGuard               -> resolves MemberContext for (userId, clubId)
 *   - PrismaService.withClub() -> sets app.club_id on the DB session so
 *                                 RLS policies enforce isolation
 *
 * This middleware does NOT itself call withClub() because it can't wrap the
 * entire request handler in a DB transaction. Instead, services that need
 * RLS-enforced queries opt in by calling `this.prisma.withClub(ctx.clubId, ...)`.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(
    req: {
      headers: Record<string, string | string[] | undefined>;
      params?: Record<string, string>;
      clubId?: string;
    },
    _res: unknown,
    next: () => void,
  ) {
    const header = req.headers['x-club-id'];
    if (typeof header === 'string' && header.length > 0) {
      req.clubId = header;
    } else if (req.params?.clubId) {
      req.clubId = req.params.clubId;
    }
    next();
  }
}
