import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Locale, OrgType, Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_PRESETS } from '../shared';
import type {
  DoctorDataDto,
  EnterpriseDataDto,
  PatientDataDto,
  PharmacyDataDto,
  RegisterDto,
} from './dto/register.dto';

const CODE_TTL_MS = 10 * 60 * 1000; // 2FA code valid 10 minutes
const CONSENT_VERSION = '2026-07-v1';

// `ttlMin` carries the org's session policy so the guard can slide the window.
export type SessionPayload = {
  sub: string;
  role: Role;
  stage: 'session';
  ttlMin?: number;
};
export type PreAuthPayload = { sub: string; stage: '2fa'; remember?: boolean };

/** Fallbacks when a user belongs to no organisation (patients). */
const DEFAULT_POLICY = { mandatory2fa: true, sessionTimeoutMin: 12 * 60 };
const REMEMBER_MIN = 30 * 24 * 60; // "stay signed in" — 30 days

export type LoginResult =
  | { user: User; session: string; ttlMin: number }
  | { user: User; preAuthToken: string; devCode?: string };

const ROLE_MAP: Record<RegisterDto['role'], Role> = {
  patient: Role.PATIENT,
  doctor: Role.DOCTOR,
  pharmacy: Role.PHARMACY,
  enterprise: Role.ENTERPRISE,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ---------------------------------------------------------------- register
  async register(dto: RegisterDto, ip?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('EMAIL_TAKEN');

    const passwordHash = await argon2.hash(dto.password);
    const role = ROLE_MAP[dto.role];

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role,
          firstName: dto.firstName,
          lastName: dto.lastName,
          locale: dto.locale ?? Locale.de,
          isActive: role === Role.PATIENT,
        },
      });

      switch (dto.role) {
        case 'patient': {
          const data = dto.roleData as PatientDataDto | undefined;
          if (!data?.consentArt9) {
            // Art. 9 GDPR consent is mandatory for processing health data.
            throw new BadRequestException('CONSENT_ART9_REQUIRED');
          }
          await tx.patientProfile.create({
            data: {
              userId: created.id,
              dateOfBirth: new Date(data.dateOfBirth),
              therapyStart: new Date(),
            },
          });
          if (data.preferredLanguage) {
            await tx.user.update({
              where: { id: created.id },
              data: { locale: data.preferredLanguage },
            });
          }
          await tx.consent.create({
            data: {
              userId: created.id,
              purpose: 'data_processing_art9',
              version: CONSENT_VERSION,
              ipAddress: ip,
            },
          });
          if (data.consentShareDoctor) {
            await tx.consent.create({
              data: {
                userId: created.id,
                purpose: 'share_with_doctor',
                version: CONSENT_VERSION,
                ipAddress: ip,
              },
            });
          }
          break;
        }
        case 'doctor': {
          const data = dto.roleData as DoctorDataDto | undefined;
          const org = await tx.organization.create({
            data: {
              name: data?.practiceName ?? `Praxis ${dto.lastName}`,
              type: OrgType.PRACTICE,
              branding: data
                ? { lanr: data.lanr, bsnr: data.bsnr, specialty: data.specialty, phone: data.phone }
                : undefined,
            },
          });
          await tx.membership.create({
            data: {
              userId: created.id,
              orgId: org.id,
              roleInOrg: Role.DOCTOR,
              orgRole: 'ADMIN',
              permissions: [...ROLE_PRESETS.ADMIN],
            },
          });
          break;
        }
        case 'pharmacy': {
          const data = dto.roleData as PharmacyDataDto | undefined;
          const org = await tx.organization.create({
            data: {
              name: data?.pharmacyName ?? `Apotheke ${dto.lastName}`,
              type: OrgType.PHARMACY,
              branding: data
                ? { contactPerson: data.contactPerson, address: data.address, phone: data.phone, idf: data.idf }
                : undefined,
            },
          });
          await tx.membership.create({
            data: {
              userId: created.id,
              orgId: org.id,
              roleInOrg: Role.PHARMACY,
              orgRole: 'ADMIN',
              permissions: [...ROLE_PRESETS.ADMIN],
            },
          });
          break;
        }
        case 'enterprise': {
          const data = dto.roleData as EnterpriseDataDto | undefined;
          const org = await tx.organization.create({
            data: {
              name: data?.companyName ?? `Enterprise ${dto.lastName}`,
              type: OrgType.ENTERPRISE,
              branding: data
                ? { contactPerson: data.contactPerson, partnerType: data.partnerType, phone: data.phone }
                : undefined,
            },
          });
          await tx.membership.create({
            data: {
              userId: created.id,
              orgId: org.id,
              roleInOrg: Role.ENTERPRISE,
              orgRole: 'ADMIN',
              permissions: [...ROLE_PRESETS.ADMIN],
            },
          });
          break;
        }
      }

      await tx.auditLog.create({
        data: {
          userId: created.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: created.id,
          metadata: { role },
          ipAddress: ip,
        },
      });

      return created;
    });

    const devCode = await this.issueTwoFactorCode(user);
    return { user, preAuthToken: this.signPreAuth(user), devCode };
  }

  /**
   * The security policy that governs this user: their organisation's, or a safe
   * default for patients (who belong to no org). This is what makes the
   * "Zwei-Faktor-Pflicht" and "Sitzungs-Timeout" switches in Organisation
   * Settings actually do something.
   */
  async policyFor(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      select: { orgId: true },
    });
    if (!membership) return DEFAULT_POLICY;

    const settings = await this.prisma.orgSettings.findUnique({
      where: { orgId: membership.orgId },
    });
    return {
      mandatory2fa: settings?.mandatory2fa ?? DEFAULT_POLICY.mandatory2fa,
      sessionTimeoutMin:
        settings?.sessionTimeoutMin ?? DEFAULT_POLICY.sessionTimeoutMin,
    };
  }

  // ------------------------------------------------------------------- login
  /** Either a completed session (2FA off) or a pending 2FA challenge. */
  async login(dto: LoginInput, ip?: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');
    if (!user.isActive) throw new UnauthorizedException('ACCOUNT_INACTIVE');

    // Verify membership organization status
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      include: {
        org: {
          include: {
            subscriptions: true,
          },
        },
      },
    });
    if (membership && membership.org) {
      const activeSub = membership.org.subscriptions[0];
      if (activeSub && !activeSub.isActive) {
        throw new UnauthorizedException('ORGANIZATION_SUSPENDED');
      }
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('INVALID_CREDENTIALS');

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_PASSWORD_OK',
        ipAddress: ip,
      },
    });

    const policy = await this.policyFor(user.id);

    // Org disabled the 2FA requirement: the password alone completes the login.
    if (!policy.mandatory2fa) {
      await this.prisma.auditLog.create({
        data: { userId: user.id, action: 'LOGIN_2FA_SKIPPED', ipAddress: ip },
      });
      return {
        user,
        session: this.signSession(user, policy.sessionTimeoutMin, dto.remember),
        ttlMin: dto.remember ? REMEMBER_MIN : policy.sessionTimeoutMin,
      };
    }

    const devCode = await this.issueTwoFactorCode(user);
    return { user, preAuthToken: this.signPreAuth(user, dto.remember), devCode };
  }

  // ------------------------------------------------------------------ verify
  async verify(preAuthToken: string | undefined, code: string, ip?: string) {
    if (!preAuthToken) throw new UnauthorizedException('NO_PENDING_LOGIN');

    let payload: PreAuthPayload;
    try {
      payload = this.jwt.verify<PreAuthPayload>(preAuthToken);
    } catch {
      throw new UnauthorizedException('NO_PENDING_LOGIN');
    }
    if (payload.stage !== '2fa') throw new UnauthorizedException('NO_PENDING_LOGIN');

    const candidates = await this.prisma.twoFactorCode.findMany({
      where: {
        userId: payload.sub,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    let matched: string | null = null;
    for (const c of candidates) {
      if (await argon2.verify(c.codeHash, code)) {
        matched = c.id;
        break;
      }
    }
    if (!matched) throw new UnauthorizedException('INVALID_CODE');

    await this.prisma.twoFactorCode.update({
      where: { id: matched },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
    });
    if (!user.isActive) throw new UnauthorizedException('ACCOUNT_INACTIVE');

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN_2FA_OK', ipAddress: ip },
    });

    const policy = await this.policyFor(user.id);
    const session = this.signSession(
      user,
      policy.sessionTimeoutMin,
      payload.remember,
    );

    return {
      user,
      session,
      ttlMin: payload.remember ? REMEMBER_MIN : policy.sessionTimeoutMin,
    };
  }

  // ------------------------------------------------------------------ resend
  async resend(preAuthToken: string | undefined) {
    if (!preAuthToken) throw new UnauthorizedException('NO_PENDING_LOGIN');
    let payload: PreAuthPayload;
    try {
      payload = this.jwt.verify<PreAuthPayload>(preAuthToken);
    } catch {
      throw new UnauthorizedException('NO_PENDING_LOGIN');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    const devCode = await this.issueTwoFactorCode(user);
    return { devCode };
  }

  // --------------------------------------------------------- password reset
  async forgotPassword(email: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    // Always report success — never reveal whether an email exists.
    if (!user || !user.isActive) return { devToken: undefined };

    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: await argon2.hash(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED', ipAddress: ip },
    });

    // TODO(M11): email the reset link via EU transactional provider.
    this.logger.log(`Password reset token for ${user.email}: ${token}`);

    return {
      devToken: process.env.NODE_ENV === 'production' ? undefined : token,
    };
  }

  async resetPassword(token: string, password: string, ip?: string) {
    const candidates = await this.prisma.passwordResetToken.findMany({
      where: { consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let match: (typeof candidates)[number] | null = null;
    for (const c of candidates) {
      if (await argon2.verify(c.tokenHash, token)) {
        match = c;
        break;
      }
    }
    if (!match) throw new UnauthorizedException('INVALID_RESET_TOKEN');

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: match.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: match.userId },
        data: { passwordHash: await argon2.hash(password) },
      }),
      this.prisma.auditLog.create({
        data: { userId: match.userId, action: 'PASSWORD_RESET_DONE', ipAddress: ip },
      }),
    ]);

    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        locale: true,
        mustChangePassword: true,
        memberships: {
          take: 1,
          select: { orgRole: true, permissions: true, orgId: true },
        },
      },
    });
    const membership = user.memberships[0];
    return {
      ...user,
      memberships: undefined,
      orgId: membership?.orgId ?? null,
      orgRole: membership?.orgRole ?? null,
      permissions: membership?.permissions ?? [],
    };
  }

  /** Logged-in user sets a new password (first login with a temp password). */
  async changePassword(userId: string, password: string, ip?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await argon2.hash(password),
        mustChangePassword: false,
      },
    });
    await this.prisma.auditLog.create({
      data: { userId, action: 'PASSWORD_CHANGED', ipAddress: ip },
    });
    return { ok: true };
  }

  // ----------------------------------------------------------------- helpers
  /** Session token whose lifetime is the org's configured timeout. */
  signSession(user: User, timeoutMin: number, remember?: boolean) {
    const ttlMin = remember ? REMEMBER_MIN : timeoutMin;
    return this.jwt.sign(
      {
        sub: user.id,
        role: user.role,
        stage: 'session',
        ttlMin,
      } satisfies SessionPayload,
      { expiresIn: `${ttlMin}m` },
    );
  }

  private signPreAuth(user: User, remember?: boolean) {
    return this.jwt.sign(
      { sub: user.id, stage: '2fa', remember } satisfies PreAuthPayload,
      { expiresIn: '10m' },
    );
  }

  private async issueTwoFactorCode(user: User): Promise<string | undefined> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.twoFactorCode.create({
      data: {
        userId: user.id,
        codeHash: await argon2.hash(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    // TODO(M11): send via transactional email provider (GDPR-compliant, EU region).
    this.logger.log(`2FA code for ${user.email}: ${code}`);

    // SMTP enabled
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
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? '"Cannathera" <no-reply@cannathera.de>',
          to: user.email,
          subject: 'Cannathera 2FA Code',
          text: `Your 2FA verification code is: ${code}`,
          html: `<p>Your 2FA verification code is: <strong>${code}</strong></p>`,
        });
        this.logger.log(`2FA email sent to ${user.email}`);
      } catch (err) {
        this.logger.error(`Failed to send 2FA email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return process.env.NODE_ENV === 'production' ? undefined : code;
  }
}

type LoginInput = { email: string; password: string; remember?: boolean };
