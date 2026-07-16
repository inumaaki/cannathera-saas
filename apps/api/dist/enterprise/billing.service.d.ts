import { PrismaService } from '../prisma/prisma.service';
export declare function tierFor(reviews: number): {
    readonly key: "Tier 1";
    readonly label: "Basic (1 – 500)";
    readonly from: 1;
    readonly to: 500;
    readonly unitPrice: 8;
} | {
    readonly key: "Tier 2";
    readonly label: "Enterprise (501 – 1.500)";
    readonly from: 501;
    readonly to: 1500;
    readonly unitPrice: 6.5;
} | {
    readonly key: "Tier 3";
    readonly label: "Unlimited (1.501+)";
    readonly from: 1501;
    readonly to: null;
    readonly unitPrice: 5;
};
export declare class BillingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private orgOf;
    private billedOrgIds;
    private reviewsBetween;
    usage(userId: string): Promise<{
        cycle: {
            from: Date;
            to: Date;
            label: string;
        };
        totalVolume: number;
        volumeLimit: number;
        activeTier: "Tier 1" | "Tier 2" | "Tier 3";
        unitPrice: 5 | 8 | 6.5;
        projectedCost: number;
        tiers: {
            key: "Tier 1" | "Tier 2" | "Tier 3";
            label: "Basic (1 – 500)" | "Enterprise (501 – 1.500)" | "Unlimited (1.501+)";
            from: 1 | 501 | 1501;
            to: 500 | 1500 | null;
            unitPrice: 5 | 8 | 6.5;
            used: number;
            capacity: number | null;
            pct: number;
            state: string;
        }[];
    }>;
    invoices(userId: string, status?: string): Promise<{
        rows: {
            id: string;
            number: string;
            issuedAt: Date;
            periodStart: Date;
            periodEnd: Date;
            tier: string;
            reviews: number;
            unitPrice: number;
            amount: number;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            paidAt: Date | null;
        }[];
        totals: {
            count: number;
            outstanding: number;
        };
    }>;
    generateInvoice(userId: string): Promise<{
        number: string;
        id: string;
        orgId: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        periodStart: Date;
        periodEnd: Date;
        tier: string;
        reviews: number;
        unitPrice: import("@prisma/client/runtime/library").Decimal;
        amount: import("@prisma/client/runtime/library").Decimal;
        issuedAt: Date;
        paidAt: Date | null;
    }>;
    exportInvoicesCsv(userId: string): Promise<string>;
}
