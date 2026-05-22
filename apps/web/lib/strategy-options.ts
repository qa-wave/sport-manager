/**
 * Sdílené konstanty pro Strategy UI (Library/Strategie).
 */
import type { StrategyCategory } from '@/lib/api';

export const STRATEGY_CATEGORIES: StrategyCategory[] = [
  'OFFENSE',
  'DEFENSE',
  'TRANSITION',
  'SET_PIECE',
  'SPECIAL',
];

export const STRATEGY_CATEGORY_LABELS: Record<StrategyCategory, string> = {
  OFFENSE: 'Útok',
  DEFENSE: 'Obrana',
  TRANSITION: 'Přechod',
  SET_PIECE: 'Standardní situace',
  SPECIAL: 'Speciální (PP/oslabení)',
};

export const STRATEGY_CATEGORY_ICONS: Record<StrategyCategory, string> = {
  OFFENSE: '⚔️',
  DEFENSE: '🛡️',
  TRANSITION: '🔁',
  SET_PIECE: '🎯',
  SPECIAL: '⚡',
};

export const STRATEGY_CATEGORY_COLORS: Record<StrategyCategory, string> = {
  OFFENSE: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  DEFENSE: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  TRANSITION:
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  SET_PIECE:
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  SPECIAL:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export const STRATEGY_SPORTS = [
  { value: 'fotbal', label: 'Fotbal' },
  { value: 'florbal', label: 'Florbal' },
  { value: 'universal', label: 'Univerzální' },
];

export const STRATEGY_DIFFICULTY = [
  { value: 'easy', label: 'Jednoduchá' },
  { value: 'medium', label: 'Střední' },
  { value: 'hard', label: 'Pokročilá' },
];

/**
 * Vrátí YouTube embed URL pokud videoUrl je YouTube odkaz, jinak undefined.
 */
export function getYoutubeEmbed(videoUrl: string | null | undefined): string | undefined {
  if (!videoUrl) return undefined;
  try {
    const u = new URL(videoUrl);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/embed/')) {
      return videoUrl;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
