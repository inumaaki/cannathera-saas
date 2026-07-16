import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsGuard, RolesGuard, SessionGuard } from './auth.guard';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, RolesGuard, PermissionsGuard],
  exports: [AuthService, SessionGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
