/**
 * Shared label constants for event types, RSVP statuses, and day names.
 * Import from here instead of defining inline in each page/component.
 */

export const EVENT_TYPES = ['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL'] as const;
export type EventTypeValue = (typeof EVENT_TYPES)[number];

/** Czech labels for event types. */
export const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Společenská akce',
};

/** Czech labels for RSVP statuses. */
export const RSVP_STATUS_LABEL: Record<string, string> = {
  YES: 'Ano',
  NO: 'Ne',
  MAYBE: 'Možná',
  PENDING: 'Čeká',
};

/** Czech weekday names (Monday-first, index 0 = Monday). */
export const DAYS_CS = [
  'Pondělí',
  'Úterý',
  'Středa',
  'Čtvrtek',
  'Pátek',
  'Sobota',
  'Neděle',
] as const;
