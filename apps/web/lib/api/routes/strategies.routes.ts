import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateStrategyInput, UpdateStrategyInput } from '@sport-manager/contracts';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/strategies — taktické strategie (Library/Strategie).
 *
 * Stejný BUILTIN/CUSTOM model jako Exercise. BUILTIN se seedují (clubId=null,
 * read-only). CUSTOM patří klubu a smí je editovat ADMIN/OWNER/HEAD_COACH.
 */
const strategies = new Hono<HonoEnv>();

strategies.use('/*', requireAuth());

type StrategyRow = Prisma.StrategyGetPayload<{
  include: {
    createdBy: { include: { user: { select: { firstName: true; lastName: true } } } };
  };
}>;

function serializeStrategy(row: StrategyRow) {
  return {
    id: row.id,
    source: row.source,
    clubId: row.clubId,
    category: row.category,
    name: row.name,
    description: row.description,
    whenToUse: row.whenToUse,
    counterTo: row.counterTo,
    reasoning: row.reasoning,
    roles: Array.isArray(row.roles) ? row.roles : [],
    keyPoints: row.keyPoints,
    formation: row.formation,
    sports: row.sports,
    difficulty: row.difficulty,
    ageGroups: row.ageGroups,
    videoUrl: row.videoUrl,
    posterUrl: row.posterUrl,
    imageUrls: row.imageUrls,
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
// GET /v1/strategies — list strategií (CUSTOM klubu + BUILTIN shared)
// ---------------------------------------------------------------------------
strategies.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
  }

  const category = c.req.query('category');
  const sport = c.req.query('sport');
  const search = c.req.query('search')?.trim();
  const sourceParam = c.req.query('source');

  const where: Prisma.StrategyWhereInput = {};

  if (sourceParam === 'BUILTIN') {
    where.source = 'BUILTIN';
    where.clubId = null;
  } else if (sourceParam === 'CUSTOM') {
    where.source = 'CUSTOM';
    where.clubId = clubId;
  } else {
    where.OR = [
      { source: 'BUILTIN', clubId: null },
      { source: 'CUSTOM', clubId },
    ];
  }

  if (
    category === 'OFFENSE' ||
    category === 'DEFENSE' ||
    category === 'TRANSITION' ||
    category === 'SET_PIECE' ||
    category === 'SPECIAL'
  ) {
    where.category = category;
  }
  if (sport) where.sports = { has: sport };
  if (search) {
    const term = { contains: search, mode: 'insensitive' } as const;
    const orClauses: Prisma.StrategyWhereInput[] = [
      { name: term },
      { description: term },
      { tags: { has: search.toLowerCase() } },
    ];
    where.AND = [{ OR: orClauses }];
  }

  const rows = await prisma.strategy.findMany({
    where,
    include: {
      createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: [{ source: 'asc' }, { updatedAt: 'desc' }],
  });

  return c.json({ strategies: rows.map(serializeStrategy) });
});

// ---------------------------------------------------------------------------
// GET /v1/strategies/:id — detail (CUSTOM klubu nebo BUILTIN)
// ---------------------------------------------------------------------------
strategies.get('/:id', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
  }
  const id = c.req.param('id');

  const row = await prisma.strategy.findFirst({
    where: {
      id,
      OR: [
        { source: 'BUILTIN', clubId: null },
        { clubId },
      ],
    },
    include: {
      createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!row) {
    return c.json({ error: 'Not Found', message: 'Strategy not found' }, 404);
  }
  return c.json(serializeStrategy(row));
});

// ---------------------------------------------------------------------------
// POST /v1/strategies — vytvořit CUSTOM strategii
// ---------------------------------------------------------------------------
strategies.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', CreateStrategyInput),
  async (c) => {
    const clubId = c.get('clubId');
    const member = c.get('member');
    if (!clubId || !member) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const input = c.req.valid('json');

    const row = await prisma.strategy.create({
      data: {
        source: 'CUSTOM',
        clubId,
        category: input.category,
        name: input.name,
        description: input.description ?? null,
        whenToUse: input.whenToUse ?? null,
        counterTo: input.counterTo ?? null,
        reasoning: input.reasoning ?? null,
        roles: (input.roles ?? []) as Prisma.InputJsonValue,
        keyPoints: input.keyPoints ?? [],
        formation: input.formation ?? null,
        sports: input.sports ?? [],
        difficulty: input.difficulty ?? null,
        ageGroups: input.ageGroups ?? [],
        videoUrl: input.videoUrl ?? null,
        posterUrl: input.posterUrl ?? null,
        imageUrls: input.imageUrls ?? [],
        icon: input.icon ?? null,
        tags: input.tags ?? [],
        createdById: member.memberId,
      },
      include: {
        createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return c.json(serializeStrategy(row), 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/strategies/:id — update CUSTOM strategie
// ---------------------------------------------------------------------------
strategies.patch(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', UpdateStrategyInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const id = c.req.param('id');
    const input = c.req.valid('json');

    const existing = await prisma.strategy.findFirst({ where: { id, clubId } });
    if (!existing) {
      return c.json({ error: 'Not Found', message: 'Strategy not found' }, 404);
    }
    if (existing.source === 'BUILTIN') {
      return c.json(
        { error: 'Forbidden', message: 'Built-in strategies are read-only' },
        403,
      );
    }

    const data: Prisma.StrategyUpdateInput = {};
    if (input.category !== undefined) data.category = input.category;
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.whenToUse !== undefined) data.whenToUse = input.whenToUse ?? null;
    if (input.counterTo !== undefined) data.counterTo = input.counterTo ?? null;
    if (input.reasoning !== undefined) data.reasoning = input.reasoning ?? null;
    if (input.roles !== undefined) data.roles = (input.roles ?? []) as Prisma.InputJsonValue;
    if (input.keyPoints !== undefined) data.keyPoints = input.keyPoints ?? [];
    if (input.formation !== undefined) data.formation = input.formation ?? null;
    if (input.sports !== undefined) data.sports = input.sports ?? [];
    if (input.difficulty !== undefined) data.difficulty = input.difficulty ?? null;
    if (input.ageGroups !== undefined) data.ageGroups = input.ageGroups ?? [];
    if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl ?? null;
    if (input.posterUrl !== undefined) data.posterUrl = input.posterUrl ?? null;
    if (input.imageUrls !== undefined) data.imageUrls = input.imageUrls ?? [];
    if (input.icon !== undefined) data.icon = input.icon ?? null;
    if (input.tags !== undefined) data.tags = input.tags ?? [];

    const row = await prisma.strategy.update({
      where: { id },
      data,
      include: {
        createdBy: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return c.json(serializeStrategy(row));
  },
);

// ---------------------------------------------------------------------------
// DELETE /v1/strategies/:id — odstranit CUSTOM strategii
// ---------------------------------------------------------------------------
strategies.delete(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const id = c.req.param('id');

    const existing = await prisma.strategy.findFirst({ where: { id, clubId } });
    if (!existing) {
      return c.json({ error: 'Not Found', message: 'Strategy not found' }, 404);
    }
    if (existing.source === 'BUILTIN') {
      return c.json(
        { error: 'Forbidden', message: 'Built-in strategies are read-only' },
        403,
      );
    }

    await prisma.strategy.delete({ where: { id } });
    return c.json({ ok: true });
  },
);

export { strategies as strategiesRoutes };
