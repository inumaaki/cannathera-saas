import type { Response } from 'express';
import type { SessionPayload } from '../auth/auth.service';
import { DoctorService } from './doctor.service';
declare class CreatePatientDto {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
}
declare class NoteDto {
    text: string;
}
declare class InviteDto {
    firstName: string;
    lastName: string;
    email: string;
    orgRole: string;
    permissions: string[];
}
declare class UpdateMemberDto {
    orgRole?: string;
    permissions?: string[];
}
declare class RescheduleDto {
    scheduledAt: string;
}
export declare class DoctorController {
    private readonly doctors;
    constructor(doctors: DoctorService);
    overview(user: SessionPayload): Promise<{
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
    reports(user: SessionPayload, days?: string): Promise<{
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
    exportReports(user: SessionPayload): Promise<string>;
    complianceAudit(user: SessionPayload, res: Response): Promise<{
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
    practice(user: SessionPayload): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: import("@prisma/client/runtime/library").JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    } | null>;
    updatePractice(user: SessionPayload, body: {
        name?: string;
        branding?: Record<string, unknown>;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: import("@prisma/client/runtime/library").JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    }>;
    uploadLogo(user: SessionPayload, file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    team(user: SessionPayload): Promise<{
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
    invite(user: SessionPayload, dto: InviteDto): Promise<{
        userId: string;
        email: string;
        tempPassword: string;
    }>;
    updateMember(user: SessionPayload, membershipId: string, dto: UpdateMemberDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        orgId: string;
        roleInOrg: import("@prisma/client").$Enums.Role;
        orgRole: string;
        permissions: string[];
    }>;
    patients(user: SessionPayload): Promise<{
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
    createPatient(user: SessionPayload, dto: CreatePatientDto): Promise<{
        patientId: string;
        patientRef: string | null;
        email: string;
        tempPassword: string;
    }>;
    redFlags(user: SessionPayload, view?: string): Promise<{
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
    acknowledge(user: SessionPayload, id: string): Promise<{
        ok: boolean;
    }>;
    patientDetail(user: SessionPayload, id: string): Promise<{
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
            metrics: import("@prisma/client/runtime/library").JsonValue;
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
    addNote(user: SessionPayload, id: string, dto: NoteDto): Promise<{
        id: string;
        createdAt: Date;
        text: string;
        patientId: string;
        authorId: string;
    }>;
    reschedule(user: SessionPayload, id: string, dto: RescheduleDto): Promise<{
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
    submissionDetail(user: SessionPayload, id: string): Promise<{
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
export {};
