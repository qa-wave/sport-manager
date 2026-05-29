import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/notification-preferences — GET + PATCH per-user per-club prefs.
 */
const notificationPrefs = new Hono<HonoEnv>();

notificationPrefs.use('/*', requireAuth());

const UpdatePrefsInput = z.object({
  emailEvents: z.boolean().optional(),
  emailRsvpReminder: z.boolean().optional(),
  emailMessages: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /v1/notification-preferences
// Returns preferences for current user+club. Upserts with defaults on first access.
// ---------------------------------------------------------------------------
notificationPrefs.get('/', async (c) => {
  const user = c.get('user');
  const member = c.get('member');

  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if (!member) return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);

  const prefs = await prisma.withClub(member.clubId, (tx) =>
    tx.notificationPreference.upsert({
      where: { userId_clubId: { userId: user.id, clubId: member.clubId } },
      create: { userId: user.id, clubId: member.clubId },
      update: {},
    }),
  );

  return c.json({
    id: prefs.id,
    emailEvents: prefs.emailEvents,
    emailRsvpReminder: prefs.emailRsvpReminder,
    emailMessages: prefs.emailMessages,
    pushEnabled: prefs.pushEnabled,
    updatedAt: prefs.updatedAt,
  });
});

// ---------------------------------------------------------------------------
// PATCH /v1/notification-preferences
// Partial update — only provided fields are changed.
// ---------------------------------------------------------------------------
notificationPrefs.patch('/', async (c) => {
  const user = c.get('user');
  const member = c.get('member');

  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if (!member) return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);

  const body = await c.req.json();
  const data = UpdatePrefsInput.parse(body);

  // Filter out undefined values so we only update provided fields
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  ) as Record<string, boolean>;

  const prefs = await prisma.withClub(member.clubId, (tx) =>
    tx.notificationPreference.upsert({
      where: { userId_clubId: { userId: user.id, clubId: member.clubId } },
      create: { userId: user.id, clubId: member.clubId, ...updateData },
      update: updateData,
    }),
  );

  return c.json({
    id: prefs.id,
    emailEvents: prefs.emailEvents,
    emailRsvpReminder: prefs.emailRsvpReminder,
    emailMessages: prefs.emailMessages,
    pushEnabled: prefs.pushEnabled,
    updatedAt: prefs.updatedAt,
  });
});

export { notificationPrefs as notificationPrefsRoutes };
