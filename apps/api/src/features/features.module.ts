import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FeaturesGuard } from './features.guard';
import { FeaturesService } from './features.service';
import { RedisCacheService } from './redis-cache.service';

/**
 * Global features/config module. Registered once in AppModule so any
 * controller can use `@RequireFeature('key')` without importing anything.
 *
 * Exports FeaturesService so services that need tier/limits lookups
 * (limits enforcement, /me context, etc.) can inject it.
 */
@Global()
@Module({
  providers: [
    RedisCacheService,
    FeaturesService,
    { provide: APP_GUARD, useClass: FeaturesGuard },
  ],
  exports: [FeaturesService],
})
export class FeaturesModule {}
