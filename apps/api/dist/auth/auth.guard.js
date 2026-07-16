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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.SubscriptionGuard = exports.PermissionsGuard = exports.Perms = exports.PERMS_KEY = exports.RolesGuard = exports.Roles = exports.ROLES_KEY = exports.SessionGuard = exports.PRE_AUTH_COOKIE = exports.SESSION_COOKIE = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
exports.SESSION_COOKIE = 'cannathera_session';
exports.PRE_AUTH_COOKIE = 'cannathera_preauth';
let SessionGuard = class SessionGuard {
    jwt;
    constructor(jwt) {
        this.jwt = jwt;
    }
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const token = req.cookies?.[exports.SESSION_COOKIE];
        if (!token)
            throw new common_1.UnauthorizedException('NO_SESSION');
        try {
            const payload = this.jwt.verify(token);
            if (payload.stage !== 'session')
                throw new Error();
            req.user = payload;
            this.slide(ctx, payload);
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('NO_SESSION');
        }
    }
    slide(ctx, payload) {
        const ttlMin = payload.ttlMin;
        if (!ttlMin || !payload.exp)
            return;
        const remainingSec = payload.exp - Math.floor(Date.now() / 1000);
        if (remainingSec > (ttlMin * 60) / 2)
            return;
        const renewed = this.jwt.sign({
            sub: payload.sub,
            role: payload.role,
            stage: 'session',
            ttlMin,
        }, { expiresIn: `${ttlMin}m` });
        const res = ctx.switchToHttp().getResponse();
        res.cookie(exports.SESSION_COOKIE, renewed, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ttlMin * 60 * 1000,
            path: '/',
        });
    }
};
exports.SessionGuard = SessionGuard;
exports.SessionGuard = SessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], SessionGuard);
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(ctx) {
        const required = this.reflector.getAllAndOverride(exports.ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required?.length)
            return true;
        const req = ctx.switchToHttp().getRequest();
        if (!required.includes(req.user.role))
            throw new common_1.ForbiddenException();
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
exports.PERMS_KEY = 'permissions';
const Perms = (...perms) => (0, common_1.SetMetadata)(exports.PERMS_KEY, perms);
exports.Perms = Perms;
let PermissionsGuard = class PermissionsGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const required = this.reflector.getAllAndOverride(exports.PERMS_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required?.length)
            return true;
        const req = ctx.switchToHttp().getRequest();
        const membership = await this.prisma.membership.findFirst({
            where: { userId: req.user.sub },
            select: { permissions: true },
        });
        const granted = membership?.permissions ?? [];
        if (!required.every((p) => granted.includes(p))) {
            throw new common_1.ForbiddenException('MISSING_PERMISSION');
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PermissionsGuard);
let SubscriptionGuard = class SubscriptionGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        if (!user)
            throw new common_1.UnauthorizedException('NO_SESSION');
        if (user.role === client_1.Role.ADMIN || user.role === client_1.Role.PATIENT) {
            return true;
        }
        const membership = await this.prisma.membership.findFirst({
            where: { userId: user.sub },
            include: { org: { include: { subscriptions: true } } },
        });
        if (!membership || !membership.org) {
            throw new common_1.ForbiddenException('NO_ORGANIZATION');
        }
        const hasActive = membership.org.subscriptions.some((s) => s.isActive);
        if (!hasActive) {
            throw new common_1.ForbiddenException('PARTNER_INACTIVE');
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionGuard);
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => ctx.switchToHttp().getRequest().user);
//# sourceMappingURL=auth.guard.js.map