import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/waivers — waiver template CRUD + signing.
 */
const waivers = new Hono<HonoEnv>();

waivers.use('/*', requireAuth());

const WAIVER_TYPES = ['GDPR', 'HEALTH', 'LIABILITY', 'MEDIA_CONSENT'] as const;

// ---------------------------------------------------------------------------
// GET /v1/waivers
// ---------------------------------------------------------------------------
waivers.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const list = await prisma.withClub(clubId, async (tx) => {
    return tx.waiver.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { signatures: true } },
        signatures: {
          select: {
            id: true,
            subjectId: true,
            signedById: true,
            signedAt: true,
          },
        },
      },
    });
  });

  // Count total club members for "X/Y signed" stat
  const memberCount = await prisma.member.count({ where: { clubId } });

  return c.json(
    list.map((w) => ({
      id: w.id,
      title: w.title,
      body: w.body,
      version: w.version,
      type: w.type,
      requiredForMinors: w.requiredForMinors,
      createdAt: w.createdAt.toISOString(),
      signedCount: w._count.signatures,
      memberCount,
    })),
  );
});

// ---------------------------------------------------------------------------
// POST /v1/waivers — create template (OWNER / ADMIN)
// ---------------------------------------------------------------------------
const CreateWaiverInput = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum(WAIVER_TYPES),
  requiredForMinors: z.boolean().optional().default(true),
});

waivers.post(
  '/',
  requireRole('OWNER', 'ADMIN'),
  zValidator('json', CreateWaiverInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    const waiver = await prisma.waiver.create({
      data: {
        clubId: member.clubId,
        title: input.title,
        body: input.body,
        type: input.type as any,
        requiredForMinors: input.requiredForMinors,
      },
    });

    return c.json({ id: waiver.id }, 201);
  },
);

// ---------------------------------------------------------------------------
// GET /v1/waivers/:id/pending — list members who haven't signed
// ---------------------------------------------------------------------------
waivers.get('/:id/pending', requireRole('OWNER', 'ADMIN'), async (c) => {
  const member = c.get('member')!;
  const waiverId = c.req.param('id');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const waiver = await tx.waiver.findUnique({
      where: { id: waiverId },
      include: {
        signatures: { select: { subjectId: true } },
      },
    });
    if (!waiver) return null;

    const signedIds = new Set(waiver.signatures.map((s) => s.subjectId));

    const members = await tx.member.findMany({
      where: { clubId: member.clubId, status: 'ACTIVE' },
      select: {
        id: true,
        isMinor: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ user: { lastName: 'asc' } }],
    });

    const pending = members
      .filter((m) => !signedIds.has(m.id))
      .map((m) => ({
        memberId: m.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        isMinor: m.isMinor,
      }));

    return { waiver: { id: waiver.id, title: waiver.title }, pending };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Waiver not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /v1/waivers/:id/sign
// ---------------------------------------------------------------------------
const SignWaiverInput = z.object({
  memberId: z.string().cuid(),
  signature: z.string().min(1).max(500),
});

waivers.post('/:id/sign', requireAuth(), zValidator('json', SignWaiverInput), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!member || !clubId) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const waiverId = c.req.param('id');
  const { memberId, signature } = c.req.valid('json');

  // Must be signing for self, a child, or be admin/owner
  const isAdminOrOwner =
    member.clubRoles.includes('OWNER') || member.clubRoles.includes('ADMIN');

  if (memberId !== member.memberId && !isAdminOrOwner) {
    // Check if signer is guardian of subject with canSignWaivers
    const link = await prisma.guardianLink.findUnique({
      where: { guardianId_childId: { guardianId: member.memberId, childId: memberId } },
    });
    if (!link || !link.canSignWaivers || !link.verifiedAt) {
      return c.json({ error: 'Forbidden', message: 'You cannot sign on behalf of this member' }, 403);
    }
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const waiver = await tx.waiver.findUnique({ where: { id: waiverId } });
    if (!waiver) return null;

    // Get IP from request
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0]?.trim() : undefined;

    const existing = await tx.waiverSignature.findUnique({
      where: { waiverId_subjectId: { waiverId, subjectId: memberId } },
    });
    if (existing) {
      return { id: existing.id, alreadySigned: true };
    }

    const sig = await tx.waiverSignature.create({
      data: {
        waiverId,
        subjectId: memberId,
        signedById: member.memberId,
        ipAddress: ip ?? null,
      },
    });

    return { id: sig.id, alreadySigned: false };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Waiver not found' }, 404);
  }

  return c.json(result, result.alreadySigned ? 200 : 201);
});

export { waivers as waiversRoutes };
