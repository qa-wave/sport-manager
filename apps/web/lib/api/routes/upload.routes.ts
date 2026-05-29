import { Hono } from 'hono';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import { uploadBlob, isBlobConfigured } from '../services/blob.service';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/upload — file upload infrastructure.
 *
 * POST /v1/upload
 *   Accepts multipart/form-data with an image file.
 *   If Vercel Blob is configured → uploads to Blob CDN, returns public URL.
 *   Otherwise (local dev / preview without token) → returns base64 data URL.
 *   Either way the returned `url` survives cold starts: Blob is CDN-hosted,
 *   base64 ends up in DB rows (avatars, gallery JSON, …).
 *
 * PATCH /v1/upload/members/:id/avatar
 *   Updates the avatarUrl on the member's User record.
 *   Body: { avatarUrl: string }
 */

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = new Hono<HonoEnv>();

upload.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// POST /v1/upload
// ---------------------------------------------------------------------------
upload.post('/', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: 'Bad Request', message: 'Expected multipart/form-data' }, 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'Bad Request', message: 'Missing file field' }, 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json(
      { error: 'Bad Request', message: 'Allowed types: image/jpeg, image/png, image/webp' },
      400,
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return c.json({ error: 'Bad Request', message: 'File exceeds 2 MB limit' }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Production path: upload to Vercel Blob (durable, CDN-served, survives cold starts).
  if (isBlobConfigured()) {
    try {
      const ext = file.type.split('/')[1] ?? 'bin';
      const filename = `uploads/${member.clubId}/${crypto.randomUUID()}.${ext}`;
      const url = await uploadBlob(filename, buffer, file.type);
      return c.json({ url, storage: 'blob' });
    } catch (err) {
      console.error('[upload] Blob upload failed, falling back to base64:', err);
      // fall through to base64 below
    }
  }

  // Fallback: base64 data URL (local dev or Blob outage).
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;
  return c.json({ url: dataUrl, storage: 'base64' });
});

// ---------------------------------------------------------------------------
// PATCH /v1/upload/members/:id/avatar
// Updates the user's avatarUrl. Only the member themselves, or ADMIN/OWNER.
// ---------------------------------------------------------------------------
upload.patch('/members/:id/avatar', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const targetMemberId = c.req.param('id');

  let body: { avatarUrl: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Bad Request', message: 'Invalid JSON body' }, 400);
  }

  const { avatarUrl } = body;
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return c.json({ error: 'Bad Request', message: 'avatarUrl is required' }, 400);
  }

  await prisma.withClub(member.clubId, async (tx) => {
    const target = await tx.member.findUnique({
      where: { id: targetMemberId },
      select: { id: true, userId: true },
    });

    if (!target) {
      throw Object.assign(new Error('Member not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const isSelf = target.id === member.memberId;
    const isAdminOrOwner = member.clubRoles.some((r) => ['ADMIN', 'OWNER'].includes(r));

    if (!isSelf && !isAdminOrOwner) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403, code: 'FORBIDDEN' });
    }

    await tx.user.update({
      where: { id: target.userId },
      data: { avatarUrl },
    });
  });

  return c.json({ ok: true });
});

export { upload as uploadRoutes };
