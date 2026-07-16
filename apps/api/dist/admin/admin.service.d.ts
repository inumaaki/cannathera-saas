import { OrgType, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPartners(): Promise<({
        memberships: ({
            user: {
                role: import("@prisma/client").$Enums.Role;
                email: string;
                firstName: string | null;
                lastName: string | null;
                locale: import("@prisma/client").$Enums.Locale;
                id: string;
                passwordHash: string;
                isActive: boolean;
                mustChangePassword: boolean;
                emailVerified: Date | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            orgId: string;
            roleInOrg: import("@prisma/client").$Enums.Role;
            orgRole: string;
            permissions: string[];
        })[];
        subscriptions: ({
            plan: {
                name: string;
                id: string;
                isActive: boolean;
                tier: import("@prisma/client").$Enums.SubscriptionTier;
                monthlyPrice: import("@prisma/client/runtime/library").Decimal;
                reviewCap: number | null;
                features: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            isActive: boolean;
            orgId: string;
            planId: string;
            startedAt: Date;
            endsAt: Date | null;
        })[];
        settings: {
            id: string;
            updatedAt: Date;
            orgId: string;
            mandatory2fa: boolean;
            sessionTimeoutMin: number;
        } | null;
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.OrgType;
        branding: import("@prisma/client/runtime/library").JsonValue | null;
        parentOrgId: string | null;
        joinedAt: Date | null;
    })[]>;
    togglePartner(orgId: string): Promise<{
        orgId: string;
        isActive: boolean;
    }>;
    onboardPartner(dto: {
        name: string;
        type: OrgType;
        adminEmail: string;
        adminFirstName: string;
        adminLastName: string;
        planTier: SubscriptionTier;
    }): Promise<{
        orgId: string;
        userId: string;
        tempPassword: string;
    }>;
    listAuditLogs(): Promise<({
        user: {
            email: string;
            firstName: string | null;
            lastName: string | null;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entityType: string | null;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
    })[]>;
    listUsers(): Promise<({
        memberships: ({
            org: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: import("@prisma/client").$Enums.OrgType;
                branding: import("@prisma/client/runtime/library").JsonValue | null;
                parentOrgId: string | null;
                joinedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            orgId: string;
            roleInOrg: import("@prisma/client").$Enums.Role;
            orgRole: string;
            permissions: string[];
        })[];
    } & {
        role: import("@prisma/client").$Enums.Role;
        email: string;
        firstName: string | null;
        lastName: string | null;
        locale: import("@prisma/client").$Enums.Locale;
        id: string;
        passwordHash: string;
        isActive: boolean;
        mustChangePassword: boolean;
        emailVerified: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    toggleUser(userId: string): Promise<{
        userId: string;
        isActive: boolean;
    }>;
    listPricingPlans(): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        tier: import("@prisma/client").$Enums.SubscriptionTier;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        reviewCap: number | null;
        features: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    updatePricingPlan(id: string, dto: {
        monthlyPrice?: number;
        reviewCap?: number;
        isActive?: boolean;
    }): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        tier: import("@prisma/client").$Enums.SubscriptionTier;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        reviewCap: number | null;
        features: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    togglePartner2FA(orgId: string): Promise<{
        orgId: string;
        mandatory2fa: boolean;
    }>;
}
