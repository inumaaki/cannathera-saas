import type { PrismaService } from '../prisma/prisma.service';
export declare const ORG_ROLES: readonly ["SUPER_ADMIN", "SUPPORT", "BILLING", "VIEWER"];
export type OrgRole = (typeof ORG_ROLES)[number];
export declare const CAN: Record<OrgRole, readonly string[]>;
export type EnterprisePermission = (typeof CAN)[OrgRole][number];
export declare function membershipOf(prisma: PrismaService, userId: string): Promise<{
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
}>;
export declare function normalizeRole(orgRole: string | null | undefined): OrgRole;
export declare function requirePermission(prisma: PrismaService, userId: string, permission: string): Promise<{
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
}>;
