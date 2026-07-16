import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { SessionPayload } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto, VerifyDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto, res: Response, ip: string): Promise<{
        devCode?: string | undefined;
        requires2fa: boolean;
    }>;
    login(dto: LoginDto, res: Response, ip: string): Promise<{
        requires2fa: boolean;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            locale: import("@prisma/client").$Enums.Locale;
        };
        home: string;
    } | {
        devCode?: string | undefined;
        requires2fa: boolean;
        user?: undefined;
        home?: undefined;
    }>;
    verify(dto: VerifyDto, req: Request, res: Response, ip: string): Promise<{
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            locale: import("@prisma/client").$Enums.Locale;
        };
        home: string;
    }>;
    private setSessionCookie;
    changePassword(user: SessionPayload, dto: ChangePasswordDto, ip: string): Promise<{
        ok: boolean;
    }>;
    resend(req: Request): Promise<{
        devCode?: string | undefined;
        sent: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto, ip: string): Promise<{
        devToken?: string | undefined;
        sent: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto, ip: string): Promise<{
        ok: boolean;
    }>;
    me(user: SessionPayload): Promise<{
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
    logout(res: Response): {
        ok: boolean;
    };
}
