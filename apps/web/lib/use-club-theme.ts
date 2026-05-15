'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-store';
import { generateThemeVars, generateDarkThemeVars } from './club-theme';
import type { MeResponse } from './api';

/**
 * Reads the active club's theme from the cached /me query and injects
 * CSS custom properties onto <html>. Reacts to light/dark mode changes.
 *
 * Call once inside the admin layout (inside QueryProvider).
 */
export function useClubThemeInjection() {
  const auth = useAuth();
  const { resolvedTheme } = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    const me = queryClient.getQueryData<MeResponse>(['me', auth.accessToken]);
    const club = me?.members.find(m => m.clubId === (auth.clubId ?? null));
    const theme = club?.club.config.theme;
    if (!theme) return;

    const vars =
      resolvedTheme === 'dark'
        ? generateDarkThemeVars(theme)
        : generateThemeVars(theme);

    const el = document.documentElement;
    const keys = Object.keys(vars);
    keys.forEach(k => el.style.setProperty(k, vars[k] ?? ''));

    return () => {
      keys.forEach(k => el.style.removeProperty(k));
    };
  }, [auth.accessToken, auth.clubId, resolvedTheme, queryClient]);
}
