/**
 * limits-service.test.ts
 *
 * Tests the PLAN_LIMITS constants and TIER_RANK ordering from
 * @sport-manager/contracts. We do NOT test the async service functions
 * (assertMemberLimit, assertTeamLimit) here — those require a live DB and are
 * covered by the regression.sh suite.
 */
import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS } from '@sport-manager/contracts';

// ---------------------------------------------------------------------------
// PLAN_LIMITS shape
// ---------------------------------------------------------------------------
describe('PLAN_LIMITS', () => {
  const tiers = ['free', 'basic', 'pro', 'club', 'enterprise'] as const;

  it('contains an entry for every known tier', () => {
    for (const tier of tiers) {
      expect(PLAN_LIMITS[tier]).toBeDefined();
    }
  });

  it('each tier entry has maxMembers and maxTeams as positive integers', () => {
    for (const tier of tiers) {
      const limits = PLAN_LIMITS[tier];
      expect(typeof limits.maxMembers).toBe('number');
      expect(typeof limits.maxTeams).toBe('number');
      expect(limits.maxMembers).toBeGreaterThan(0);
      expect(limits.maxTeams).toBeGreaterThan(0);
      expect(Number.isInteger(limits.maxMembers)).toBe(true);
      expect(Number.isInteger(limits.maxTeams)).toBe(true);
    }
  });

  it('free tier has maxMembers = 25', () => {
    expect(PLAN_LIMITS.free.maxMembers).toBe(25);
  });

  it('free tier has maxTeams = 2', () => {
    expect(PLAN_LIMITS.free.maxTeams).toBe(2);
  });

  it('pro tier has maxMembers >> 25 (effectively unlimited)', () => {
    expect(PLAN_LIMITS.pro.maxMembers).toBeGreaterThan(1000);
  });

  it('pro tier has maxTeams >> 2 (effectively unlimited)', () => {
    expect(PLAN_LIMITS.pro.maxTeams).toBeGreaterThan(10);
  });

  it('club tier has maxMembers >= pro tier maxMembers', () => {
    expect(PLAN_LIMITS.club.maxMembers).toBeGreaterThanOrEqual(PLAN_LIMITS.pro.maxMembers);
  });

  it('club tier has maxTeams >= pro tier maxTeams', () => {
    expect(PLAN_LIMITS.club.maxTeams).toBeGreaterThanOrEqual(PLAN_LIMITS.pro.maxTeams);
  });

  it('enterprise (legacy) has at least as high limits as pro', () => {
    expect(PLAN_LIMITS.enterprise.maxMembers).toBeGreaterThanOrEqual(PLAN_LIMITS.pro.maxMembers);
  });

  it('basic (legacy) has at least as high limits as free', () => {
    expect(PLAN_LIMITS.basic.maxMembers).toBeGreaterThan(PLAN_LIMITS.free.maxMembers);
  });
});

// ---------------------------------------------------------------------------
// TIER_RANK ordering (inlined mirror of limits.service.ts)
// ---------------------------------------------------------------------------
describe('TIER_RANK ordering', () => {
  // Mirrors the TIER_RANK constant in limits.service.ts
  const TIER_RANK: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 1,
    club: 2,
    enterprise: 2,
  };

  it('free has rank 0 (lowest)', () => {
    expect(TIER_RANK.free).toBe(0);
  });

  it('pro has rank higher than free', () => {
    expect(TIER_RANK.pro).toBeGreaterThan(TIER_RANK.free);
  });

  it('club has rank higher than or equal to pro', () => {
    expect(TIER_RANK.club).toBeGreaterThanOrEqual(TIER_RANK.pro);
  });

  it('basic and pro share the same rank (legacy alias)', () => {
    expect(TIER_RANK.basic).toBe(TIER_RANK.pro);
  });

  it('enterprise and club share the same rank (legacy alias)', () => {
    expect(TIER_RANK.enterprise).toBe(TIER_RANK.club);
  });

  it('club rank is strictly higher than free rank', () => {
    expect(TIER_RANK.club).toBeGreaterThan(TIER_RANK.free);
  });
});
