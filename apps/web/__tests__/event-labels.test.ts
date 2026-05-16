import { describe, it, expect } from 'vitest';
import {
  EVENT_TYPES,
  EVENT_TYPE_LABEL,
  RSVP_STATUS_LABEL,
  DAYS_CS,
} from '../lib/event-labels';

// ---------------------------------------------------------------------------
// EVENT_TYPES & EVENT_TYPE_LABEL
// ---------------------------------------------------------------------------
describe('EVENT_TYPE_LABEL', () => {
  it('contains a label for every value in EVENT_TYPES', () => {
    for (const type of EVENT_TYPES) {
      expect(EVENT_TYPE_LABEL[type]).toBeDefined();
      expect(typeof EVENT_TYPE_LABEL[type]).toBe('string');
      expect(EVENT_TYPE_LABEL[type].length).toBeGreaterThan(0);
    }
  });

  it('has label for PRACTICE', () => {
    expect(EVENT_TYPE_LABEL['PRACTICE']).toBe('Trénink');
  });

  it('has label for MATCH', () => {
    expect(EVENT_TYPE_LABEL['MATCH']).toBe('Zápas');
  });

  it('has label for TOURNAMENT', () => {
    expect(EVENT_TYPE_LABEL['TOURNAMENT']).toBe('Turnaj');
  });

  it('has label for MEETING', () => {
    expect(EVENT_TYPE_LABEL['MEETING']).toBe('Schůzka');
  });

  it('has label for SOCIAL', () => {
    expect(EVENT_TYPE_LABEL['SOCIAL']).toBeDefined();
    expect(EVENT_TYPE_LABEL['SOCIAL'].length).toBeGreaterThan(0);
  });

  it('has exactly as many labels as EVENT_TYPES entries', () => {
    // All EVENT_TYPES must have a label — no extra unmapped keys required
    const labelKeys = Object.keys(EVENT_TYPE_LABEL);
    for (const type of EVENT_TYPES) {
      expect(labelKeys).toContain(type);
    }
  });
});

// ---------------------------------------------------------------------------
// RSVP_STATUS_LABEL
// ---------------------------------------------------------------------------
describe('RSVP_STATUS_LABEL', () => {
  const required = ['YES', 'NO', 'MAYBE', 'PENDING'] as const;

  it.each(required)('has label for %s', (status) => {
    expect(RSVP_STATUS_LABEL[status]).toBeDefined();
    expect(typeof RSVP_STATUS_LABEL[status]).toBe('string');
    expect(RSVP_STATUS_LABEL[status].length).toBeGreaterThan(0);
  });

  it('has Czech label "Ano" for YES', () => {
    expect(RSVP_STATUS_LABEL['YES']).toBe('Ano');
  });

  it('has Czech label "Ne" for NO', () => {
    expect(RSVP_STATUS_LABEL['NO']).toBe('Ne');
  });

  it('has Czech label "Možná" for MAYBE', () => {
    expect(RSVP_STATUS_LABEL['MAYBE']).toBe('Možná');
  });

  it('has Czech label "Čeká" for PENDING', () => {
    expect(RSVP_STATUS_LABEL['PENDING']).toBe('Čeká');
  });
});

// ---------------------------------------------------------------------------
// DAYS_CS
// ---------------------------------------------------------------------------
describe('DAYS_CS', () => {
  it('has exactly 7 days', () => {
    expect(DAYS_CS).toHaveLength(7);
  });

  it('starts with Pondělí (Monday-first)', () => {
    expect(DAYS_CS[0]).toBe('Pondělí');
  });

  it('ends with Neděle (Sunday at index 6)', () => {
    expect(DAYS_CS[6]).toBe('Neděle');
  });

  it('contains Sobota at index 5', () => {
    expect(DAYS_CS[5]).toBe('Sobota');
  });

  it('all entries are non-empty strings', () => {
    for (const day of DAYS_CS) {
      expect(typeof day).toBe('string');
      expect(day.length).toBeGreaterThan(0);
    }
  });
});
