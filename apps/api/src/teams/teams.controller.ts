import { Controller, Get } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import type { MemberContext } from '../auth/rbac.service';

/**
 * Teams live entirely inside a club. RolesGuard resolves the active club
 * from the `x-club-id` header, asserts the caller is a Member, and attaches
 * a MemberContext. The service then hits Postgres *inside* that club's
 * RLS scope.
 */
@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  async list(@CurrentMember() me: MemberContext) {
    return this.teams.listForClub(me.clubId);
  }
}
