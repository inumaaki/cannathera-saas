import { ReportType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export type ReportData = {
    type: ReportType;
    periodStart: Date;
    periodEnd: Date;
    generatedAt: Date;
    patient: {
        name: string;
        patientRef: string | null;
        dateOfBirth: Date | null;
        therapyDay: number | null;
    };
    practice: {
        name: string | null;
        logoUrl: string | null;
    } | null;
    dosage: {
        weeks: Array<{
            label: string;
            avgG: number | null;
        }>;
        avgDailyG: number | null;
        totalG: number;
    };
    strains: Array<{
        name: string;
        days: number;
    }>;
    metrics: Array<{
        key: 'pain' | 'sleep' | 'activity' | 'qol';
        label: string;
        unit: string;
        start: number | null;
        end: number | null;
        changePct: number | null;
        betterWhenDown: boolean;
    }>;
    adherence: {
        loggedDays: number;
        totalDays: number;
        pct: number;
    };
    sideEffects: string[];
    satisfaction: number | null;
    goalsReached: string | null;
    notes: string | null;
    redFlags: Array<{
        severity: string;
        message: string;
        createdAt: Date;
    }>;
    nextAppointmentPrep: string[];
    summary: string;
};
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    assertCanAccessPatient(userId: string, patientId: string): Promise<void>;
    buildData(patientId: string, type: ReportType): Promise<ReportData>;
    generate(requestedByUserId: string, patientId: string, type: ReportType): Promise<{
        buffer: Buffer;
        filename: string;
        reportId: string;
    }>;
    history(patientId: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ReportType;
        periodStart: Date;
        periodEnd: Date;
        fileUrl: string | null;
        generatedAt: Date | null;
    }[]>;
    fileById(userId: string, reportId: string): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        filename: string;
    }>;
    patientIdOfUser(userId: string): Promise<string>;
}
