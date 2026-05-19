/**
 * Supported languages with flag emojis and native names.
 * Ordered by global reach / priority.
 */

export type Language = {
  code: string;
  flag: string;
  name: string;
  /** English name for search */
  nameEn: string;
};

export const LANGUAGES: Language[] = [
  // Stejné lokalizace jako projekt qawave (next-intl locales: en, cs).
  { code: 'cs', flag: '🇨🇿', name: 'Čeština', nameEn: 'Czech' },
  { code: 'en', flag: '🇬🇧', name: 'English', nameEn: 'English' },
];

/** Currently active locale code — stored in localStorage */
const STORAGE_KEY = 'sport-manager-locale';

export function getStoredLocale(): string {
  if (typeof window === 'undefined') return 'cs';
  return localStorage.getItem(STORAGE_KEY) ?? 'cs';
}

export function setStoredLocale(code: string): void {
  localStorage.setItem(STORAGE_KEY, code);
}

export function findLanguage(code: string): Language | undefined {
  return LANGUAGES.find(l => l.code === code);
}
