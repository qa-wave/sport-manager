import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TrainingTemplatesService } from './training-templates.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { MemberContext } from '../auth/rbac.service';
import {
  CreateTrainingTemplateInput,
  UpdateTrainingTemplateInput,
} from '@club/contracts';
import { RequireFeature } from '../features/feature.decorator';

@Controller('training-templates')
@RequireFeature('trainingTemplates')
export class TrainingTemplatesController {
  constructor(private readonly templates: TrainingTemplatesService) {}

  @Get()
  async list(
    @CurrentMember() me: MemberContext,
    @Query('teamId') teamId?: string,
    @Query('active') active?: string,
  ) {
    const activeBool =
      active === undefined ? undefined : active === 'true' || active === '1';
    return this.templates.list(me.clubId, { teamId, active: activeBool });
  }

  @Get(':id')
  async get(
    @CurrentMember() me: MemberContext,
    @Param('id') id: string,
  ) {
    return this.templates.get(me.clubId, id);
  }

  @Post()
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER')
  async create(
    @CurrentMember() me: MemberContext,
    @Body() body: unknown,
  ) {
    const input = CreateTrainingTemplateInput.parse(body);
    return this.templates.create(me, input);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER')
  async update(
    @CurrentMember() me: MemberContext,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = UpdateTrainingTemplateInput.parse(body);
    return this.templates.update(me, id, input);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER')
  async remove(
    @CurrentMember() me: MemberContext,
    @Param('id') id: string,
  ) {
    return this.templates.remove(me, id);
  }

  @Post(':id/regenerate')
  @Roles('ADMIN', 'OWNER')
  async regenerate(
    @CurrentMember() me: MemberContext,
    @Param('id') id: string,
  ) {
    return this.templates.regenerate(me, id);
  }
}
