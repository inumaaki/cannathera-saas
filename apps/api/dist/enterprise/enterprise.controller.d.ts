import type { SessionPayload } from '../auth/auth.service';
import { BillingService } from './billing.service';
import { EnterpriseService } from './enterprise.service';
import { IntegrationsService } from './integrations.service';
import { SettingsService } from './settings.service';
declare class BrandingDto {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
}
declare class AddPartnerDto {
    orgId: string;
}
declare class CreateKeyDto {
    name: string;
    scopes: string[];
    live?: boolean;
}
declare class CreateWebhookDto {
    url: string;
    events: string[];
}
declare class ToggleWebhookDto {
    active: boolean;
}
declare class InviteDto {
    email: string;
    firstName?: string;
    lastName?: string;
    orgRole: string;
}
declare class UpdateMemberDto {
    orgRole: string;
}
declare class UpdateSettingsDto {
    mandatory2fa?: boolean;
    sessionTimeoutMin?: number;
}
export declare class EnterpriseController {
    private readonly enterprise;
    private readonly integrations;
    private readonly billing;
    private readonly settings;
    constructor(enterprise: EnterpriseService, integrations: IntegrationsService, billing: BillingService, settings: SettingsService);
    overview(user: SessionPayload): Promise<{
        enterpriseName: string;
        branding: {
            logoUrl?: string | null;
            primaryColor?: string | null;
            accentColor?: string | null;
            fontFamily?: string | null;
        };
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
    partners(user: SessionPayload, type?: string): Promise<{
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
    available(user: SessionPayload): Promise<{
        name: string;
        id: string;
        type: import("@prisma/client").$Enums.OrgType;
    }[]>;
    partnerDetail(user: SessionPayload, id: string): Promise<{
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
    addPartner(user: SessionPayload, dto: AddPartnerDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: import("@prisma/client/runtime/library").JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    }>;
    removePartner(user: SessionPayload, id: string): Promise<{
        ok: boolean;
    }>;
    updateBranding(user: SessionPayload, dto: BrandingDto): Promise<{
        branding: import("@prisma/client/runtime/library").JsonValue;
        poweredBy: string;
    }>;
    uploadLogo(user: SessionPayload, file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    exportCsv(user: SessionPayload): Promise<string>;
    integrationStatus(user: SessionPayload): Promise<{
        zoom: {
            status: string;
            sessions: number;
        };
        zapier: {
            status: string;
            hooks: number;
        };
        webhooks: {
            status: string;
            active: number;
            successRate: number | null;
        };
        restApi: {
            status: string;
            version: string;
            activeKeys: number;
        };
    }>;
    listKeys(user: SessionPayload): Promise<{
        id: string;
        name: string;
        masked: string;
        scopes: string[];
        createdAt: Date;
        lastUsedAt: Date | null;
        revoked: boolean;
    }[]>;
    createKey(user: SessionPayload, dto: CreateKeyDto): Promise<{
        id: string;
        name: string;
        scopes: string[];
        key: string;
    }>;
    revokeKey(user: SessionPayload, id: string): Promise<{
        ok: boolean;
    }>;
    listWebhooks(user: SessionPayload): Promise<{
        id: string;
        url: string;
        events: string[];
        active: boolean;
        createdAt: Date;
        successRate: number | null;
    }[]>;
    createWebhook(user: SessionPayload, dto: CreateWebhookDto): Promise<{
        id: string;
        url: string;
        events: string[];
        secret: string;
    }>;
    toggleWebhook(user: SessionPayload, id: string, dto: ToggleWebhookDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        url: string;
        active: boolean;
        events: string[];
        secret: string;
    }>;
    deleteWebhook(user: SessionPayload, id: string): Promise<{
        ok: boolean;
    }>;
    deliveries(user: SessionPayload, limit?: string): Promise<{
        id: string;
        event: string;
        url: string;
        statusCode: number | null;
        ok: boolean;
        error: string | null;
        attempts: number;
        createdAt: Date;
    }[]>;
    retryDelivery(user: SessionPayload, id: string): Promise<{
        error: string | null;
        id: string;
        createdAt: Date;
        endpointId: string;
        event: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        statusCode: number | null;
        ok: boolean;
        attempts: number;
        deliveredAt: Date | null;
    }>;
    usage(user: SessionPayload): Promise<{
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
    invoices(user: SessionPayload, status?: string): Promise<{
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
    generateInvoice(user: SessionPayload): Promise<{
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
    exportInvoices(user: SessionPayload): Promise<string>;
    team(user: SessionPayload): Promise<{
        rows: {
            id: string;
            userId: string;
            name: string;
            email: string;
            orgRole: "VIEWER" | "SUPER_ADMIN" | "SUPPORT" | "BILLING";
            permissions: string[];
            status: string;
            isSelf: boolean;
            createdAt: Date;
        }[];
        me: {
            orgRole: "VIEWER" | "SUPER_ADMIN" | "SUPPORT" | "BILLING";
            canManageTeam: boolean;
        };
        stats: {
            totalActive: number;
            pendingInvites: number;
            mfaCoverage: number;
        };
    }>;
    invite(user: SessionPayload, dto: InviteDto): Promise<{
        email: string;
        tempPassword: string;
        orgRole: string;
    }>;
    updateMember(user: SessionPayload, id: string, dto: UpdateMemberDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        orgId: string;
        roleInOrg: import("@prisma/client").$Enums.Role;
        orgRole: string;
        permissions: string[];
    }>;
    removeMember(user: SessionPayload, id: string): Promise<{
        ok: boolean;
    }>;
    getSettings(user: SessionPayload): Promise<{
        security: {
            mandatory2fa: boolean;
            sessionTimeoutMin: number;
        };
        system: {
            apiStatus: string;
            passwordHashing: string;
            transport: string;
            storedReports: number;
            auditEntries: number;
        };
    }>;
    updateSettings(user: SessionPayload, dto: UpdateSettingsDto): Promise<{
        id: string;
        updatedAt: Date;
        orgId: string;
        mandatory2fa: boolean;
        sessionTimeoutMin: number;
    }>;
    audit(user: SessionPayload, limit?: string, action?: string): Promise<{
        rows: {
            id: string;
            user: string;
            action: string;
            entityType: string | null;
            createdAt: Date;
        }[];
        total: number;
    }>;
}
export {};
