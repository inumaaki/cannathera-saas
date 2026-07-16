"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const access_1 = require("./access");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    membershipOf(userId) {
        return (0, access_1.membershipOf)(this.prisma, userId);
    }
    requirePermission(userId, permission) {
        return (0, access_1.requirePermission)(this.prisma, userId, permission);
    }
    async assertNotLastAdmin(orgId, membershipId) {
        const admins = await this.prisma.membership.findMany({
            where: { orgId, orgRole: { in: ['SUPER_ADMIN', 'ADMIN'] } },
            select: { id: true },
        });
        if (admins.length <= 1 && admins.some((a) => a.id === membershipId)) {
            throw new common_1.ConflictException('LAST_ADMIN');
        }
    }
    generateTempPassword() {
        const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const pick = (n) => Array.from({ length: n }, () => alphabet[(0, crypto_1.randomInt)(alphabet.length)]).join('');
        return `${pick(4)}-${pick(4)}-${pick(2)}`;
    }
    async team(userId) {
        const me = await this.membershipOf(userId);
        const members = await this.prisma.membership.findMany({
            where: { orgId: me.orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        mustChangePassword: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        const rows = members.map((m) => ({
            id: m.id,
            userId: m.userId,
            name: [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email,
            email: m.user.email,
            orgRole: (0, access_1.normalizeRole)(m.orgRole),
            permissions: m.permissions,
            status: m.user.mustChangePassword ? 'invited' : 'active',
            isSelf: m.userId === userId,
            createdAt: m.user.createdAt,
        }));
        const settings = await this.prisma.orgSettings.findUnique({
            where: { orgId: me.orgId },
        });
        const twoFaOn = settings?.mandatory2fa ?? true;
        return {
            rows,
            me: {
                orgRole: (0, access_1.normalizeRole)(me.orgRole),
                canManageTeam: (0, access_1.normalizeRole)(me.orgRole) === 'SUPER_ADMIN',
            },
            stats: {
                totalActive: rows.filter((r) => r.status === 'active').length,
                pendingInvites: rows.filter((r) => r.status === 'invited').length,
                mfaCoverage: twoFaOn ? 100 : 0,
            },
        };
    }
    async invite(userId, data) {
        const me = await this.requirePermission(userId, 'team:manage');
        if (!access_1.ORG_ROLES.includes(data.orgRole)) {
            throw new common_1.ConflictException('INVALID_ROLE');
        }
        const exists = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (exists)
            throw new common_1.ConflictException('EMAIL_TAKEN');
        const tempPassword = this.generateTempPassword();
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: await argon2.hash(tempPassword),
                role: client_1.Role.ENTERPRISE,
                firstName: data.firstName,
                lastName: data.lastName,
                mustChangePassword: true,
                memberships: {
                    create: {
                        orgId: me.orgId,
                        roleInOrg: client_1.Role.ENTERPRISE,
                        orgRole: data.orgRole,
                        permissions: data.orgRole === 'SUPER_ADMIN'
                            ? ['patients:view', 'alerts:view', 'reports:view', 'settings:practice', 'settings:team', 'compliance:view']
                            : data.orgRole === 'BILLING'
                                ? ['reports:view', 'compliance:view']
                                : ['patients:view', 'reports:view'],
                    },
                },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ENTERPRISE_MEMBER_INVITED',
                entityType: 'User',
                entityId: user.id,
                metadata: { email: data.email, orgRole: data.orgRole },
            },
        });
        return { email: user.email, tempPassword, orgRole: data.orgRole };
    }
    async updateMember(userId, membershipId, orgRole) {
        const me = await this.requirePermission(userId, 'team:manage');
        if (!access_1.ORG_ROLES.includes(orgRole)) {
            throw new common_1.ConflictException('INVALID_ROLE');
        }
        const target = await this.prisma.membership.findFirst({
            where: { id: membershipId, orgId: me.orgId },
        });
        if (!target)
            throw new common_1.NotFoundException('MEMBER_NOT_FOUND');
        if (target.userId === userId && orgRole !== 'SUPER_ADMIN') {
            throw new common_1.ConflictException('CANNOT_DEMOTE_SELF');
        }
        if ((0, access_1.normalizeRole)(target.orgRole) === 'SUPER_ADMIN' && orgRole !== 'SUPER_ADMIN') {
            await this.assertNotLastAdmin(me.orgId, membershipId);
        }
        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: { orgRole },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ENTERPRISE_MEMBER_UPDATED',
                entityType: 'Membership',
                entityId: membershipId,
                metadata: { orgRole },
            },
        });
        return updated;
    }
    async removeMember(userId, membershipId) {
        const me = await this.requirePermission(userId, 'team:manage');
        const target = await this.prisma.membership.findFirst({
            where: { id: membershipId, orgId: me.orgId },
        });
        if (!target)
            throw new common_1.NotFoundException('MEMBER_NOT_FOUND');
        if (target.userId === userId)
            throw new common_1.ConflictException('CANNOT_REMOVE_SELF');
        if ((0, access_1.normalizeRole)(target.orgRole) === 'SUPER_ADMIN') {
            await this.assertNotLastAdmin(me.orgId, membershipId);
        }
        await this.prisma.membership.delete({ where: { id: membershipId } });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ENTERPRISE_MEMBER_REMOVED',
                entityType: 'Membership',
                entityId: membershipId,
            },
        });
        return { ok: true };
    }
    async settings(userId) {
        const me = await this.membershipOf(userId);
        const settings = await this.prisma.orgSettings.upsert({
            where: { orgId: me.orgId },
            update: {},
            create: { orgId: me.orgId },
        });
        const auditCount = await this.prisma.auditLog.count();
        const reports = await this.prisma.report.count();
        return {
            security: {
                mandatory2fa: settings.mandatory2fa,
                sessionTimeoutMin: settings.sessionTimeoutMin,
            },
            system: {
                apiStatus: 'operational',
                passwordHashing: 'argon2id',
                transport: 'TLS 1.3',
                storedReports: reports,
                auditEntries: auditCount,
            },
        };
    }
    async updateSettings(userId, data) {
        const me = await this.requirePermission(userId, 'settings:manage');
        const updated = await this.prisma.orgSettings.upsert({
            where: { orgId: me.orgId },
            update: data,
            create: { orgId: me.orgId, ...data },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE_SECURITY_CONFIG',
                entityType: 'OrgSettings',
                entityId: updated.id,
                metadata: data,
            },
        });
        return updated;
    }
    async auditLog(userId, limit = 25, action) {
        const me = await this.membershipOf(userId);
        const members = await this.prisma.organization.findMany({
            where: { parentOrgId: me.orgId },
            select: { id: true },
        });
        const orgIds = [me.orgId, ...members.map((m) => m.id)];
        const where = {
            user: { memberships: { some: { orgId: { in: orgIds } } } },
            ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
        };
        const rows = await this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(100, limit),
            include: { user: { select: { email: true } } },
        });
        const total = await this.prisma.auditLog.count({ where });
        return {
            rows: rows.map((r) => ({
                id: r.id,
                user: r.user?.email ?? 'system_daemon',
                action: r.action,
                entityType: r.entityType,
                createdAt: r.createdAt,
            })),
            total,
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map