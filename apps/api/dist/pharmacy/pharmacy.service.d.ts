import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class PharmacyService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private orgOf;
    private reviewState;
    overview(userId: string): Promise<{
        pharmacyName: string;
        dueThisMonth: number;
        criticalPending: number;
        completedThisMonth: number;
        tier: import("@prisma/client").$Enums.SubscriptionTier;
        planUsage: {
            used: number;
            cap: number | null;
        };
        retention: number;
        avgAdherence: number;
        adherenceBuckets: {
            onTrack: number;
            supportNeeded: number;
            critical: number;
        };
        reviewsDueSoon: {
            criticalFlags: number;
            openFlags: number;
            dueAt: Date;
            diffDays: number;
            status: "overdue" | "dueSoon" | "onTrack";
            id: string;
            name: string;
            patientRef: string | null;
            condition: string | null;
            tier: import("@prisma/client").$Enums.SubscriptionTier;
            lastReviewAt: Date | null;
        }[];
        stockAlert: {
            id: string;
            name: string;
            stockLevel: number;
            unit: string;
        } | null;
    }>;
    reviews(userId: string, filter?: string): Promise<{
        rows: {
            openFlags: number;
            criticalFlags: number;
            dueAt: Date;
            diffDays: number;
            status: "overdue" | "dueSoon" | "onTrack";
            id: string;
            name: string;
            patientRef: string | null;
            condition: string | null;
            tier: import("@prisma/client").$Enums.SubscriptionTier;
            lastReviewAt: Date | null;
        }[];
        stats: {
            overdue: number;
            completedToday: number;
            pending: number;
            flagged: number;
            total: number;
        };
    }>;
    reviewSummary(userId: string, patientId: string): Promise<{
        patient: {
            id: string;
            name: string;
            patientRef: string | null;
            condition: string | null;
            tier: import("@prisma/client").$Enums.SubscriptionTier;
            therapyStart: Date;
            lastReviewAt: Date | null;
            totalLogs: number;
        };
        practice: {
            id: string;
            name: string;
        } | null;
        redFlags: {
            id: string;
            createdAt: Date;
            severity: import("@prisma/client").$Enums.RedFlagSeverity;
            message: string;
        }[];
        reports: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.ReportType;
            periodStart: Date;
            periodEnd: Date;
            fileUrl: string | null;
        }[];
        day: number;
        phase: number;
        adherence: number;
        avgDosageG: number | null;
        efficacy: number | null;
        painChange: number | null;
        series: {
            date: string;
            pain: number | null;
            sleep: number | null;
            dosageG: number | null;
        }[];
    }>;
    completeReview(userId: string, patientId: string, note?: string): Promise<{
        ok: boolean;
        lastReviewAt: Date;
    }>;
    treatmentLogs(userId: string, opts: {
        days?: number;
        q?: string;
        flaggedOnly?: boolean;
    }): Promise<{
        rows: {
            id: string;
            loggedAt: Date;
            patientId: string;
            patientName: string;
            patientRef: string | null;
            strain: string | null;
            dosageG: number | null;
            pain: number | null;
            sleep: number | null;
            flagged: boolean;
            severity: import("@prisma/client").$Enums.RedFlagSeverity | null;
            status: string;
        }[];
        stats: {
            total: number;
            recent7d: number;
            activePatients: number;
            inRange: number;
            matched: number;
            flagged: number;
        };
    }>;
    analytics(userId: string): Promise<{
        retention: number;
        months: {
            month: string;
            entries: number;
            avgQol: number | null;
        }[];
        totalReviews: number;
        avgRating: number | null;
        responseRate: number;
        billing: {
            tier: import("@prisma/client").$Enums.SubscriptionTier;
            planName: string;
            monthlyPrice: number | null;
            reviewCap: number | null;
            reviewsThisMonth: number;
            unitPrice: number;
            projectedCost: number;
        };
    }>;
    private stockStatus;
    private itemOf;
    private trail;
    inventory(userId: string, opts?: {
        category?: string;
        q?: string;
        status?: string;
        sort?: string;
        includeArchived?: boolean;
    }): Promise<{
        items: {
            status: "low" | "critical" | "inStock";
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            active: boolean;
            sku: string;
            category: string;
            thc: number | null;
            cbd: number | null;
            stockLevel: number;
            unit: string;
            safetyThreshold: number;
            pendingOrder: boolean;
            reorderQty: number | null;
            orderedAt: Date | null;
            lastRestockAt: Date | null;
        }[];
        stats: {
            totalSkus: number;
            lowStock: number;
            critical: number;
            pendingOrders: number;
        };
        shortages: {
            status: "low" | "critical" | "inStock";
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            active: boolean;
            sku: string;
            category: string;
            thc: number | null;
            cbd: number | null;
            stockLevel: number;
            unit: string;
            safetyThreshold: number;
            pendingOrder: boolean;
            reorderQty: number | null;
            orderedAt: Date | null;
            lastRestockAt: Date | null;
        }[];
        categories: string[];
    }>;
    createItem(userId: string, data: {
        sku: string;
        name: string;
        category: string;
        thc?: number;
        cbd?: number;
        stockLevel: number;
        unit: string;
        safetyThreshold: number;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        active: boolean;
        sku: string;
        category: string;
        thc: number | null;
        cbd: number | null;
        stockLevel: number;
        unit: string;
        safetyThreshold: number;
        pendingOrder: boolean;
        reorderQty: number | null;
        orderedAt: Date | null;
        lastRestockAt: Date | null;
    }>;
    updateItem(userId: string, itemId: string, data: {
        name?: string;
        category?: string;
        thc?: number;
        cbd?: number;
        unit?: string;
        stockLevel?: number;
        safetyThreshold?: number;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        active: boolean;
        sku: string;
        category: string;
        thc: number | null;
        cbd: number | null;
        stockLevel: number;
        unit: string;
        safetyThreshold: number;
        pendingOrder: boolean;
        reorderQty: number | null;
        orderedAt: Date | null;
        lastRestockAt: Date | null;
    }>;
    reorderItem(userId: string, itemId: string, qty?: number): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        active: boolean;
        sku: string;
        category: string;
        thc: number | null;
        cbd: number | null;
        stockLevel: number;
        unit: string;
        safetyThreshold: number;
        pendingOrder: boolean;
        reorderQty: number | null;
        orderedAt: Date | null;
        lastRestockAt: Date | null;
    }>;
    cancelOrder(userId: string, itemId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        active: boolean;
        sku: string;
        category: string;
        thc: number | null;
        cbd: number | null;
        stockLevel: number;
        unit: string;
        safetyThreshold: number;
        pendingOrder: boolean;
        reorderQty: number | null;
        orderedAt: Date | null;
        lastRestockAt: Date | null;
    }>;
    receiveItem(userId: string, itemId: string, qty?: number): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        active: boolean;
        sku: string;
        category: string;
        thc: number | null;
        cbd: number | null;
        stockLevel: number;
        unit: string;
        safetyThreshold: number;
        pendingOrder: boolean;
        reorderQty: number | null;
        orderedAt: Date | null;
        lastRestockAt: Date | null;
    }>;
    archiveItem(userId: string, itemId: string): Promise<{
        ok: boolean;
    }>;
    itemHistory(userId: string, itemId: string): Promise<{
        item: {
            id: string;
            sku: string;
            name: string;
            unit: string;
        };
        events: {
            id: string;
            action: string;
            at: Date;
            by: string;
            metadata: Prisma.JsonValue;
        }[];
    }>;
    private toCsv;
    exportLogsCsv(userId: string): Promise<string>;
    exportReviewsCsv(userId: string): Promise<string>;
    exportInventoryCsv(userId: string): Promise<string>;
    exportAnalyticsCsv(userId: string): Promise<string>;
}
