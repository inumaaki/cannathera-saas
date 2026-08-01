import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  PRE_AUTH_COOKIE,
  SESSION_COOKIE,
  SessionGuard,
} from './auth.guard';
import type { SessionPayload } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  VerifyDto,
} from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Role → dashboard landing route (mirrored in packages/shared ROLE_HOME).
const ROLE_HOME: Record<string, string> = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  PHARMACY: '/pharmacy',
  ENTERPRISE: '/enterprise',
  ADMIN: '/admin',
};

const isProd = process.env.NODE_ENV === 'production';

// Cross-origin deployments (Vercel → Railway) require sameSite:'none' + secure.
// In local dev keep 'lax' so plain http://localhost works.
const cookieSameSite = isProd ? ('none' as const) : ('lax' as const);

const preAuthCookieOpts = {
  httpOnly: true,
  sameSite: cookieSameSite,
  secure: isProd,
  maxAge: 10 * 60 * 1000,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const result = await this.auth.register(dto, ip);

    if ('session' in result) {
      this.setSessionCookie(res, result.session as string, 12 * 60);
      return {
        requires2fa: false,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          locale: result.user.locale,
        },
        home: ROLE_HOME[result.user.role] ?? '/',
      };
    }

    res.cookie(PRE_AUTH_COOKIE, result.preAuthToken, preAuthCookieOpts);
    return { requires2fa: true, ...(result.devCode ? { devCode: result.devCode } : {}) };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const result = await this.auth.login(dto, ip);

    // The org may have switched the 2FA requirement off — then the password
    // alone completes the login and we hand out the session straight away.
    if ('session' in result) {
      this.setSessionCookie(res, result.session, result.ttlMin);
      return {
        requires2fa: false,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          locale: result.user.locale,
        },
        home: result.user.mustChangePassword
          ? '/set-password'
          : (ROLE_HOME[result.user.role] ?? '/'),
      };
    }

    res.cookie(PRE_AUTH_COOKIE, result.preAuthToken, preAuthCookieOpts);
    return {
      requires2fa: true,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    };
  }

  @Post('verify')
  @HttpCode(200)
  async verify(
    @Body() dto: VerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const preAuth = (req.cookies as Record<string, string>)[PRE_AUTH_COOKIE];
    const result = await this.auth.verify(preAuth, dto.code, ip);

    res.clearCookie(PRE_AUTH_COOKIE, { path: '/' });
    if (result.pendingActivation) {
      return {
        pendingActivation: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          locale: result.user.locale,
        },
      };
    }

    this.setSessionCookie(res, result.session, result.ttlMin);

    return {
      pendingActivation: false,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        locale: result.user.locale,
      },
      // Temp-password accounts must set their own password first.
      home: result.user.mustChangePassword
        ? '/set-password'
        : (ROLE_HOME[result.user.role] ?? '/'),
    };
  }

  /** Cookie lifetime tracks the org's session policy, not a hard-coded 30 days. */
  private setSessionCookie(res: Response, session: string, ttlMin: number) {
    res.cookie(SESSION_COOKIE, session, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: isProd,
      maxAge: ttlMin * 60 * 1000,
      path: '/',
    });
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  changePassword(
    @CurrentUser() user: SessionPayload,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string,
  ) {
    return this.auth.changePassword(user.sub, dto.password, ip);
  }

  @Post('resend')
  @HttpCode(200)
  async resend(@Req() req: Request) {
    const preAuth = (req.cookies as Record<string, string>)[PRE_AUTH_COOKIE];
    const { devCode } = await this.auth.resend(preAuth);
    return { sent: true, ...(devCode ? { devCode } : {}) };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    const { devToken } = await this.auth.forgotPassword(dto.email, ip);
    return { sent: true, ...(devToken ? { devToken } : {}) };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    return this.auth.resetPassword(dto.token, dto.password, ip);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: SessionPayload) {
    return this.auth.me(user.sub);
  }

  @Get('logout')
  @HttpCode(200)
  logoutGet(@Res({ passthrough: true }) res: Response) {
    return this.logout(res);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, {
      path: '/',
      sameSite: cookieSameSite,
      secure: isProd,
    });
    return { ok: true };
  }

  // TEMP: Easy way to seed the admin account on a live production server.
  // Visit https://your-backend-url/auth/setup-admin in the browser.
  @Get('setup-admin')
  async setupAdmin() {
    const argon2 = require('argon2');
    const { PrismaClient, Role } = require('@prisma/client');
    const prisma = new PrismaClient();

    const email = 'd.larkin@cannathera-report.de';
    const passwordHash = await argon2.hash('ct-admin-2026-secure!');

    const admin = await prisma.user.upsert({
      where: { email },
      update: { role: Role.ADMIN, passwordHash, isActive: true },
      create: {
        email,
        passwordHash,
        role: Role.ADMIN,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
      },
    });
    return {
      message: 'Admin user created successfully in production!',
      email: admin.email,
    };
  }
}
