import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import type { MemberContext } from '../auth/rbac.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('feed')
  async feed(@CurrentMember() me: MemberContext) {
    return this.dashboard.getFeed(me.clubId);
  }
}
