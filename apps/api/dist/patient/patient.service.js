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
exports.PatientService = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const PLAN_DAYS = 90;
let PatientService = class PatientService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async profileOf(userId) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { userId },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        if (!profile)
            throw new common_1.NotFoundException('NO_PATIENT_PROFILE');
        return profile;
    }
    async branding(userId) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { userId },
            select: { orgId: true, pharmacyId: true },
        });
        if (!profile)
            throw new common_1.NotFoundException('NO_PATIENT_PROFILE');
        const candidates = [profile.orgId, profile.pharmacyId].filter((id) => !!id);
        const orgs = await this.prisma.organization.findMany({
            where: { id: { in: candidates } },
            select: {
                id: true,
                name: true,
                branding: true,
                parentOrg: { select: { name: true, branding: true } },
            },
        });
        const ordered = candidates
            .map((id) => orgs.find((o) => o.id === id))
            .filter((o) => !!o);
        const hasTheme = (b) => !!(b?.primaryColor || b?.accentColor || b?.logoUrl || b?.fontFamily);
        for (const org of ordered) {
            const own = org.branding;
            if (hasTheme(own)) {
                return { partner: org.name, ...own, poweredBy: 'Powered by Cannathera' };
            }
        }
        for (const org of ordered) {
            const parent = org.parentOrg?.branding;
            if (hasTheme(parent)) {
                return {
                    partner: org.parentOrg.name,
                    ...parent,
                    poweredBy: 'Powered by Cannathera',
                };
            }
        }
        return {
            partner: null,
            logoUrl: null,
            primaryColor: null,
            accentColor: null,
            fontFamily: null,
            poweredBy: 'Powered by Cannathera',
        };
    }
    async summary(userId) {
        const profile = await this.profileOf(userId);
        const start = profile.therapyStart ?? profile.createdAt;
        const day = Math.min(PLAN_DAYS, Math.max(1, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1));
        const since = new Date(Date.now() - 30 * 86_400_000);
        const logs = await this.prisma.therapyLog.findMany({
            where: { patientId: profile.id, loggedAt: { gte: since } },
            orderBy: { loggedAt: 'asc' },
        });
        const windowDays = Math.min(30, day);
        const loggedDays = new Set(logs.map((l) => l.loggedAt.toISOString().slice(0, 10)));
        const adherence = windowDays
            ? Math.min(100, Math.round((loggedDays.size / windowDays) * 100))
            : 0;
        const today = new Date().toISOString().slice(0, 10);
        const todayLogged = loggedDays.has(today);
        const metric = (l, key) => l ? (l.metrics?.[key] ?? null) : null;
        const last = logs.at(-1);
        const weekAgoIdx = logs.findIndex((l) => l.loggedAt.getTime() >= Date.now() - 7 * 86_400_000);
        const prev = weekAgoIdx > 0 ? logs[weekAgoIdx - 1] : logs[0];
        const stats = ['pain', 'sleep', 'activity', 'qol'].map((key) => {
            const current = metric(last, key);
            const before = metric(prev, key);
            return {
                key,
                value: current,
                delta: current !== null && before !== null
                    ? Math.round((current - before) * 10) / 10
                    : null,
            };
        });
        const nextAppointment = await this.prisma.telemedicineSession.findFirst({
            where: { patientId: profile.id, scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: 'asc' },
        });
        return {
            firstName: profile.user.firstName,
            day,
            planDays: PLAN_DAYS,
            adherence,
            todayLogged,
            lastDosageG: last?.dosageG ?? null,
            lastStrain: last?.strain ?? null,
            stats,
            nextAppointment,
        };
    }
    async createLog(userId, data) {
        const profile = await this.profileOf(userId);
        const log = await this.prisma.therapyLog.create({
            data: {
                patientId: profile.id,
                loggedAt: new Date(),
                dosageG: data.dosageG,
                strain: data.strain,
                metrics: data.metrics,
                note: data.note,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'THERAPY_LOG_CREATED',
                entityType: 'TherapyLog',
                entityId: log.id,
            },
        });
        const hits = [];
        if (data.metrics.pain != null && data.metrics.pain >= 9) {
            hits.push({
                severity: 'CRITICAL',
                message: 'Sehr starke Schmerzen im Tageseintrag (NRS ≥ 9) — ärztliche Prüfung erforderlich.',
            });
        }
        if (data.metrics.sleep != null && data.metrics.sleep <= 2) {
            hits.push({
                severity: 'WARNING',
                message: 'Sehr schlechte Schlafqualität im Tageseintrag (≤ 2/10).',
            });
        }
        if (hits.length) {
            await this.prisma.redFlagHit.createMany({
                data: hits.map((h) => ({
                    patientId: profile.id,
                    severity: h.severity,
                    message: h.message,
                    source: 'daily_log',
                })),
            });
        }
        const patientName = [profile.user.firstName, profile.user.lastName].filter(Boolean).join(' ') ||
            profile.user.email;
        const worst = hits.find((h) => h.severity === 'CRITICAL') ?? hits[0];
        for (const orgId of [profile.orgId, profile.pharmacyId].filter((id) => !!id)) {
            if (worst) {
                this.notifications.publish({
                    target: { orgId },
                    kind: 'red_flag',
                    severity: worst.severity === 'CRITICAL' ? 'critical' : 'warning',
                    title: patientName,
                    text: worst.message,
                    href: `/doctor/patients/${profile.id}`,
                });
            }
            else {
                this.notifications.publish({
                    target: { orgId },
                    kind: 'log_submitted',
                    severity: 'info',
                    title: patientName,
                    text: 'Neuer Tageseintrag erfasst.',
                    href: `/doctor/patients/${profile.id}`,
                });
            }
        }
        return log;
    }
    async stats(userId, days = 7) {
        const profile = await this.profileOf(userId);
        const since = new Date(Date.now() - days * 86_400_000);
        const logs = await this.prisma.therapyLog.findMany({
            where: { patientId: profile.id, loggedAt: { gte: since } },
            orderBy: { loggedAt: 'asc' },
        });
        const series = logs.map((l) => {
            const m = l.metrics ?? {};
            return {
                date: l.loggedAt.toISOString().slice(0, 10),
                dosageMg: l.dosageG !== null ? Math.round((l.dosageG ?? 0) * 1000) : null,
                pain: m.pain ?? null,
                sleep: m.sleep ?? null,
                activity: m.activity ?? null,
                qol: m.qol ?? null,
                relief: m.pain != null ? Math.round((10 - m.pain) * 10) : null,
            };
        });
        const reliefVals = series.map((s) => s.relief).filter((v) => v != null);
        const efficacy = reliefVals.length
            ? Math.round(reliefVals.reduce((a, b) => a + b, 0) / reliefVals.length)
            : null;
        const totalDosageMg = series.reduce((a, s) => a + (s.dosageMg ?? 0), 0);
        const summary = await this.summary(userId);
        return {
            efficacy,
            totalDosageMg,
            adherence: summary.adherence,
            day: summary.day,
            planDays: summary.planDays,
            series,
        };
    }
    async rescheduleAppointment(userId, sessionId, scheduledAt) {
        const profile = await this.profileOf(userId);
        const session = await this.prisma.telemedicineSession.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.patientId !== profile.id) {
            throw new common_1.NotFoundException('APPOINTMENT_NOT_FOUND');
        }
        const updated = await this.prisma.telemedicineSession.update({
            where: { id: sessionId },
            data: { scheduledAt: new Date(scheduledAt) },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'APPOINTMENT_RESCHEDULED_BY_PATIENT',
                entityType: 'TelemedicineSession',
                entityId: sessionId,
            },
        });
        return updated;
    }
    async appointments(userId) {
        const profile = await this.profileOf(userId);
        const now = new Date();
        const [upcoming, past] = await Promise.all([
            this.prisma.telemedicineSession.findMany({
                where: { patientId: profile.id, scheduledAt: { gte: now } },
                orderBy: { scheduledAt: 'asc' },
            }),
            this.prisma.telemedicineSession.findMany({
                where: { patientId: profile.id, scheduledAt: { lt: now } },
                orderBy: { scheduledAt: 'desc' },
                take: 10,
            }),
        ]);
        return { upcoming, past };
    }
    async profile(userId) {
        const p = await this.profileOf(userId);
        const pharmacies = await this.prisma.organization.findMany({
            where: { type: 'PHARMACY' },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });
        return {
            fullName: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
            patientRef: p.patientRef ?? `CT-${p.id.slice(-6).toUpperCase()}`,
            email: p.user.email,
            pharmacyOrgId: p.pharmacyId,
            pharmacies,
        };
    }
    async updateProfile(userId, data) {
        const p = await this.profileOf(userId);
        if (data.firstName !== undefined || data.lastName !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { firstName: data.firstName, lastName: data.lastName },
            });
        }
        if (data.pharmacyOrgId !== undefined) {
            if (data.pharmacyOrgId) {
                const org = await this.prisma.organization.findFirst({
                    where: { id: data.pharmacyOrgId, type: 'PHARMACY' },
                    select: { id: true },
                });
                if (!org)
                    throw new common_1.BadRequestException('INVALID_PHARMACY');
            }
            await this.prisma.patientProfile.update({
                where: { id: p.id },
                data: { pharmacyId: data.pharmacyOrgId },
            });
        }
        await this.prisma.auditLog.create({
            data: { userId, action: 'PROFILE_UPDATED', entityType: 'PatientProfile', entityId: p.id },
        });
        return this.profile(userId);
    }
    async plan(userId) {
        const summary = await this.summary(userId);
        const phases = [
            { key: 'initialAssessment', day: 1 },
            { key: 'titrationCommencement', day: 14 },
            { key: 'doseAdjustmentReview', day: 45 },
            { key: 'monthlyClinicalReview', day: 60 },
            { key: 'cycleCompletion', day: 90 },
        ].map((p, i, arr) => {
            const next = arr[i + 1]?.day ?? PLAN_DAYS + 1;
            let status;
            if (summary.day >= next)
                status = 'achieved';
            else if (summary.day >= p.day)
                status = 'inProgress';
            else
                status = 'pending';
            return { ...p, status };
        });
        const progressPct = Math.round((summary.day / PLAN_DAYS) * 100);
        return { day: summary.day, planDays: PLAN_DAYS, progressPct, phases };
    }
};
exports.PatientService = PatientService;
exports.PatientService = PatientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], PatientService);
//# sourceMappingURL=patient.service.js.map