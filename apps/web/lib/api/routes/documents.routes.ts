import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/clubs/documents — documents stored in club.config.documents array.
 *
 * Documents are stored as base64 data URLs (same as gallery images).
 * Limited to PDFs and images, max 2 MB.
 */
const documents = new Hono<HonoEnv>();
documents.use('/*', requireAuth());

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export type ClubDocument = {
  id: string;
  title: string;
  mimeType: string;
  dataUrl: string;
  uploadedByMemberId: string;
  uploadedAt: string;
};

async function getDocuments(clubId: string): Promise<ClubDocument[]> {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
  if (!club) return [];
  const cfg = (club.config as Record<string, unknown>) ?? {};
  return Array.isArray(cfg.documents) ? (cfg.documents as ClubDocument[]) : [];
}

async function saveDocuments(clubId: string, docs: ClubDocument[]): Promise<void> {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
  if (!club) return;
  const cfg = (club.config as Record<string, unknown>) ?? {};
  await prisma.club.update({
    where: { id: clubId },
    data: { config: asJson({ ...cfg, documents: docs }) },
  });
}

// GET /v1/clubs/documents
documents.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const docs = await getDocuments(clubId);
  // Strip dataUrl from list response to keep payload small
  return c.json(docs.map(({ dataUrl: _, ...d }) => d));
});

// POST /v1/clubs/documents
const UploadDocumentInput = z.object({
  title: z.string().min(1).max(200),
  mimeType: z.string().refine(
    (m) => ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(m),
    { message: 'Only PDF and images are allowed' },
  ),
  dataUrl: z.string().min(1),
});

documents.post(
  '/',
  requireRole('ADMIN', 'OWNER'),
  zValidator('json', UploadDocumentInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    // 2 MB limit: base64 is ~133% of binary, so 2 MB binary ≈ 2.7 MB base64
    if (input.dataUrl.length > 3_000_000) {
      return c.json({ error: 'Bad Request', message: 'Document exceeds 2 MB limit' }, 400);
    }

    const docs = await getDocuments(member.clubId);

    const newDoc: ClubDocument = {
      id: crypto.randomUUID(),
      title: input.title,
      mimeType: input.mimeType,
      dataUrl: input.dataUrl,
      uploadedByMemberId: member.memberId,
      uploadedAt: new Date().toISOString(),
    };

    await saveDocuments(member.clubId, [...docs, newDoc]);
    const { dataUrl: _, ...withoutData } = newDoc;
    return c.json(withoutData, 201);
  },
);

// GET /v1/clubs/documents/:docId — returns full dataUrl for viewing
documents.get('/:docId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const docId = c.req.param('docId');
  const docs = await getDocuments(clubId);
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return c.json({ error: 'Not Found', message: 'Document not found' }, 404);

  return c.json(doc);
});

// DELETE /v1/clubs/documents/:docId
documents.delete(
  '/:docId',
  requireRole('ADMIN', 'OWNER'),
  async (c) => {
    const member = c.get('member')!;
    const docId = c.req.param('docId');

    const docs = await getDocuments(member.clubId);
    const filtered = docs.filter((d) => d.id !== docId);
    if (filtered.length === docs.length) {
      return c.json({ error: 'Not Found', message: 'Document not found' }, 404);
    }

    await saveDocuments(member.clubId, filtered);
    return c.body(null, 204);
  },
);

export { documents as documentsRoutes };
