import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateExerciseInput, UpdateExerciseInput } from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/exercises — unified CRUD for TRAINING drills and PHYSIO exercises.
 *
 * Built-in exercises live in TS libraries (lib/training-library.ts,
 * lib/physio-library.ts) and are merged by the frontend. The DB only holds
 * CUSTOM exercises created by a club. Built-in records cannot exist in DB —
 * any record returned from these routes has source=CUSTOM by definition.
 */
const exercises = new Hono<HonoEnv>();

exercises.use('/*', requireAuth());

function serializeExercise(
  row: Prisma.ExerciseGetPayload<{
    include: {
      category: true;
      createdBy: { include: { user: { select: { firstName: true; lastName: true } } } };
    };
  }>,
) {
  return {
    id: row.id,
    source: row.source,
    type: row.type,
    clubId: row.clubId,
    categoryId: row.categoryId,
    categorySlug: row.category?.slug ?? null,
    categoryName: row.category?.name ?? null,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    coachingPoints: row.coachingPoints,
    equipment: row.equipment,
    difficulty: row.difficulty,
    ageGroups: row.ageGroups,
    sports: row.sports,
    bodyAreas: row.bodyAreas,
    physioType: row.physioType,
    durationMinutes: row.durationMinutes,
    playersMin: row.playersMin,
    playersMax: row.playersMax,
    fieldSize: row.fieldSize,
    imageUrls: row.imageUrls,
    youtubeId: row.youtubeId,
    videoUrl: row.videoUrl,
    diagramKey: row.diagramKey,
    icon: row.icon,
    tags: row.tags,
    createdById: row.createdById,
    createdByName: row.createdBy
      ? `${row.createdBy.user.firstName} ${row.createdBy.user.lastName}`
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    usageCount: row.usageCount,
  };
}

