import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class DoctorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private orgIdOf;
    private assertPatientInPractice;
    overview(doctorUserId: string): Promise<{
        activePatients: number;
        appointmentsToday: number;
        nextAppointment: ({
            patient: {
                user: {
                    firstName: string | null;
                    lastName: string | null;
                };
            } & {
                dateOfBirth: Date | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                orgId: string | null;
                patientRef: string | null;
                therapyStart: Date | null;
                packageTier: import("@prisma/client").$Enums.SubscriptionTier;
                condition: string | null;
                lastReviewAt: Date | null;
                pharmacyId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            patientId: string;
            provider: import("@prisma/client").$Enums.TeleProvider;
            externalId: string | null;
            joinUrl: string | null;
            hostUrl: string | null;
            scheduledAt: Date;
            durationMin: number;
        }) | null;
        openRedFlags: number;
        avgAdherence: number | null;
        appointments: {
            id: string;
            patientId: string;
            patientName: string;
            scheduledAt: Date;
            video: boolean;
        }[];
        alerts: {
            id: string;
            severity: import("@prisma/client").$Enums.RedFlagSeverity;
            message: string;
            createdAt: Date;
            acknowledged: boolean;
            source: string;
            patientId: string;
            patientName: string;
            patientRef: string | null;
            submissionId: string | null;
            questionnaire: string;
            submittedAt: Date;
        }[];
    }>;
    reportsSummary(doctorUserId: string, days?: number): Promise<{
        trend: {
            month: string;
            pain: number | null;
            sleep: number | null;
        }[];
        painReduction: number | null;
        phases: {
            phase1: number;
            phase2: number;
            phase3: number;
        };
        rows: {
            id: string;
            patientId: string;
            patientName: string;
            patientRef: string | null;
            submittedAt: Date | null;
            compliance: number | null;
            risk: string;
        }[];
        totalLogs: number;
    }>;
    practice(doctorUserId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: Prisma.JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    } | null>;
    updatePractice(doctorUserId: string, data: {
        name?: string;
        branding?: Record<string, unknown>;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: Prisma.JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    }>;
    patients(doctorUserId: string): Promise<{
        adherence: number;
        id: string;
        name: string;
        email: string;
        patientRef: string | null;
        therapyStart: Date | null;
        day: number;
        lastLogAt: Date;
        lastPain: number | null;
        openFlags: number;
        criticalFlags: number;
        submissions: number;
    }[]>;
    redFlags(doctorUserId: string, view?: 'unreviewed' | 'reviewed' | 'all'): Promise<{
        id: string;
        severity: import("@prisma/client").$Enums.RedFlagSeverity;
        message: string;
        createdAt: Date;
        acknowledged: boolean;
        source: string;
        patientId: string;
        patientName: string;
        patientRef: string | null;
        submissionId: string | null;
        questionnaire: string;
        submittedAt: Date;
    }[]>;
    createPatient(doctorUserId: string, data: {
        firstName: string;
        lastName: string;
        email: string;
        dateOfBirth?: string;
    }): Promise<{
        patientId: string;
        patientRef: string | null;
        email: string;
        tempPassword: string;
    }>;
    private generateTempPassword;
    addNote(doctorUserId: string, patientId: string, text: string): Promise<{
        id: string;
        createdAt: Date;
        text: string;
        patientId: string;
        authorId: string;
    }>;
    team(doctorUserId: string): Promise<{
        membershipId: string;
        userId: string;
        name: string;
        email: string;
        roleInOrg: import("@prisma/client").$Enums.Role;
        orgRole: string;
        permissions: string[];
        pending: boolean;
        active: boolean;
        since: Date;
    }[]>;
    updateTeamMember(adminUserId: string, membershipId: string, data: {
        orgRole?: string;
        permissions?: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        orgId: string;
        roleInOrg: import("@prisma/client").$Enums.Role;
        orgRole: string;
        permissions: string[];
    }>;
    inviteTeamMember(doctorUserId: string, data: {
        firstName: string;
        lastName: string;
        email: string;
        orgRole: string;
        permissions: string[];
    }): Promise<{
        userId: string;
        email: string;
        tempPassword: string;
    }>;
    reschedule(doctorUserId: string, sessionId: string, scheduledAt: string): Promise<{
        id: string;
        createdAt: Date;
        patientId: string;
        provider: import("@prisma/client").$Enums.TeleProvider;
        externalId: string | null;
        joinUrl: string | null;
        hostUrl: string | null;
        scheduledAt: Date;
        durationMin: number;
    }>;
    saveLogo(doctorUserId: string, file: {
        buffer: Buffer;
        mimetype: string;
    }): Promise<{
        logoUrl: string;
    }>;
    exportCsv(doctorUserId: string): Promise<string>;
    complianceAudit(doctorUserId: string): Promise<{
        generatedAt: string;
        organization: string | null;
        standards: {
            transport: string;
            passwordHashing: string;
            twoFactor: string;
            dataResidency: string;
        };
        counts: {
            users: number;
            activeConsents: number;
            auditLogEvents: number;
            redFlagHits: number;
        };
    }>;
    acknowledgeFlag(doctorUserId: string, flagId: string): Promise<{
        ok: boolean;
    }>;
    patientDetail(doctorUserId: string, patientId: string): Promise<{
        id: string;
        name: string;
        email: string;
        patientRef: string | null;
        dateOfBirth: Date | null;
        therapyStart: Date;
        pharmacy: {
            name: string;
            tier: import("@prisma/client").$Enums.SubscriptionTier;
            lastReviewAt: Date | null;
            nextReviewAt: Date;
        } | null;
        notes: {
            id: string;
            text: string;
            createdAt: Date;
            author: string;
        }[];
        logs: {
            loggedAt: Date;
            dosageG: number | null;
            strain: string | null;
            metrics: Prisma.JsonValue;
        }[];
        redFlags: {
            id: string;
            createdAt: Date;
            acknowledged: boolean;
            submissionId: string | null;
            ruleId: string | null;
            patientId: string;
            severity: import("@prisma/client").$Enums.RedFlagSeverity;
            message: string;
            source: string;
        }[];
        submissions: {
            id: string;
            submittedAt: Date | null;
            questionnaire: string;
            key: string;
            flags: number;
        }[];
        appointments: {
            id: string;
            createdAt: Date;
            patientId: string;
            provider: import("@prisma/client").$Enums.TeleProvider;
            externalId: string | null;
            joinUrl: string | null;
            hostUrl: string | null;
            scheduledAt: Date;
            durationMin: number;
        }[];
    }>;
    submissionDetail(doctorUserId: string, submissionId: string): Promise<{
        id: string;
        submittedAt: Date | null;
        questionnaire: string;
        patientName: string;
        patientRef: string | null;
        redFlags: {
            id: string;
            createdAt: Date;
            acknowledged: boolean;
            submissionId: string | null;
            ruleId: string | null;
            patientId: string;
            severity: import("@prisma/client").$Enums.RedFlagSeverity;
            message: string;
            source: string;
        }[];
        sections: {
            title: string;
            answers: {
                label: string;
                type: import("@prisma/client").$Enums.QuestionType;
                value: unknown;
            }[];
        }[];
    }>;
}
