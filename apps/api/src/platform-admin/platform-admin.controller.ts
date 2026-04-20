import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  UpdateClubConfigInput,
  UpdateClubFeaturesInput,
} from '@branik/contracts';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';

/**
 * Platform-admin-only surface. Every handler is gated by `PlatformAdminGuard`
 * (checks `User.isPlatformAdmin === true`). A normal club OWNER / ADMIN gets
 * 403 here — this is intentional, feature flags are a platform-level concern.
 *
 * These routes are NOT tenant-scoped — no `x-club-id` required; the target
 * club is always in the path.
 */
@Controller('platform-admin/clubs')
@UseGuards(PlatformAdminGuard)
export class PlatformAdminController {
  constructor(private readonly service: PlatformAdminService) {}

  /** List all clubs with their flags + config + counts. */
  @Get()
  list() {
    return this.service.listClubs();
  }

  /** Detail of a single club. */
  @Get(':clubId')
  getOne(@Param('clubId') clubId: string) {
    return this.service.getClub(clubId);
  }

  /** Replace the feature flags on a club. Writes an audit row. */
  @Patch(':clubId/features')
  updateFeatures(
    @Param('clubId') clubId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const input = UpdateClubFeaturesInput.parse(body);
    return this.service.updateFeatures(clubId, user.id, input);
  }

  /** Replace the tenant config (tier/limits). Writes an audit row. */
  @Patch(':clubId/config')
  updateConfig(
    @Param('clubId') clubId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const input = UpdateClubConfigInput.parse(body);
    return this.service.updateConfig(clubId, user.id, input);
  }

  /** Paginated audit history. */
  @Get(':clubId/audit')
  audit(
    @Param('clubId') clubId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.listAudit(clubId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }
}
