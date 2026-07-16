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
exports.EnterpriseService = void 0;
const common_1 = require("@nestjs/common");
require("multer");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_1 = require("./access");
const CYCLE_DAYS = 30;
const DAY = 86_400_000;
const VOLUME_TIERS = [
    { upTo: 500, unitPrice: 8 },
    { upTo: 1500, unitPrice: 6.5 },
    { upTo: null, unitPrice: 5 },
];
function unitPriceFor(reviews) {
    return (VOLUME_TIERS.find((t) => t.upTo === null || reviews <= t.upTo)?.unitPrice ?? 5);
}
let EnterpriseService = class EnterpriseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async orgOf(userId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId },
            include: { org: true },
        });
        if (!membership)
            throw new common_1.NotFoundException('NO_ORGANIZATION');
        if (membership.org.type !== client_1.OrgType.ENTERPRISE) {
            throw new common_1.NotFoundException('NOT_AN_ENTERPRISE');
        }
        return membership.org;
    }
    async memberOrgs(parentId) {
        return this.prisma.organization.findMany({
            where: { parentOrgId: parentId },
            orderBy: { name: 'asc' },
        });
    }
    patientScope(memberIds) {
        return {
            OR: [{ orgId: { in: memberIds } }, { pharmacyId: { in: memberIds } }],
        };
    }
    async overview(userId) {
        const org = await this.orgOf(userId);
        const members = await this.memberOrgs(org.id);
        const memberIds = members.map((m) => m.id);
        if (memberIds.length === 0) {
            return {
                enterpriseName: org.name,
                branding: org.branding ?? null,
                partners: { total: 0, pharmacies: 0, practices: 0 },
                patients: 0,
                activePatients: 0,
                reviewsThisMonth: 0,
                overdueReviews: 0,
                openFlags: 0,
                criticalFlags: 0,
                avgAdherence: 0,
                billing: { reviewsThisMonth: 0, unitPrice: 8, projectedCost: 0, tierLabel: '1–500' },
                topPartners: [],
                months: [],
            };
        }
        const since30 = new Date(Date.now() - 30 * DAY);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const scope = this.patientScope(memberIds);
        const [patients, reviewsThisMonth, flags, logs] = await Promise.all([
            this.prisma.patientProfile.findMany({
                where: scope,
                select: {
                    id: true,
                    orgId: true,
                    pharmacyId: true,
                    therapyStart: true,
                    createdAt: true,
                    lastReviewAt: true,
                },
            }),
            this.prisma.submission.count({
                where: {
                    patient: scope,
                    status: client_1.SubmissionStatus.SUBMITTED,
                    submittedAt: { gte: monthStart },
                    version: { questionnaire: { key: 'monthly_review' } },
                },
            }),
            this.prisma.redFlagHit.findMany({
                where: { patient: scope, acknowledged: false },
                select: { severity: true },
            }),
            this.prisma.therapyLog.findMany({
                where: { patient: scope, loggedAt: { gte: since30 } },
                select: { patientId: true, loggedAt: true, metrics: true },
            }),
        ]);
        const daysByPatient = new Map();
        for (const l of logs) {
            const set = daysByPatient.get(l.patientId) ?? new Set();
            set.add(l.loggedAt.toISOString().slice(0, 10));
            daysByPatient.set(l.patientId, set);
        }
        const adherenceOf = (p) => {
            const start = p.therapyStart ?? p.createdAt;
            const window = Math.max(1, Math.min(30, Math.floor((Date.now() - start.getTime()) / DAY) + 1));
            return Math.min(100, Math.round(((daysByPatient.get(p.id)?.size ?? 0) / window) * 100));
        };
        const adherences = patients.map(adherenceOf);
        const avgAdherence = adherences.length
            ? Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length)
            : 0;
        const overdueReviews = patients.filter((p) => {
            const base = p.lastReviewAt ?? p.therapyStart ?? p.createdAt;
            return base.getTime() + CYCLE_DAYS * DAY < Date.now();
        }).length;
        const topPartners = members
            .map((m) => {
            const own = patients.filter((p) => p.orgId === m.id || p.pharmacyId === m.id);
            const ads = own.map(adherenceOf);
            const branding = m.branding ?? {};
            const address = branding.address ?? '';
            const city = address.match(/\d{5}\s+([^,]+)/)?.[1]?.trim() ||
                address.split(',').pop()?.trim() ||
                null;
            return {
                id: m.id,
                name: m.name,
                type: m.type,
                joinedAt: m.joinedAt,
                address: address || null,
                city,
                patients: own.length,
                overdue: own.filter((p) => {
                    const base = p.lastReviewAt ?? p.therapyStart ?? p.createdAt;
                    return base.getTime() + CYCLE_DAYS * DAY < Date.now();
                }).length,
                avgAdherence: ads.length
                    ? Math.round(ads.reduce((a, b) => a + b, 0) / ads.length)
                    : 0,
            };
        })
            .sort((a, b) => b.patients - a.patients);
        const allLogs = await this.prisma.therapyLog.findMany({
            where: { patient: scope },
            select: { loggedAt: true, patientId: true, metrics: true },
            orderBy: { loggedAt: 'asc' },
        });
        const byMonth = new Map();
        for (const l of allLogs) {
            const key = l.loggedAt.toISOString().slice(0, 7);
            const b = byMonth.get(key) ?? { days: new Set(), qol: [] };
            b.days.add(`${l.patientId}:${l.loggedAt.toISOString().slice(0, 10)}`);
            const m = l.metrics ?? {};
            if (m.qol != null)
                b.qol.push(m.qol);
            byMonth.set(key, b);
        }
        const months = [...byMonth.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8)
            .map(([month, b]) => ({
            month,
            entries: b.days.size,
            avgQol: b.qol.length
                ? Math.round((b.qol.reduce((x, y) => x + y, 0) / b.qol.length) * 10) / 10
                : null,
        }));
        const unitPrice = unitPriceFor(reviewsThisMonth);
        return {
            enterpriseName: org.name,
            branding: org.branding ?? null,
            partners: {
                total: members.length,
                pharmacies: members.filter((m) => m.type === client_1.OrgType.PHARMACY).length,
                practices: members.filter((m) => m.type === client_1.OrgType.PRACTICE).length,
            },
            patients: patients.length,
            activePatients: [...daysByPatient.keys()].length,
            reviewsThisMonth,
            overdueReviews,
            openFlags: flags.length,
            criticalFlags: flags.filter((f) => f.severity === client_1.RedFlagSeverity.CRITICAL).length,
            avgAdherence,
            billing: {
                reviewsThisMonth,
                unitPrice,
                projectedCost: Math.round(reviewsThisMonth * unitPrice * 100) / 100,
                tierLabel: reviewsThisMonth <= 500
                    ? '1–500'
                    : reviewsThisMonth <= 1500
                        ? '501–1.500'
                        : 'ab 1.501',
            },
            topPartners,
            months,
        };
    }
    async partners(userId, type) {
        const { topPartners, ...rest } = await this.overview(userId);
        const rows = type && type !== 'all'
            ? topPartners.filter((p) => p.type === type)
            : topPartners;
        return { rows, partners: rest.partners };
    }
    async partnerDetail(userId, partnerId) {
        const org = await this.orgOf(userId);
        const partner = await this.prisma.organization.findFirst({
            where: { id: partnerId, parentOrgId: org.id },
        });
        if (!partner)
            throw new common_1.NotFoundException('PARTNER_NOT_FOUND');
        const patients = await this.prisma.patientProfile.findMany({
            where: { OR: [{ orgId: partner.id }, { pharmacyId: partner.id }] },
            include: {
                user: { select: { firstName: true, lastName: true } },
                redFlagHits: { where: { acknowledged: false }, select: { severity: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const subscription = await this.prisma.subscription.findFirst({
            where: { orgId: partner.id, isActive: true },
            include: { plan: true },
        });
        return {
            partner: {
                id: partner.id,
                name: partner.name,
                type: partner.type,
                joinedAt: partner.joinedAt,
                tier: subscription?.plan.tier ?? client_1.SubscriptionTier.BASIC,
            },
            patients: patients.map((p) => {
                const base = p.lastReviewAt ?? p.therapyStart ?? p.createdAt;
                const diffDays = Math.round((base.getTime() + CYCLE_DAYS * DAY - Date.now()) / DAY);
                return {
                    id: p.id,
                    name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
                    patientRef: p.patientRef,
                    condition: p.condition,
                    tier: p.packageTier,
                    lastReviewAt: p.lastReviewAt,
                    diffDays,
                    overdue: diffDays < 0,
                    openFlags: p.redFlagHits.length,
                };
            }),
        };
    }
    async addPartner(userId, orgId) {
        await (0, access_1.requirePermission)(this.prisma, userId, 'partners:manage');
        const org = await this.orgOf(userId);
        const target = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!target)
            throw new common_1.NotFoundException('ORGANIZATION_NOT_FOUND');
        if (target.type === client_1.OrgType.ENTERPRISE) {
            throw new common_1.BadRequestException('CANNOT_NEST_ENTERPRISE');
        }
        if (target.parentOrgId && target.parentOrgId !== org.id) {
            throw new common_1.ConflictException('ALREADY_IN_ANOTHER_NETWORK');
        }
        const updated = await this.prisma.organization.update({
            where: { id: orgId },
            data: { parentOrgId: org.id, joinedAt: target.joinedAt ?? new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ENTERPRISE_PARTNER_ADDED',
                entityType: 'Organization',
                entityId: orgId,
                metadata: { enterpriseId: org.id, partner: target.name },
            },
        });
        return updated;
    }
    async removePartner(userId, orgId) {
        await (0, access_1.requirePermission)(this.prisma, userId, 'partners:manage');
        const org = await this.orgOf(userId);
        const target = await this.prisma.organization.findFirst({
            where: { id: orgId, parentOrgId: org.id },
        });
        if (!target)
            throw new common_1.NotFoundException('PARTNER_NOT_FOUND');
        await this.prisma.organization.update({
            where: { id: orgId },
            data: { parentOrgId: null, joinedAt: null },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ENTERPRISE_PARTNER_REMOVED',
                entityType: 'Organization',
                entityId: orgId,
                metadata: { enterpriseId: org.id, partner: target.name },
            },
        });
        return { ok: true };
    }
    async availablePartners(userId) {
        await this.orgOf(userId);
        return this.prisma.organization.findMany({
            where: {
                parentOrgId: null,
                type: { in: [client_1.OrgType.PHARMACY, client_1.OrgType.PRACTICE] },
            },
            select: { id: true, name: true, type: true },
            orderBy: { name: 'asc' },
        });
    }
    async updateBranding(userId, branding) {
        await (0, access_1.requirePermission)(this.prisma, userId, 'branding:manage');
        const org = await this.orgOf(userId);
        const current = org.branding ?? {};
        const merged = { ...current, ...branding };
        const updated = await this.prisma.organization.update({
            where: { id: org.id },
            data: { branding: merged },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ENTERPRISE_BRANDING_UPDATED',
                entityType: 'Organization',
                entityId: org.id,
                metadata: merged,
            },
        });
        return { branding: updated.branding, poweredBy: 'Powered by Cannathera' };
    }
    async saveLogo(userId, file) {
        await (0, access_1.requirePermission)(this.prisma, userId, 'branding:manage');
        const org = await this.orgOf(userId);
        if (!file)
            throw new common_1.BadRequestException('NO_FILE');
        const ext = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
        }[file.mimetype];
        if (!ext)
            throw new common_1.BadRequestException('UNSUPPORTED_FILE_TYPE');
        const { randomBytes } = await import('crypto');
        const fs = await import('fs/promises');
        const path = await import('path');
        const dir = path.join(process.cwd(), 'uploads', 'public');
        await fs.mkdir(dir, { recursive: true });
        const filename = `logo-${org.id}-${randomBytes(4).toString('hex')}.${ext}`;
        await fs.writeFile(path.join(dir, filename), file.buffer);
        const logoUrl = `/uploads/${filename}`;
        await this.updateBranding(userId, { logoUrl });
        return { logoUrl };
    }
    async exportCsv(userId) {
        const { topPartners } = await this.overview(userId);
        const escape = (v) => typeof v === 'string' && /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        const lines = [
            'Partner;Typ;Beigetreten;Patient:innen;Überfällige Reviews;Ø Therapietreue (%)',
            ...topPartners.map((p) => [
                p.name,
                p.type,
                p.joinedAt ? p.joinedAt.toISOString().slice(0, 10) : '',
                p.patients,
                p.overdue,
                p.avgAdherence,
            ]
                .map(escape)
                .join(';')),
        ];
        return '﻿' + lines.join('\r\n');
    }
};
exports.EnterpriseService = EnterpriseService;
exports.EnterpriseService = EnterpriseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnterpriseService);
//# sourceMappingURL=enterprise.service.js.map