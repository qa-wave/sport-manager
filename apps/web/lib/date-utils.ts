/**
 * Shared date utility functions.
 *
 * All locale-aware functions default to Czech ('cs-CZ').
 * Functions accept both string ISO dates and Date objects.
 */

/** Format: "15. května 2026" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format: "15:30" */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '--';
  return new Date(date).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format: "15.5.2026 15:30" */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '--';
  const d = new Date(date);
  const datePart = d.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} ${timePart}`;
}

/** Returns true if the given date falls on today. */
export function isToday(date: string | Date): boolean {
  const now = new Date();
  const d = new Date(date);
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/** Returns true if two dates fall on the same calendar day. */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getDate() === db.getDate() &&
    da.getMonth() === db.getMonth() &&
    da.getFullYear() === db.getFullYear()
  );
}

/**
 * Human-readable relative time in Czech.
 * Examples: "právě teď", "před 5 min", "včera", "15. 5. 2026"
 */
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'právě teď';
  if (diffMin < 60) return `před ${diffMin} min`;
  if (diffHours < 24 && isToday(date)) return `před ${diffHours} h`;

  const yesterday = new Date(now - 86400000);
  if (isSameDay(date, yesterday)) return 'včera';

  if (diffDays < 7) return `před ${diffDays} dny`;

  return new Date(date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
