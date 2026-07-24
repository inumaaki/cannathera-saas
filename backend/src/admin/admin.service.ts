import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrgType, Role, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import * as nodemailer from 'nodemailer';
import { lookup } from 'dns/promises';
import { onboardingEmail } from '../shared/email-templates';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private onboardingKey() {
    const secret =
      process.env.ONBOARDING_CREDENTIAL_SECRET ??
      process.env.JWT_SECRET ??
      'dev-only-onboarding-secret';
    return createHash('sha256').update(secret).digest();
  }

  private encryptTemporaryPassword(password: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.onboardingKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(password, 'utf8'),
      cipher.final(),
    ]);
    return [
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  private decryptTemporaryPassword(value: string | null) {
    if (!value) return null;
    try {
      const [iv, tag, encrypted] = value.split('.');
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.onboardingKey(),
        Buffer.from(iv, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null;
    }
  }

  async listPartners() {
    const partners = await this.prisma.organization.findMany({
      where: {
        type: {
          in: [
            OrgType.PRACTICE,
            OrgType.PHARMACY,
            OrgType.ENTERPRISE,
            OrgType.CLINIC,
          ],
        },
      },
      include: {
        settings: true,
        subscriptions: {
          include: {
            plan: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                createdAt: true,
                mustChangePassword: true,
                temporaryPasswordEncrypted: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return partners.map((partner) => ({
      ...partner,
      memberships: partner.memberships.map((membership) => {
        const { temporaryPasswordEncrypted, ...user } = membership.user;
        return {
          ...membership,
          user: {
            ...user,
            temporaryPassword: user.mustChangePassword
              ? this.decryptTemporaryPassword(temporaryPasswordEncrypted)
              : null,
          },
        };
      }),
    }));
  }

  async togglePartner(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: true,
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!org) throw new NotFoundException('ORGANIZATION_NOT_FOUND');

    // Toggle active subscription status
    const activeSub = org.subscriptions[0];
    let newStatus = true;
    if (activeSub) {
      newStatus = !activeSub.isActive;
      await this.prisma.subscription.update({
        where: { id: activeSub.id },
        data: { isActive: newStatus },
      });
    } else {
      // If no subscription existed, create one active
      const plan = await this.prisma.pricingPlan.findFirst({
        where: { tier: SubscriptionTier.PREMIUM },
      });
      await this.prisma.subscription.create({
        data: {
          orgId: org.id,
          planId: plan?.id ?? 'default-plan',
          isActive: true,
        },
      });
    }

    // Toggle memberships user active status
    for (const membership of org.memberships) {
      await this.prisma.user.update({
        where: { id: membership.userId },
        data: { isActive: newStatus },
      });
    }

    return { orgId, isActive: newStatus };
  }

  async issueTemporaryPassword(orgId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { orgId, orgRole: 'ADMIN' },
      include: { user: true },
    });
    if (!membership) throw new NotFoundException('PARTNER_ADMIN_NOT_FOUND');
    if (!membership.user.mustChangePassword) {
      throw new BadRequestException('PASSWORD_ALREADY_UPDATED');
    }

    const tempPassword = randomBytes(4).toString('hex');
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: {
        passwordHash: await argon2.hash(tempPassword),
        temporaryPasswordEncrypted: this.encryptTemporaryPassword(tempPassword),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: membership.userId,
        action: 'TEMP_PASSWORD_REISSUED_BY_ADMIN',
        entityType: 'Organization',
        entityId: orgId,
      },
    });
    return { userId: membership.userId, tempPassword };
  }

  async onboardPartner(dto: {
    name: string;
    type: OrgType;
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
    planTier: SubscriptionTier;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestException('EMAIL_ALREADY_REGISTERED');
    }

    // Determine Role
    let role: Role = Role.DOCTOR;
    if (dto.type === OrgType.PHARMACY) role = Role.PHARMACY;
    if (dto.type === OrgType.ENTERPRISE) role = Role.ENTERPRISE;

    // Get pricing plan
    let plan = await this.prisma.pricingPlan.findFirst({
      where: { tier: dto.planTier },
    });
    if (!plan) {
      plan = await this.prisma.pricingPlan.create({
        data: {
          tier: dto.planTier,
          name: dto.planTier.toString(),
          monthlyPrice: dto.planTier === SubscriptionTier.PREMIUM ? 349 : 149,
          reviewCap: 100,
          features: { pdfExports: true },
        },
      });
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        type: dto.type,
      },
    });

    // Create active subscription
    await this.prisma.subscription.create({
      data: {
        orgId: org.id,
        planId: plan.id,
        isActive: true,
      },
    });

    const tempPassword = randomBytes(4).toString('hex');
    const passwordHash = await argon2.hash(tempPassword);

    // Create admin user
    const user = await this.prisma.user.create({
      data: {
        email: dto.adminEmail.toLowerCase(),
        passwordHash,
        role,
        firstName: dto.adminFirstName,
        lastName: dto.adminLastName,
        isActive: true,
        mustChangePassword: true,
        temporaryPasswordEncrypted: this.encryptTemporaryPassword(tempPassword),
        memberships: {
          create: {
            orgId: org.id,
            roleInOrg: role,
            orgRole: 'ADMIN',
            permissions: [
              'patients:view',
              'patients:create',
              'patients:note',
              'alerts:view',
              'alerts:acknowledge',
              'appointments:manage',
              'reports:view',
              'settings:practice',
              'settings:team',
              'compliance:view',
            ],
          },
        },
      },
    });

    // Send onboarding email logic
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      const smtpHost = process.env.SMTP_HOST;
      lookup(smtpHost, { family: 4 })
        .then((dnsResult: any) => {
          const transporter = nodemailer.createTransport({
            host: dnsResult.address,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
            tls: {
              servername: smtpHost,
            },
          } as any);
          const message = onboardingEmail({
            firstName: user.firstName,
            email: user.email,
            temporaryPassword: tempPassword,
          });
          transporter
            .sendMail({
              from:
                process.env.SMTP_FROM ??
                '"Cannathera" <no-reply@cannathera.de>',
              to: user.email,
              ...message,
            })
            .then(() => {
              console.log(`Onboarding email sent to ${user.email}`);
            })
            .catch((err) => {
              console.error('Failed to send onboarding email:', err);
            });
        })
        .catch((err: any) => {
          console.error(
            'Failed to resolve SMTP host to IPv4 for onboarding:',
            err,
          );
        });
    } else {
      console.log(
        `[ONBOARDING MOCK EMAIL] Temporary credentials for ${user.email}: ${tempPassword}`,
      );
    }

    return { orgId: org.id, userId: user.id, tempPassword };
  }

  async listAuditLogs() {
    return this.prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async listUsers() {
    // Exclude protected admin accounts from the UI to prevent accidental suspension
    const PROTECTED_EMAILS = ['admin@cannathera.de', 'admin@example.com'];
    return this.prisma.user.findMany({
      where: {
        email: { notIn: PROTECTED_EMAILS },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          include: {
            org: true,
          },
        },
      },
    });
  }

  async toggleUser(userId: string) {
    const PROTECTED_EMAILS = ['admin@cannathera.de', 'admin@example.com'];
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (PROTECTED_EMAILS.includes(user.email)) {
      throw new BadRequestException('CANNOT_SUSPEND_ADMIN_ACCOUNT');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
    return { userId: updated.id, isActive: updated.isActive };
  }

  async listPricingPlans() {
    return this.prisma.pricingPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  async updatePricingPlan(
    id: string,
    dto: { monthlyPrice?: number; reviewCap?: number; isActive?: boolean },
  ) {
    const plan = await this.prisma.pricingPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('PRICING_PLAN_NOT_FOUND');
    return this.prisma.pricingPlan.update({
      where: { id },
      data: dto,
    });
  }

  async togglePartner2FA(orgId: string) {
    const settings = await this.prisma.orgSettings.findUnique({
      where: { orgId },
    });
    const current = settings?.mandatory2fa ?? true;
    const updated = await this.prisma.orgSettings.upsert({
      where: { orgId },
      update: { mandatory2fa: !current },
      create: { orgId, mandatory2fa: !current },
    });
    return { orgId, mandatory2fa: updated.mandatory2fa };
  }
}
