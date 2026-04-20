import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FeatureKey } from '@branik/contracts';
import { FEATURE_KEY } from './feature.decorator';
import { FeaturesService } from './features.service';

/**
 * Enforces the `@RequireFeature('...')` decorator.
 *
 * Order matters: this guard runs AFTER JwtAuthGuard + RolesGuard (see
 * AppModule wiring), so by the time we execute the user is already
 * authenticated and club-scoped. We resolve the active clubId from:
 *   1. `req.member.clubId` — populated by RolesGuard
 *   2. `req.clubId`        — populated by TenantMiddleware
 *   3. `x-club-id` header  — last-resort fallback
 *
 * Routes without `@RequireFeature()` just pass through. When the flag is
 * disabled we throw 404 (not 403) on purpose — we don't want the API to
 * confirm "yes, this module exists, you just aren't allowed."
 */
@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly features: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<FeatureKey | undefined>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const clubId = this.resolveClubId(req);
    if (!clubId) {
      // No club context and the route is feature-gated: same 404 path.
      // The upstream guards would normally reject first, but we stay safe.
      throw new NotFoundException();
    }

    const flags = await this.features.getFeatures(clubId);
    if (!flags[required]) {
      // 404 on purpose — do not advertise that the module exists.
      throw new NotFoundException();
    }
    return true;
  }

  private resolveClubId(req: {
    member?: { clubId?: string };
    clubId?: string;
    headers: Record<string, string | string[] | undefined>;
  }): string | undefined {
    if (req.member?.clubId) return req.member.clubId;
    if (req.clubId) return req.clubId;
    const header = req.headers['x-club-id'];
    return typeof header === 'string' && header.length > 0 ? header : undefined;
  }
}
