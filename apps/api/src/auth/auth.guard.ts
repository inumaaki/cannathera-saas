import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@cannathera/db';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { SessionPayload } from './auth.service';

export const SESSION_COOKIE = 'cannathera_session';
export const PRE_AUTH_COOKIE = 'cannathera_preauth';

export type AuthedRequest = Request & { user: SessionPayload };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException('NO_SESSION');
    try {
      const payload = this.jwt.verify<SessionPayload & { exp?: number }>(token);
      if (payload.stage !== 'session') throw new Error();
      req.user = payload;
      this.slide(ctx, payload);
      return true;
    } catch {
      throw new UnauthorizedException('NO_SESSION');
    }
  }

  /**
   * The org policy calls it an *inactivity* timeout, so activity must extend it.
   * Once the token is past its half-life, re-issue it for a fresh full window —
   * an idle user still expires exactly `ttlMin` after their last request.
   */
  private slide(ctx: ExecutionContext, payload: SessionPayload & { exp?: number }) {
    const ttlMin = payload.ttlMin;
    if (!ttlMin || !payload.exp) return;

    const remainingSec = payload.exp - Math.floor(Date.now() / 1000);
    if (remainingSec > (ttlMin * 60) / 2) return; // still fresh, leave it alone

    const renewed = this.jwt.sign(
      {
        sub: payload.sub,
        role: payload.role,
        stage: 'session',
        ttlMin,
      } satisfies SessionPayload,
      { expiresIn: `${ttlMin}m` },
    );
    const res = ctx.switchToHttp().getResponse<Response>();
    res.cookie(SESSION_COOKIE, renewed, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ttlMin * 60 * 1000,
      path: '/',
    });
  }
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!required.includes(req.user.role)) throw new ForbiddenException();
    return true;
  }
}

export const PERMS_KEY = 'permissions';
/** Require org permissions on a route (e.g. @Perms('settings:team')). */
export const Perms = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);

/** Checks the caller's membership permissions. Requires SessionGuard first. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const membership = await this.prisma.membership.findFirst({
      where: { userId: req.user.sub },
      select: { permissions: true },
    });
    const granted = membership?.permissions ?? [];
    if (!required.every((p) => granted.includes(p))) {
      throw new ForbiddenException('MISSING_PERMISSION');
    }
    return true;
  }
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;
    if (!user) throw new UnauthorizedException('NO_SESSION');

    // Admins and Patients are exempt from this guard
    if (user.role === Role.ADMIN || user.role === Role.PATIENT) {
      return true;
    }

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.sub },
      include: { org: { include: { subscriptions: true } } },
    });

    if (!membership || !membership.org) {
      throw new ForbiddenException('NO_ORGANIZATION');
    }

    const hasActive = membership.org.subscriptions.some((s) => s.isActive);
    if (!hasActive) {
      throw new ForbiddenException('PARTNER_INACTIVE');
    }

    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
