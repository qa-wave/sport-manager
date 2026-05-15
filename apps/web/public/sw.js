/**
 * Sport Manager — Service Worker
 * Handles web push notifications via VAPID.
 *
 * Events handled:
 *   push          — received a push message from server; show notification
 *   notificationclick — user clicked a notification; focus or open the app
 */

'use strict';

const APP_NAME = 'Sport Manager';
const DEFAULT_ICON = '/icon.svg';
const DEFAULT_BADGE = '/icon.svg';

// ---------------------------------------------------------------------------
// push event — parse payload and show notification
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[sw] Push event received with no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: APP_NAME, body: event.data.text(), url: '/admin' };
  }

  const title = payload.title ?? APP_NAME;
  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? DEFAULT_ICON,
    badge: payload.badge ?? DEFAULT_BADGE,
    tag: payload.tag ?? 'sport-manager',
    renotify: true,
    data: {
      url: payload.url ?? '/admin',
    },
    // Actions shown on supported platforms (Android Chrome)
    actions: payload.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ---------------------------------------------------------------------------
// notificationclick event — focus existing tab or open new one
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? '/admin';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already an open window for this origin, focus it and navigate
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const swUrl = new URL(self.location.origin);
          if (clientUrl.origin === swUrl.origin) {
            client.focus();
            return client.navigate(targetUrl);
          }
        }
        // No existing window — open a new one
        return clients.openWindow(targetUrl);
      })
  );
});

// ---------------------------------------------------------------------------
// install / activate — take control immediately (no waiting)
// ---------------------------------------------------------------------------
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
