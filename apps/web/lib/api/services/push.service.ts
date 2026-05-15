/**
 * Push service — web push notifications via VAPID.
 *
 * sendPushToUser(userId, payload) — fans out to all browser subscriptions of a user.
 * sendPushToClub(clubId, payload) — fans out to all active members in a club.
 *
 * Uses `web-push` package. Falls back to console.log when VAPID keys are missing (dev).
 * On HTTP 410 Gone the subscription is automatically removed from DB.
 */
import webpush from 'web-push';
import { prisma } from '../prisma';

// ---------------------------------------------------------------------------
// Setup — configure VAPID credentials once at module load
// ---------------------------------------------------------------------------
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ?? 'mailto:admin@sport-manager.qawave.ai';

const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (vapidConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

// ---------------------------------------------------------------------------
// Internal: send to a single subscription endpoint
// ---------------------------------------------------------------------------
async function sendToEndpoint(
  subscriptionId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
): Promise<void> {
  if (!vapidConfigured) {
    console.log('[push] VAPID not configured. Would send:', payload);
    return;
  }

  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '/admin',
        icon: payload.icon ?? '/icon.svg',
        badge: payload.icon ?? '/icon.svg',
        tag: payload.tag ?? 'sport-manager',
      }),
    );
  } catch (err: unknown) {
    const error = err as { statusCode?: number; status?: number };
    const status = error.statusCode ?? error.status ?? 0;

    if (status === 410 || status === 404) {
      // Subscription expired / unregistered — clean up
      try {
        await prisma.pushSubscription.delete({ where: { id: subscriptionId } });
        console.log(`[push] Removed stale subscription ${subscriptionId}`);
      } catch {
        // Already deleted — ignore
      }
    } else {
      console.error(`[push] Failed to send to ${subscriptionId}:`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// sendPushToUser — push to all browser subscriptions of a single user
// ---------------------------------------------------------------------------
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  await Promise.all(
    subscriptions.map((s) =>
      sendToEndpoint(s.id, s.endpoint, s.p256dh, s.auth, payload),
    ),
  );
}

// ---------------------------------------------------------------------------
// sendPushToClub — push to all active members in a club
// ---------------------------------------------------------------------------
export async function sendPushToClub(
  clubId: string,
  payload: PushPayload,
): Promise<void> {
  // Get all active members in the club
  const members = await prisma.member.findMany({
    where: { clubId, status: 'ACTIVE' },
    select: { userId: true },
  });

  const userIds = [...new Set(members.map((m) => m.userId))];

  await Promise.all(userIds.map((userId) => sendPushToUser(userId, payload)));
}
