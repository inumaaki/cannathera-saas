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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const path_1 = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const report_template_1 = require("./report-template");
const REPORT_DIR = (0, path_1.join)(process.cwd(), 'storage', 'reports');
const METRIC_META = [
    { key: 'pain', label: 'Schmerz (NRS 0–10)', unit: '/10', betterWhenDown: true },
    { key: 'sleep', label: 'Schlafqualität (0–10)', unit: '/10', betterWhenDown: false },
    { key: 'activity', label: 'Aktivität (0–10)', unit: '/10', betterWhenDown: false },
    { key: 'qol', label: 'Lebensqualität (0–10)', unit: '/10', betterWhenDown: false },
];
const PERIOD_DAYS = {
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
    LONG_TERM: null,
};
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertCanAccessPatient(userId, patientId) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { id: patientId },
            select: { userId: true, orgId: true, pharmacyId: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
        if (profile.userId === userId)
            return;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, memberships: { select: { orgId: true } } },
        });
        if (!user || user.role === client_1.Role.PATIENT)
            throw new common_1.ForbiddenException('FORBIDDEN');
        const orgIds = user.memberships.map((m) => m.orgId);
        const onCase = (profile.orgId && orgIds.includes(profile.orgId)) ||
            (profile.pharmacyId && orgIds.includes(profile.pharmacyId));
        if (!onCase)
            throw new common_1.ForbiddenException('PATIENT_NOT_IN_ORGANIZATION');
    }
    async buildData(patientId, type) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { id: patientId },
            include: {
                user: { select: { firstName: true, lastName: true } },
                org: { select: { name: true, branding: true } },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
        const therapyStart = profile.therapyStart ?? profile.createdAt;
        const periodEnd = new Date();
        const days = PERIOD_DAYS[type];
        const periodStart = days === null
            ? therapyStart
            : new Date(Math.max(therapyStart.getTime(), periodEnd.getTime() - days * 86_400_000));
        const [logs, submissions, redFlags] = await Promise.all([
            this.prisma.therapyLog.findMany({
                where: { patientId, loggedAt: { gte: periodStart, lte: periodEnd } },
                orderBy: { loggedAt: 'asc' },
            }),
            this.prisma.submission.findMany({
                where: {
                    patientId,
                    status: 'SUBMITTED',
                    submittedAt: { gte: periodStart, lte: periodEnd },
                },
                orderBy: { submittedAt: 'desc' },
                include: {
                    answers: { include: { question: { include: { options: true } } } },
                },
            }),
            this.prisma.redFlagHit.findMany({
                where: { patientId, createdAt: { gte: periodStart, lte: periodEnd } },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const weekBuckets = new Map();
        let totalG = 0;
        for (const l of logs) {
            if (l.dosageG == null)
                continue;
            totalG += l.dosageG;
            const week = Math.floor((l.loggedAt.getTime() - periodStart.getTime()) / (7 * 86_400_000));
            const bucket = weekBuckets.get(week) ?? [];
            bucket.push(l.dosageG);
            weekBuckets.set(week, bucket);
        }
        const avg = (a) => a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100 : null;
        const weeks = [...weekBuckets.entries()]
            .sort(([a], [b]) => a - b)
            .map(([w, vals]) => ({ label: `Woche ${w + 1}`, avgG: avg(vals) }));
        const dosedLogs = logs.filter((l) => l.dosageG != null);
        const avgDailyG = avg(dosedLogs.map((l) => l.dosageG));
        const strainCount = new Map();
        for (const l of logs) {
            if (!l.strain)
                continue;
            strainCount.set(l.strain, (strainCount.get(l.strain) ?? 0) + 1);
        }
        const strains = [...strainCount.entries()]
            .map(([name, d]) => ({ name, days: d }))
            .sort((a, b) => b.days - a.days);
        const firstOf = (k) => logs.find((l) => l.metrics?.[k] != null);
        const lastOf = (k) => [...logs].reverse().find((l) => l.metrics?.[k] != null);
        const metrics = METRIC_META.map((m) => {
            const start = firstOf(m.key)?.metrics?.[m.key] ?? null;
            const end = lastOf(m.key)?.metrics?.[m.key] ?? null;
            const changePct = start != null && end != null && start !== 0
                ? Math.round(((end - start) / start) * 100)
                : null;
            return { ...m, start, end, changePct };
        });
        const loggedDays = new Set(logs.map((l) => l.loggedAt.toISOString().slice(0, 10))).size;
        const totalDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86_400_000));
        const adherence = {
            loggedDays,
            totalDays,
            pct: Math.min(100, Math.round((loggedDays / totalDays) * 100)),
        };
        const review = submissions[0];
        const answerOf = (key) => {
            const a = review?.answers.find((x) => x.question.key === key);
            if (!a)
                return null;
            const raw = a.value;
            if (Array.isArray(raw)) {
                return raw.map((v) => a.question.options.find((o) => o.value === v)?.label ?? String(v));
            }
            if (typeof raw === 'string') {
                return a.question.options.find((o) => o.value === raw)?.label ?? raw;
            }
            return raw;
        };
        const sideEffectsRaw = answerOf('sideEffects');
        const sideEffects = Array.isArray(sideEffectsRaw)
            ? sideEffectsRaw.filter((s) => s.toLowerCase() !== 'keine')
            : [];
        const satisfaction = typeof answerOf('satisfaction') === 'number'
            ? answerOf('satisfaction')
            : null;
        const goalsReached = typeof answerOf('goalsReached') === 'string' ? answerOf('goalsReached') : null;
        const notes = typeof answerOf('notes') === 'string' ? answerOf('notes') : null;
        const prep = [];
        const pain = metrics.find((m) => m.key === 'pain');
        const sleep = metrics.find((m) => m.key === 'sleep');
        if (pain?.end != null && pain.end >= 6) {
            prep.push('Aktuelle Dosierung überprüfen — Schmerzniveau weiterhin erhöht.');
        }
        else {
            prep.push('Aktuelle Dosierung beibehalten oder leicht anpassen?');
        }
        if (sleep?.changePct != null && sleep.changePct < 0) {
            prep.push('Schlafentwicklung besprechen — Werte rückläufig.');
        }
        else {
            prep.push('Weiterbeobachtung der Schlaf- und Schmerzentwicklung.');
        }
        if (strains.length > 1)
            prep.push('Prüfung, ob eine Sortenanpassung sinnvoll ist.');
        if (sideEffects.length) {
            prep.push(`Nebenwirkungen besprechen: ${sideEffects.join(', ')}.`);
        }
        prep.push('Langfristige Zielsetzung und weiterer Therapieplan.');
        const improved = metrics.filter((m) => m.changePct != null &&
            (m.betterWhenDown ? m.changePct < 0 : m.changePct > 0)).length;
        const summary = logs.length === 0
            ? 'Für diesen Zeitraum liegen keine Tageseinträge vor.'
            : `Der dokumentierte Therapieverlauf zeigt in ${improved} von ${metrics.length} Bereichen eine positive Entwicklung. ` +
                `Die Therapietreue liegt bei ${adherence.pct} %. ` +
                (sideEffects.length
                    ? `Berichtete Nebenwirkungen: ${sideEffects.join(', ')}.`
                    : 'Die Therapie wird gut vertragen.');
        const branding = (profile.org?.branding ?? null);
        const therapyDay = Math.max(1, Math.floor((periodEnd.getTime() - therapyStart.getTime()) / 86_400_000) + 1);
        return {
            type,
            periodStart,
            periodEnd,
            generatedAt: new Date(),
            patient: {
                name: [profile.user.firstName, profile.user.lastName].filter(Boolean).join(' '),
                patientRef: profile.patientRef,
                dateOfBirth: profile.dateOfBirth,
                therapyDay,
            },
            practice: profile.org
                ? { name: profile.org.name, logoUrl: branding?.logoUrl ?? null }
                : null,
            dosage: { weeks, avgDailyG, totalG: Math.round(totalG * 100) / 100 },
            strains,
            metrics,
            adherence,
            sideEffects,
            satisfaction,
            goalsReached,
            notes,
            redFlags: redFlags.map((f) => ({
                severity: f.severity,
                message: f.message,
                createdAt: f.createdAt,
            })),
            nextAppointmentPrep: prep,
            summary,
        };
    }
    async generate(requestedByUserId, patientId, type) {
        const user = await this.prisma.user.findUnique({
            where: { id: requestedByUserId },
            select: {
                role: true,
                memberships: {
                    select: {
                        org: {
                            select: {
                                subscriptions: {
                                    where: { isActive: true },
                                    select: { id: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('USER_NOT_FOUND');
        if (user.role === client_1.Role.PATIENT) {
            const profile = await this.prisma.patientProfile.findUnique({
                where: { id: patientId },
                select: { packageTier: true },
            });
            if (!profile)
                throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
            if (profile.packageTier === client_1.SubscriptionTier.BASIC) {
                throw new common_1.ForbiddenException('UPGRADE_REQUIRED');
            }
        }
        else {
            const hasActiveSub = user.memberships.some((m) => m.org.subscriptions.length > 0);
            if (!hasActiveSub) {
                throw new common_1.ForbiddenException('PARTNER_INACTIVE');
            }
            const profile = await this.prisma.patientProfile.findUnique({
                where: { id: patientId },
                select: { packageTier: true },
            });
            if (!profile)
                throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
            if (profile.packageTier === client_1.SubscriptionTier.BASIC) {
                throw new common_1.ForbiddenException('UPGRADE_REQUIRED');
            }
        }
        const data = await this.buildData(patientId, type);
        const buffer = await (0, report_template_1.renderReportPdf)(data);
        const fs = await import('fs/promises');
        const path = await import('path');
        const dir = REPORT_DIR;
        await fs.mkdir(dir, { recursive: true });
        const stamp = data.periodEnd.toISOString().slice(0, 10);
        const filename = `cannathera-${type.toLowerCase()}-${data.patient.patientRef ?? patientId}-${stamp}.pdf`;
        await fs.writeFile(path.join(dir, filename), buffer);
        const report = await this.prisma.report.create({
            data: {
                patientId,
                type,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                fileUrl: filename,
                generatedAt: new Date(),
                coBranded: !!data.practice?.logoUrl,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: requestedByUserId,
                action: 'REPORT_GENERATED',
                entityType: 'Report',
                entityId: report.id,
                metadata: { type, patientId },
            },
        });
        return { buffer, filename, reportId: report.id };
    }
    async history(patientId) {
        return this.prisma.report.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                type: true,
                periodStart: true,
                periodEnd: true,
                fileUrl: true,
                generatedAt: true,
            },
        });
    }
    async fileById(userId, reportId) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
            select: { id: true, patientId: true, fileUrl: true, type: true },
        });
        if (!report)
            throw new common_1.NotFoundException('REPORT_NOT_FOUND');
        await this.assertCanAccessPatient(userId, report.patientId);
        const fs = await import('fs/promises');
        const path = await import('path');
        const filename = path.basename(report.fileUrl ?? '');
        const full = path.join(REPORT_DIR, filename);
        let buffer;
        try {
            if (!filename)
                throw new Error('NO_FILE');
            buffer = await fs.readFile(full);
        }
        catch {
            ({ buffer } = await this.generate(userId, report.patientId, report.type));
        }
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'REPORT_DOWNLOADED',
                entityType: 'Report',
                entityId: report.id,
            },
        });
        return { buffer, filename };
    }
    async patientIdOfUser(userId) {
        const p = await this.prisma.patientProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!p)
            throw new common_1.NotFoundException('NO_PATIENT_PROFILE');
        return p.id;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map