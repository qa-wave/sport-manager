import { Global, Module } from '@nestjs/common';
import { LimitsService } from './limits.service';

/**
 * Club-wide concerns (limits, tier enforcement). Global so any domain
 * service (members, teams, ...) can inject LimitsService without importing.
 */
@Global()
@Module({
  providers: [LimitsService],
  exports: [LimitsService],
})
export class ClubsModule {}
