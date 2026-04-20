import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import { TrainingTemplatesService } from '../training-templates/training-templates.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { MemberContext } from '../auth/rbac.service';
import { CreateEventInput, UpdateEventInput, RsvpInput, MarkAttendanceInput } from '@branik/contracts';

@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly templates: TrainingTemplatesService,
  ) {}

  @Get()
  async list(
    @CurrentMember() me: MemberContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.events.listEvents(me.clubId, { from, to, teamId });
  }

  @Get(':eventId')
  async getOne(
    @CurrentMember() me: MemberContext,
    @Param('eventId') eventId: string,
  ) {
    return this.events.getEventDetail(me.clubId, eventId);
  }

  @Post()
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER')
  async create(
    @CurrentMember() me: MemberContext,
    @Body() body: any,
  ) {
    const input = CreateEventInput.parse(body);
    return this.events.createEvent(me.clubId, me.memberId, input);
  }

  @Patch(':eventId')
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH')
  async update(
    @CurrentMember() me: MemberContext,
    @Param('eventId') eventId: string,
    @Body() body: any,
  ) {
    const input = UpdateEventInput.parse(body);
    return this.events.updateEvent(me.clubId, eventId, input);
  }

  @Post(':eventId/rsvp')
  async rsvp(
    @CurrentMember() me: MemberContext,
    @Param('eventId') eventId: string,
    @Body() body: any,
  ) {
    const input = RsvpInput.parse({ ...body, eventId });
    return this.events.submitRsvp(me, eventId, input.memberId, input.status, input.note);
  }

  @Patch(':eventId/attendance')
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH')
  async markAttendance(
    @CurrentMember() me: MemberContext,
    @Param('eventId') eventId: string,
    @Body() body: any,
  ) {
    const input = MarkAttendanceInput.parse(body);
    return this.events.markAttendance(me.clubId, eventId, input.attendances);
  }

  /**
   * Detach an Event from its TrainingTemplate.
   *
   * Flips `detached = true`. The `templateId` stays so we can still show
   * the event's origin in the UI ("moved from the template"). Future
   * regenerations will leave this event alone.
   */
  @Post(':eventId/detach')
  @Roles('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER')
  async detach(
    @CurrentMember() me: MemberContext,
    @Param('eventId') eventId: string,
  ) {
    return this.templates.detachEvent(me, eventId);
  }
}
