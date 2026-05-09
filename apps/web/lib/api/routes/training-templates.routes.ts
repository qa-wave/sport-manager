import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  CreateTrainingTemplateInput,
  UpdateTrainingTemplateInput,
} from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import {
  eachLocalDay,
  localDayOfWeek,
  zonedWallTimeToUtc,
} from '../services/timezone';
import type { HonoEnv, MemberContext } from '../../types/hono';

/**
 * /v1/training-templates — CRUD + event generation.
 *
 * Design:
 *   - Generation runs at create/update time (no scheduler).
 *   - Delete removes future events, detaches past ones for audit.
 *   - @@unique([templateId, startsAt]) + skipDuplicates = idempotent.
 */
const trainingTemplates = new Hono<HonoEnv>();

trainingTemplates.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type GenerationScope = 'all' | 'future';

function parseHhMm(s: string): [number, number] {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!match) {
    throw Object.assign(new Error(`Invalid time string "${s}"`), {
      statusCode: 400,
      code: 'INVALID_TIME',
    });
  }
  return [Number(match[1]), Number(match[2])];
}

/**
 * Materialize Event rows for a template.
 * scope: "all" = from validFrom to validUntil
 *        "future" = from max(now, validFrom) to validUntil
 * Returns number of rows actually inserted.
 */
async function generateEvents(
  clubId: string,
  templateId: string,
  scope: GenerationScope,
  tx: Prisma.TransactionClient,
): Promise<number> {
  const template = await tx.trainingTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    throw Object.assign(new Error('Training template not found'), {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }

  const club = await tx.club.findUnique({
    where: { id: clubId },
    select: { timezone: true },
  });
  if (!club) {
    throw Object.assign(new Error('Club not found'), {
      statusCode: 404,
      code: 'CLUB_NOT_FOUND',
    });
  }
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

/**
 * Templates can be created/edited by:
 *   - Club ADMIN / OWNER
 *   - HEAD_COACH of the target team
 *   - TEAM_MANAGER of the target team
 */
function assertTeamAccess(ctx: MemberContext, teamId: string): void {
  if (ctx.clubRoles.includes('ADMIN' as any) || ctx.clubRoles.includes('OWNER' as any)) {
    return;
  }
  const teamRoles = ctx.teamRoles
    .filter((tr) => tr.teamId === teamId)
    .map((tr) => tr.role);
  if (teamRoles.includes('HEAD_COACH' as any) || teamRoles.includes('TEAM_MANAGER' as any)) {
    return;
  }
  throw Object.assign(
    new Error('You do not have permission to manage training templates for this team'),
    { statusCode: 403, code: 'FORBIDDEN' },
  );
}

// ---------------------------------------------------------------------------
// GET /v1/training-templates
// ---------------------------------------------------------------------------
trainingTemplates.get('/', requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'), async (c) => {
  const member = c.get('member')!;
  const teamId = c.req.query('teamId');
  const activeParam = c.req.query('active');
  const active =
    activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const where: Prisma.TrainingTemplateWhereInput = {};
    if (teamId) where.teamId = teamId;
    if (active !== undefined) where.active = active;

    const templates = await tx.trainingTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        team: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
    });

    const now = new Date();
    const list = [];
    for (const t of templates) {
      const upcoming = await tx.event.count({
        where: { templateId: t.id, startsAt: { gt: now } },
      });
      list.push({
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
    return list;
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /v1/training-templates/:id
// ---------------------------------------------------------------------------
trainingTemplates.get('/:id', requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'), async (c) => {
  const member = c.get('member')!;
  const id = c.req.param('id');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const t = await tx.trainingTemplate.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true } },
        createdBy: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!t) return null;

    const now = new Date();
    const [totalEvents, detachedEvents, pastEvents, upcomingEvents] = await Promise.all([
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
      stats: { totalEvents, detachedEvents, pastEvents, upcomingEvents },
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Training template not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /v1/training-templates
// ---------------------------------------------------------------------------
trainingTemplates.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'),
  zValidator('json', CreateTrainingTemplateInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    assertTeamAccess(member, input.teamId);

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const team = await tx.team.findUnique({ where: { id: input.teamId } });
      if (!team) {
        throw Object.assign(new Error('Team not found'), {
          statusCode: 404,
          code: 'TEAM_NOT_FOUND',
        });
      }

      const sortedDays = [...new Set(input.daysOfWeek)].sort((a, b) => a - b);

      const template = await tx.trainingTemplate.create({
        data: {
          clubId: member.clubId,
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
          createdById: member.memberId,
        },
      });

      const generatedEventsCount = await generateEvents(
        member.clubId,
        template.id,
        'all',
        tx,
      );

      return { id: template.id, generatedEventsCount };
    });

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/training-templates/:id
// ---------------------------------------------------------------------------
trainingTemplates.patch(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'),
  zValidator('json', UpdateTrainingTemplateInput),
  async (c) => {
    const member = c.get('member')!;
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      const existing = await tx.trainingTemplate.findUnique({ where: { id } });
      if (!existing) return null;

      // Team change also needs access on the new team.
      const effectiveTeamId = input.teamId ?? existing.teamId;
      assertTeamAccess(member, effectiveTeamId);

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
        // Count detached to preserve (for reporting only).
        detachedPreservedCount = await tx.event.count({
          where: { templateId: id, detached: true, startsAt: { gt: now } },
        });
        // Wipe future non-detached events.
        await tx.event.deleteMany({
          where: { templateId: id, detached: false, startsAt: { gt: now } },
        });
        // Regenerate from now forward.
        regeneratedEventsCount = await generateEvents(
          member.clubId,
          id,
          'future',
          tx,
        );
      }

      return { id, regeneratedEventsCount, detachedPreservedCount };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Training template not found' }, 404);
    }

    return c.json(result);
  },
);

// ---------------------------------------------------------------------------
// DELETE /v1/training-templates/:id
// Deletes future events, detaches past events for audit trail.
// ---------------------------------------------------------------------------
trainingTemplates.delete('/:id', requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'), async (c) => {
  const member = c.get('member')!;
  const id = c.req.param('id');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const existing = await tx.trainingTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    assertTeamAccess(member, existing.teamId);

    const now = new Date();

    // Delete future events.
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

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Training template not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /v1/training-templates/:id/regenerate
// Manual trigger: regenerates future events from now.
// ---------------------------------------------------------------------------
trainingTemplates.post('/:id/regenerate', requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'), async (c) => {
  const member = c.get('member')!;
  const id = c.req.param('id');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const existing = await tx.trainingTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    assertTeamAccess(member, existing.teamId);

    const regeneratedEventsCount = await generateEvents(
      member.clubId,
      id,
      'future',
      tx,
    );
    return { regeneratedEventsCount };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Training template not found' }, 404);
  }

  return c.json(result);
});

export { trainingTemplates as trainingTemplatesRoutes };
