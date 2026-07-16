import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
type LogMetrics = {
    pain?: number;
    sleep?: number;
    activity?: number;
    qol?: number;
};
export declare class PatientService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private profileOf;
    branding(userId: string): Promise<{
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
    summary(userId: string): Promise<{
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
    createLog(userId: string, data: {
        dosageG: number;
        strain?: string;
        metrics: LogMetrics;
        note?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        loggedAt: Date;
        patientId: string;
        dosageG: number | null;
        strain: string | null;
        metrics: Prisma.JsonValue | null;
        note: string | null;
    }>;
    stats(userId: string, days?: number): Promise<{
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
    rescheduleAppointment(userId: string, sessionId: string, scheduledAt: string): Promise<{
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
    appointments(userId: string): Promise<{
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
    profile(userId: string): Promise<{
        fullName: string;
        patientRef: string;
        email: string;
        pharmacyOrgId: string | null;
        pharmacies: {
            name: string;
            id: string;
        }[];
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        pharmacyOrgId?: string | null;
    }): Promise<{
        fullName: string;
        patientRef: string;
        email: string;
        pharmacyOrgId: string | null;
        pharmacies: {
            name: string;
            id: string;
        }[];
    }>;
    plan(userId: string): Promise<{
        day: number;
        planDays: number;
        progressPct: number;
        phases: {
            status: "pending" | "achieved" | "inProgress";
            key: string;
            day: number;
        }[];
    }>;
}
export {};
