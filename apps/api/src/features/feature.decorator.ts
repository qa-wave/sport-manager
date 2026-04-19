import { SetMetadata } from '@nestjs/common';
import type { FeatureKey } from '@club/contracts';

/**
 * Metadata key used by FeaturesGuard.
 * Kept internal to the features/ module.
 */
export const FEATURE_KEY = 'feature';

/**
 * Gate an endpoint behind a per-club feature flag.
 *
 * Runs AFTER JwtAuthGuard and RolesGuard — role decisions are independent
 * of feature flags. When the flag is off, the guard throws `NotFoundException`
 * (404, not 403) on purpose: we don't want to leak "this feature exists but
 * your club doesn't have it."
 *
 * Usage:
 *   @Get('')
 *   @Roles('PLAYER', 'HEAD_COACH')
 *   @RequireFeature('messages')
 *   list(@CurrentMember() me: MemberContext) { ... }
 */
export const RequireFeature = (feature: FeatureKey) =>
  SetMetadata(FEATURE_KEY, feature);
