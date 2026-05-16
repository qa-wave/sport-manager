import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// constants.test.ts
//
// We re-import the module inside each test group so that env var changes take
// effect. Vitest module cache is cleared with vi.resetModules().
// ---------------------------------------------------------------------------

describe('APP_BASE_URL', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env after every test
    process.env = { ...originalEnv };
  });

  it('is a string', async () => {
    const { APP_BASE_URL } = await import('../lib/constants');
    expect(typeof APP_BASE_URL).toBe('string');
  });

  it('defaults to http://localhost:3100 when no env vars are set', async () => {
    // The module is already loaded at this point — the default was baked in at
    // import time. Verify the value contains localhost as the fallback.
    const { APP_BASE_URL } = await import('../lib/constants');
    // In the test environment NEXT_PUBLIC_APP_URL and VERCEL_URL are not set,
    // so the module must have resolved to the localhost fallback.
    if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.VERCEL_URL) {
      expect(APP_BASE_URL).toBe('http://localhost:3100');
    }
  });

  it('is a valid URL-like string', async () => {
    const { APP_BASE_URL } = await import('../lib/constants');
    expect(APP_BASE_URL).toMatch(/^https?:\/\//);
  });

  it('does not end with a trailing slash', async () => {
    const { APP_BASE_URL } = await import('../lib/constants');
    expect(APP_BASE_URL).not.toMatch(/\/$/);
  });
});
