import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { uploadBlob, deleteBlob, isBlobConfigured } from '../services/blob.service';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/clubs/documents — club documents stored in club.config.documents array.
 *
 * When BLOB_READ_WRITE_TOKEN is present, binary content is uploaded to Vercel Blob
 * and only metadata (no base64) is stored in config.
 *
 * Fallback: when Blob is not configured, the original base64 dataUrl approach
 * is used so the app stays functional in local/preview environments.
 */
const documents = new Hono<HonoEnv>();
documents.use('/*', requireAuth());

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Stored in club.config.documents[].
 * Either blobUrl (Vercel Blob) or dataUrl (base64 fallback) is set.
 */
export type ClubDocument = {
  id: string;
  title: string;
  mimeType: string;
  /** Vercel Blob CDN URL — present when Blob is configured. */
  blobUrl?: string;
  /** Base64 data URL — fallback when Blob is not configured. */
  dataUrl?: string;
  uploadedByMemberId: string;
  uploadedAt: string;
};

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

async function getDocuments(clubId: string): Promise<ClubDocument[]> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { config: true },
  });
  if (!club) return [];
  const cfg = (club.config as Record<string, unknown>) ?? {};
  return Array.isArray(cfg.documents) ? (cfg.documents as ClubDocument[]) : [];
}

async function saveDocuments(clubId: string, docs: ClubDocument[]): Promise<void> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { config: true },
  });
  if (!club) return;
  const cfg = (club.config as Record<string, unknown>) ?? {};
  await prisma.club.update({
    where: { id: clubId },
    data: { config: asJson({ ...cfg, documents: docs }) },
  });
}

/** Strip raw content from list responses to keep payload small. */
function toListItem(doc: ClubDocument) {
  const { dataUrl: _d, ...rest } = doc;
  return rest;
}

// ---------------------------------------------------------------------------
// GET /v1/clubs/documents — list (no raw content)
// ---------------------------------------------------------------------------
documents.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const docs = await getDocuments(clubId);
  return c.json(docs.map(toListItem));
});

// ---------------------------------------------------------------------------
// POST /v1/clubs/documents — upload
// ---------------------------------------------------------------------------
const UploadDocumentInput = z.object({
  title: z.string().min(1).max(200),
  mimeType: z.string().refine(
    (m) => ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(m),
    { message: 'Only PDF and images are allowed' },
  ),
  /** Base64-encoded file content (without data URL prefix). */
  data: z.string().min(1),
  /** Original filename, used to build the Blob path. */
  filename: z.string().min(1).max(255).optional(),
});

documents.post(
  '/',
  requireRole('ADMIN', 'OWNER'),
  zValidator('json', UploadDocumentInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    // Guard: ~2 MB base64 limit
    if (input.data.length > 3_000_000) {
      return c.json({ error: 'Bad Request', message: 'Document exceeds 2 MB limit' }, 400);
    }

    const docs = await getDocuments(member.clubId);
    const docId = crypto.randomUUID();
    const uploadedAt = new Date().toISOString();

    let newDoc: ClubDocument;

    if (isBlobConfigured()) {
      // --- Vercel Blob path ---
      const buffer = Buffer.from(input.data, 'base64');
      const safeFilename = input.filename
        ? `${docId}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        : `${docId}.bin`;

      const blobUrl = await uploadBlob(safeFilename, buffer, input.mimeType);

      newDoc = {
        id: docId,
        title: input.title,
        mimeType: input.mimeType,
        blobUrl,
        uploadedByMemberId: member.memberId,
        uploadedAt,
      };
    } else {
      // --- Base64 fallback (local / preview without Blob token) ---
      const dataUrl = `data:${input.mimeType};base64,${input.data}`;
      newDoc = {
        id: docId,
        title: input.title,
        mimeType: input.mimeType,
        dataUrl,
        uploadedByMemberId: member.memberId,
        uploadedAt,
      };
    }

    await saveDocuments(member.clubId, [...docs, newDoc]);
    return c.json(toListItem(newDoc), 201);
  },
);

// ---------------------------------------------------------------------------
// GET /v1/clubs/documents/:docId — detail with download URL
// ---------------------------------------------------------------------------
documents.get('/:docId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const docId = c.req.param('docId');
  const docs = await getDocuments(clubId);
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return c.json({ error: 'Not Found', message: 'Document not found' }, 404);

  // When Blob is used, blobUrl is the direct CDN link — return metadata + url.
  // When base64 fallback, return the full dataUrl so client can render it.
  return c.json(doc);
});

// ---------------------------------------------------------------------------
// DELETE /v1/clubs/documents/:docId
// ---------------------------------------------------------------------------
documents.delete('/:docId', requireRole('ADMIN', 'OWNER'), async (c) => {
  const member = c.get('member')!;
  const docId = c.req.param('docId');

  const docs = await getDocuments(member.clubId);
  const target = docs.find((d) => d.id === docId);
  if (!target) {
    return c.json({ error: 'Not Found', message: 'Document not found' }, 404);
  }

  // Remove from Blob CDN if applicable
  if (target.blobUrl && isBlobConfigured()) {
    try {
      await deleteBlob(target.blobUrl);
    } catch (err) {
      // Log but don't block — metadata cleanup should still proceed
      console.error('[documents] Blob delete failed:', err);
    }
  }

  const filtered = docs.filter((d) => d.id !== docId);
  await saveDocuments(member.clubId, filtered);
  return c.body(null, 204);
});

export { documents as documentsRoutes };
