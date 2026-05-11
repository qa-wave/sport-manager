'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStoredLocale } from '@/lib/languages';
import cs from './cs.json';

type Translations = Record<string, string>;

// Seed the cache with the default locale — always available, no network needed
const cache = new Map<string, Translations>();
cache.set('cs', cs as Translations);

async function loadTranslations(locale: string): Promise<Translations> {
  if (cache.has(locale)) {
    return cache.get(locale)!;
  }

  try {
    const mod = await import(`./${locale}.json`);
    const translations = mod.default as Translations;
    cache.set(locale, translations);
    return translations;
  } catch {
    // Unsupported locale — fall back to Czech silently
    return cs as Translations;
  }
}

/**
 * Hook for UI translations.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   t('common.save')                    → "Uložit"
 *   t('dashboard.membersCount', { count: 5 }) → "5 členů"
 */
export function useTranslation() {
  const [locale, setLocale] = useState<string>('cs');
  const [translations, setTranslations] = useState<Translations>(cs as Translations);

  // Load stored locale on mount
  useEffect(() => {
    const stored = getStoredLocale();
    if (stored === 'cs') return; // Already loaded
    setLocale(stored);
    loadTranslations(stored).then(setTranslations);
  }, []);

  // React to language switcher events from other components
  useEffect(() => {
    function handleLocaleChange(e: CustomEvent<string>) {
      const code = e.detail;
      setLocale(code);
      loadTranslations(code).then(setTranslations);
    }

    window.addEventListener('locale-change', handleLocaleChange as EventListener);
    return () => window.removeEventListener('locale-change', handleLocaleChange as EventListener);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = translations[key] ?? (cs as Translations)[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [translations],
  );

  return { t, locale };
}
