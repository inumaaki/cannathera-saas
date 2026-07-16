import type { SessionPayload } from '../auth/auth.service';
import { PatientService } from './patient.service';
import { CreateLogDto, RescheduleDto, UpdateProfileDto } from './patient.dto';
export declare class PatientController {
    private readonly patients;
    constructor(patients: PatientService);
    summary(user: SessionPayload): Promise<{
        firstName: string | null;
        day: number;
        planDays: number;
        adherence: number;
        todayLogged: boolean;
        lastDosageG: number | null;
        lastStrain: string | null;
        stats: {
            key: "pain" | "sleep" | "activity" | "qol";
            value: number | null;
            delta: number | null;
        }[];
        nextAppointment: {
            id: string;
            createdAt: Date;
            patientId: string;
            provider: import("@prisma/client").$Enums.TeleProvider;
            externalId: string | null;
            joinUrl: string | null;
            hostUrl: string | null;
            scheduledAt: Date;
            durationMin: number;
        } | null;
    }>;
    createLog(user: SessionPayload, dto: CreateLogDto): Promise<{
        id: string;
        createdAt: Date;
        loggedAt: Date;
        patientId: string;
        dosageG: number | null;
        strain: string | null;
        metrics: import("@prisma/client/runtime/library").JsonValue | null;
        note: string | null;
    }>;
    stats(user: SessionPayload, days?: string): Promise<{
        efficacy: number | null;
        totalDosageMg: number;
        adherence: number;
        day: number;
        planDays: number;
        series: {
            date: string;
            dosageMg: number | null;
            pain: number | null;
            sleep: number | null;
            activity: number | null;
            qol: number | null;
            relief: number | null;
        }[];
    }>;
    appointments(user: SessionPayload): Promise<{
        upcoming: {
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
        past: {
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
    profile(user: SessionPayload): Promise<{
        fullName: string;
        patientRef: string;
        email: string;
        pharmacyOrgId: string | null;
        pharmacies: {
            name: string;
            id: string;
        }[];
    }>;
    updateProfile(user: SessionPayload, dto: UpdateProfileDto): Promise<{
        fullName: string;
        patientRef: string;
        email: string;
        pharmacyOrgId: string | null;
        pharmacies: {
            name: string;
            id: string;
        }[];
    }>;
    plan(user: SessionPayload): Promise<{
        day: number;
        planDays: number;
        progressPct: number;
        phases: {
            status: "pending" | "achieved" | "inProgress";
            key: string;
            day: number;
        }[];
    }>;
    branding(user: SessionPayload): Promise<{
        poweredBy: string;
        logoUrl?: string | null;
        primaryColor?: string | null;
        accentColor?: string | null;
        fontFamily?: string | null;
        partner: string;
    } | {
        partner: null;
        logoUrl: null;
        primaryColor: null;
        accentColor: null;
        fontFamily: null;
        poweredBy: string;
    }>;
}
