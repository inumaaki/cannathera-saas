import type { Response } from 'express';
import type { SessionPayload } from '../auth/auth.service';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    doctorReport(user: SessionPayload, patientId: string, type: string, res: Response): Promise<void>;
    doctorHistory(user: SessionPayload, patientId: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ReportType;
        periodStart: Date;
        periodEnd: Date;
        fileUrl: string | null;
        generatedAt: Date | null;
    }[]>;
    file(user: SessionPayload, reportId: string, res: Response): Promise<void>;
    myReport(user: SessionPayload, type: string, res: Response): Promise<void>;
    myHistory(user: SessionPayload): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.ReportType;
        periodStart: Date;
        periodEnd: Date;
        fileUrl: string | null;
        generatedAt: Date | null;
    }[]>;
}
