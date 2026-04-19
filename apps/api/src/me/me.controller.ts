import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ClubConfig, FeatureFlags } from '@club/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types';
import type { MemberContext } from '../auth/rbac.service';
import { FeaturesService } from '../features/features.service';

/**
 * The single best smoke test for the whole auth + RBAC stack.
 *
 * GET /me              -> identity only, any authenticated user (no club scope)
 * GET /me/context      -> identity + full MemberContext for the active club
 *                         (requires x-club-id header; asserts membership)
 * GET /me/coach-only   -> proves @Roles() gating: only HEAD_COACH/ASSISTANT_COACH
 *                         of the active club (or any team in it) can hit this.
 */
@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly features: FeaturesService,
  ) {}

  @Get()
  async whoami(@CurrentUser() user: AuthenticatedUser) {
    const full = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        locale: true,
        isPlatformAdmin: true,
        members: {
          select: {
            id: true,
            clubId: true,
            club: {
              select: {
                id: true,
                slug: true,
                name: true,
                timezone: true,
                features: true,
                config: true,
              },
            },
          },
        },
      },
    });
    if (!full) throw new NotFoundException();

    // Parse each club's features/config through Zod so defaults are applied
    // and the FE sees a fully-populated object (no optional keys). This keeps
    // the wire-format stable even if the DB row is the legacy `{}`.
    const members = full.members.map((m) => ({
      id: m.id,
      clubId: m.clubId,
      club: {
        id: m.club.id,
        slug: m.club.slug,
        name: m.club.name,
        timezone: m.club.timezone,
        features: FeatureFlags.parse(m.club.features ?? {}),
        config: ClubConfig.parse(m.club.config ?? {}),
      },
    }));

    return {
      id: full.id,
      email: full.email,
      firstName: full.firstName,
      lastName: full.lastName,
      avatarUrl: full.avatarUrl,
      locale: full.locale,
      isPlatformAdmin: full.isPlatformAdmin,
      members,
    };
  }

  /**
   * Returns the resolved MemberContext + the active club's flags/config.
   * Mobile / web clients hit this on boot after choosing a club.
   */
  @Get('context')
  async context(@CurrentMember() me: MemberContext) {
    const state = await this.features.getState(me.clubId);
    return {
      ...me,
      features: state.features,
      config: state.config,
    };
  }

  /**
   * Gated: any coach (team-scoped) OR club admin (club-scoped). A player or
   * parent in the same club will get 403.
   */
  @Get('coach-only')
  @Roles('HEAD_COACH', 'ASSISTANT_COACH', 'ADMIN', 'OWNER')
  coachOnly(@CurrentMember() me: MemberContext) {
    return {
      ok: true,
      memberId: me.memberId,
      clubRoles: me.clubRoles,
      teamRoles: me.teamRoles,
    };
  }
}
