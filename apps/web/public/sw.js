/**
 * Sport Manager — Service Worker
 *
 * Handles:
 *   1. Web push notifications via VAPID
 *   2. Offline caching (app shell + API + images + background sync)
 *
 * Cache strategies:
 *   - App shell (HTML, JS, CSS): Cache First — precached on install
 *   - API GET responses:         Network First with cache fallback
 *   - Images:                    Cache First with 7-day TTL
 *   - POST/PUT/DELETE:           Queued when offline, replayed on reconnect
 */

'use strict';

const APP_NAME = 'Sport Manager';
const DEFAULT_ICON = '/icon.svg';
const DEFAULT_BADGE = '/icon.svg';

const CACHE_VERSION = 'v1';
const CACHE_SHELL = `shell-${CACHE_VERSION}`;
const CACHE_API = `api-${CACHE_VERSION}`;
const CACHE_IMAGES = `images-${CACHE_VERSION}`;
const CACHE_ALL = [CACHE_SHELL, CACHE_API, CACHE_IMAGES];

// App shell URLs to precache on install
const APP_SHELL_URLS = [
  '/',
  '/admin',
  '/login',
  '/offline.html',
];

// Image TTL: 7 days in seconds
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// install — precache app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      // Use individual requests so one failure doesn't abort entire precache
      return Promise.allSettled(
        APP_SHELL_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[sw] Precache failed for ${url}:`, err);
          }),
        ),
      );
    }),
  );
});

// ---------------------------------------------------------------------------
// activate — claim clients and remove old cache versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CACHE_ALL.includes(key))
            .map((key) => {
              console.log(`[sw] Deleting old cache: ${key}`);
              return caches.delete(key);
            }),
        ),
      ),
    ]),
  );
});

// ---------------------------------------------------------------------------
// fetch — routing logic
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin or relative requests
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api/')) {
    // For cross-origin image requests — use cache-first
    if (request.destination === 'image') {
      event.respondWith(cacheFirstWithTTL(request, CACHE_IMAGES));
      return;
    }
    return; // Let browser handle other cross-origin
  }

  // Non-GET mutations — queue offline, replay online
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleMutation(request));
    }
    return;
  }

  // API GET — Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, CACHE_API));
    return;
  }

  // Images — Cache First with TTL
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithTTL(request, CACHE_IMAGES));
    return;
  }

  // App shell / navigation — Cache First
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(cacheFirstAppShell(request));
    return;
  }

  // JS / CSS / fonts — Cache First
  if (['script', 'style', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirstStatic(request, CACHE_SHELL));
    return;
  }

  // Everything else — network with cache fallback
  event.respondWith(networkFirstWithCache(request, CACHE_SHELL));
});

// ---------------------------------------------------------------------------
// Strategy: Network First with cache write-through
// ---------------------------------------------------------------------------
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // For API requests return a structured offline response
    if (new URL(request.url).pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Offline', message: 'Jste offline. Data jsou nedostupna.' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'X-SW-Cache': 'offline' },
        },
      );
    }
    return offlineFallback();
  }
}

// ---------------------------------------------------------------------------
// Strategy: Cache First (app shell / navigation)
// ---------------------------------------------------------------------------
async function cacheFirstAppShell(request) {
  const cache = await caches.open(CACHE_SHELL);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Try to serve /admin or / from cache, then offline fallback
    const fallbackCached = await cache.match('/admin') ?? await cache.match('/');
    return fallbackCached ?? offlineFallback();
  }
}

// ---------------------------------------------------------------------------
// Strategy: Cache First for static assets (JS/CSS)
// ---------------------------------------------------------------------------
async function cacheFirstStatic(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Strategy: Cache First with TTL for images
// ---------------------------------------------------------------------------
async function cacheFirstWithTTL(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedDate = cached.headers.get('X-SW-Cached-At');
    if (cachedDate) {
      const age = Date.now() - new Date(cachedDate).getTime();
      if (age < IMAGE_TTL_MS) return cached;
      // Expired — delete and re-fetch
      cache.delete(request);
    } else {
      return cached;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone response and inject cache timestamp header
      const headers = new Headers(networkResponse.headers);
      headers.set('X-SW-Cached-At', new Date().toISOString());
      const cachedResponse = new Response(await networkResponse.blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
      cache.put(request, cachedResponse.clone());
      return cachedResponse;
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ---------------------------------------------------------------------------
// Strategy: Mutation handler — queue when offline
// ---------------------------------------------------------------------------
const MUTATION_QUEUE_KEY = 'mutation-queue';

async function handleMutation(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch {
    // Offline — queue the request for later replay
    const body = await request.text().catch(() => '');
    const queuedRequest = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      queuedAt: new Date().toISOString(),
    };

    // Store in cache as simple JSON queue
    const cache = await caches.open('mutation-queue-v1');
    const existing = await cache.match(MUTATION_QUEUE_KEY);
    const queue = existing ? await existing.json() : [];
    queue.push(queuedRequest);
    await cache.put(
      MUTATION_QUEUE_KEY,
      new Response(JSON.stringify(queue), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    console.log('[sw] Queued offline mutation:', request.method, request.url);

    return new Response(
      JSON.stringify({
        queued: true,
        message: 'Jste offline. Akce bude provedena po obnovení připojení.',
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json', 'X-SW-Queued': 'true' },
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Replay queued mutations when back online
// ---------------------------------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'replay-mutations') {
    event.waitUntil(replayMutationQueue());
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'REPLAY_MUTATIONS') {
    event.waitUntil(replayMutationQueue());
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function replayMutationQueue() {
  const cache = await caches.open('mutation-queue-v1');
  const existing = await cache.match(MUTATION_QUEUE_KEY);
  if (!existing) return;

  let queue;
  try {
    queue = await existing.json();
  } catch {
    return;
  }

  if (!queue || queue.length === 0) return;

  const remaining = [];
  for (const req of queue) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body || undefined,
      });
      if (res.ok || res.status < 500) {
        console.log('[sw] Replayed mutation:', req.method, req.url);
      } else {
        remaining.push(req);
      }
    } catch {
      remaining.push(req);
    }
  }

  await cache.put(
    MUTATION_QUEUE_KEY,
    new Response(JSON.stringify(remaining), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ---------------------------------------------------------------------------
// Offline fallback HTML page
// ---------------------------------------------------------------------------
async function offlineFallback() {
  const cache = await caches.open(CACHE_SHELL);
  const cached = await cache.match('/offline.html');
  if (cached) return cached;
  return new Response(
    `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><title>Offline — Sport Manager</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0b0f;color:#e5e7eb;}
    .box{text-align:center;padding:2rem;} h1{font-size:1.5rem;margin-bottom:.5rem;} p{color:#9ca3af;}</style>
    </head><body><div class="box"><h1>Jste offline</h1><p>Data se synchronizují po obnovení připojení.</p></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

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
