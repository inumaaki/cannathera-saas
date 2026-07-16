import 'multer';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
type Branding = {
    logoUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    fontFamily?: string | null;
};
export declare class EnterpriseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private orgOf;
    private memberOrgs;
    private patientScope;
    overview(userId: string): Promise<{
        enterpriseName: string;
        branding: Branding;
        partners: {
            total: number;
            pharmacies: number;
            practices: number;
        };
        patients: number;
        activePatients: number;
        reviewsThisMonth: number;
        overdueReviews: number;
        openFlags: number;
        criticalFlags: number;
        avgAdherence: number;
        billing: {
            reviewsThisMonth: number;
            unitPrice: number;
            projectedCost: number;
            tierLabel: string;
        };
        topPartners: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.OrgType;
            joinedAt: Date | null;
            address: string | null;
            city: string | null;
            patients: number;
            overdue: number;
            avgAdherence: number;
        }[];
        months: {
            month: string;
            entries: number;
            avgQol: number | null;
        }[];
    }>;
    partners(userId: string, type?: string): Promise<{
        rows: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.OrgType;
            joinedAt: Date | null;
            address: string | null;
            city: string | null;
            patients: number;
            overdue: number;
            avgAdherence: number;
        }[];
        partners: {
            total: number;
            pharmacies: number;
            practices: number;
        };
    }>;
    partnerDetail(userId: string, partnerId: string): Promise<{
        partner: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.OrgType;
            joinedAt: Date | null;
            tier: import("@prisma/client").$Enums.SubscriptionTier;
        };
        patients: {
            id: string;
            name: string;
            patientRef: string | null;
            condition: string | null;
            tier: import("@prisma/client").$Enums.SubscriptionTier;
            lastReviewAt: Date | null;
            diffDays: number;
            overdue: boolean;
            openFlags: number;
        }[];
    }>;
    addPartner(userId: string, orgId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: Prisma.JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    }>;
    removePartner(userId: string, orgId: string): Promise<{
        ok: boolean;
    }>;
    availablePartners(userId: string): Promise<{
        name: string;
        id: string;
        type: import("@prisma/client").$Enums.OrgType;
    }[]>;
    updateBranding(userId: string, branding: Branding): Promise<{
        branding: Prisma.JsonValue;
        poweredBy: string;
    }>;
    saveLogo(userId: string, file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    exportCsv(userId: string): Promise<string>;
}
export {};
