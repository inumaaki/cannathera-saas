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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const nodemailer = __importStar(require("nodemailer"));
const prisma_service_1 = require("../prisma/prisma.service");
const shared_1 = require("@cannathera/shared");
const CODE_TTL_MS = 10 * 60 * 1000;
const CONSENT_VERSION = '2026-07-v1';
const DEFAULT_POLICY = { mandatory2fa: true, sessionTimeoutMin: 12 * 60 };
const REMEMBER_MIN = 30 * 24 * 60;
const ROLE_MAP = {
    patient: client_1.Role.PATIENT,
    doctor: client_1.Role.DOCTOR,
    pharmacy: client_1.Role.PHARMACY,
    enterprise: client_1.Role.ENTERPRISE,
};
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(dto, ip) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existing)
            throw new common_1.ConflictException('EMAIL_TAKEN');
        const passwordHash = await argon2.hash(dto.password);
        const role = ROLE_MAP[dto.role];
        const user = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    passwordHash,
                    role,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    locale: dto.locale ?? client_1.Locale.de,
                    isActive: role === client_1.Role.PATIENT,
                },
            });
            switch (dto.role) {
                case 'patient': {
                    const data = dto.roleData;
                    if (!data?.consentArt9) {
                        throw new common_1.BadRequestException('CONSENT_ART9_REQUIRED');
                    }
                    await tx.patientProfile.create({
                        data: {
                            userId: created.id,
                            dateOfBirth: new Date(data.dateOfBirth),
                            therapyStart: new Date(),
                        },
                    });
                    if (data.preferredLanguage) {
                        await tx.user.update({
                            where: { id: created.id },
                            data: { locale: data.preferredLanguage },
                        });
                    }
                    await tx.consent.create({
                        data: {
                            userId: created.id,
                            purpose: 'data_processing_art9',
                            version: CONSENT_VERSION,
                            ipAddress: ip,
                        },
                    });
                    if (data.consentShareDoctor) {
                        await tx.consent.create({
                            data: {
                                userId: created.id,
                                purpose: 'share_with_doctor',
                                version: CONSENT_VERSION,
                                ipAddress: ip,
                            },
                        });
                    }
                    break;
                }
                case 'doctor': {
                    const data = dto.roleData;
                    const org = await tx.organization.create({
                        data: {
                            name: data?.practiceName ?? `Praxis ${dto.lastName}`,
                            type: client_1.OrgType.PRACTICE,
                            branding: data
                                ? { lanr: data.lanr, bsnr: data.bsnr, specialty: data.specialty, phone: data.phone }
                                : undefined,
                        },
                    });
                    await tx.membership.create({
                        data: {
                            userId: created.id,
                            orgId: org.id,
                            roleInOrg: client_1.Role.DOCTOR,
                            orgRole: 'ADMIN',
                            permissions: [...shared_1.ROLE_PRESETS.ADMIN],
                        },
                    });
                    break;
                }
                case 'pharmacy': {
                    const data = dto.roleData;
                    const org = await tx.organization.create({
                        data: {
                            name: data?.pharmacyName ?? `Apotheke ${dto.lastName}`,
                            type: client_1.OrgType.PHARMACY,
                            branding: data
                                ? { contactPerson: data.contactPerson, address: data.address, phone: data.phone, idf: data.idf }
                                : undefined,
                        },
                    });
                    await tx.membership.create({
                        data: {
                            userId: created.id,
                            orgId: org.id,
                            roleInOrg: client_1.Role.PHARMACY,
                            orgRole: 'ADMIN',
                            permissions: [...shared_1.ROLE_PRESETS.ADMIN],
                        },
                    });
                    break;
                }
                case 'enterprise': {
                    const data = dto.roleData;
                    const org = await tx.organization.create({
                        data: {
                            name: data?.companyName ?? `Enterprise ${dto.lastName}`,
                            type: client_1.OrgType.ENTERPRISE,
                            branding: data
                                ? { contactPerson: data.contactPerson, partnerType: data.partnerType, phone: data.phone }
                                : undefined,
                        },
                    });
                    await tx.membership.create({
                        data: {
                            userId: created.id,
                            orgId: org.id,
                            roleInOrg: client_1.Role.ENTERPRISE,
                            orgRole: 'ADMIN',
                            permissions: [...shared_1.ROLE_PRESETS.ADMIN],
                        },
                    });
                    break;
                }
            }
            await tx.auditLog.create({
                data: {
                    userId: created.id,
                    action: 'USER_REGISTERED',
                    entityType: 'User',
                    entityId: created.id,
                    metadata: { role },
                    ipAddress: ip,
                },
            });
            return created;
        });
        const devCode = await this.issueTwoFactorCode(user);
        return { user, preAuthToken: this.signPreAuth(user), devCode };
    }
    async policyFor(userId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId },
            select: { orgId: true },
        });
        if (!membership)
            return DEFAULT_POLICY;
        const settings = await this.prisma.orgSettings.findUnique({
            where: { orgId: membership.orgId },
        });
        return {
            mandatory2fa: settings?.mandatory2fa ?? DEFAULT_POLICY.mandatory2fa,
            sessionTimeoutMin: settings?.sessionTimeoutMin ?? DEFAULT_POLICY.sessionTimeoutMin,
        };
    }
    async login(dto, ip) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user)
            throw new common_1.UnauthorizedException('INVALID_CREDENTIALS');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('ACCOUNT_INACTIVE');
        const membership = await this.prisma.membership.findFirst({
            where: { userId: user.id },
            include: {
                org: {
                    include: {
                        subscriptions: true,
                    },
                },
            },
        });
        if (membership && membership.org) {
            const activeSub = membership.org.subscriptions[0];
            if (activeSub && !activeSub.isActive) {
                throw new common_1.UnauthorizedException('ORGANIZATION_SUSPENDED');
            }
        }
        const valid = await argon2.verify(user.passwordHash, dto.password);
        if (!valid)
            throw new common_1.UnauthorizedException('INVALID_CREDENTIALS');
        await this.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN_PASSWORD_OK',
                ipAddress: ip,
            },
        });
        const policy = await this.policyFor(user.id);
        if (!policy.mandatory2fa) {
            await this.prisma.auditLog.create({
                data: { userId: user.id, action: 'LOGIN_2FA_SKIPPED', ipAddress: ip },
            });
            return {
                user,
                session: this.signSession(user, policy.sessionTimeoutMin, dto.remember),
                ttlMin: dto.remember ? REMEMBER_MIN : policy.sessionTimeoutMin,
            };
        }
        const devCode = await this.issueTwoFactorCode(user);
        return { user, preAuthToken: this.signPreAuth(user, dto.remember), devCode };
    }
    async verify(preAuthToken, code, ip) {
        if (!preAuthToken)
            throw new common_1.UnauthorizedException('NO_PENDING_LOGIN');
        let payload;
        try {
            payload = this.jwt.verify(preAuthToken);
        }
        catch {
            throw new common_1.UnauthorizedException('NO_PENDING_LOGIN');
        }
        if (payload.stage !== '2fa')
            throw new common_1.UnauthorizedException('NO_PENDING_LOGIN');
        const candidates = await this.prisma.twoFactorCode.findMany({
            where: {
                userId: payload.sub,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
        let matched = null;
        for (const c of candidates) {
            if (await argon2.verify(c.codeHash, code)) {
                matched = c.id;
                break;
            }
        }
        if (!matched)
            throw new common_1.UnauthorizedException('INVALID_CODE');
        await this.prisma.twoFactorCode.update({
            where: { id: matched },
            data: { consumedAt: new Date() },
        });
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: payload.sub },
        });
        if (!user.isActive)
            throw new common_1.UnauthorizedException('ACCOUNT_INACTIVE');
        await this.prisma.auditLog.create({
            data: { userId: user.id, action: 'LOGIN_2FA_OK', ipAddress: ip },
        });
        const policy = await this.policyFor(user.id);
        const session = this.signSession(user, policy.sessionTimeoutMin, payload.remember);
        return {
            user,
            session,
            ttlMin: payload.remember ? REMEMBER_MIN : policy.sessionTimeoutMin,
        };
    }
    async resend(preAuthToken) {
        if (!preAuthToken)
            throw new common_1.UnauthorizedException('NO_PENDING_LOGIN');
        let payload;
        try {
            payload = this.jwt.verify(preAuthToken);
        }
        catch {
            throw new common_1.UnauthorizedException('NO_PENDING_LOGIN');
        }
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
        const devCode = await this.issueTwoFactorCode(user);
        return { devCode };
    }
    async forgotPassword(email, ip) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user || !user.isActive)
            return { devToken: undefined };
        const token = (0, crypto_1.randomBytes)(32).toString('base64url');
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash: await argon2.hash(token),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        await this.prisma.auditLog.create({
            data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED', ipAddress: ip },
        });
        this.logger.log(`Password reset token for ${user.email}: ${token}`);
        return {
            devToken: process.env.NODE_ENV === 'production' ? undefined : token,
        };
    }
    async resetPassword(token, password, ip) {
        const candidates = await this.prisma.passwordResetToken.findMany({
            where: { consumedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        let match = null;
        for (const c of candidates) {
            if (await argon2.verify(c.tokenHash, token)) {
                match = c;
                break;
            }
        }
        if (!match)
            throw new common_1.UnauthorizedException('INVALID_RESET_TOKEN');
        await this.prisma.$transaction([
            this.prisma.passwordResetToken.update({
                where: { id: match.id },
                data: { consumedAt: new Date() },
            }),
            this.prisma.user.update({
                where: { id: match.userId },
                data: { passwordHash: await argon2.hash(password) },
            }),
            this.prisma.auditLog.create({
                data: { userId: match.userId, action: 'PASSWORD_RESET_DONE', ipAddress: ip },
            }),
        ]);
        return { ok: true };
    }
    async me(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                locale: true,
                mustChangePassword: true,
                memberships: {
                    take: 1,
                    select: { orgRole: true, permissions: true, orgId: true },
                },
            },
        });
        const membership = user.memberships[0];
        return {
            ...user,
            memberships: undefined,
            orgId: membership?.orgId ?? null,
            orgRole: membership?.orgRole ?? null,
            permissions: membership?.permissions ?? [],
        };
    }
    async changePassword(userId, password, ip) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: await argon2.hash(password),
                mustChangePassword: false,
            },
        });
        await this.prisma.auditLog.create({
            data: { userId, action: 'PASSWORD_CHANGED', ipAddress: ip },
        });
        return { ok: true };
    }
    signSession(user, timeoutMin, remember) {
        const ttlMin = remember ? REMEMBER_MIN : timeoutMin;
        return this.jwt.sign({
            sub: user.id,
            role: user.role,
            stage: 'session',
            ttlMin,
        }, { expiresIn: `${ttlMin}m` });
    }
    signPreAuth(user, remember) {
        return this.jwt.sign({ sub: user.id, stage: '2fa', remember }, { expiresIn: '10m' });
    }
    async issueTwoFactorCode(user) {
        const code = (0, crypto_1.randomInt)(0, 1_000_000).toString().padStart(6, '0');
        await this.prisma.twoFactorCode.create({
            data: {
                userId: user.id,
                codeHash: await argon2.hash(code),
                expiresAt: new Date(Date.now() + CODE_TTL_MS),
            },
        });
        this.logger.log(`2FA code for ${user.email}: ${code}`);
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT ?? 587),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });
                await transporter.sendMail({
                    from: process.env.SMTP_FROM ?? '"Cannathera" <no-reply@cannathera.de>',
                    to: user.email,
                    subject: 'Cannathera 2FA Code',
                    text: `Your 2FA verification code is: ${code}`,
                    html: `<p>Your 2FA verification code is: <strong>${code}</strong></p>`,
                });
                this.logger.log(`2FA email sent to ${user.email}`);
            }
            catch (err) {
                this.logger.error(`Failed to send 2FA email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        return process.env.NODE_ENV === 'production' ? undefined : code;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map