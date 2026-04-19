/**
 * Tiny auth store.
 *
 * The access token lives in sessionStorage (not localStorage — we want it
 * wiped when the tab closes) with an in-memory cache. The refresh token is
 * in an httpOnly cookie set by the API, which we can't touch from JS.
 *
 * The active clubId is stored alongside the token because every scoped
 * request sends it as `x-club-id`. On login we auto-pick the user's first
 * Member row's clubId; a real app would show a picker for multi-club users.
 *
 * `useSyncExternalStore` re-renders subscribed components whenever the
 * token or clubId changes — no Context provider needed.
 */
import { useSyncExternalStore } from 'react';

const ACCESS_KEY = 'club.access';
const CLUB_KEY = 'club.clubId';

type Listener = () => void;
const listeners = new Set<Listener>();

let accessMemo: string | null = null;
let clubMemo: string | null = null;
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  accessMemo = window.sessionStorage.getItem(ACCESS_KEY);
  clubMemo = window.sessionStorage.getItem(CLUB_KEY);
  hydrated = true;
}

function emit() {
  for (const fn of listeners) fn();
}

export const authStore = {
  getAccessToken(): string | null {
    hydrate();
    return accessMemo;
  },
  getClubId(): string | null {
    hydrate();
    return clubMemo;
  },
  setSession(accessToken: string, clubId: string | null) {
    accessMemo = accessToken;
    clubMemo = clubId;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ACCESS_KEY, accessToken);
      if (clubId) window.sessionStorage.setItem(CLUB_KEY, clubId);
      else window.sessionStorage.removeItem(CLUB_KEY);
    }
    emit();
  },
  clear() {
    accessMemo = null;
    clubMemo = null;
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ACCESS_KEY);
      window.sessionStorage.removeItem(CLUB_KEY);
    }
    emit();
  },
};

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  hydrate();
  return `${accessMemo ?? ''}|${clubMemo ?? ''}`;
}

function getServerSnapshot() {
  return '|';
}

export function useAuth() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    accessToken: authStore.getAccessToken(),
    clubId: authStore.getClubId(),
    isAuthenticated: authStore.getAccessToken() !== null,
    signIn: authStore.setSession,
    signOut: authStore.clear,
  };
}
