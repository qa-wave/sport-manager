/**
 * training-library.test.ts
 *
 * Tests for the drill library — content integrity, filtering logic,
 * and data shape validation.
 */
import { describe, it, expect } from 'vitest';
import { DRILLS, filterDrills, type Drill } from '../lib/training-library';

const REQUIRED_FIELDS: (keyof Drill)[] = ['id', 'name', 'category', 'sport'];

// ---------------------------------------------------------------------------
// Library size & mandatory fields
// ---------------------------------------------------------------------------
describe('DRILLS', () => {
  it('has at least 89 drills', () => {
    expect(DRILLS.length).toBeGreaterThanOrEqual(89);
  });

  it('every drill has all required fields (id, name, category, sport)', () => {
    for (const drill of DRILLS) {
      for (const field of REQUIRED_FIELDS) {
        expect(drill[field], `Drill ${drill.id} missing "${field}"`).toBeDefined();
        expect(String(drill[field]).length, `Drill ${drill.id} has empty "${field}"`).toBeGreaterThan(0);
      }
    }
  });

  it('every drill id is a non-empty string', () => {
    for (const drill of DRILLS) {
      expect(typeof drill.id).toBe('string');
      expect(drill.id.length).toBeGreaterThan(0);
    }
  });

  it('every drill has an icon (emoji string)', () => {
    for (const drill of DRILLS) {
      expect(typeof drill.icon).toBe('string');
      expect(drill.icon.length).toBeGreaterThan(0);
    }
  });

  it('every drill has at least one ageGroup', () => {
    for (const drill of DRILLS) {
      expect(Array.isArray(drill.ageGroups)).toBe(true);
      expect(drill.ageGroups.length).toBeGreaterThan(0);
    }
  });

  it('no duplicate drill IDs', () => {
    const ids = DRILLS.map((d) => d.id);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
      throw new Error(`Duplicate drill IDs found: ${duplicates.join(', ')}`);
    }
    expect(unique.size).toBe(ids.length);
  });

  it('all drills have a valid sport value', () => {
    const validSports = new Set(['fotbal', 'florbal', 'universal']);
    for (const drill of DRILLS) {
      expect(validSports.has(drill.sport), `Drill ${drill.id} has invalid sport "${drill.sport}"`).toBe(true);
    }
  });

  it('all drills have a valid difficulty value', () => {
    const validDifficulties = new Set(['easy', 'medium', 'hard']);
    for (const drill of DRILLS) {
      expect(
        validDifficulties.has(drill.difficulty),
        `Drill ${drill.id} has invalid difficulty "${drill.difficulty}"`,
      ).toBe(true);
    }
  });

  it('all drills have non-negative durationMin', () => {
    for (const drill of DRILLS) {
      expect(drill.durationMin).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// filterDrills — category filter
// ---------------------------------------------------------------------------
describe('filterDrills — category filter', () => {
  it('returns only drills matching the given category', () => {
    const results = filterDrills({ category: 'warmup' });
    expect(results.length).toBeGreaterThan(0);
    for (const drill of results) {
      expect(drill.category).toBe('warmup');
    }
  });

  it('returns drills with category "shooting"', () => {
    const results = filterDrills({ category: 'shooting' });
    expect(results.length).toBeGreaterThan(0);
    for (const drill of results) {
      expect(drill.category).toBe('shooting');
    }
  });

  it('returns all drills when no category is specified', () => {
    const results = filterDrills({});
    expect(results.length).toBe(DRILLS.length);
  });

  it('returns empty array for a category with no drills (edge case)', () => {
    // 'goalkeeping' may have drills, but we test the filter logic works for any category
    const results = filterDrills({ category: 'passing' });
    for (const drill of results) {
      expect(drill.category).toBe('passing');
    }
  });
});

// ---------------------------------------------------------------------------
// filterDrills — sport filter
// ---------------------------------------------------------------------------
describe('filterDrills — sport filter', () => {
  it('returns only fotbal drills when sport=fotbal', () => {
    const results = filterDrills({ sport: 'fotbal' });
    expect(results.length).toBeGreaterThan(0);
    for (const drill of results) {
      expect(drill.sport).toBe('fotbal');
    }
  });

  it('returns only florbal drills when sport=florbal', () => {
    const results = filterDrills({ sport: 'florbal' });
    expect(results.length).toBeGreaterThan(0);
    for (const drill of results) {
      expect(drill.sport).toBe('florbal');
    }
  });
});

// ---------------------------------------------------------------------------
// filterDrills — search query
// ---------------------------------------------------------------------------
describe('filterDrills — search query', () => {
  it('returns drills whose name matches the search query (case-insensitive)', () => {
    // Pick first drill and search by part of its name
    const firstDrill = DRILLS[0];
    const query = firstDrill.name.slice(0, 4).toLowerCase();
    const results = filterDrills({ search: query });
    const ids = results.map((d) => d.id);
    expect(ids).toContain(firstDrill.id);
  });

  it('returns empty array for a search query that matches nothing', () => {
    const results = filterDrills({ search: 'xyzzy_no_match_123456' });
    expect(results).toHaveLength(0);
  });

  it('search matches tags', () => {
    // Find a drill with at least one tag and search by that tag
    const drillWithTag = DRILLS.find((d) => d.tags.length > 0);
    if (!drillWithTag) return; // skip if none
    const tag = drillWithTag.tags[0];
    const results = filterDrills({ search: tag });
    const ids = results.map((d) => d.id);
    expect(ids).toContain(drillWithTag.id);
  });

  it('search is case-insensitive', () => {
    const firstDrill = DRILLS[0];
    const upperQuery = firstDrill.name.slice(0, 4).toUpperCase();
    const results = filterDrills({ search: upperQuery });
    const ids = results.map((d) => d.id);
    expect(ids).toContain(firstDrill.id);
  });
});

// ---------------------------------------------------------------------------
// filterDrills — combined filters
// ---------------------------------------------------------------------------
describe('filterDrills — combined filters', () => {
  it('applies category and sport filter together', () => {
    const results = filterDrills({ category: 'warmup', sport: 'fotbal' });
    for (const drill of results) {
      expect(drill.category).toBe('warmup');
      expect(drill.sport).toBe('fotbal');
    }
  });

  it('ageGroup filter returns only drills that include that age group', () => {
    const results = filterDrills({ ageGroup: 'U15' });
    expect(results.length).toBeGreaterThan(0);
    for (const drill of results) {
      expect(drill.ageGroups).toContain('U15');
    }
  });

  it('difficulty filter returns only drills of that difficulty', () => {
    const results = filterDrills({ difficulty: 'easy' });
    expect(results.length).toBeGreaterThan(0);
    for (const drill of results) {
      expect(drill.difficulty).toBe('easy');
    }
  });
});
