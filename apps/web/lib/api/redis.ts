import { getCache } from '@vercel/functions';

/**
 * Cache layer — Vercel Runtime Cache in production, in-memory fallback locally.
 *
 * Runtime Cache:
 *  - Per-region key-value store shared across function instances
 *  - Survives cold starts within the region
 *  - 2 MB per item, LRU eviction when full
 *  - Tag-based invalidation
 *
 * Locally (no Vercel runtime), falls back to a Map so dev keeps working.
 */

type Entry = { value: string; expiresAt: number };

class CacheService {
  private readonly memory = new Map<string, Entry>();
  private runtimeCache: ReturnType<typeof getCache> | null = null;
  private usingFallback = false;

  constructor() {
    try {
      this.runtimeCache = getCache();
    } catch (err) {
      console.warn(
        `[cache] Vercel Runtime Cache unavailable (${(err as Error).message}) — using in-memory fallback`,
      );
      this.usingFallback = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.shouldUseMemory()) return this.getFromMemory(key);
    try {
      const value = await this.runtimeCache!.get(key);
      return typeof value === 'string' ? value : value == null ? null : JSON.stringify(value);
    } catch (err) {
      console.warn(`[cache] Runtime Cache GET failed (${(err as Error).message}) — falling back`);
      this.usingFallback = true;
      return this.getFromMemory(key);
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    // Always write to memory as a hot-path mirror (cheap)
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });

    if (this.shouldUseMemory()) return;
    try {
      await this.runtimeCache!.set(key, value, { ttl: ttlSeconds });
    } catch (err) {
      console.warn(`[cache] Runtime Cache SET failed (${(err as Error).message}) — using memory only`);
      this.usingFallback = true;
    }
  }

  async del(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.runtimeCache && !this.usingFallback) {
      try {
        await this.runtimeCache.delete(key);
      } catch (err) {
        console.warn(`[cache] Runtime Cache DEL failed (${(err as Error).message})`);
      }
    }
  }

  private shouldUseMemory(): boolean {
    return this.usingFallback || !this.runtimeCache;
  }

  private getFromMemory(key: string): string | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }
}

const globalForCache = globalThis as unknown as {
  cacheService: CacheService | undefined;
};

export const cache = globalForCache.cacheService ?? new CacheService();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cacheService = cache;
}
