import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RbacService } from './rbac.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // secrets passed per-call
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RbacService,
    // Apply JwtAuthGuard globally. @Public() opts out per-route.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RolesGuard runs after JwtAuthGuard. @Roles() drives it.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService, RbacService],
})
export class AuthModule {}
