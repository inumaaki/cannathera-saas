import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private membershipOf;
    private requirePermission;
    private assertNotLastAdmin;
    private generateTempPassword;
    team(userId: string): Promise<{
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
    invite(userId: string, data: {
        email: string;
        firstName?: string;
        lastName?: string;
        orgRole: string;
    }): Promise<{
        email: string;
        tempPassword: string;
        orgRole: string;
    }>;
    updateMember(userId: string, membershipId: string, orgRole: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        orgId: string;
        roleInOrg: import("@prisma/client").$Enums.Role;
        orgRole: string;
        permissions: string[];
    }>;
    removeMember(userId: string, membershipId: string): Promise<{
        ok: boolean;
    }>;
    settings(userId: string): Promise<{
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
    updateSettings(userId: string, data: {
        mandatory2fa?: boolean;
        sessionTimeoutMin?: number;
    }): Promise<{
        id: string;
        updatedAt: Date;
        orgId: string;
        mandatory2fa: boolean;
        sessionTimeoutMin: number;
    }>;
    auditLog(userId: string, limit?: number, action?: string): Promise<{
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
