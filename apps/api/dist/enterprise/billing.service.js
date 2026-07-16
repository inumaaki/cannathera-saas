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
exports.BillingService = void 0;
exports.tierFor = tierFor;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const access_1 = require("./access");
const DAY = 86_400_000;
const TIERS = [
    { key: 'Tier 1', label: 'Basic (1 – 500)', from: 1, to: 500, unitPrice: 8 },
    { key: 'Tier 2', label: 'Enterprise (501 – 1.500)', from: 501, to: 1500, unitPrice: 6.5 },
    { key: 'Tier 3', label: 'Unlimited (1.501+)', from: 1501, to: null, unitPrice: 5 },
];
function tierFor(reviews) {
    return (TIERS.find((t) => t.to === null || reviews <= t.to) ?? TIERS[TIERS.length - 1]);
}
let BillingService = class BillingService {
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
        return membership.org;
    }
    async billedOrgIds(orgId, type) {
        if (type !== client_1.OrgType.ENTERPRISE)
            return [orgId];
        const members = await this.prisma.organization.findMany({
            where: { parentOrgId: orgId },
            select: { id: true },
        });
        return members.map((m) => m.id);
    }
    async reviewsBetween(orgIds, from, to) {
        if (orgIds.length === 0)
            return 0;
        return this.prisma.submission.count({
            where: {
                status: client_1.SubmissionStatus.SUBMITTED,
                submittedAt: { gte: from, lt: to },
                patient: {
                    OR: [{ orgId: { in: orgIds } }, { pharmacyId: { in: orgIds } }],
                },
                version: { questionnaire: { key: 'monthly_review' } },
            },
        });
    }
    async usage(userId) {
        const org = await this.orgOf(userId);
        const orgIds = await this.billedOrgIds(org.id, org.type);
        const now = new Date();
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        const from = new Date(now.getFullYear(), qStartMonth, 1);
        const to = new Date(now.getFullYear(), qStartMonth + 3, 1);
        const reviews = await this.reviewsBetween(orgIds, from, to);
        const active = tierFor(Math.max(1, reviews));
        const tiers = TIERS.map((t) => {
            const used = Math.max(reviews - (t.from - 1), 0);
            const capacity = t.to === null ? null : t.to - (t.from - 1);
            const filled = capacity === null ? used : Math.min(used, capacity);
            return {
                key: t.key,
                label: t.label,
                from: t.from,
                to: t.to,
                unitPrice: t.unitPrice,
                used: filled,
                capacity,
                pct: capacity === null
                    ? filled > 0
                        ? 100
                        : 0
                    : Math.min(100, Math.round((filled / capacity) * 100)),
                state: t.to !== null && reviews > t.to
                    ? 'maxed'
                    : t.key === active.key
                        ? 'active'
                        : reviews < t.from
                            ? 'pending'
                            : 'maxed',
            };
        });
        return {
            cycle: { from, to, label: `Q${Math.floor(qStartMonth / 3) + 1} ${now.getFullYear()}` },
            totalVolume: reviews,
            volumeLimit: 1500,
            activeTier: active.key,
            unitPrice: active.unitPrice,
            projectedCost: Math.round(reviews * active.unitPrice * 100) / 100,
            tiers,
        };
    }
    async invoices(userId, status) {
        const org = await this.orgOf(userId);
        const rows = await this.prisma.invoice.findMany({
            where: {
                orgId: org.id,
                ...(status && status !== 'all'
                    ? { status: status.toUpperCase() }
                    : {}),
            },
            orderBy: { issuedAt: 'desc' },
            take: 50,
        });
        return {
            rows: rows.map((i) => ({
                id: i.id,
                number: i.number,
                issuedAt: i.issuedAt,
                periodStart: i.periodStart,
                periodEnd: i.periodEnd,
                tier: i.tier,
                reviews: i.reviews,
                unitPrice: Number(i.unitPrice),
                amount: Number(i.amount),
                status: i.status,
                paidAt: i.paidAt,
            })),
            totals: {
                count: rows.length,
                outstanding: rows
                    .filter((i) => i.status !== client_1.InvoiceStatus.PAID)
                    .reduce((sum, i) => sum + Number(i.amount), 0),
            },
        };
    }
    async generateInvoice(userId) {
        await (0, access_1.requirePermission)(this.prisma, userId, 'billing:manage');
        const org = await this.orgOf(userId);
        const orgIds = await this.billedOrgIds(org.id, org.type);
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 1);
        const existing = await this.prisma.invoice.findFirst({
            where: { orgId: org.id, periodStart: from },
        });
        if (existing)
            return existing;
        const reviews = await this.reviewsBetween(orgIds, from, to);
        const tier = tierFor(Math.max(1, reviews));
        const amount = Math.round(reviews * tier.unitPrice * 100) / 100;
        const seq = await this.prisma.invoice.count({ where: { orgId: org.id } });
        const invoice = await this.prisma.invoice.create({
            data: {
                orgId: org.id,
                number: `INV-${from.getFullYear()}-${String(seq + 1).padStart(4, '0')}`,
                periodStart: from,
                periodEnd: to,
                tier: tier.key,
                reviews,
                unitPrice: tier.unitPrice,
                amount,
                status: client_1.InvoiceStatus.PAID,
                paidAt: new Date(),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'INVOICE_GENERATED',
                entityType: 'Invoice',
                entityId: invoice.id,
                metadata: { number: invoice.number, reviews, amount },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'INVOICE_AUTO_PAID',
                entityType: 'Invoice',
                entityId: invoice.id,
                metadata: { number: invoice.number, amount, gateway: 'Stripe' },
            },
        });
        return invoice;
    }
    async exportInvoicesCsv(userId) {
        const { rows } = await this.invoices(userId);
        const lines = [
            'Rechnungsnummer;Datum;Zeitraum;Tarif;Reviews;Preis pro Review (EUR);Betrag (EUR);Status',
            ...rows.map((i) => [
                i.number,
                i.issuedAt.toISOString().slice(0, 10),
                `${i.periodStart.toISOString().slice(0, 10)} – ${i.periodEnd.toISOString().slice(0, 10)}`,
                i.tier,
                i.reviews,
                i.unitPrice,
                i.amount,
                i.status,
            ].join(';')),
        ];
        return '﻿' + lines.join('\r\n');
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map