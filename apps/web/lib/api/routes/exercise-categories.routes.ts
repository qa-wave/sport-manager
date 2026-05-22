import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateExerciseCategoryInput } from '@sport-manager/contracts';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/exercise-categories — per-club CUSTOM categories.
 *
 * Built-in categories are defined in the frontend libraries
 * (lib/training-library.ts CATEGORY_LABELS, lib/physio-library.ts
 * PHYSIO_CATEGORY_LABELS). This endpoint serves only club-scoped custom
 * categories for unified rendering in the editor and lists.
 */
const categories = new Hono<HonoEnv>();

categories.use('/*', requireAuth());

function serialize(row: {
  id: string;
  type: 'TRAINING' | 'PHYSIO';
  slug: string;
  name: string;
  icon: string | null;
  colorKey: string | null;
  clubId: string | null;
  isBuiltin: boolean;
  sortOrder: number;
}) {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    name: row.name,
    icon: row.icon,
    colorKey: row.colorKey,
    clubId: row.clubId,
    isBuiltin: row.isBuiltin,
    sortOrder: row.sortOrder,
  };
}

// ---------------------------------------------------------------------------
// GET /v1/exercise-categories — list custom categories for this club
// Query: ?type=TRAINING|PHYSIO
// ---------------------------------------------------------------------------
categories.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
  }
  const type = c.req.query('type');

  const rows = await prisma.exerciseCategory.findMany({
    where: {
      clubId,
      ...(type === 'TRAINING' || type === 'PHYSIO' ? { type } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return c.json({ categories: rows.map(serialize) });
});

// ---------------------------------------------------------------------------
// POST /v1/exercise-categories — create CUSTOM category (ADMIN/OWNER/HEAD_COACH)
// ---------------------------------------------------------------------------
categories.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', CreateExerciseCategoryInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const input = c.req.valid('json');

    try {
      const row = await prisma.exerciseCategory.create({
        data: {
          type: input.type,
          slug: input.slug,
          name: input.name,
          icon: input.icon ?? null,
          colorKey: input.colorKey ?? null,
          sortOrder: input.sortOrder ?? 100,
          clubId,
          isBuiltin: false,
        },
      });
      return c.json(serialize(row), 201);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        return c.json(
          { error: 'Conflict', message: 'Kategorie s tímto slug už existuje' },
          409,
        );
      }
      throw err;
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /v1/exercise-categories/:id — remove custom category
// ---------------------------------------------------------------------------
categories.delete(
  '/:id',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'Club context required' }, 400);
    }
    const id = c.req.param('id');

    const existing = await prisma.exerciseCategory.findFirst({ where: { id, clubId } });
    if (!existing) {
      return c.json({ error: 'Not Found', message: 'Category not found' }, 404);
    }
    if (existing.isBuiltin) {
      return c.json({ error: 'Forbidden', message: 'Built-in categories are read-only' }, 403);
    }

    await prisma.exerciseCategory.delete({ where: { id } });
    return c.json({ ok: true });
  },
);

export { categories as exerciseCategoriesRoutes };
