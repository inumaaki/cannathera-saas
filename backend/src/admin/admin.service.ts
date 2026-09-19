import {
  Injectable,
  Logger,
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
import {
  accountActivatedEmail,
  onboardingEmail,
} from '../shared/email-templates';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async sendActivationEmail(user: {
    email: string;
    firstName: string | null;
  }) {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      this.logger.log(`[MOCK] Activation email skipped (no SMTP) for ${user.email}`);
      return;
    }

    try {
      const smtpHost = process.env.SMTP_HOST;
      const dnsResult = await lookup(smtpHost, { family: 4 });
      const transporter = nodemailer.createTransport({
        host: dnsResult.address,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: { servername: smtpHost },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? '"Cannathera" <no-reply@cannathera.de>',
        to: user.email,
        ...accountActivatedEmail({ firstName: user.firstName }),
      });
      this.logger.log(`Activation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send activation email to ${user.email}:`, error);
    }
  }

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
      const updatedUser = await this.prisma.user.update({
        where: { id: membership.userId },
        data: { isActive: newStatus },
      });
      if (newStatus) void this.sendActivationEmail(updatedUser);
    }

    return { orgId, isActive: newStatus };
  }

  /**
   * Assign (or clear) a per-partner pilot price. This is an admin-only override
   * for individual commercial agreements — e.g. a €400 flat rate or a free
   * first month — separate from the global per-tier plan price.
   *
   * Setting a price activates the org's subscription (so the partner is
   * unlocked past the paywall) and stores customMonthlyPrice + optional end
   * date + note for display. Passing price = null clears the override and
   * reverts the displayed price to the plan's standard tier price.
   *
   * Display + access only — no Stripe charge or invoice is generated.
   */
  async setPilotPricing(
    orgId: string,
    dto: {
      price: number | null;
      endsAt?: string | null;
      note?: string | null;
      tier?: SubscriptionTier;
    },
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: { include: { plan: true } },
        memberships: { include: { user: true } },
      },
    });
    if (!org) throw new NotFoundException('ORGANIZATION_NOT_FOUND');

    if (dto.price != null && dto.price < 0) {
      throw new BadRequestException('INVALID_PRICE');
    }

    const endsAt =
      dto.endsAt != null && dto.endsAt !== '' ? new Date(dto.endsAt) : null;
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('INVALID_END_DATE');
    }

    const existingSub = org.subscriptions[0];

    // Resolve a plan to attach the subscription to. If dto.tier is provided,
    // we use that tier and update the subscription. Otherwise use the existing tier or default.
    const tier =
      dto.tier ?? existingSub?.plan?.tier ?? SubscriptionTier.PREMIUM;
    let plan = await this.prisma.pricingPlan.findFirst({ where: { tier } });
    if (!plan) {
      plan = await this.prisma.pricingPlan.create({
        data: {
          tier,
          name: tier.toString(),
          monthlyPrice: tier === SubscriptionTier.PREMIUM ? 349 : 149,
          reviewCap: tier === SubscriptionTier.ENTERPRISE ? null : 100,
          features: { pdfExports: true },
        },
      });
    }
    const planId = plan.id;

    if (existingSub) {
      await this.prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId,
          isActive: true,
          customMonthlyPrice: dto.price,
          endsAt,
          pilotNote: dto.note ?? null,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          orgId: org.id,
          planId,
          isActive: true,
          customMonthlyPrice: dto.price,
          endsAt,
          pilotNote: dto.note ?? null,
        },
      });
    }

    // Activate member users so both the subscription gate and the per-user
    // active check pass (mirrors togglePartner).
    for (const membership of org.memberships) {
      if (!membership.user.isActive) {
        const updatedUser = await this.prisma.user.update({
          where: { id: membership.userId },
          data: { isActive: true },
        });
        void this.sendActivationEmail(updatedUser);
      }
    }

    await this.prisma.auditLog.create({
      data: {
        action:
          dto.price == null
            ? 'PARTNER_PILOT_PRICE_CLEARED'
            : 'PARTNER_PILOT_PRICE_SET',
        entityType: 'Organization',
        entityId: orgId,
      },
    });

    return {
      orgId,
      customMonthlyPrice: dto.price,
      endsAt,
      pilotNote: dto.note ?? null,
    };
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
    if (dto.type === OrgType.PATIENT) role = Role.PATIENT;

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

    // Subscription is no longer created automatically so the partner will hit the paywall

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
              ...(role === Role.PHARMACY
                ? ['alerts:view', 'alerts:acknowledge']
                : []),
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

    if (role === Role.PATIENT) {
      await this.prisma.patientProfile.create({
        data: {
          userId: user.id,
          orgId: org.id,
          packageTier: dto.planTier,
          hasActiveSubscription: true,
        },
      });
    }

    // Send onboarding email logic
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      const smtpHost = process.env.SMTP_HOST;
      lookup(smtpHost, { family: 4 })
        .then((dnsResult: { address: string }) => {
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
          } as nodemailer.TransportOptions);
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
              this.logger.log(`Onboarding email sent to ${user.email}`);
            })
            .catch((err) => {
              this.logger.error('Failed to send onboarding email:', err);
            });
        })
        .catch((err: any) => {
          this.logger.error('Failed to resolve SMTP host to IPv4 for onboarding:', err);
        });
    } else {
      this.logger.log(`[MOCK] Onboarding email skipped (no SMTP) for ${user.email}`);
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

  /**
   * Cross-org red-flag oversight for the admin. Unlike the doctor view (scoped
   * to a single practice), this returns hits across ALL partner orgs, with the
   * owning practice/pharmacy name so the admin can monitor compliance network-wide.
   */
  async listRedFlags(view: 'unreviewed' | 'reviewed' | 'all' = 'unreviewed') {
    const hits = await this.prisma.redFlagHit.findMany({
      where: {
        ...(view === 'all' ? {} : { acknowledged: view === 'reviewed' }),
      },
      orderBy: [
        { acknowledged: 'asc' },
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            org: { select: { id: true, name: true } },
            pharmacy: { select: { id: true, name: true } },
          },
        },
        submission: {
          select: {
            id: true,
            submittedAt: true,
            version: {
              select: { questionnaire: { select: { key: true, title: true } } },
            },
          },
        },
      },
    });
    return hits.map((h) => ({
      id: h.id,
      severity: h.severity,
      message: h.message,
      createdAt: h.createdAt,
      acknowledged: h.acknowledged,
      source: h.source,
      patientId: h.patientId,
      patientName:
        [h.patient.user.firstName, h.patient.user.lastName]
          .filter(Boolean)
          .join(' ') || '—',
      patientRef: h.patient.patientRef,
      practiceName: h.patient.org?.name ?? null,
      pharmacyName: h.patient.pharmacy?.name ?? null,
      submissionId: h.submissionId,
      questionnaire:
        h.submission?.version.questionnaire.title ?? 'Tageseintrag',
      submittedAt: h.submission?.submittedAt ?? h.createdAt,
    }));
  }

  /** Admin marks a red flag reviewed/processed (any org). */
  async acknowledgeRedFlag(adminUserId: string, flagId: string) {
    const existing = await this.prisma.redFlagHit.findUnique({
      where: { id: flagId },
      select: { id: true, patientId: true, acknowledged: true },
    });
    if (!existing) throw new NotFoundException('FLAG_NOT_FOUND');

    const hit = await this.prisma.redFlagHit.update({
      where: { id: flagId },
      data: { acknowledged: true },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'RED_FLAG_ACKNOWLEDGED',
        entityType: 'RedFlagHit',
        entityId: flagId,
        metadata: { patientId: hit.patientId, by: 'admin' },
      },
    });
    return { ok: true };
  }

  async listUsers() {
    // Exclude protected admin accounts from the UI to prevent accidental suspension
    const PROTECTED_EMAILS = [
      'd.larkin@cannathera-report.de',
      'admin@example.com',
    ];
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
    const PROTECTED_EMAILS = [
      'd.larkin@cannathera-report.de',
      'admin@example.com',
    ];
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (PROTECTED_EMAILS.includes(user.email)) {
      throw new BadRequestException('CANNOT_SUSPEND_ADMIN_ACCOUNT');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
    if (updated.isActive) void this.sendActivationEmail(updated);
    return { userId: updated.id, isActive: updated.isActive };
  }

  async listPricingPlans(targetGroup?: OrgType) {
    const defaultPlans = [
      // Doctor / Practice Plans
      {
        tier: SubscriptionTier.BASIC,
        targetGroup: OrgType.PRACTICE,
        name: 'Arzt-Praxis Basic',
        monthlyPrice: 149,
        reviewCap: 50,
        features: { pdfExports: true, patientCaseLimit: 50 },
      },
      {
        tier: SubscriptionTier.PLUS,
        targetGroup: OrgType.PRACTICE,
        name: 'Arzt-Praxis Pro',
        monthlyPrice: 249,
        reviewCap: 150,
        features: { pdfExports: true, patientCaseLimit: 150 },
      },
      {
        tier: SubscriptionTier.PREMIUM,
        targetGroup: OrgType.PRACTICE,
        name: 'Arzt-Praxis Premium',
        monthlyPrice: 349,
        reviewCap: 300,
        features: { pdfExports: true, patientCaseLimit: 300, prioritySupport: true },
      },
      {
        tier: SubscriptionTier.ENTERPRISE,
        targetGroup: OrgType.PRACTICE,
        name: 'Arzt-Praxis Enterprise',
        monthlyPrice: 799,
        reviewCap: null,
        features: { pdfExports: true, patientCaseLimit: null, customIntegrations: true },
      },
      // Pharmacy Plans
      {
        tier: SubscriptionTier.BASIC,
        targetGroup: OrgType.PHARMACY,
        name: 'Apotheke Flex (bis 50 Pat.)',
        monthlyPrice: 199,
        reviewCap: 50,
        features: { webshopSync: true, maxPatients: 50 },
      },
      {
        tier: SubscriptionTier.PLUS,
        targetGroup: OrgType.PHARMACY,
        name: 'Apotheke Flashback S (bis 150 Pat.)',
        monthlyPrice: 399,
        reviewCap: 150,
        features: { webshopSync: true, maxPatients: 150 },
      },
      {
        tier: SubscriptionTier.PREMIUM,
        targetGroup: OrgType.PHARMACY,
        name: 'Apotheke Flashback M (bis 350 Pat.)',
        monthlyPrice: 699,
        reviewCap: 350,
        features: { webshopSync: true, maxPatients: 350, priorityDispense: true },
      },
      {
        tier: SubscriptionTier.ENTERPRISE,
        targetGroup: OrgType.PHARMACY,
        name: 'Apotheke Enterprise (350+ Pat.)',
        monthlyPrice: 999,
        reviewCap: null,
        features: { webshopSync: true, maxPatients: null, dedicatedApi: true },
      },
    ];

    for (const p of defaultPlans) {
      const exists = await this.prisma.pricingPlan.findFirst({
        where: { tier: p.tier, targetGroup: p.targetGroup },
      });
      if (!exists) {
        await this.prisma.pricingPlan.create({
          data: p,
        });
      }
    }

    const where = targetGroup ? { targetGroup } : {};
    return this.prisma.pricingPlan.findMany({
      where,
      orderBy: [{ targetGroup: 'asc' }, { monthlyPrice: 'asc' }],
    });
  }

  async updatePricingPlan(
    id: string,
    dto: { monthlyPrice?: number; reviewCap?: number; isActive?: boolean; targetGroup?: OrgType; name?: string },
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

  // ── Partner Codes ──────────────────────────────────────────────────────────

  async listPartnerCodes() {
    return this.prisma.partnerCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        org: {
          select: { id: true, name: true, type: true },
        },
      },
    });
  }

  async createPartnerCode(dto: {
    orgId: string;
    label?: string;
    maxUses?: number;
    expiresAt?: Date;
  }) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.orgId },
    });
    if (!org) throw new NotFoundException('ORGANIZATION_NOT_FOUND');

    // Generate a unique, short, human-readable code
    const prefix = org.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    const code = `${prefix}-${suffix}`;

    return this.prisma.partnerCode.create({
      data: {
        orgId: dto.orgId,
        code,
        label: dto.label,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt,
      },
      include: {
        org: {
          select: { id: true, name: true, type: true },
        },
      },
    });
  }

  async togglePartnerCode(id: string) {
    const code = await this.prisma.partnerCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('PARTNER_CODE_NOT_FOUND');
    const updated = await this.prisma.partnerCode.update({
      where: { id },
      data: { isActive: !code.isActive },
    });
    return { id: updated.id, isActive: updated.isActive };
  }
}
