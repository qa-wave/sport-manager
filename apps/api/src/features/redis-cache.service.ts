import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Thin Redis wrapper with an in-memory fallback.
 *
 * We want the API to boot and run tests WITHOUT a local Redis. If REDIS_URL
 * is missing or the connection errors, we transparently fall through to a
 * Map-based cache with the same `get` / `set` / `del` semantics.
 *
 * Callers should never deal with connection state — they just `get/set/del`.
 * TTL is seconds (matches Redis convention).
 */
type Entry = { value: string; expiresAt: number };

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis | null;
  /** Used when Redis is unavailable; NOT shared across processes. */
  private readonly memory = new Map<string, Entry>();
  private usingFallback = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — using in-memory fallback cache');
      this.client = null;
      this.usingFallback = true;
      return;
    }

    try {
      // `lazyConnect` lets us catch connection failures early without throwing
      // at module-init time if Redis is temporarily down in dev.
      this.client = new Redis(url, {
        maxRetriesPerRequest: 2,
        lazyConnect: false,
        enableOfflineQueue: true,
      });

      this.client.on('error', (err) => {
        // Don't spam the console — one warning then silence.
        if (!this.usingFallback) {
          this.logger.warn(
            `Redis error (falling back to memory cache): ${err.message}`,
          );
          this.usingFallback = true;
        }
      });
    } catch (err) {
      this.logger.warn(
        `Redis connection setup failed (${(err as Error).message}) — using memory`,
      );
      this.client = null;
      this.usingFallback = true;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // socket already closed — fine
      }
    }
  }

  /** Returns the cached string, or null if missing/expired. */
  async get(key: string): Promise<string | null> {
    if (this.shouldUseMemory()) return this.getFromMemory(key);

    try {
      return await this.client!.get(key);
    } catch (err) {
      this.logger.warn(`Redis GET failed (${(err as Error).message}) — falling back`);
      this.usingFallback = true;
      return this.getFromMemory(key);
    }
  }

  /** Sets a key with TTL in seconds. */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.shouldUseMemory()) {
      this.memory.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return;
    }

    try {
      await this.client!.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      this.logger.warn(`Redis SET failed (${(err as Error).message}) — falling back`);
      this.usingFallback = true;
      this.memory.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  /** Delete a key (used for invalidation after mutations). */
  async del(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.client && !this.usingFallback) {
      try {
        await this.client.del(key);
      } catch (err) {
        this.logger.warn(`Redis DEL failed (${(err as Error).message})`);
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
