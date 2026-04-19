import { join } from 'node:path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { TeamsModule } from './teams/teams.module';
import { MembersModule } from './members/members.module';
import { EventsModule } from './events/events.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConversationsModule } from './conversations/conversations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TrainingTemplatesModule } from './training-templates/training-templates.module';
import { FeaturesModule } from './features/features.module';
import { ClubsModule } from './clubs/clubs.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { TenantMiddleware } from './tenant/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load the monorepo root `.env` so DATABASE_URL / JWT secrets are
      // shared across api / workers / scripts.
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '../../.env'),
      ],
    }),
    PrismaModule,
    AuthModule,
    // FeaturesModule must register its APP_GUARD before the domain modules
    // load so the per-route @RequireFeature() metadata is enforced.
    FeaturesModule,
    ClubsModule,
    HealthModule,
    MeModule,
    TeamsModule,
    MembersModule,
    EventsModule,
    DashboardModule,
    ConversationsModule,
    NotificationsModule,
    TrainingTemplatesModule,
    PlatformAdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
