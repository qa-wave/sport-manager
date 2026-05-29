import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Extended PrismaClient with withClub() RLS helper.
 *
 * Import from @prisma/client directly (not @sport-manager/db which exports a
 * pre-instantiated singleton without the withClub method).
 */
class ExtendedPrismaClient extends PrismaClient {
  /**
   * Run `fn` inside a transaction scoped to `clubId` for Postgres RLS.
   *
   * Sets `app.club_id` via `set_config(..., is_local=true)` so it's
   * automatically scoped to the current transaction and reset when it ends.
   * RLS policies check this via `current_setting('app.club_id', true)`.
   */
  async withClub<T>(
    clubId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.club_id', ${clubId}, true)`;
      return fn(tx);
    });
  }

  /**
   * Run `fn` with platform-admin scope — RLS policies treat the sentinel
   * `app.club_id = '__platform__'` as "see all clubs". MUST only be called
   * from routes already gated by requirePlatformAdmin(). A real clubId is a
   * cuid and can never collide with the sentinel.
   */
  async withPlatformAdmin<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.club_id', '__platform__', true)`;
      return fn(tx);
    });
  }
}

/** Sentinel club id that RLS policies recognise as platform-admin bypass. */
export const PLATFORM_ADMIN_SENTINEL = '__platform__';

/**
 * globalThis pattern ensures a single PrismaClient instance survives
 * Next.js hot reloads in development. Without this, each module reload
 * would create a new connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new ExtendedPrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
