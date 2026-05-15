'use client';

/**
 * usePushNotifications — React hook for web push subscription management.
 *
 * Returns:
 *   isSupported   — true if the browser supports push notifications
 *   isSubscribed  — true if the current browser is currently subscribed
 *   isLoading     — pending async operation
 *   subscribe()   — request permission + subscribe + register with API
 *   unsubscribe() — unsubscribe + remove from API
 *
 * Usage:
 *   const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 */

import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const SW_PATH = '/sw.js';

// Convert base64url VAPID public key to Uint8Array for PushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

async function fetchVapidKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/push/vapid-key`);
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey: string };
    return data.publicKey;
  } catch {
    return null;
  }
}

async function getActiveSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export function usePushNotifications() {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check current subscription state on mount
  useEffect(() => {
    if (!isSupported) return;

    getActiveSubscription().then((sub) => {
      setIsSubscribed(sub !== null);
    });
  }, [isSupported]);

  // Register service worker and subscribe
  const subscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupported) {
      return { ok: false, error: 'Push notifications not supported in this browser' };
    }

    setIsLoading(true);

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { ok: false, error: 'Permission denied' };
      }

      // 2. Register (or get existing) service worker
      const registration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
      await navigator.serviceWorker.ready;

      // 3. Get VAPID public key
      const vapidPublicKey = await fetchVapidKey();
      if (!vapidPublicKey) {
        return { ok: false, error: 'VAPID not configured on server' };
      }

      // 4. Subscribe with PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 5. Send subscription to our API
      const subJson = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const res = await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!res.ok) {
        return { ok: false, error: 'Failed to register subscription with server' };
      }

      setIsSubscribed(true);
      return { ok: true };
    } catch (err) {
      console.error('[push] subscribe error:', err);
      return { ok: false, error: 'Unexpected error during subscription' };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from push
  const unsubscribe = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupported) return { ok: false, error: 'Not supported' };

    setIsLoading(true);

    try {
      const subscription = await getActiveSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return { ok: true };
      }

      const endpoint = subscription.endpoint;

      // Unsubscribe in browser
      await subscription.unsubscribe();

      // Remove from server
      await fetch(`${API_BASE}/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ endpoint }),
      });

      setIsSubscribed(false);
      return { ok: true };
    } catch (err) {
      console.error('[push] unsubscribe error:', err);
      return { ok: false, error: 'Unexpected error during unsubscription' };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
