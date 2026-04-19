import { Controller, Get, Param } from '@nestjs/common';
import { MembersService } from './members.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import type { MemberContext } from '../auth/rbac.service';

@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  async list(@CurrentMember() me: MemberContext) {
    return this.members.listForClub(me.clubId);
  }

  @Get(':memberId')
  async getOne(
    @CurrentMember() me: MemberContext,
    @Param('memberId') memberId: string,
  ) {
    return this.members.getById(me.clubId, memberId);
  }
}
