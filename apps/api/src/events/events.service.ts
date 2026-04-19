import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService, type MemberContext } from '../auth/rbac.service';
import type { CreateEventInput, UpdateEventInput } from '@club/contracts';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async listEvents(
    clubId: string,
    filters: { from?: string; to?: string; teamId?: string },
  ) {
    return this.prisma.withClub(clubId, async (tx) => {
      const where: any = {};
      if (filters.from || filters.to) {
        where.startsAt = {};
        if (filters.from) where.startsAt.gte = new Date(filters.from);
        if (filters.to) where.startsAt.lte = new Date(filters.to);
      }
      if (filters.teamId) {
        where.teamId = filters.teamId;
      }

      const events = await tx.event.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        include: {
          team: { select: { id: true, name: true } },
          attendances: {
            select: { status: true },
          },
        },
      });

      return events.map((e) => {
        const rsvpSummary = { yes: 0, no: 0, maybe: 0, pending: 0, total: e.attendances.length };
        for (const a of e.attendances) {
          if (a.status === 'YES') rsvpSummary.yes++;
          else if (a.status === 'NO') rsvpSummary.no++;
          else if (a.status === 'MAYBE') rsvpSummary.maybe++;
          else rsvpSummary.pending++;
        }

        return {
          id: e.id,
          type: e.type,
          title: e.title,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          location: e.location,
          teamId: e.teamId,
          teamName: e.team?.name ?? null,
          opponent: e.opponent,
          homeAway: e.homeAway,
          rsvpSummary,
        };
      });
    });
  }

  async getEventDetail(clubId: string, eventId: string) {
    return this.prisma.withClub(clubId, async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          team: { select: { id: true, name: true } },
          createdBy: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
          attendances: {
            include: {
              member: {
                select: {
                  id: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      if (!event) throw new NotFoundException('Event not found');

      // Get all team members to show who hasn't responded
      let allTeamMembers: Array<{ id: string; firstName: string; lastName: string }> = [];
      if (event.teamId) {
        const memberships = await tx.teamMembership.findMany({
          where: { teamId: event.teamId, leftAt: null },
          select: {
            member: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });
        allTeamMembers = memberships.map((m) => ({
          id: m.member.id,
          firstName: m.member.user.firstName,
          lastName: m.member.user.lastName,
        }));
      }

      // Build attendee map from existing RSVPs
      const attendanceMap = new Map(
        event.attendances.map((a) => [
          a.memberId,
          {
            memberId: a.memberId,
            name: `${a.member.user.firstName} ${a.member.user.lastName}`,
            status: a.status,
            note: a.note,
            respondedAt: a.respondedAt,
            attended: a.attended,
          },
        ]),
      );

      // Merge: all team members + any RSVPs from non-team members
      const attendees: Array<{
        memberId: string;
        name: string;
        status: string;
        note: string | null;
        respondedAt: Date | null;
        attended: boolean | null;
      }> = [];

      for (const tm of allTeamMembers) {
        const existing = attendanceMap.get(tm.id);
        if (existing) {
          attendees.push(existing);
          attendanceMap.delete(tm.id);
        } else {
          attendees.push({
            memberId: tm.id,
            name: `${tm.firstName} ${tm.lastName}`,
            status: 'PENDING',
            note: null,
            respondedAt: null,
            attended: null,
          });
        }
      }
      // Add any RSVPs from members not currently on the team roster
      for (const remaining of attendanceMap.values()) {
        attendees.push(remaining);
      }

      const rsvpSummary = { yes: 0, no: 0, maybe: 0, pending: 0, total: attendees.length };
      for (const a of attendees) {
        if (a.status === 'YES') rsvpSummary.yes++;
        else if (a.status === 'NO') rsvpSummary.no++;
        else if (a.status === 'MAYBE') rsvpSummary.maybe++;
        else rsvpSummary.pending++;
      }

      return {
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        locationUrl: event.locationUrl,
        teamId: event.teamId,
        teamName: event.team?.name ?? null,
        opponent: event.opponent,
        homeAway: event.homeAway,
        rsvpDeadline: event.rsvpDeadline,
        createdBy: `${event.createdBy.user.firstName} ${event.createdBy.user.lastName}`,
        rsvpSummary,
        attendees,
      };
    });
  }

  async createEvent(clubId: string, createdById: string, input: CreateEventInput) {
    return this.prisma.withClub(clubId, async (tx) => {
      const event = await tx.event.create({
        data: {
          clubId,
          createdById,
          teamId: input.teamId ?? null,
          type: input.type as any,
          title: input.title,
          description: input.description,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          location: input.location,
          locationUrl: input.locationUrl,
          opponent: input.opponent,
          homeAway: input.homeAway as any,
          rsvpDeadline: input.rsvpDeadline ? new Date(input.rsvpDeadline) : null,
        },
      });
      return { id: event.id };
    });
  }

  async updateEvent(clubId: string, eventId: string, input: UpdateEventInput) {
    return this.prisma.withClub(clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Event not found');

      const data: any = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.type !== undefined) data.type = input.type;
      if (input.teamId !== undefined) data.teamId = input.teamId;
      if (input.startsAt !== undefined) data.startsAt = new Date(input.startsAt);
      if (input.endsAt !== undefined) data.endsAt = new Date(input.endsAt);
      if (input.location !== undefined) data.location = input.location;
      if (input.locationUrl !== undefined) data.locationUrl = input.locationUrl;
      if (input.opponent !== undefined) data.opponent = input.opponent;
      if (input.homeAway !== undefined) data.homeAway = input.homeAway;
      if (input.rsvpDeadline !== undefined) data.rsvpDeadline = input.rsvpDeadline ? new Date(input.rsvpDeadline) : null;

      // Implicit detach: if this event came from a training template and the
      // caller moved its start/end time, mark it as manually adjusted so the
      // next template regeneration leaves it alone.
      if (event.templateId && !event.detached) {
        const movedStart =
          input.startsAt !== undefined &&
          new Date(input.startsAt).getTime() !== event.startsAt.getTime();
        const movedEnd =
          input.endsAt !== undefined &&
          new Date(input.endsAt).getTime() !== event.endsAt.getTime();
        if (movedStart || movedEnd) {
          data.detached = true;
        }
      }

      await tx.event.update({ where: { id: eventId }, data });
      return { id: eventId };
    });
  }

  async submitRsvp(
    ctx: MemberContext,
    eventId: string,
    memberId: string,
    status: string,
    note?: string,
  ) {
    // Check authorization: self or guardian with canRsvp
    if (ctx.memberId !== memberId) {
      if (!this.rbac.canActOnBehalfOf(ctx, memberId, 'canRsvp')) {
        throw new ForbiddenException('You cannot RSVP on behalf of this member');
      }
    }

    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Event not found');

      if (event.rsvpDeadline && new Date() > event.rsvpDeadline) {
        throw new BadRequestException('RSVP deadline has passed');
      }

      await tx.eventAttendance.upsert({
        where: { eventId_memberId: { eventId, memberId } },
        create: {
          eventId,
          memberId,
          respondedById: ctx.memberId,
          status: status as any,
          note: note ?? null,
        },
        update: {
          respondedById: ctx.memberId,
          status: status as any,
          note: note ?? null,
          respondedAt: new Date(),
        },
      });

      return { ok: true };
    });
  }

  async markAttendance(
    clubId: string,
    eventId: string,
    attendances: Array<{ memberId: string; attended: boolean }>,
  ) {
    return this.prisma.withClub(clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Event not found');

      for (const { memberId, attended } of attendances) {
        await tx.eventAttendance.upsert({
          where: { eventId_memberId: { eventId, memberId } },
          create: {
            eventId,
            memberId,
            respondedById: memberId,
            status: 'PENDING',
            attended,
          },
          update: { attended },
        });
      }

      return { ok: true };
    });
  }
}
