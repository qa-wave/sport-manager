import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeaturesService } from '../features/features.service';

/**
 * Enforces the Level-2 tenant config `limits` (tier, maxMembers, maxTeams).
 *
 * Call these from service layer BEFORE inserting new Member / Team rows.
 * Violation throws HTTP 402 Payment Required — the idea being: "your tier
 * doesn't allow more of this, upgrade or remove existing rows".
 *
 * Platform admins bypass the limit check — when a support engineer is
 * manually provisioning a big club it shouldn't need to temporarily bump
 * the limit just to add one member.
 */
@Injectable()
export class LimitsService {
  private readonly logger = new Logger(LimitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly features: FeaturesService,
  ) {}

  /**
   * Assert that creating one more Member in `clubId` is within the limit.
   * @param actingUserId — optional; platform admins bypass the check.
   */
  async assertMemberLimit(
    clubId: string,
    actingUserId?: string,
  ): Promise<void> {
    if (await this.isPlatformAdmin(actingUserId)) return;
    const { config } = await this.features.getState(clubId);
    const current = await this.prisma.member.count({ where: { clubId } });
    if (current >= config.limits.maxMembers) {
      throw new HttpException(
        `Member limit exceeded (tier: ${config.tier}, max: ${config.limits.maxMembers})`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  /** Mirror of the member check, for teams. */
  async assertTeamLimit(
    clubId: string,
    actingUserId?: string,
  ): Promise<void> {
    if (await this.isPlatformAdmin(actingUserId)) return;
    const { config } = await this.features.getState(clubId);
    const current = await this.prisma.team.count({ where: { clubId } });
    if (current >= config.limits.maxTeams) {
      throw new HttpException(
        `Team limit exceeded (tier: ${config.tier}, max: ${config.limits.maxTeams})`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private async isPlatformAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false;
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPlatformAdmin: true },
    });
    return u?.isPlatformAdmin === true;
  }
}
