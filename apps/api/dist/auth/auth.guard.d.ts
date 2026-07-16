import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { SessionPayload } from './auth.service';
export declare const SESSION_COOKIE = "cannathera_session";
export declare const PRE_AUTH_COOKIE = "cannathera_preauth";
export type AuthedRequest = Request & {
    user: SessionPayload;
};
export declare class SessionGuard implements CanActivate {
    private readonly jwt;
    constructor(jwt: JwtService);
    canActivate(ctx: ExecutionContext): boolean;
    private slide;
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(ctx: ExecutionContext): boolean;
}
export declare const PERMS_KEY = "permissions";
export declare const Perms: (...perms: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private readonly prisma;
    constructor(reflector: Reflector, prisma: PrismaService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
export declare class SubscriptionGuard implements CanActivate {
    private readonly prisma;
    constructor(prisma: PrismaService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
