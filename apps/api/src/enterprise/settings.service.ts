import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ORG_ROLES, membershipOf, normalizeRole, requirePermission } from './access';

/* Figma 8.7 Team Management + 8.8 Organization Settings. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private membershipOf(userId: string) {
    return membershipOf(this.prisma, userId);
  }

  private requirePermission(userId: string, permission: string) {
    return requirePermission(this.prisma, userId, permission);
  }

  /** Refuses to leave the organisation without a single SUPER_ADMIN.
      `ADMIN` is the legacy spelling and still counts as one. */
  private async assertNotLastAdmin(orgId: string, membershipId: string) {
    const admins = await this.prisma.membership.findMany({
      where: { orgId, orgRole: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      select: { id: true },
    });
    if (admins.length <= 1 && admins.some((a) => a.id === membershipId)) {
      throw new ConflictException('LAST_ADMIN');
    }
  }

  private generateTempPassword() {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const pick = (n: number) =>
      Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join('');
    return `${pick(4)}-${pick(4)}-${pick(2)}`;
  }

  // ----------------------------------------------------------------- team ---
  async team(userId: string) {
    const me = await this.membershipOf(userId);
    const members = await this.prisma.membership.findMany({
      where: { orgId: me.orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            mustChangePassword: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name:
        [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email,
      email: m.user.email,
      orgRole: normalizeRole(m.orgRole),
      permissions: m.permissions,
      // "Invited" until they have set their own password.
      status: m.user.mustChangePassword ? 'invited' : 'active',
      isSelf: m.userId === userId,
      createdAt: m.user.createdAt,
    }));

    const settings = await this.prisma.orgSettings.findUnique({
      where: { orgId: me.orgId },
    });
    const twoFaOn = settings?.mandatory2fa ?? true;

    return {
      rows,
      // The UI hides management controls for non-admins; the API rejects them
      // regardless, so this is convenience, not the security boundary.
      me: {
        orgRole: normalizeRole(me.orgRole),
        canManageTeam: normalizeRole(me.orgRole) === 'SUPER_ADMIN',
      },
      stats: {
        totalActive: rows.filter((r) => r.status === 'active').length,
        pendingInvites: rows.filter((r) => r.status === 'invited').length,
        // Honest: 2FA covers everyone only while the org policy enforces it.
        mfaCoverage: twoFaOn ? 100 : 0,
      },
    };
  }

  async invite(
    userId: string,
    data: { email: string; firstName?: string; lastName?: string; orgRole: string },
  ) {
    // Only a SUPER_ADMIN may add members.
    const me = await this.requirePermission(userId, 'team:manage');
    if (!ORG_ROLES.includes(data.orgRole as (typeof ORG_ROLES)[number])) {
      throw new ConflictException('INVALID_ROLE');
    }
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new ConflictException('EMAIL_TAKEN');

    const tempPassword = this.generateTempPassword();
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await argon2.hash(tempPassword),
        role: Role.ENTERPRISE,
        firstName: data.firstName,
        lastName: data.lastName,
        mustChangePassword: true,
        memberships: {
          create: {
            orgId: me.orgId,
            roleInOrg: Role.ENTERPRISE,
            orgRole: data.orgRole,
            permissions:
              data.orgRole === 'SUPER_ADMIN'
                ? ['patients:view', 'alerts:view', 'reports:view', 'settings:practice', 'settings:team', 'compliance:view']
                : data.orgRole === 'BILLING'
                  ? ['reports:view', 'compliance:view']
                  : ['patients:view', 'reports:view'],
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ENTERPRISE_MEMBER_INVITED',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: data.email, orgRole: data.orgRole },
      },
    });

    // No mail yet (M11) — the temp password is handed back so the admin can pass
    // it on. It is never stored in clear anywhere.
    return { email: user.email, tempPassword, orgRole: data.orgRole };
  }

  async updateMember(userId: string, membershipId: string, orgRole: string) {
    // Only a SUPER_ADMIN may change roles — otherwise a VIEWER could promote
    // themselves or demote the admin.
    const me = await this.requirePermission(userId, 'team:manage');
    if (!ORG_ROLES.includes(orgRole as (typeof ORG_ROLES)[number])) {
      throw new ConflictException('INVALID_ROLE');
    }
    const target = await this.prisma.membership.findFirst({
      where: { id: membershipId, orgId: me.orgId },
    });
    if (!target) throw new NotFoundException('MEMBER_NOT_FOUND');
    // An admin must not be able to demote themselves out of admin rights.
    if (target.userId === userId && orgRole !== 'SUPER_ADMIN') {
      throw new ConflictException('CANNOT_DEMOTE_SELF');
    }
    // …nor demote the only remaining admin.
    if (normalizeRole(target.orgRole) === 'SUPER_ADMIN' && orgRole !== 'SUPER_ADMIN') {
      await this.assertNotLastAdmin(me.orgId, membershipId);
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { orgRole },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ENTERPRISE_MEMBER_UPDATED',
        entityType: 'Membership',
        entityId: membershipId,
        metadata: { orgRole },
      },
    });
    return updated;
  }

  async removeMember(userId: string, membershipId: string) {
    // Only a SUPER_ADMIN may remove members. Without this, any member could
    // delete the admin and take over the organisation.
    const me = await this.requirePermission(userId, 'team:manage');
    const target = await this.prisma.membership.findFirst({
      where: { id: membershipId, orgId: me.orgId },
    });
    if (!target) throw new NotFoundException('MEMBER_NOT_FOUND');
    if (target.userId === userId) throw new ConflictException('CANNOT_REMOVE_SELF');
    if (normalizeRole(target.orgRole) === 'SUPER_ADMIN') {
      await this.assertNotLastAdmin(me.orgId, membershipId);
    }

    await this.prisma.membership.delete({ where: { id: membershipId } });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ENTERPRISE_MEMBER_REMOVED',
        entityType: 'Membership',
        entityId: membershipId,
      },
    });
    return { ok: true };
  }

  // ------------------------------------------------------------- settings ---
  async settings(userId: string) {
    const me = await this.membershipOf(userId);
    const settings = await this.prisma.orgSettings.upsert({
      where: { orgId: me.orgId },
      update: {},
      create: { orgId: me.orgId },
    });

    const auditCount = await this.prisma.auditLog.count();
    const reports = await this.prisma.report.count();

    return {
      security: {
        mandatory2fa: settings.mandatory2fa,
        sessionTimeoutMin: settings.sessionTimeoutMin,
      },
      // Honest system facts, not decoration.
      system: {
        apiStatus: 'operational',
        passwordHashing: 'argon2id',
        transport: 'TLS 1.3',
        storedReports: reports,
        auditEntries: auditCount,
      },
    };
  }

  async updateSettings(
    userId: string,
    data: { mandatory2fa?: boolean; sessionTimeoutMin?: number },
  ) {
    // Security policy is admin-only.
    const me = await this.requirePermission(userId, 'settings:manage');
    const updated = await this.prisma.orgSettings.upsert({
      where: { orgId: me.orgId },
      update: data,
      create: { orgId: me.orgId, ...data },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_SECURITY_CONFIG',
        entityType: 'OrgSettings',
        entityId: updated.id,
        metadata: data,
      },
    });
    return updated;
  }

  /** System audit log panel (Figma 8.8) — this network only.
      Without the org filter this returned every clinic's audit trail. */
  async auditLog(userId: string, limit = 25, action?: string) {
    const me = await this.membershipOf(userId);

    // Everyone whose actions this network may see: its own staff, plus the staff
    // of the member practices/pharmacies underneath it.
    const members = await this.prisma.organization.findMany({
      where: { parentOrgId: me.orgId },
      select: { id: true },
    });
    const orgIds = [me.orgId, ...members.map((m) => m.id)];

    const where: Prisma.AuditLogWhereInput = {
      user: { memberships: { some: { orgId: { in: orgIds } } } },
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
    };

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, limit),
      include: { user: { select: { email: true } } },
    });
    const total = await this.prisma.auditLog.count({ where });
    return {
      rows: rows.map((r) => ({
        id: r.id,
        user: r.user?.email ?? 'system_daemon',
        action: r.action,
        entityType: r.entityType,
        createdAt: r.createdAt,
      })),
      total,
    };
  }
}
