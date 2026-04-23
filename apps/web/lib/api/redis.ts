import Redis from 'ioredis';

/**
 * Thin Redis wrapper with in-memory fallback.
 *
 * The API can boot and operate WITHOUT a local Redis. If REDIS_URL is missing
 * or the connection errors, we transparently fall through to a Map-based cache
 * with the same get/set/del semantics. TTL is in seconds (Redis convention).
 */

type Entry = { value: string; expiresAt: number };

class CacheService {
  private readonly client: Redis | null;
  private readonly memory = new Map<string, Entry>();
  private usingFallback = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.warn('[cache] REDIS_URL not set — using in-memory fallback cache');
      this.client = null;
      this.usingFallback = true;
      return;
    }

    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 2,
        lazyConnect: false,
        enableOfflineQueue: true,
      });

      this.client.on('error', (err: Error) => {
        if (!this.usingFallback) {
          console.warn(
            `[cache] Redis error (falling back to memory): ${err.message}`,
          );
          this.usingFallback = true;
        }
      });
    } catch (err) {
      console.warn(
        `[cache] Redis setup failed (${(err as Error).message}) — using memory`,
      );
      this.client = null;
      this.usingFallback = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.shouldUseMemory()) return this.getFromMemory(key);
    try {
      return await this.client!.get(key);
    } catch (err) {
      console.warn(`[cache] Redis GET failed (${(err as Error).message}) — falling back`);
      this.usingFallback = true;
      return this.getFromMemory(key);
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.shouldUseMemory()) {
      this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return;
    }
    try {
      await this.client!.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`[cache] Redis SET failed (${(err as Error).message}) — falling back`);
      this.usingFallback = true;
      this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
  }

  async del(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.client && !this.usingFallback) {
      try {
        await this.client.del(key);
      } catch (err) {
        console.warn(`[cache] Redis DEL failed (${(err as Error).message})`);
      }
    }
  }

  private shouldUseMemory(): boolean {
    return this.usingFallback || !this.client;
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

/**
 * globalThis singleton so the cache survives hot reloads.
 */
const globalForCache = globalThis as unknown as {
  cacheService: CacheService | undefined;
};

export const cache =
  globalForCache.cacheService ?? new CacheService();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cacheService = cache;
}