// ---------------------------------------------------------------------------
// GET /v1/exercises — list CUSTOM exercises for current club
// Query: ?type=TRAINING|PHYSIO&search=...&categoryId=...
// ---------------------------------------------------------------------------
exercises.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
  }

  const type = c.req.query('type');
  const search = c.req.query('search')?.trim();
  const categoryId = c.req.query('categoryId');

  const where: Prisma.ExerciseWhereInput = {
    clubId,
    source: 'CUSTOM',
  };
  if (type === 'TRAINING' || type === 'PHYSIO') where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  const rows = await prisma.exercise.findMany({
    where,
    include: {
      category: true,
      createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return c.json({ exercises: rows.map(serializeExercise) });
});

// ---------------------------------------------------------------------------
// GET /v1/exercises/:id — detail of a CUSTOM exercise
// ---------------------------------------------------------------------------
exercises.get('/:id', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
  }
  const id = c.req.param('id');

  const row = await prisma.exercise.findFirst({
    where: { id, clubId },
    include: {
      category: true,
      createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!row) {
    return c.json({ error: 'Not Found', message: 'Exercise not found' }, 404);
  }
  return c.json(serializeExercise(row));
});

// ---------------------------------------------------------------------------
// POST /v1/exercises — create a CUSTOM exercise (ADMIN, OWNER, HEAD_COACH)
// ---------------------------------------------------------------------------
exercises.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', CreateExerciseInput),
  async (c) => {
    const clubId = c.get('clubId');
    const member = c.get('member');
    if (!clubId || !member) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const input = c.req.valid('json');

    // If categoryId is provided, verify it belongs to this club or is built-in.
    if (input.categoryId) {
      const cat = await prisma.exerciseCategory.findUnique({ where: { id: input.categoryId } });
      if (!cat || (cat.clubId && cat.clubId !== clubId)) {
        return c.json({ error: 'Bad Request', message: 'Invalid category' }, 400);
      }
      if (cat.type !== input.type) {
        return c.json({ error: 'Bad Request', message: 'Category type mismatch' }, 400);
      }
    }

    const row = await prisma.exercise.create({
      data: {
        source: 'CUSTOM',
        type: input.type,
        clubId,
        categoryId: input.categoryId ?? null,
        name: input.name,
        description: input.description ?? null,
        instructions: input.instructions ?? [],
        coachingPoints: input.coachingPoints ?? [],
        equipment: input.equipment ?? [],
        difficulty: input.difficulty ?? null,
        ageGroups: input.ageGroups ?? [],
        sports: input.sports ?? [],
        bodyAreas: input.bodyAreas ?? [],
        physioType: input.physioType ?? null,
        durationMinutes: input.durationMinutes ?? null,
        playersMin: input.playersMin ?? null,
        playersMax: input.playersMax ?? null,
        fieldSize: input.fieldSize ?? null,
        imageUrls: input.imageUrls ?? [],
        youtubeId: input.youtubeId ?? null,
        videoUrl: input.videoUrl ?? null,
        icon: input.icon ?? null,
        tags: input.tags ?? [],
        createdById: member.memberId,
      },
      include: {
        category: true,
        createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return c.json(serializeExercise(row), 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/exercises/:id — update CUSTOM exercise (ADMIN/OWNER/HEAD_COACH)
// ---------------------------------------------------------------------------
exercises.patch(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', UpdateExerciseInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const existing = await prisma.exercise.findFirst({ where: { id, clubId } });
    if (!existing) {
      return c.json({ error: 'Not Found', message: 'Exercise not found' }, 404);
    }
    if (existing.source === 'BUILTIN') {
      return c.json(
        { error: 'Forbidden', message: 'Built-in exercises are read-only' },
        403,
      );
    }

    if (input.categoryId) {
      const cat = await prisma.exerciseCategory.findUnique({ where: { id: input.categoryId } });
      if (!cat || (cat.clubId && cat.clubId !== clubId)) {
        return c.json({ error: 'Bad Request', message: 'Invalid category' }, 400);
      }
    }

    const data: Prisma.ExerciseUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.categoryId !== undefined) {
      data.category = input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true };
    }
    if (input.instructions !== undefined) data.instructions = input.instructions ?? [];
    if (input.coachingPoints !== undefined) data.coachingPoints = input.coachingPoints ?? [];
    if (input.equipment !== undefined) data.equipment = input.equipment ?? [];
    if (input.difficulty !== undefined) data.difficulty = input.difficulty ?? null;
    if (input.ageGroups !== undefined) data.ageGroups = input.ageGroups ?? [];
    if (input.sports !== undefined) data.sports = input.sports ?? [];
    if (input.bodyAreas !== undefined) data.bodyAreas = input.bodyAreas ?? [];
    if (input.physioType !== undefined) data.physioType = input.physioType ?? null;
    if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes ?? null;
    if (input.playersMin !== undefined) data.playersMin = input.playersMin ?? null;
    if (input.playersMax !== undefined) data.playersMax = input.playersMax ?? null;
    if (input.fieldSize !== undefined) data.fieldSize = input.fieldSize ?? null;
    if (input.imageUrls !== undefined) data.imageUrls = input.imageUrls ?? [];
    if (input.youtubeId !== undefined) data.youtubeId = input.youtubeId ?? null;
    if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl ?? null;
    if (input.icon !== undefined) data.icon = input.icon ?? null;
    if (input.tags !== undefined) data.tags = input.tags ?? [];

    const row = await prisma.exercise.update({
      where: { id },
      data,
      include: {
        category: true,
        createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return c.json(serializeExercise(row));
  },
);

// ---------------------------------------------------------------------------
// DELETE /v1/exercises/:id — remove CUSTOM exercise
// ---------------------------------------------------------------------------
exercises.delete(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const id = c.req.param('id');

    const existing = await prisma.exercise.findFirst({ where: { id, clubId } });
    if (!existing) {
      return c.json({ error: 'Not Found', message: 'Exercise not found' }, 404);
    }
    if (existing.source === 'BUILTIN') {
      return c.json(
        { error: 'Forbidden', message: 'Built-in exercises are read-only' },
        403,
      );
    }

    await prisma.exercise.delete({ where: { id } });
    return c.json({ ok: true });
  },
);

export { exercises as exercisesRoutes };
