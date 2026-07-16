import type { SessionPayload } from '../auth/auth.service';
import { PharmacyService } from './pharmacy.service';
declare class CreateItemDto {
    sku: string;
    name: string;
    category: string;
    thc: number;
    cbd: number;
    unit: string;
    stockLevel: number;
    safetyThreshold: number;
}
declare class UpdateItemDto {
    name?: string;
    category?: string;
    thc?: number;
    cbd?: number;
    unit?: string;
    stockLevel?: number;
    safetyThreshold?: number;
}
declare class QuantityDto {
    qty?: number;
}
declare class CompleteReviewDto {
    note?: string;
}
export declare class PharmacyController {
    private readonly pharmacy;
    constructor(pharmacy: PharmacyService);
    overview(user: SessionPayload): Promise<{
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
    reviews(user: SessionPayload, filter?: string): Promise<{
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
    exportReviews(user: SessionPayload): Promise<string>;
    reviewSummary(user: SessionPayload, patientId: string): Promise<{
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
    completeReview(user: SessionPayload, patientId: string, dto: CompleteReviewDto): Promise<{
        ok: boolean;
        lastReviewAt: Date;
    }>;
    logs(user: SessionPayload, days?: string, q?: string, flagged?: string): Promise<{
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
    exportLogs(user: SessionPayload): Promise<string>;
    analytics(user: SessionPayload): Promise<{
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
    exportAnalytics(user: SessionPayload): Promise<string>;
    exportInventory(user: SessionPayload): Promise<string>;
    inventory(user: SessionPayload, category?: string, q?: string, status?: string, sort?: string): Promise<{
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
    createItem(user: SessionPayload, dto: CreateItemDto): Promise<{
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
    itemHistory(user: SessionPayload, id: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    updateItem(user: SessionPayload, id: string, dto: UpdateItemDto): Promise<{
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
    reorder(user: SessionPayload, id: string, dto: QuantityDto): Promise<{
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
    receive(user: SessionPayload, id: string, dto: QuantityDto): Promise<{
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
    cancelOrder(user: SessionPayload, id: string): Promise<{
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
    archiveItem(user: SessionPayload, id: string): Promise<{
        ok: boolean;
    }>;
}
export {};
