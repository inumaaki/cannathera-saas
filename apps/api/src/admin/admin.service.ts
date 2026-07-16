import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrgType, Role, SubscriptionTier } from '@cannathera/db';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listPartners() {
    return this.prisma.organization.findMany({
      where: {
        type: {
          in: [OrgType.PRACTICE, OrgType.PHARMACY, OrgType.ENTERPRISE, OrgType.CLINIC],
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
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        const greetingName = user.firstName ? user.firstName : 'Partner';
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? '"Cannathera" <no-reply@cannathera.de>',
          to: user.email,
          subject: 'Welcome to Cannathera - Account Activated',
          text: `Welcome to Cannathera!\n\nYour account has been onboarded.\nEmail: ${user.email}\nTemporary Password: ${tempPassword}\n\nPlease sign in at http://localhost:3000/en/login. You will be prompted to set a new strong password on your first login.`,
          html: `
            <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0d3a2e 0%, #164e43 100%); padding: 35px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; font-family: 'Outfit', sans-serif;">CANNATHERA</h1>
                  <p style="color: #3cd3ad; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Welcome Partner</p>
                </div>
                <!-- Body -->
                <div style="padding: 40px 30px; line-height: 1.6; color: #334155;">
                  <h2 style="color: #0d3a2e; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${greetingName},</h2>
                  <p style="font-size: 15px; margin-bottom: 20px;">Your partner administrator account has been onboarded and activated successfully. Please find your login credentials below:</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 15px;"><strong>Email Address:</strong> <span style="color: #0d3a2e; font-family: monospace;">${user.email}</span></p>
                    <p style="margin: 0; font-size: 15px;"><strong>Temporary Password:</strong> <span style="color: #0d3a2e; font-family: monospace; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span></p>
                  </div>

                  <p style="font-size: 14px; color: #64748b; margin-top: 20px;"><em>Security Notice: For your security, you will be prompted to set a new strong password immediately upon your first sign-in.</em></p>

                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="http://localhost:3000/en/login" style="background-color: #0d3a2e; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(13, 58, 46, 0.15); transition: background-color 0.2s;">Sign In to Account</a>
                  </div>
                </div>
                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0;">&copy; 2026 Cannathera GmbH. All rights reserved.</p>
                  <p style="margin: 5px 0 0 0;">This is an automated operational message. Please do not reply.</p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (err) {
        console.error('Failed to send onboarding email:', err);
      }
    } else {
      console.log(`[ONBOARDING MOCK EMAIL] Temporary credentials for ${user.email}: ${tempPassword}`);
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

  async updatePricingPlan(id: string, dto: { monthlyPrice?: number; reviewCap?: number; isActive?: boolean }) {
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
