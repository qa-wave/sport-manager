import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/gallery — photo gallery stored in Club.config.gallery
 *
 * Albums and photos are stored as JSON in Club.config to avoid
 * requiring a DB schema migration. Each club gets:
 *   config.gallery.albums = [{ id, title, photos: [...], createdAt }]
 *
 * Photos are base64 data URLs uploaded via POST /v1/upload.
 */

const gallery = new Hono<HonoEnv>();

gallery.use('/*', requireAuth());

// ── Types ─────────────────────────────────────────────────────────────────

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

interface GalleryAlbum {
  id: string;
  title: string;
  photos: GalleryPhoto[];
  createdAt: string;
}

interface GalleryConfig {
  albums: GalleryAlbum[];
}

function asJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

async function getGallery(clubId: string): Promise<GalleryConfig> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { config: true },
  });
  const cfg = (club?.config as Record<string, unknown>) ?? {};
  const raw = cfg.gallery as unknown;
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as Record<string, unknown>).albums)) {
    return { albums: [] };
  }
  return raw as GalleryConfig;
}

async function saveGallery(clubId: string, gallery: GalleryConfig): Promise<void> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { config: true },
  });
  const cfg = (club?.config as Record<string, unknown>) ?? {};
  await prisma.club.update({
    where: { id: clubId },
    data: { config: asJson({ ...cfg, gallery }) as any },
  });
}

// ── GET /v1/gallery ────────────────────────────────────────────────────────

gallery.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const data = await getGallery(clubId);

  const albums = data.albums.map((album) => ({
    id: album.id,
    title: album.title,
    photoCount: album.photos.length,
    coverUrl: album.photos[0]?.url ?? null,
    createdAt: album.createdAt,
  }));

  return c.json({ albums });
});

// ── POST /v1/gallery/albums ────────────────────────────────────────────────

const CreateAlbumInput = z.object({
  title: z.string().min(1).max(100),
});

gallery.post(
  '/albums',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  zValidator('json', CreateAlbumInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    const { title } = c.req.valid('json');
    const data = await getGallery(clubId);

    const newAlbum: GalleryAlbum = {
      id: crypto.randomUUID(),
      title,
      photos: [],
      createdAt: new Date().toISOString(),
    };

    data.albums.push(newAlbum);
    await saveGallery(clubId, data);

    return c.json({ album: { id: newAlbum.id, title: newAlbum.title, photoCount: 0, coverUrl: null, createdAt: newAlbum.createdAt } }, 201);
  },
);

// ── GET /v1/gallery/albums/:albumId ───────────────────────────────────────

gallery.get('/albums/:albumId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const albumId = c.req.param('albumId');
  const data = await getGallery(clubId);
  const album = data.albums.find((a) => a.id === albumId);

  if (!album) {
    return c.json({ error: 'Not Found', message: 'Album not found' }, 404);
  }

  return c.json({ album });
});

// ── POST /v1/gallery/albums/:albumId/photos ───────────────────────────────

const AddPhotoInput = z.object({
  url: z.string().min(1),
  caption: z.string().max(200).optional(),
});

gallery.post(
  '/albums/:albumId/photos',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  zValidator('json', AddPhotoInput),
  async (c) => {
    const member = c.get('member')!;
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    const albumId = c.req.param('albumId');
    const { url, caption } = c.req.valid('json');

    // Fetch uploader name
    const memberRecord = await prisma.member.findUnique({
      where: { id: member.memberId },
      select: { user: { select: { firstName: true, lastName: true } } },
    });
    const uploaderName = memberRecord
      ? `${memberRecord.user.firstName} ${memberRecord.user.lastName}`
      : 'Člen';

    const data = await getGallery(clubId);
    const albumIdx = data.albums.findIndex((a) => a.id === albumId);

    if (albumIdx === -1) {
      return c.json({ error: 'Not Found', message: 'Album not found' }, 404);
    }

    const newPhoto: GalleryPhoto = {
      id: crypto.randomUUID(),
      url,
      caption: caption ?? null,
      uploadedBy: member.memberId,
      uploadedByName: uploaderName,
      createdAt: new Date().toISOString(),
    };

    const targetAlbum = data.albums[albumIdx];
    if (!targetAlbum) {
      return c.json({ error: 'Not Found', message: 'Album not found' }, 404);
    }
    targetAlbum.photos.push(newPhoto);
    await saveGallery(clubId, data);

    return c.json({ photo: newPhoto }, 201);
  },
);

// ── DELETE /v1/gallery/albums/:albumId/photos/:photoId ────────────────────

gallery.delete(
  '/albums/:albumId/photos/:photoId',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    const albumId = c.req.param('albumId');
    const photoId = c.req.param('photoId');

    const data = await getGallery(clubId);
    const albumIdx = data.albums.findIndex((a) => a.id === albumId);

    if (albumIdx === -1) {
      return c.json({ error: 'Not Found', message: 'Album not found' }, 404);
    }

    const targetAlbum2 = data.albums[albumIdx];
    if (!targetAlbum2) {
      return c.json({ error: 'Not Found', message: 'Album not found' }, 404);
    }
    const photoBefore = targetAlbum2.photos.length;
    targetAlbum2.photos = targetAlbum2.photos.filter((p) => p.id !== photoId);

    if (targetAlbum2.photos.length === photoBefore) {
      return c.json({ error: 'Not Found', message: 'Photo not found' }, 404);
    }

    await saveGallery(clubId, data);
    return c.body(null, 204);
  },
);

// ── DELETE /v1/gallery/albums/:albumId ────────────────────────────────────

gallery.delete(
  '/albums/:albumId',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    const albumId = c.req.param('albumId');
    const data = await getGallery(clubId);
    const before = data.albums.length;
    data.albums = data.albums.filter((a) => a.id !== albumId);

    if (data.albums.length === before) {
      return c.json({ error: 'Not Found', message: 'Album not found' }, 404);
    }

    await saveGallery(clubId, data);
    return c.body(null, 204);
  },
);

export { gallery as galleryRoutes };
