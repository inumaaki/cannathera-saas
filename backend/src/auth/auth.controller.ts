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

const preAuthCookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
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
    const { preAuthToken, devCode } = await this.auth.register(dto, ip);
    res.cookie(PRE_AUTH_COOKIE, preAuthToken, preAuthCookieOpts);
    return { requires2fa: true, ...(devCode ? { devCode } : {}) };
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
    return { requires2fa: true, ...(result.devCode ? { devCode: result.devCode } : {}) };
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
    const { user, session, ttlMin } = await this.auth.verify(preAuth, dto.code, ip);

    res.clearCookie(PRE_AUTH_COOKIE, { path: '/' });
    this.setSessionCookie(res, session, ttlMin);

    return {
      user: { id: user.id, email: user.email, role: user.role, locale: user.locale },
      // Temp-password accounts must set their own password first.
      home: user.mustChangePassword ? '/set-password' : (ROLE_HOME[user.role] ?? '/'),
    };
  }

  /** Cookie lifetime tracks the org's session policy, not a hard-coded 30 days. */
  private setSessionCookie(res: Response, session: string, ttlMin: number) {
    res.cookie(SESSION_COOKIE, session, {
      httpOnly: true,
      sameSite: 'lax',
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

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }
}
