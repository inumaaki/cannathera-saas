import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

/** Enterprise org roles, ordered by power. */
export const ORG_ROLES = ['SUPER_ADMIN', 'SUPPORT', 'BILLING', 'VIEWER'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/**
 * What each role may do. Mirrors the Figma role matrix: Super Admins have full
 * control over API keys, billing, team and security; Support sees clinical data
 * and partner config; Billing sees invoices; Viewer is read-only.
 */
export const CAN: Record<OrgRole, readonly string[]> = {
  SUPER_ADMIN: [
    'team:manage',
    'settings:manage',
    'keys:manage',
    'webhooks:manage',
    'partners:manage',
    'branding:manage',
    'billing:manage',
    'billing:view',
    'network:view',
  ],
  SUPPORT: ['partners:manage', 'network:view'],
  BILLING: ['billing:view', 'network:view'],
  VIEWER: ['network:view'],
} as const;

export type EnterprisePermission = (typeof CAN)[OrgRole][number];

export async function membershipOf(prisma: PrismaService, userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { org: true },
  });
  if (!membership) throw new NotFoundException('NO_ORGANIZATION');
  return membership;
}

/**
 * Authorises an action inside the enterprise org. Belonging to the org is NOT
 * enough — a VIEWER must never be able to remove a SUPER_ADMIN or rotate keys.
 */
/** Accounts created before the enterprise roles existed carry the generic
    org role "ADMIN"; treat it as the enterprise's SUPER_ADMIN. */
export function normalizeRole(orgRole: string | null | undefined): OrgRole {
  if (orgRole === 'ADMIN') return 'SUPER_ADMIN';
  return ORG_ROLES.includes(orgRole as OrgRole) ? (orgRole as OrgRole) : 'VIEWER';
}

export async function requirePermission(
  prisma: PrismaService,
  userId: string,
  permission: string,
) {
  const membership = await membershipOf(prisma, userId);
  const allowed = CAN[normalizeRole(membership.orgRole)];
  if (!allowed.includes(permission)) {
    throw new ForbiddenException('MISSING_PERMISSION');
  }
  return membership;
}
