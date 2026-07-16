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
exports.PharmacyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const CYCLE_DAYS = 30;
const PAIN_CRITICAL = 9;
const SLEEP_WARNING = 2;
let PharmacyService = class PharmacyService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
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
    reviewState(lastReviewAt, therapyStart) {
        const base = lastReviewAt ?? therapyStart;
        const due = new Date(base.getTime() + CYCLE_DAYS * 86_400_000);
        const diffDays = Math.round((due.getTime() - Date.now()) / 86_400_000);
        const status = diffDays < 0 ? 'overdue' : diffDays <= 7 ? 'dueSoon' : 'onTrack';
        return { dueAt: due, diffDays, status };
    }
    async overview(userId) {
        const org = await this.orgOf(userId);
        const patients = await this.prisma.patientProfile.findMany({
            where: { pharmacyId: org.id },
            include: {
                user: { select: { firstName: true, lastName: true } },
                redFlagHits: { where: { acknowledged: false }, select: { severity: true } },
            },
        });
        const rows = patients.map((p) => {
            const start = p.therapyStart ?? p.createdAt;
            const state = this.reviewState(p.lastReviewAt, start);
            return {
                id: p.id,
                name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
                patientRef: p.patientRef,
                condition: p.condition,
                tier: p.packageTier,
                lastReviewAt: p.lastReviewAt,
                ...state,
                criticalFlags: p.redFlagHits.filter((f) => f.severity === client_1.RedFlagSeverity.CRITICAL).length,
                openFlags: p.redFlagHits.length,
            };
        });
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const completedThisMonth = await this.prisma.submission.count({
            where: {
                status: client_1.SubmissionStatus.SUBMITTED,
                submittedAt: { gte: monthStart },
                patient: { pharmacyId: org.id },
                version: { questionnaire: { key: 'monthly_review' } },
            },
        });
        const since = new Date(Date.now() - 30 * 86_400_000);
        const logs = await this.prisma.therapyLog.findMany({
            where: { patient: { pharmacyId: org.id }, loggedAt: { gte: since } },
            select: { patientId: true, loggedAt: true },
        });
        const daysByPatient = new Map();
        for (const l of logs) {
            const set = daysByPatient.get(l.patientId) ?? new Set();
            set.add(l.loggedAt.toISOString().slice(0, 10));
            daysByPatient.set(l.patientId, set);
        }
        const adherences = patients.map((p) => {
            const start = p.therapyStart ?? p.createdAt;
            const days = Math.max(1, Math.min(30, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1));
            return Math.min(100, Math.round(((daysByPatient.get(p.id)?.size ?? 0) / days) * 100));
        });
        const avgAdherence = adherences.length
            ? Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length)
            : 0;
        const buckets = {
            onTrack: adherences.filter((a) => a >= 80).length,
            supportNeeded: adherences.filter((a) => a >= 50 && a < 80).length,
            critical: adherences.filter((a) => a < 50).length,
        };
        const inventory = await this.prisma.inventoryItem.findMany({
            where: { orgId: org.id },
        });
        const shortage = inventory
            .filter((i) => i.stockLevel < i.safetyThreshold)
            .sort((a, b) => a.stockLevel / a.safetyThreshold - b.stockLevel / b.safetyThreshold)[0];
        const subscription = await this.prisma.subscription.findFirst({
            where: { orgId: org.id, isActive: true },
            include: { plan: true },
        });
        return {
            pharmacyName: org.name,
            dueThisMonth: rows.filter((r) => r.status !== 'onTrack').length,
            criticalPending: rows.filter((r) => r.criticalFlags > 0).length,
            completedThisMonth,
            tier: subscription?.plan.tier ?? client_1.SubscriptionTier.BASIC,
            planUsage: {
                used: completedThisMonth,
                cap: subscription?.plan.reviewCap ?? null,
            },
            retention: patients.length
                ? Math.round((patients.filter((p) => (p.lastReviewAt ?? p.createdAt) > since).length /
                    patients.length) *
                    100)
                : 0,
            avgAdherence,
            adherenceBuckets: buckets,
            reviewsDueSoon: rows
                .filter((r) => r.status !== 'onTrack')
                .sort((a, b) => a.diffDays - b.diffDays)
                .slice(0, 6),
            stockAlert: shortage
                ? {
                    id: shortage.id,
                    name: shortage.name,
                    stockLevel: shortage.stockLevel,
                    unit: shortage.unit,
                }
                : null,
        };
    }
    async reviews(userId, filter = 'all') {
        const org = await this.orgOf(userId);
        const patients = await this.prisma.patientProfile.findMany({
            where: { pharmacyId: org.id },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                redFlagHits: { where: { acknowledged: false }, select: { severity: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const rows = patients.map((p) => {
            const start = p.therapyStart ?? p.createdAt;
            const state = this.reviewState(p.lastReviewAt, start);
            return {
                id: p.id,
                name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || p.user.email,
                patientRef: p.patientRef,
                condition: p.condition,
                tier: p.packageTier,
                lastReviewAt: p.lastReviewAt,
                ...state,
                openFlags: p.redFlagHits.length,
                criticalFlags: p.redFlagHits.filter((f) => f.severity === client_1.RedFlagSeverity.CRITICAL).length,
            };
        });
        const filtered = filter === 'flagged'
            ? rows.filter((r) => r.openFlags > 0)
            : filter === 'all'
                ? rows
                : rows.filter((r) => r.status === filter);
        filtered.sort((a, b) => a.diffDays - b.diffDays);
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const completedToday = await this.prisma.submission.count({
            where: {
                status: client_1.SubmissionStatus.SUBMITTED,
                submittedAt: { gte: todayStart },
                patient: { pharmacyId: org.id },
            },
        });
        return {
            rows: filtered,
            stats: {
                overdue: rows.filter((r) => r.status === 'overdue').length,
                completedToday,
                pending: rows.filter((r) => r.status !== 'onTrack').length,
                flagged: rows.filter((r) => r.openFlags > 0).length,
                total: rows.length,
            },
        };
    }
    async reviewSummary(userId, patientId) {
        const org = await this.orgOf(userId);
        const p = await this.prisma.patientProfile.findFirst({
            where: { id: patientId, pharmacyId: org.id },
            include: {
                user: { select: { firstName: true, lastName: true } },
                org: { select: { id: true, name: true } },
                therapyLogs: {
                    where: { loggedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
                    orderBy: { loggedAt: 'asc' },
                },
                redFlagHits: {
                    where: { acknowledged: false },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: { id: true, severity: true, message: true, createdAt: true },
                },
                reports: {
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                    select: {
                        id: true,
                        type: true,
                        periodStart: true,
                        periodEnd: true,
                        fileUrl: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
        const logs = p.therapyLogs;
        const start = p.therapyStart ?? p.createdAt;
        const day = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1);
        const phase = day <= 30 ? 1 : day <= 60 ? 2 : 3;
        const loggedDays = new Set(logs.map((l) => l.loggedAt.toISOString().slice(0, 10)))
            .size;
        const window = Math.min(30, day);
        const adherence = Math.min(100, Math.round((loggedDays / window) * 100));
        const dosed = logs.filter((l) => l.dosageG != null);
        const avgDosageG = dosed.length
            ? Math.round((dosed.reduce((a, l) => a + (l.dosageG ?? 0), 0) / dosed.length) * 100) /
                100
            : null;
        const qols = logs
            .map((l) => l.metrics?.qol)
            .filter((v) => v != null);
        const efficacy = qols.length
            ? Math.round((qols.reduce((a, b) => a + b, 0) / qols.length) * 10) / 10
            : null;
        const painFirst = logs[0]?.metrics?.pain ?? null;
        const painLast = logs.at(-1)?.metrics?.pain ?? null;
        const painChange = painFirst != null && painLast != null && painFirst !== 0
            ? Math.round(((painLast - painFirst) / painFirst) * 100)
            : null;
        const totalLogs = await this.prisma.therapyLog.count({
            where: { patientId: p.id },
        });
        return {
            patient: {
                id: p.id,
                name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
                patientRef: p.patientRef,
                condition: p.condition,
                tier: p.packageTier,
                therapyStart: p.therapyStart ?? p.createdAt,
                lastReviewAt: p.lastReviewAt,
                totalLogs,
            },
            practice: p.org ? { id: p.org.id, name: p.org.name } : null,
            redFlags: p.redFlagHits,
            reports: p.reports,
            day,
            phase,
            adherence,
            avgDosageG,
            efficacy,
            painChange,
            series: logs.map((l) => {
                const m = l.metrics ?? {};
                return {
                    date: l.loggedAt.toISOString().slice(0, 10),
                    pain: m.pain ?? null,
                    sleep: m.sleep ?? null,
                    dosageG: l.dosageG,
                };
            }),
        };
    }
    async completeReview(userId, patientId, note) {
        const org = await this.orgOf(userId);
        const sub = await this.prisma.subscription.findFirst({
            where: { orgId: org.id, isActive: true },
        });
        if (!sub) {
            throw new common_1.ForbiddenException('PARTNER_INACTIVE');
        }
        const p = await this.prisma.patientProfile.findFirst({
            where: { id: patientId, pharmacyId: org.id },
        });
        if (!p)
            throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
        if (p.packageTier === client_1.SubscriptionTier.BASIC) {
            throw new common_1.ForbiddenException('UPGRADE_REQUIRED');
        }
        await this.prisma.patientProfile.update({
            where: { id: patientId },
            data: { lastReviewAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'PHARMACY_REVIEW_COMPLETED',
                entityType: 'PatientProfile',
                entityId: patientId,
                metadata: note ? { note } : undefined,
            },
        });
        return { ok: true, lastReviewAt: new Date() };
    }
    async treatmentLogs(userId, opts) {
        const org = await this.orgOf(userId);
        const days = opts.days ?? 30;
        const since = new Date(Date.now() - days * 86_400_000);
        const needleRaw = opts.q?.trim();
        const logs = await this.prisma.therapyLog.findMany({
            where: {
                patient: {
                    pharmacyId: org.id,
                    ...(needleRaw
                        ? {
                            OR: needleRaw.split(/\s+/).flatMap((term) => [
                                { patientRef: { contains: term, mode: 'insensitive' } },
                                { user: { firstName: { contains: term, mode: 'insensitive' } } },
                                { user: { lastName: { contains: term, mode: 'insensitive' } } },
                            ]),
                        }
                        : {}),
                },
                loggedAt: { gte: since },
            },
            orderBy: { loggedAt: 'desc' },
            take: 500,
            include: {
                patient: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        redFlagHits: {
                            where: { source: 'daily_log' },
                            select: { createdAt: true, severity: true },
                        },
                    },
                },
            },
        });
        const needle = opts.q?.toLowerCase().trim();
        const all = logs.map((l) => {
            const m = l.metrics ?? {};
            const name = [l.patient.user.firstName, l.patient.user.lastName]
                .filter(Boolean)
                .join(' ');
            const day = l.loggedAt.toISOString().slice(0, 10);
            const hit = l.patient.redFlagHits.find((f) => f.createdAt.toISOString().slice(0, 10) === day);
            const breach = (m.pain != null && m.pain >= PAIN_CRITICAL) ||
                (m.sleep != null && m.sleep <= SLEEP_WARNING);
            const flagged = !!hit || breach;
            const severity = hit?.severity ??
                (m.pain != null && m.pain >= PAIN_CRITICAL
                    ? client_1.RedFlagSeverity.CRITICAL
                    : breach
                        ? client_1.RedFlagSeverity.WARNING
                        : null);
            return {
                id: l.id,
                loggedAt: l.loggedAt,
                patientId: l.patientId,
                patientName: name,
                patientRef: l.patient.patientRef,
                strain: l.strain,
                dosageG: l.dosageG,
                pain: m.pain ?? null,
                sleep: m.sleep ?? null,
                flagged,
                severity,
                status: flagged ? 'flagged' : 'verified',
            };
        });
        const matchesSearch = (r) => !needle ||
            r.patientName.toLowerCase().includes(needle) ||
            (r.patientRef ?? '').toLowerCase().includes(needle);
        const searched = all.filter(matchesSearch);
        const rows = searched.filter((r) => !opts.flaggedOnly || r.flagged);
        const activePatients = await this.prisma.patientProfile.count({
            where: { pharmacyId: org.id },
        });
        const recent = await this.prisma.therapyLog.count({
            where: {
                patient: { pharmacyId: org.id },
                loggedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
            },
        });
        const total = await this.prisma.therapyLog.count({
            where: { patient: { pharmacyId: org.id } },
        });
        return {
            rows,
            stats: {
                total,
                recent7d: recent,
                activePatients,
                inRange: all.length,
                matched: searched.length,
                flagged: searched.filter((r) => r.flagged).length,
            },
        };
    }
    async analytics(userId) {
        const org = await this.orgOf(userId);
        const logs = await this.prisma.therapyLog.findMany({
            where: { patient: { pharmacyId: org.id } },
            select: { loggedAt: true, metrics: true, patientId: true },
            orderBy: { loggedAt: 'asc' },
        });
        const byMonth = new Map();
        for (const l of logs) {
            const key = l.loggedAt.toISOString().slice(0, 7);
            const b = byMonth.get(key) ?? { adherenceDays: new Set(), qol: [] };
            b.adherenceDays.add(`${l.patientId}:${l.loggedAt.toISOString().slice(0, 10)}`);
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
            entries: b.adherenceDays.size,
            avgQol: b.qol.length
                ? Math.round((b.qol.reduce((x, y) => x + y, 0) / b.qol.length) * 10) / 10
                : null,
        }));
        const submissions = await this.prisma.submission.findMany({
            where: {
                patient: { pharmacyId: org.id },
                status: client_1.SubmissionStatus.SUBMITTED,
            },
            include: { answers: { include: { question: { select: { key: true } } } } },
        });
        const ratings = submissions
            .map((s) => s.answers.find((a) => a.question.key === 'satisfaction')?.value)
            .filter((v) => typeof v === 'number');
        const avgRating = ratings.length
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length / 2) * 10) / 10
            : null;
        const patients = await this.prisma.patientProfile.count({
            where: { pharmacyId: org.id },
        });
        const since30 = new Date(Date.now() - 30 * 86_400_000);
        const activeRecently = await this.prisma.patientProfile.count({
            where: {
                pharmacyId: org.id,
                therapyLogs: { some: { loggedAt: { gte: since30 } } },
            },
        });
        const retention = patients ? Math.round((activeRecently / patients) * 100) : 0;
        const subscription = await this.prisma.subscription.findFirst({
            where: { orgId: org.id, isActive: true },
            include: { plan: true },
        });
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const reviewsThisMonth = await this.prisma.submission.count({
            where: {
                patient: { pharmacyId: org.id },
                status: client_1.SubmissionStatus.SUBMITTED,
                submittedAt: { gte: monthStart },
                version: { questionnaire: { key: 'monthly_review' } },
            },
        });
        const unitPrice = reviewsThisMonth <= 500 ? 8 : reviewsThisMonth <= 1500 ? 6.5 : 5;
        return {
            retention,
            months,
            totalReviews: submissions.length,
            avgRating,
            responseRate: patients
                ? Math.min(100, Math.round((submissions.length / Math.max(1, patients)) * 100))
                : 0,
            billing: {
                tier: subscription?.plan.tier ?? client_1.SubscriptionTier.BASIC,
                planName: subscription?.plan.name ?? 'Basic',
                monthlyPrice: subscription?.plan.monthlyPrice
                    ? Number(subscription.plan.monthlyPrice)
                    : null,
                reviewCap: subscription?.plan.reviewCap ?? null,
                reviewsThisMonth,
                unitPrice,
                projectedCost: Math.round(reviewsThisMonth * unitPrice * 100) / 100,
            },
        };
    }
    stockStatus(stockLevel, safetyThreshold) {
        if (stockLevel <= safetyThreshold * 0.2)
            return 'critical';
        if (stockLevel < safetyThreshold)
            return 'low';
        return 'inStock';
    }
    async itemOf(userId, itemId) {
        const org = await this.orgOf(userId);
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id: itemId, orgId: org.id },
        });
        if (!item)
            throw new common_1.NotFoundException('ITEM_NOT_FOUND');
        return item;
    }
    trail(userId, itemId, action, metadata) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType: 'InventoryItem',
                entityId: itemId,
                metadata,
            },
        });
    }
    async inventory(userId, opts = {}) {
        const org = await this.orgOf(userId);
        const all = await this.prisma.inventoryItem.findMany({
            where: { orgId: org.id, active: true },
        });
        const decorate = (i) => ({
            ...i,
            status: this.stockStatus(i.stockLevel, i.safetyThreshold),
        });
        const stats = {
            totalSkus: all.length,
            lowStock: all.filter((i) => decorate(i).status === 'low').length,
            critical: all.filter((i) => decorate(i).status === 'critical').length,
            pendingOrders: all.filter((i) => i.pendingOrder).length,
        };
        const needle = opts.q?.trim().toLowerCase();
        let rows = all.map(decorate).filter((i) => {
            if (opts.category && opts.category !== 'all' && i.category !== opts.category)
                return false;
            if (needle && !`${i.name} ${i.sku}`.toLowerCase().includes(needle))
                return false;
            if (opts.status === 'pending')
                return i.pendingOrder;
            if (opts.status && opts.status !== 'all' && i.status !== opts.status)
                return false;
            return true;
        });
        const SORTS = {
            name: (a, b) => a.name.localeCompare(b.name, 'de'),
            sku: (a, b) => a.sku.localeCompare(b.sku),
            stock: (a, b) => a.stockLevel / (a.safetyThreshold || 1) - b.stockLevel / (b.safetyThreshold || 1),
            category: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
        };
        rows = [...rows].sort(SORTS[opts.sort ?? 'name'] ?? SORTS.name);
        const shortages = all
            .map(decorate)
            .filter((i) => i.status === 'critical')
            .sort((a, b) => a.stockLevel / (a.safetyThreshold || 1) - b.stockLevel / (b.safetyThreshold || 1));
        return { items: rows, stats, shortages, categories: [...new Set(all.map((i) => i.category))].sort() };
    }
    async createItem(userId, data) {
        const org = await this.orgOf(userId);
        const sku = data.sku.trim().toUpperCase();
        const exists = await this.prisma.inventoryItem.findFirst({
            where: { orgId: org.id, sku },
        });
        if (exists && !exists.active) {
            const revived = await this.prisma.inventoryItem.update({
                where: { id: exists.id },
                data: { ...data, sku, active: true, pendingOrder: false, reorderQty: null },
            });
            await this.trail(userId, revived.id, 'INVENTORY_ITEM_RESTORED', { sku });
            return revived;
        }
        if (exists)
            throw new common_1.ConflictException('SKU_TAKEN');
        const item = await this.prisma.inventoryItem.create({
            data: { ...data, sku, orgId: org.id },
        });
        await this.trail(userId, item.id, 'INVENTORY_ITEM_CREATED', {
            sku,
            name: item.name,
            stockLevel: item.stockLevel,
        });
        return item;
    }
    async updateItem(userId, itemId, data) {
        const item = await this.itemOf(userId, itemId);
        const updated = await this.prisma.inventoryItem.update({
            where: { id: itemId },
            data,
        });
        const wasCritical = this.stockStatus(item.stockLevel, item.safetyThreshold);
        const nowCritical = this.stockStatus(updated.stockLevel, updated.safetyThreshold);
        if (nowCritical === 'critical' && wasCritical !== 'critical') {
            this.notifications.publish({
                target: { orgId: item.orgId },
                kind: 'stock_low',
                severity: 'critical',
                title: updated.name,
                text: `Kritischer Engpass — nur noch ${updated.stockLevel} ${updated.unit} auf Lager.`,
                href: '/pharmacy/inventory',
            });
        }
        if (data.stockLevel != null && data.stockLevel !== item.stockLevel) {
            await this.trail(userId, itemId, 'INVENTORY_STOCK_CORRECTED', {
                from: item.stockLevel,
                to: data.stockLevel,
                delta: Math.round((data.stockLevel - item.stockLevel) * 100) / 100,
                unit: item.unit,
            });
        }
        const { stockLevel: _ignored, ...master } = data;
        if (Object.keys(master).length > 0) {
            await this.trail(userId, itemId, 'INVENTORY_ITEM_UPDATED', master);
        }
        return updated;
    }
    async reorderItem(userId, itemId, qty) {
        const item = await this.itemOf(userId, itemId);
        if (item.pendingOrder)
            throw new common_1.ConflictException('ORDER_ALREADY_OPEN');
        const quantity = qty ?? Math.max(1, Math.round(item.safetyThreshold * 2 - item.stockLevel));
        const updated = await this.prisma.inventoryItem.update({
            where: { id: itemId },
            data: { pendingOrder: true, reorderQty: quantity, orderedAt: new Date() },
        });
        await this.trail(userId, itemId, 'INVENTORY_REORDERED', {
            qty: quantity,
            unit: item.unit,
            stockAtOrder: item.stockLevel,
        });
        return updated;
    }
    async cancelOrder(userId, itemId) {
        const item = await this.itemOf(userId, itemId);
        if (!item.pendingOrder)
            throw new common_1.ConflictException('NO_OPEN_ORDER');
        const updated = await this.prisma.inventoryItem.update({
            where: { id: itemId },
            data: { pendingOrder: false, reorderQty: null, orderedAt: null },
        });
        await this.trail(userId, itemId, 'INVENTORY_ORDER_CANCELLED', {
            qty: item.reorderQty ?? 0,
        });
        return updated;
    }
    async receiveItem(userId, itemId, qty) {
        const item = await this.itemOf(userId, itemId);
        if (!item.pendingOrder)
            throw new common_1.ConflictException('NO_OPEN_ORDER');
        const received = qty ?? item.reorderQty ?? 0;
        if (received <= 0)
            throw new common_1.ConflictException('INVALID_QUANTITY');
        const stockLevel = Math.round((item.stockLevel + received) * 100) / 100;
        const updated = await this.prisma.inventoryItem.update({
            where: { id: itemId },
            data: {
                stockLevel,
                pendingOrder: false,
                reorderQty: null,
                orderedAt: null,
                lastRestockAt: new Date(),
            },
        });
        await this.trail(userId, itemId, 'INVENTORY_RECEIVED', {
            qty: received,
            unit: item.unit,
            from: item.stockLevel,
            to: stockLevel,
        });
        return updated;
    }
    async archiveItem(userId, itemId) {
        const item = await this.itemOf(userId, itemId);
        await this.prisma.inventoryItem.update({
            where: { id: itemId },
            data: { active: false, pendingOrder: false, reorderQty: null, orderedAt: null },
        });
        await this.trail(userId, itemId, 'INVENTORY_ITEM_ARCHIVED', {
            sku: item.sku,
            stockAtArchive: item.stockLevel,
        });
        return { ok: true };
    }
    async itemHistory(userId, itemId) {
        const item = await this.itemOf(userId, itemId);
        const rows = await this.prisma.auditLog.findMany({
            where: { entityType: 'InventoryItem', entityId: itemId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        return {
            item: { id: item.id, sku: item.sku, name: item.name, unit: item.unit },
            events: rows.map((r) => ({
                id: r.id,
                action: r.action,
                at: r.createdAt,
                by: [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') ||
                    r.user?.email ||
                    '—',
                metadata: r.metadata,
            })),
        };
    }
    toCsv(header, rows) {
        const escape = (v) => typeof v === 'string' && /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        return ('﻿' +
            [header, ...rows.map((r) => r.map(escape).join(';'))].join('\r\n'));
    }
    async exportLogsCsv(userId) {
        const { rows } = await this.treatmentLogs(userId, { days: 90 });
        return this.toCsv('Datum;Patient;Patienten-ID;Sorte;Dosis (g);Schmerz;Schlaf;Status', rows.map((r) => [
            r.loggedAt.toISOString().slice(0, 16).replace('T', ' '),
            r.patientName,
            r.patientRef ?? '',
            r.strain ?? '',
            r.dosageG ?? '',
            r.pain ?? '',
            r.sleep ?? '',
            r.status,
        ]));
    }
    async exportReviewsCsv(userId) {
        const { rows } = await this.reviews(userId, 'all');
        const STATUS = {
            overdue: 'Überfällig',
            dueSoon: 'Bald fällig',
            onTrack: 'Im Plan',
        };
        return this.toCsv('Patient;Patienten-ID;Paket;Letztes Review;Nächste Fälligkeit;Tage bis Fälligkeit;Status', rows.map((r) => [
            r.name,
            r.patientRef ?? '',
            r.tier,
            r.lastReviewAt ? r.lastReviewAt.toISOString().slice(0, 10) : '',
            r.dueAt.toISOString().slice(0, 10),
            r.diffDays,
            STATUS[r.status] ?? r.status,
        ]));
    }
    async exportInventoryCsv(userId) {
        const { items } = await this.inventory(userId);
        const STATUS = {
            critical: 'Kritisch',
            low: 'Niedrig',
            inStock: 'Verfügbar',
        };
        return this.toCsv('SKU;Produkt;Kategorie;THC (%);CBD (%);Bestand;Einheit;Sicherheitsbestand;Status;Bestellung offen;Bestellmenge;Bestellt am;Letzter Wareneingang', items.map((i) => [
            i.sku,
            i.name,
            i.category,
            i.thc ?? '',
            i.cbd ?? '',
            i.stockLevel,
            i.unit,
            i.safetyThreshold,
            STATUS[i.status] ?? i.status,
            i.pendingOrder ? 'ja' : 'nein',
            i.reorderQty ?? '',
            i.orderedAt ? i.orderedAt.toISOString().slice(0, 10) : '',
            i.lastRestockAt ? i.lastRestockAt.toISOString().slice(0, 10) : '',
        ]));
    }
    async exportAnalyticsCsv(userId) {
        const a = await this.analytics(userId);
        const rows = [
            ['Patientenbindung (%)', a.retention],
            ['Reviews gesamt', a.totalReviews],
            ['Ø Bewertung (1–5)', a.avgRating ?? ''],
            ['Rücklaufquote (%)', a.responseRate],
            ['Tarif', a.billing.planName],
            ['Monatliche Grundgebühr (EUR)', a.billing.monthlyPrice ?? ''],
            ['Inklusive Reviews', a.billing.reviewCap ?? 'unbegrenzt'],
            ['Reviews in diesem Monat', a.billing.reviewsThisMonth],
            ['Preis pro Review (EUR)', a.billing.unitPrice],
            ['Voraussichtliche Kosten (EUR)', a.billing.projectedCost],
            [],
            ['Monat', 'Einträge', 'Ø Lebensqualität'],
            ...a.months.map((m) => [m.month, m.entries, m.avgQol ?? '']),
        ];
        return this.toCsv('Kennzahl;Wert', rows);
    }
};
exports.PharmacyService = PharmacyService;
exports.PharmacyService = PharmacyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], PharmacyService);
//# sourceMappingURL=pharmacy.service.js.map