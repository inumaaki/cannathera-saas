import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
export type SessionPayload = {
    sub: string;
    role: Role;
    stage: 'session';
    ttlMin?: number;
};
export type PreAuthPayload = {
    sub: string;
    stage: '2fa';
    remember?: boolean;
};
export type LoginResult = {
    user: User;
    session: string;
    ttlMin: number;
} | {
    user: User;
    preAuthToken: string;
    devCode?: string;
};
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(dto: RegisterDto, ip?: string): Promise<{
        user: {
            role: import("@prisma/client").$Enums.Role;
            email: string;
            firstName: string | null;
            lastName: string | null;
            locale: import("@prisma/client").$Enums.Locale;
            id: string;
            passwordHash: string;
            isActive: boolean;
            mustChangePassword: boolean;
            emailVerified: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        preAuthToken: string;
        devCode: string | undefined;
    }>;
    policyFor(userId: string): Promise<{
        mandatory2fa: boolean;
        sessionTimeoutMin: number;
    }>;
    login(dto: LoginInput, ip?: string): Promise<LoginResult>;
    verify(preAuthToken: string | undefined, code: string, ip?: string): Promise<{
        user: {
            role: import("@prisma/client").$Enums.Role;
            email: string;
            firstName: string | null;
            lastName: string | null;
            locale: import("@prisma/client").$Enums.Locale;
            id: string;
            passwordHash: string;
            isActive: boolean;
            mustChangePassword: boolean;
            emailVerified: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        session: string;
        ttlMin: number;
    }>;
    resend(preAuthToken: string | undefined): Promise<{
        devCode: string | undefined;
    }>;
    forgotPassword(email: string, ip?: string): Promise<{
        devToken: string | undefined;
    }>;
    resetPassword(token: string, password: string, ip?: string): Promise<{
        ok: boolean;
    }>;
    me(userId: string): Promise<{
        memberships: undefined;
        orgId: string;
        orgRole: string;
        permissions: string[];
        role: import("@prisma/client").$Enums.Role;
        email: string;
        firstName: string | null;
        lastName: string | null;
        locale: import("@prisma/client").$Enums.Locale;
        id: string;
        mustChangePassword: boolean;
    }>;
    changePassword(userId: string, password: string, ip?: string): Promise<{
        ok: boolean;
    }>;
    signSession(user: User, timeoutMin: number, remember?: boolean): string;
    private signPreAuth;
    private issueTwoFactorCode;
}
type LoginInput = {
    email: string;
    password: string;
    remember?: boolean;
};
export {};
