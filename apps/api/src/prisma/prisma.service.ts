import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@branik/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Run `fn` inside a transaction scoped to `clubId` for Postgres RLS.
   *
   * Sets `app.club_id` via `set_config(..., is_local=true)` so it's automatically
   * scoped to the current transaction and reset when the transaction ends.
   * RLS policies defined in `packages/db/scripts/enable-rls.sql` check this
   * value via `current_setting('app.club_id', true)`.
   *
   * Usage in a service:
   *
   *   return this.prisma.withClub(me.clubId, (tx) =>
   *     tx.team.findMany(),   // RLS guarantees only this club's teams come back
   *   );
   *
   * Notes:
   *   - Queries outside withClub() see the default (empty) club_id setting,
   *     which matches no rows on RLS-protected tables. This is intentional
   *     fail-safe behavior.
   *   - Background workers that need cross-club access should either connect
   *     as a BYPASSRLS role or call withClub() per club in a loop.
   */
  async withClub<T>(
    clubId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // Parameterized -> safe from injection. `true` = transaction-local.
      await tx.$executeRaw`SELECT set_config('app.club_id', ${clubId}, true)`;
      return fn(tx);
    });
  }
}
