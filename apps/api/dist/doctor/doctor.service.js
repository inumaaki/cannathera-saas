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
exports.DoctorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let DoctorService = class DoctorService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async orgIdOf(doctorUserId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
            select: { orgId: true },
        });
        if (!membership)
            throw new common_1.NotFoundException('NO_ORGANIZATION');
        return membership.orgId;
    }
    async assertPatientInPractice(doctorUserId, patientId) {
        const orgId = await this.orgIdOf(doctorUserId);
        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: patientId },
            select: { orgId: true },
        });
        if (!patient)
            throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
        if (patient.orgId !== orgId) {
            throw new common_1.ForbiddenException('PATIENT_NOT_IN_PRACTICE');
        }
        return orgId;
    }
    async overview(doctorUserId) {
        const orgId = await this.orgIdOf(doctorUserId);
        const scope = { orgId };
        const [patients, openFlags, todaysSessions, topAlerts] = await Promise.all([
            this.patients(doctorUserId),
            this.prisma.redFlagHit.count({
                where: { acknowledged: false, patient: scope },
            }),
            this.prisma.telemedicineSession.findMany({
                where: {
                    patient: scope,
                    scheduledAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(24, 0, 0, 0)),
                    },
                },
                orderBy: { scheduledAt: 'asc' },
                include: {
                    patient: {
                        include: { user: { select: { firstName: true, lastName: true } } },
                    },
                },
            }),
            this.redFlags(doctorUserId),
        ]);
        const since = new Date(Date.now() - 30 * 86_400_000);
        const recentLogs = await this.prisma.therapyLog.findMany({
            where: { loggedAt: { gte: since }, patient: scope },
            select: { patientId: true, loggedAt: true },
        });
        const daysByPatient = new Map();
        for (const l of recentLogs) {
            const set = daysByPatient.get(l.patientId) ?? new Set();
            set.add(l.loggedAt.toISOString().slice(0, 10));
            daysByPatient.set(l.patientId, set);
        }
        const adherences = patients
            .filter((p) => p.day !== null)
            .map((p) => {
            const window = Math.min(30, p.day ?? 30);
            const logged = daysByPatient.get(p.id)?.size ?? 0;
            return Math.min(100, Math.round((logged / window) * 100));
        });
        const avgAdherence = adherences.length
            ? Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length)
            : null;
        return {
            activePatients: patients.length,
            appointmentsToday: todaysSessions.length,
            nextAppointment: todaysSessions.find((s) => s.scheduledAt > new Date()) ?? null,
            openRedFlags: openFlags,
            avgAdherence,
            appointments: todaysSessions.map((s) => ({
                id: s.id,
                patientId: s.patientId,
                patientName: [s.patient.user.firstName, s.patient.user.lastName]
                    .filter(Boolean)
                    .join(' '),
                scheduledAt: s.scheduledAt,
                video: !!s.joinUrl,
            })),
            alerts: topAlerts.slice(0, 3),
        };
    }
    async reportsSummary(doctorUserId, days = 30) {
        const orgId = await this.orgIdOf(doctorUserId);
        const scope = { orgId };
        const logs = await this.prisma.therapyLog.findMany({
            where: {
                patient: scope,
                ...(days > 0
                    ? { loggedAt: { gte: new Date(Date.now() - days * 86_400_000) } }
                    : {}),
            },
            orderBy: { loggedAt: 'asc' },
            select: { loggedAt: true, metrics: true, patientId: true },
        });
        const byMonth = new Map();
        for (const l of logs) {
            const m = l.metrics ?? {};
            const key = l.loggedAt.toISOString().slice(0, 7);
            const bucket = byMonth.get(key) ?? { pain: [], sleep: [] };
            if (m.pain != null)
                bucket.pain.push(m.pain);
            if (m.sleep != null)
                bucket.sleep.push(m.sleep);
            byMonth.set(key, bucket);
        }
        const avg = (a) => a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : null;
        const trend = [...byMonth.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, v]) => ({ month, pain: avg(v.pain), sleep: avg(v.sleep) }));
        const first = trend[0]?.pain;
        const last = trend.at(-1)?.pain;
        const painReduction = first != null && last != null && first > 0
            ? Math.round(((first - last) / first) * 100)
            : null;
        const profiles = await this.prisma.patientProfile.findMany({
            where: scope,
            select: { therapyStart: true, createdAt: true },
        });
        const phases = { phase1: 0, phase2: 0, phase3: 0 };
        for (const p of profiles) {
            const start = p.therapyStart ?? p.createdAt;
            const day = Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1;
            if (day <= 30)
                phases.phase1++;
            else if (day <= 60)
                phases.phase2++;
            else
                phases.phase3++;
        }
        const submissions = await this.prisma.submission.findMany({
            where: { status: client_1.SubmissionStatus.SUBMITTED, patient: scope },
            orderBy: { submittedAt: 'desc' },
            take: 10,
            include: {
                patient: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                redFlagHits: { select: { severity: true } },
                answers: { include: { question: { select: { key: true } } } },
            },
        });
        const rows = submissions.map((s) => {
            const satisfaction = s.answers.find((a) => a.question.key === 'satisfaction')
                ?.value;
            const critical = s.redFlagHits.some((h) => h.severity === 'CRITICAL');
            return {
                id: s.id,
                patientId: s.patientId,
                patientName: [s.patient.user.firstName, s.patient.user.lastName]
                    .filter(Boolean)
                    .join(' '),
                patientRef: s.patient.patientRef,
                submittedAt: s.submittedAt,
                compliance: satisfaction != null ? satisfaction * 10 : null,
                risk: critical ? 'high' : s.redFlagHits.length ? 'moderate' : 'low',
            };
        });
        return { trend, painReduction, phases, rows, totalLogs: logs.length };
    }
    async practice(doctorUserId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
            include: { org: true },
        });
        return membership?.org ?? null;
    }
    async updatePractice(doctorUserId, data) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
        });
        if (!membership)
            throw new common_1.NotFoundException('NO_ORGANIZATION');
        const existing = await this.prisma.organization.findUniqueOrThrow({
            where: { id: membership.orgId },
        });
        const org = await this.prisma.organization.update({
            where: { id: membership.orgId },
            data: {
                name: data.name ?? undefined,
                branding: data.branding
                    ? {
                        ...(existing.branding ?? {}),
                        ...data.branding,
                    }
                    : undefined,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'PRACTICE_UPDATED',
                entityType: 'Organization',
                entityId: org.id,
            },
        });
        return org;
    }
    async patients(doctorUserId) {
        const orgId = await this.orgIdOf(doctorUserId);
        const profiles = await this.prisma.patientProfile.findMany({
            where: { orgId },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                therapyLogs: { orderBy: { loggedAt: 'desc' }, take: 1 },
                redFlagHits: { where: { acknowledged: false }, select: { severity: true } },
                _count: { select: { submissions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const since = new Date(Date.now() - 30 * 86_400_000);
        const recent = await this.prisma.therapyLog.findMany({
            where: { loggedAt: { gte: since }, patient: { orgId } },
            select: { patientId: true, loggedAt: true },
        });
        const daysByPatient = new Map();
        for (const l of recent) {
            const set = daysByPatient.get(l.patientId) ?? new Set();
            set.add(l.loggedAt.toISOString().slice(0, 10));
            daysByPatient.set(l.patientId, set);
        }
        return profiles.map((p) => {
            const metrics = p.therapyLogs[0]?.metrics ?? null;
            const critical = p.redFlagHits.filter((h) => h.severity === client_1.RedFlagSeverity.CRITICAL).length;
            const start = p.therapyStart ?? p.createdAt;
            const day = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1);
            const adherence = Math.min(100, Math.round(((daysByPatient.get(p.id)?.size ?? 0) / Math.min(30, day)) * 100));
            return {
                adherence,
                id: p.id,
                name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
                email: p.user.email,
                patientRef: p.patientRef,
                therapyStart: p.therapyStart,
                day,
                lastLogAt: p.therapyLogs[0]?.loggedAt ?? null,
                lastPain: metrics?.pain ?? null,
                openFlags: p.redFlagHits.length,
                criticalFlags: critical,
                submissions: p._count.submissions,
            };
        });
    }
    async redFlags(doctorUserId, view = 'unreviewed') {
        const orgId = await this.orgIdOf(doctorUserId);
        const hits = await this.prisma.redFlagHit.findMany({
            where: {
                patient: { orgId },
                ...(view === 'all' ? {} : { acknowledged: view === 'reviewed' }),
            },
            orderBy: [{ acknowledged: 'asc' }, { severity: 'desc' }, { createdAt: 'desc' }],
            take: 100,
            include: {
                patient: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                submission: {
                    select: {
                        id: true,
                        submittedAt: true,
                        version: { select: { questionnaire: { select: { key: true, title: true } } } },
                    },
                },
            },
        });
        return hits.map((h) => ({
            id: h.id,
            severity: h.severity,
            message: h.message,
            createdAt: h.createdAt,
            acknowledged: h.acknowledged,
            source: h.source,
            patientId: h.patientId,
            patientName: [h.patient.user.firstName, h.patient.user.lastName]
                .filter(Boolean)
                .join(' '),
            patientRef: h.patient.patientRef,
            submissionId: h.submissionId,
            questionnaire: h.submission?.version.questionnaire.title ?? 'Tageseintrag',
            submittedAt: h.submission?.submittedAt ?? h.createdAt,
        }));
    }
    async createPatient(doctorUserId, data) {
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existing)
            throw new common_1.ConflictException('EMAIL_TAKEN');
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
        });
        const argon2 = await import('argon2');
        const { randomBytes } = await import('crypto');
        const tempPassword = this.generateTempPassword();
        const user = await this.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash: await argon2.hash(tempPassword),
                mustChangePassword: true,
                role: 'PATIENT',
                firstName: data.firstName,
                lastName: data.lastName,
                patientProfile: {
                    create: {
                        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                        therapyStart: new Date(),
                        orgId: membership?.orgId,
                        patientRef: `CT-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2)
                            .toString('hex')
                            .toUpperCase()
                            .slice(0, 3)}`,
                    },
                },
            },
            include: { patientProfile: true },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'PATIENT_CREATED_BY_DOCTOR',
                entityType: 'PatientProfile',
                entityId: user.patientProfile.id,
            },
        });
        return {
            patientId: user.patientProfile.id,
            patientRef: user.patientProfile.patientRef,
            email: user.email,
            tempPassword,
        };
    }
    generateTempPassword() {
        const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        const { randomInt } = require('crypto');
        const pick = (n) => Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join('');
        return `${pick(4)}-${pick(4)}-${pick(2)}`;
    }
    async addNote(doctorUserId, patientId, text) {
        await this.assertPatientInPractice(doctorUserId, patientId);
        const note = await this.prisma.clinicalNote.create({
            data: { patientId, authorId: doctorUserId, text },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'CLINICAL_NOTE_ADDED',
                entityType: 'ClinicalNote',
                entityId: note.id,
            },
        });
        return note;
    }
    async team(doctorUserId) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
        });
        if (!membership)
            return [];
        const members = await this.prisma.membership.findMany({
            where: { orgId: membership.orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isActive: true,
                        mustChangePassword: true,
                        emailVerified: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return members.map((m) => ({
            membershipId: m.id,
            userId: m.user.id,
            name: [m.user.firstName, m.user.lastName].filter(Boolean).join(' '),
            email: m.user.email,
            roleInOrg: m.roleInOrg,
            orgRole: m.orgRole,
            permissions: m.permissions,
            pending: m.user.mustChangePassword,
            active: m.user.isActive,
            since: m.createdAt,
        }));
    }
    async updateTeamMember(adminUserId, membershipId, data) {
        const admin = await this.prisma.membership.findFirst({
            where: { userId: adminUserId },
        });
        const target = await this.prisma.membership.findUnique({
            where: { id: membershipId },
        });
        if (!admin || !target || target.orgId !== admin.orgId) {
            throw new common_1.NotFoundException('MEMBER_NOT_FOUND');
        }
        if (target.id === admin.id &&
            data.permissions &&
            !data.permissions.includes('settings:team')) {
            throw new common_1.ConflictException('CANNOT_REMOVE_OWN_TEAM_PERMISSION');
        }
        const updated = await this.prisma.membership.update({
            where: { id: membershipId },
            data: {
                orgRole: data.orgRole,
                permissions: data.permissions,
                roleInOrg: client_1.Role.DOCTOR,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'TEAM_MEMBER_UPDATED',
                entityType: 'Membership',
                entityId: membershipId,
                metadata: { orgRole: data.orgRole, permissions: data.permissions },
            },
        });
        return updated;
    }
    async inviteTeamMember(doctorUserId, data) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
        });
        if (!membership)
            throw new common_1.NotFoundException('NO_ORGANIZATION');
        const existing = await this.prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });
        if (existing)
            throw new common_1.ConflictException('EMAIL_TAKEN');
        const argon2 = await import('argon2');
        const tempPassword = this.generateTempPassword();
        const platformRole = client_1.Role.DOCTOR;
        const user = await this.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash: await argon2.hash(tempPassword),
                mustChangePassword: true,
                role: platformRole,
                firstName: data.firstName,
                lastName: data.lastName,
                memberships: {
                    create: {
                        orgId: membership.orgId,
                        roleInOrg: platformRole,
                        orgRole: data.orgRole,
                        permissions: data.permissions,
                    },
                },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'TEAM_MEMBER_INVITED',
                entityType: 'User',
                entityId: user.id,
                metadata: { orgRole: data.orgRole, permissions: data.permissions },
            },
        });
        return { userId: user.id, email: user.email, tempPassword };
    }
    async reschedule(doctorUserId, sessionId, scheduledAt) {
        const existing = await this.prisma.telemedicineSession.findUnique({
            where: { id: sessionId },
            select: { patientId: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('APPOINTMENT_NOT_FOUND');
        await this.assertPatientInPractice(doctorUserId, existing.patientId);
        const session = await this.prisma.telemedicineSession.update({
            where: { id: sessionId },
            data: { scheduledAt: new Date(scheduledAt) },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'APPOINTMENT_RESCHEDULED',
                entityType: 'TelemedicineSession',
                entityId: sessionId,
            },
        });
        return session;
    }
    async saveLogo(doctorUserId, file) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: doctorUserId },
        });
        if (!membership)
            throw new common_1.NotFoundException('NO_ORGANIZATION');
        const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg' }[file.mimetype] ?? null;
        if (!ext)
            throw new common_1.ConflictException('UNSUPPORTED_FILE_TYPE');
        const { randomBytes } = await import('crypto');
        const fs = await import('fs/promises');
        const path = await import('path');
        const dir = path.join(process.cwd(), 'uploads', 'public');
        await fs.mkdir(dir, { recursive: true });
        const filename = `logo-${membership.orgId}-${randomBytes(4).toString('hex')}.${ext}`;
        await fs.writeFile(path.join(dir, filename), file.buffer);
        const logoUrl = `/uploads/${filename}`;
        await this.updatePractice(doctorUserId, { branding: { logoUrl } });
        return { logoUrl };
    }
    async exportCsv(doctorUserId) {
        const { rows, painReduction, phases } = await this.reportsSummary(doctorUserId);
        const lines = [
            'Patient;Patienten-ID;Eingereicht am;Zufriedenheit (%);Risikostufe',
            ...rows.map((r) => [
                r.patientName,
                r.patientRef ?? '',
                r.submittedAt ? new Date(r.submittedAt).toISOString().slice(0, 10) : '',
                r.compliance ?? '',
                r.risk,
            ].join(';')),
            '',
            `Schmerzreduktion (%);${painReduction ?? ''}`,
            `Phase 1;${phases.phase1}`,
            `Phase 2;${phases.phase2}`,
            `Phase 3;${phases.phase3}`,
        ];
        return '﻿' + lines.join('\r\n');
    }
    async complianceAudit(doctorUserId) {
        const orgId = await this.orgIdOf(doctorUserId);
        const scope = { orgId };
        const [users, consents, auditEvents, flags, org] = await Promise.all([
            this.prisma.patientProfile.count({ where: scope }),
            this.prisma.consent.count({
                where: { revokedAt: null, user: { patientProfile: scope } },
            }),
            this.prisma.auditLog.count({
                where: { user: { memberships: { some: { orgId } } } },
            }),
            this.prisma.redFlagHit.count({ where: { patient: scope } }),
            this.practice(doctorUserId),
        ]);
        await this.prisma.auditLog.create({
            data: { userId: doctorUserId, action: 'COMPLIANCE_AUDIT_GENERATED' },
        });
        return {
            generatedAt: new Date().toISOString(),
            organization: org?.name ?? null,
            standards: {
                transport: 'TLS 1.3',
                passwordHashing: 'argon2id',
                twoFactor: 'E-Mail-Code (10 Min. TTL, Einmalverwendung)',
                dataResidency: 'Deutschland (lokal / AWS eu-central-1 geplant)',
            },
            counts: {
                users,
                activeConsents: consents,
                auditLogEvents: auditEvents,
                redFlagHits: flags,
            },
        };
    }
    async acknowledgeFlag(doctorUserId, flagId) {
        const existing = await this.prisma.redFlagHit.findUnique({
            where: { id: flagId },
            select: { patientId: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('FLAG_NOT_FOUND');
        await this.assertPatientInPractice(doctorUserId, existing.patientId);
        const hit = await this.prisma.redFlagHit.update({
            where: { id: flagId },
            data: { acknowledged: true },
        });
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'RED_FLAG_ACKNOWLEDGED',
                entityType: 'RedFlagHit',
                entityId: flagId,
                metadata: { patientId: hit.patientId },
            },
        });
        return { ok: true };
    }
    async patientDetail(doctorUserId, patientId) {
        await this.assertPatientInPractice(doctorUserId, patientId);
        const p = await this.prisma.patientProfile.findUnique({
            where: { id: patientId },
            include: {
                user: { select: { firstName: true, lastName: true, email: true, locale: true } },
                pharmacy: { select: { id: true, name: true } },
                therapyLogs: { orderBy: { loggedAt: 'asc' } },
                redFlagHits: { orderBy: { createdAt: 'desc' }, take: 20 },
                clinicalNotes: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        author: { select: { firstName: true, lastName: true } },
                    },
                },
                submissions: {
                    where: { status: client_1.SubmissionStatus.SUBMITTED },
                    orderBy: { submittedAt: 'desc' },
                    take: 20,
                    include: {
                        version: { select: { questionnaire: { select: { key: true, title: true } } } },
                        redFlagHits: { select: { severity: true } },
                    },
                },
                teleSessions: { orderBy: { scheduledAt: 'desc' }, take: 5 },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('PATIENT_NOT_FOUND');
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'PATIENT_VIEWED',
                entityType: 'PatientProfile',
                entityId: patientId,
            },
        });
        return {
            id: p.id,
            name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
            email: p.user.email,
            patientRef: p.patientRef,
            dateOfBirth: p.dateOfBirth,
            therapyStart: p.therapyStart ?? p.createdAt,
            pharmacy: p.pharmacy
                ? {
                    name: p.pharmacy.name,
                    tier: p.packageTier,
                    lastReviewAt: p.lastReviewAt,
                    nextReviewAt: new Date((p.lastReviewAt ?? p.therapyStart ?? p.createdAt).getTime() +
                        30 * 86_400_000),
                }
                : null,
            notes: p.clinicalNotes.map((n) => ({
                id: n.id,
                text: n.text,
                createdAt: n.createdAt,
                author: [n.author.firstName, n.author.lastName].filter(Boolean).join(' '),
            })),
            logs: p.therapyLogs.map((l) => ({
                loggedAt: l.loggedAt,
                dosageG: l.dosageG,
                strain: l.strain,
                metrics: l.metrics,
            })),
            redFlags: p.redFlagHits,
            submissions: p.submissions.map((s) => ({
                id: s.id,
                submittedAt: s.submittedAt,
                questionnaire: s.version.questionnaire.title,
                key: s.version.questionnaire.key,
                flags: s.redFlagHits.length,
            })),
            appointments: p.teleSessions,
        };
    }
    async submissionDetail(doctorUserId, submissionId) {
        const s = await this.prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                patient: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
                version: {
                    include: {
                        questionnaire: true,
                        sections: {
                            orderBy: { order: 'asc' },
                            include: {
                                questions: { orderBy: { order: 'asc' }, include: { options: true } },
                            },
                        },
                    },
                },
                answers: true,
                redFlagHits: true,
            },
        });
        if (!s)
            throw new common_1.NotFoundException('SUBMISSION_NOT_FOUND');
        await this.assertPatientInPractice(doctorUserId, s.patientId);
        const answerByQuestion = new Map(s.answers.map((a) => [a.questionId, a.value]));
        await this.prisma.auditLog.create({
            data: {
                userId: doctorUserId,
                action: 'SUBMISSION_VIEWED',
                entityType: 'Submission',
                entityId: submissionId,
            },
        });
        return {
            id: s.id,
            submittedAt: s.submittedAt,
            questionnaire: s.version.questionnaire.title,
            patientName: [s.patient.user.firstName, s.patient.user.lastName]
                .filter(Boolean)
                .join(' '),
            patientRef: s.patient.patientRef,
            redFlags: s.redFlagHits,
            sections: s.version.sections.map((sec) => ({
                title: sec.title,
                answers: sec.questions
                    .filter((q) => answerByQuestion.has(q.id))
                    .map((q) => {
                    const raw = answerByQuestion.get(q.id);
                    let display = raw;
                    if (Array.isArray(raw)) {
                        display = raw.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
                    }
                    else if (typeof raw === 'string') {
                        display = q.options.find((o) => o.value === raw)?.label ?? raw;
                    }
                    return { label: q.label, type: q.type, value: display };
                }),
            })),
        };
    }
};
exports.DoctorService = DoctorService;
exports.DoctorService = DoctorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DoctorService);
//# sourceMappingURL=doctor.service.js.map