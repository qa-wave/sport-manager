import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  isToday,
  isSameDay,
  timeAgo,
} from '../lib/date-utils';

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats a valid ISO date string to Czech long date', () => {
    // 2026-05-15 — "15. května 2026"
    const result = formatDate('2026-05-15T10:00:00.000Z');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2026/);
  });

  it('formats a Date object', () => {
    const result = formatDate(new Date('2025-01-01T00:00:00.000Z'));
    expect(result).toMatch(/2025/);
  });

  it('returns "--" for null', () => {
    expect(formatDate(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatDate(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(formatDate('')).toBe('--');
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  it('returns "--" for null', () => {
    expect(formatTime(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatTime(undefined)).toBe('--');
  });

  it('returns a time string in HH:MM format', () => {
    // Use a UTC noon — result depends on local timezone, just check format
    const result = formatTime(new Date('2026-05-15T10:30:00.000Z'));
    expect(result).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('accepts an ISO string', () => {
    const result = formatTime('2026-01-01T08:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('--');
  });
});

// ---------------------------------------------------------------------------
// isToday
// ---------------------------------------------------------------------------
describe('isToday', () => {
  it('returns true for the current date/time', () => {
    const now = new Date();
    expect(isToday(now)).toBe(true);
  });

  it('returns true for a Date object set to today (start of day)', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(isToday(today)).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isToday(tomorrow)).toBe(false);
  });

  it('accepts an ISO string for today', () => {
    const today = new Date();
    const iso = today.toISOString();
    expect(isToday(iso)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isSameDay
// ---------------------------------------------------------------------------
describe('isSameDay', () => {
  it('returns true for two Date objects on the same day', () => {
    const a = new Date('2026-05-15T08:00:00');
    const b = new Date('2026-05-15T23:59:59');
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for dates on different days', () => {
    const a = new Date('2026-05-15T08:00:00');
    const b = new Date('2026-05-16T08:00:00');
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns true when both are ISO strings for the same day', () => {
    expect(isSameDay('2025-12-25T00:00:00', '2025-12-25T23:59:59')).toBe(true);
  });

  it('returns false when years differ', () => {
    expect(isSameDay('2025-01-01', '2026-01-01')).toBe(false);
  });

  it('returns false when months differ', () => {
    expect(isSameDay('2026-01-15', '2026-02-15')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------
describe('timeAgo', () => {
  beforeAll(() => {
    // Pin "now" to a fixed timestamp so relative calculations are stable
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T12:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "právě teď" for a date less than 60 seconds ago', () => {
    const thirtySecondsAgo = new Date('2026-05-12T11:59:40.000Z');
    expect(timeAgo(thirtySecondsAgo)).toBe('právě teď');
  });

  it('returns "před X min" for a date less than 60 minutes ago', () => {
    const fifteenMinutesAgo = new Date('2026-05-12T11:45:00.000Z');
    expect(timeAgo(fifteenMinutesAgo)).toBe('před 15 min');
  });

  it('returns "před X h" for a date earlier today', () => {
    const twoHoursAgo = new Date('2026-05-12T10:00:00.000Z');
    const result = timeAgo(twoHoursAgo);
    expect(result).toBe('před 2 h');
  });

  it('returns "včera" for a date yesterday', () => {
    const yesterday = new Date('2026-05-11T12:00:00.000Z');
    expect(timeAgo(yesterday)).toBe('včera');
  });

  it('returns a formatted date for dates older than 7 days', () => {
    const old = new Date('2026-04-01T12:00:00.000Z');
    const result = timeAgo(old);
    // Should be a localized date string, not a relative phrase
    expect(result).toMatch(/2026/);
    expect(result).not.toMatch(/před/);
  });
});
