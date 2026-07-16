"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_guard_1 = require("./auth.guard");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
const ROLE_HOME = {
    PATIENT: '/patient',
    DOCTOR: '/doctor',
    PHARMACY: '/pharmacy',
    ENTERPRISE: '/enterprise',
    ADMIN: '/admin',
};
const isProd = process.env.NODE_ENV === 'production';
const preAuthCookieOpts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 10 * 60 * 1000,
    path: '/',
};
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async register(dto, res, ip) {
        const { preAuthToken, devCode } = await this.auth.register(dto, ip);
        res.cookie(auth_guard_1.PRE_AUTH_COOKIE, preAuthToken, preAuthCookieOpts);
        return { requires2fa: true, ...(devCode ? { devCode } : {}) };
    }
    async login(dto, res, ip) {
        const result = await this.auth.login(dto, ip);
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
        res.cookie(auth_guard_1.PRE_AUTH_COOKIE, result.preAuthToken, preAuthCookieOpts);
        return { requires2fa: true, ...(result.devCode ? { devCode: result.devCode } : {}) };
    }
    async verify(dto, req, res, ip) {
        const preAuth = req.cookies[auth_guard_1.PRE_AUTH_COOKIE];
        const { user, session, ttlMin } = await this.auth.verify(preAuth, dto.code, ip);
        res.clearCookie(auth_guard_1.PRE_AUTH_COOKIE, { path: '/' });
        this.setSessionCookie(res, session, ttlMin);
        return {
            user: { id: user.id, email: user.email, role: user.role, locale: user.locale },
            home: user.mustChangePassword ? '/set-password' : (ROLE_HOME[user.role] ?? '/'),
        };
    }
    setSessionCookie(res, session, ttlMin) {
        res.cookie(auth_guard_1.SESSION_COOKIE, session, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd,
            maxAge: ttlMin * 60 * 1000,
            path: '/',
        });
    }
    changePassword(user, dto, ip) {
        return this.auth.changePassword(user.sub, dto.password, ip);
    }
    async resend(req) {
        const preAuth = req.cookies[auth_guard_1.PRE_AUTH_COOKIE];
        const { devCode } = await this.auth.resend(preAuth);
        return { sent: true, ...(devCode ? { devCode } : {}) };
    }
    async forgotPassword(dto, ip) {
        const { devToken } = await this.auth.forgotPassword(dto.email, ip);
        return { sent: true, ...(devToken ? { devToken } : {}) };
    }
    async resetPassword(dto, ip) {
        return this.auth.resetPassword(dto.token, dto.password, ip);
    }
    me(user) {
        return this.auth.me(user.sub);
    }
    logout(res) {
        res.clearCookie(auth_guard_1.SESSION_COOKIE, { path: '/' });
        return { ok: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.VerifyDto, Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.ChangePasswordDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('resend'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resend", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.ForgotPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.ResetPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map