import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService, type MemberContext } from '../auth/rbac.service';
import type { Prisma } from '@club/db';
import type {
  CreateTrainingTemplateInput,
  UpdateTrainingTemplateInput,
} from '@club/contracts';
import {
  eachLocalDay,
  localDayOfWeek,
  zonedWallTimeToUtc,
} from './timezone';

type Tx = Prisma.TransactionClient;
type GenerationScope = 'all' | 'future';

/**
 * Service for TrainingTemplate CRUD + Event materialization.
 *
 * See /projekty/training-templates/architektura.md for design decisions:
 *   - Generation runs at create/update time (no scheduler).
 *   - Delete removes future events, detaches past ones for audit.
 *   - @@unique([templateId, startsAt]) + skipDuplicates make generation
 *     idempotent.
 */
@Injectable()
export class TrainingTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  // =========================================================================
  // LIST
  // =========================================================================
  async list(
    clubId: string,
    filters: { teamId?: string; active?: boolean } = {},
  ) {
    return this.prisma.withClub(clubId, async (tx) => {
      const where: Prisma.TrainingTemplateWhereInput = {};
      if (filters.teamId) where.teamId = filters.teamId;
      if (filters.active !== undefined) where.active = filters.active;

      const templates = await tx.trainingTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          team: { select: { id: true, name: true } },
          _count: { select: { events: true } },
        },
      });

      const now = new Date();
      const result = [];
      for (const t of templates) {
        const upcoming = await tx.event.count({
          where: { templateId: t.id, startsAt: { gt: now } },
        });
        result.push({
          id: t.id,
          name: t.name,
          teamId: t.teamId,
          teamName: t.team.name,
          eventType: t.eventType,
          daysOfWeek: t.daysOfWeek,
          startTime: t.startTime,
          endTime: t.endTime,
          location: t.location,
          validFrom: t.validFrom.toISOString(),
          validUntil: t.validUntil.toISOString(),
          active: t.active,
          generatedEventsCount: t._count.events,
          upcomingEventsCount: upcoming,
        });
      }
      return result;
    });
  }

  // =========================================================================
  // GET DETAIL
  // =========================================================================
  async get(clubId: string, id: string) {
    return this.prisma.withClub(clubId, async (tx) => {
      const t = await tx.trainingTemplate.findUnique({
        where: { id },
        include: {
          team: { select: { id: true, name: true } },
          createdBy: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      if (!t) throw new NotFoundException('Training template not found');

      const now = new Date();
      const [totalEvents, detachedEvents, pastEvents, upcomingEvents] =
        await Promise.all([
          tx.event.count({ where: { templateId: id } }),
          tx.event.count({ where: { templateId: id, detached: true } }),
          tx.event.count({ where: { templateId: id, startsAt: { lte: now } } }),
          tx.event.count({ where: { templateId: id, startsAt: { gt: now } } }),
        ]);

      return {
        id: t.id,
        name: t.name,
        teamId: t.teamId,
        teamName: t.team.name,
        eventType: t.eventType,
        daysOfWeek: t.daysOfWeek,
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        locationUrl: t.locationUrl,
        description: t.description,
        validFrom: t.validFrom.toISOString(),
        validUntil: t.validUntil.toISOString(),
        active: t.active,
        createdBy: `${t.createdBy.user.firstName} ${t.createdBy.user.lastName}`,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        generatedEventsCount: totalEvents,
        upcomingEventsCount: upcomingEvents,
        stats: {
          totalEvents,
          detachedEvents,
          pastEvents,
          upcomingEvents,
        },
      };
    });
  }

  // =========================================================================
  // CREATE
  // =========================================================================
  async create(
    ctx: MemberContext,
    input: CreateTrainingTemplateInput,
  ) {
    this.assertTeamAccess(ctx, input.teamId);

    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const team = await tx.team.findUnique({ where: { id: input.teamId } });
      if (!team) throw new NotFoundException('Team not found');

      const sortedDays = [...new Set(input.daysOfWeek)].sort((a, b) => a - b);

      const template = await tx.trainingTemplate.create({
        data: {
          clubId: ctx.clubId,
          teamId: input.teamId,
          name: input.name,
          eventType: input.eventType,
          daysOfWeek: sortedDays,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location ?? null,
          locationUrl: input.locationUrl ?? null,
          description: input.description ?? null,
          validFrom: new Date(input.validFrom),
          validUntil: new Date(input.validUntil),
          active: input.active,
          createdById: ctx.memberId,
        },
      });

      const generatedEventsCount = await this.generateEvents(
        ctx.clubId,
        template.id,
        'all',
        tx,
      );

      return { id: template.id, generatedEventsCount };
    });
  }

  // =========================================================================
  // UPDATE
  // =========================================================================
  async update(
    ctx: MemberContext,
    id: string,
    input: UpdateTrainingTemplateInput,
  ) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const existing = await tx.trainingTemplate.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Training template not found');

      // Team change also needs access on the new team.
      const effectiveTeamId = input.teamId ?? existing.teamId;
      this.assertTeamAccess(ctx, effectiveTeamId);

      // Detect whether the "time grid" changed — if so, we must regenerate.
      const gridChanged = [
        input.daysOfWeek !== undefined,
        input.startTime !== undefined,
        input.endTime !== undefined,
        input.validFrom !== undefined,
        input.validUntil !== undefined,
        input.teamId !== undefined && input.teamId !== existing.teamId,
        input.eventType !== undefined && input.eventType !== existing.eventType,
        input.location !== undefined && input.location !== existing.location,
        input.locationUrl !== undefined && input.locationUrl !== existing.locationUrl,
        input.description !== undefined && input.description !== existing.description,
      ].some(Boolean);

      const data: Prisma.TrainingTemplateUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.eventType !== undefined) data.eventType = input.eventType;
      if (input.daysOfWeek !== undefined) {
        data.daysOfWeek = [...new Set(input.daysOfWeek)].sort((a, b) => a - b);
      }
      if (input.startTime !== undefined) data.startTime = input.startTime;
      if (input.endTime !== undefined) data.endTime = input.endTime;
      if (input.location !== undefined) data.location = input.location ?? null;
      if (input.locationUrl !== undefined) data.locationUrl = input.locationUrl ?? null;
      if (input.description !== undefined) data.description = input.description ?? null;
      if (input.validFrom !== undefined) data.validFrom = new Date(input.validFrom);
      if (input.validUntil !== undefined) data.validUntil = new Date(input.validUntil);
      if (input.active !== undefined) data.active = input.active;
      if (input.teamId !== undefined) {
        data.team = { connect: { id: input.teamId } };
      }

      await tx.trainingTemplate.update({ where: { id }, data });

      let regeneratedEventsCount = 0;
      let detachedPreservedCount = 0;

      if (gridChanged) {
        const now = new Date();
        // Step 1: count detached to preserve (for reporting only).
        detachedPreservedCount = await tx.event.count({
          where: { templateId: id, detached: true, startsAt: { gt: now } },
        });
        // Step 2: wipe future non-detached events.
        await tx.event.deleteMany({
          where: { templateId: id, detached: false, startsAt: { gt: now } },
        });
        // Step 3: regenerate from now forward.
        regeneratedEventsCount = await this.generateEvents(
          ctx.clubId,
          id,
          'future',
          tx,
        );
      }

      return {
        id,
        regeneratedEventsCount,
        detachedPreservedCount,
      };
    });
  }

  // =========================================================================
  // DELETE
  // =========================================================================
  async remove(ctx: MemberContext, id: string) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const existing = await tx.trainingTemplate.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Training template not found');

      this.assertTeamAccess(ctx, existing.teamId);

      const now = new Date();

      // Delete future events (everything linked that hasn't happened yet).
      const { count: deletedEventsCount } = await tx.event.deleteMany({
        where: { templateId: id, startsAt: { gt: now } },
      });

      // Detach past events: keep them for audit/attendance history.
      const { count: detachedLegacyCount } = await tx.event.updateMany({
        where: { templateId: id, startsAt: { lte: now } },
        data: { detached: true, templateId: null },
      });

      await tx.trainingTemplate.delete({ where: { id } });

      return { deletedEventsCount, detachedLegacyCount };
    });
  }

  // =========================================================================
  // MANUAL REGENERATE
  // =========================================================================
  async regenerate(ctx: MemberContext, id: string) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const existing = await tx.trainingTemplate.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Training template not found');

      this.assertTeamAccess(ctx, existing.teamId);

      const regeneratedEventsCount = await this.generateEvents(
        ctx.clubId,
        id,
        'future',
        tx,
      );
      return { regeneratedEventsCount };
    });
  }

  // =========================================================================
  // CORE GENERATOR
  // =========================================================================
  /**
   * Materialize Event rows for a template.
   *
   * scope:
   *   - "all":    from template.validFrom to template.validUntil
   *   - "future": from max(now, validFrom) to validUntil
   *
   * Relies on @@unique([templateId, startsAt]) + skipDuplicates for
   * idempotency. Returns the number of rows that were actually inserted.
   */
  async generateEvents(
    clubId: string,
    templateId: string,
    scope: GenerationScope,
    tx: Tx,
  ): Promise<number> {
    const template = await tx.trainingTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Training template not found');

    const club = await tx.club.findUnique({
      where: { id: clubId },
      select: { timezone: true },
    });
    if (!club) throw new NotFoundException('Club not found');
    const tz = club.timezone;

    const [startHh, startMm] = parseHhMm(template.startTime);
    const [endHh, endMm] = parseHhMm(template.endTime);

    const now = new Date();
    const rangeFrom =
      scope === 'future' && now > template.validFrom ? now : template.validFrom;
    const rangeTo = template.validUntil;

    if (rangeFrom > rangeTo) return 0;

    const daysSet = new Set(template.daysOfWeek);
    const candidates: Prisma.EventCreateManyInput[] = [];

    for (const day of eachLocalDay(rangeFrom, rangeTo, tz)) {
      const startsAt = zonedWallTimeToUtc(day, startHh, startMm, tz);
      const endsAt = zonedWallTimeToUtc(day, endHh, endMm, tz);

      // Use the LOCAL day-of-week to decide — DST-safe.
      const dow = localDayOfWeek(startsAt, tz);
      if (!daysSet.has(dow)) continue;

      // Safety: never materialize outside the template's own window.
      if (startsAt < template.validFrom) continue;
      if (startsAt > template.validUntil) continue;
      if (scope === 'future' && startsAt <= now) continue;

      candidates.push({
        clubId,
        teamId: template.teamId,
        templateId,
        type: template.eventType,
        title: template.name,
        description: template.description ?? null,
        startsAt,
        endsAt,
        location: template.location ?? null,
        locationUrl: template.locationUrl ?? null,
        createdById: template.createdById,
        detached: false,
      });
    }

    if (candidates.length === 0) return 0;

    const res = await tx.event.createMany({
      data: candidates,
      skipDuplicates: true,
    });
    return res.count;
  }

  // =========================================================================
  // DETACH (called from EventsController)
  // =========================================================================
  async detachEvent(ctx: MemberContext, eventId: string) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Event not found');
      if (event.teamId) this.assertTeamAccess(ctx, event.teamId);

      await tx.event.update({
        where: { id: eventId },
        data: { detached: true },
      });
      return { ok: true };
    });
  }

  // =========================================================================
  // AUTH HELPER
  // =========================================================================
  /**
   * Templates can be created/edited by:
   *   - Club ADMIN / OWNER
   *   - HEAD_COACH of the target team
   *   - TEAM_MANAGER of the target team
   *
   * (The @Roles() decorator on the controller already filters the first
   * pass; this check scopes HEAD_COACH / TEAM_MANAGER to the relevant team.)
   */
  private assertTeamAccess(ctx: MemberContext, teamId: string) {
    if (ctx.clubRoles.includes('ADMIN') || ctx.clubRoles.includes('OWNER')) {
      return;
    }
    const teamRoles = ctx.teamRoles
      .filter((tr) => tr.teamId === teamId)
      .map((tr) => tr.role);
    if (teamRoles.includes('HEAD_COACH') || teamRoles.includes('TEAM_MANAGER')) {
      return;
    }
    throw new ForbiddenException(
      'You do not have permission to manage training templates for this team',
    );
  }
}

function parseHhMm(s: string): [number, number] {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!match) throw new BadRequestException(`Invalid time string "${s}"`);
  return [Number(match[1]), Number(match[2])];
}
