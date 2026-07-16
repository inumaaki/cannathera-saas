import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const PLAN_DAYS = 90;

type LogMetrics = { pain?: number; sleep?: number; activity?: number; qol?: number };

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async profileOf(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!profile) throw new NotFoundException('NO_PATIENT_PROFILE');
    return profile;
  }

  /**
   * Co-branding for the patient app. Resolution order: the treating practice
   * wins (they own the therapy), then the dispensing pharmacy, then the
   * enterprise umbrella above either. "Powered by Cannathera" is always returned
   * and is not removable — the client's explicit no-white-label rule.
   */
  async branding(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      select: { orgId: true, pharmacyId: true },
    });
    if (!profile) throw new NotFoundException('NO_PATIENT_PROFILE');

    const candidates = [profile.orgId, profile.pharmacyId].filter(
      (id): id is string => !!id,
    );
    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: candidates } },
      select: {
        id: true,
        name: true,
        branding: true,
        parentOrg: { select: { name: true, branding: true } },
      },
    });

    // Preserve the practice-before-pharmacy priority (findMany does not).
    const ordered = candidates
      .map((id) => orgs.find((o) => o.id === id))
      .filter((o): o is (typeof orgs)[number] => !!o);

    type Branding = {
      logoUrl?: string | null;
      primaryColor?: string | null;
      accentColor?: string | null;
      fontFamily?: string | null;
    };
    const hasTheme = (b: Branding | null) =>
      !!(b?.primaryColor || b?.accentColor || b?.logoUrl || b?.fontFamily);

    // A direct carer's own brand always beats an inherited network brand, so
    // check every own-brand first and only then fall back to the umbrellas.
    // Order: practice → pharmacy → practice's network → pharmacy's network.
    for (const org of ordered) {
      const own = org.branding as Branding | null;
      if (hasTheme(own)) {
        return { partner: org.name, ...own, poweredBy: 'Powered by Cannathera' };
      }
    }
    for (const org of ordered) {
      const parent = org.parentOrg?.branding as Branding | null;
      if (hasTheme(parent)) {
        return {
          partner: org.parentOrg!.name,
          ...parent,
          poweredBy: 'Powered by Cannathera',
        };
      }
    }

    return {
      partner: null,
      logoUrl: null,
      primaryColor: null,
      accentColor: null,
      fontFamily: null,
      poweredBy: 'Powered by Cannathera',
    };
  }

  /** Day N of the 90-day plan, adherence, latest metrics + deltas, next appointment. */
  async summary(userId: string) {
    const profile = await this.profileOf(userId);
    const start = profile.therapyStart ?? profile.createdAt;
    const day = Math.min(
      PLAN_DAYS,
      Math.max(1, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1),
    );

    const since = new Date(Date.now() - 30 * 86_400_000);
    const logs = await this.prisma.therapyLog.findMany({
      where: { patientId: profile.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });

    // Adherence: distinct days with a log in the last 30 (or since start) days.
    const windowDays = Math.min(30, day);
    const loggedDays = new Set(logs.map((l) => l.loggedAt.toISOString().slice(0, 10)));
    const adherence = windowDays
      ? Math.min(100, Math.round((loggedDays.size / windowDays) * 100))
      : 0;

    const today = new Date().toISOString().slice(0, 10);
    const todayLogged = loggedDays.has(today);

    // Latest metrics + delta vs ~7 days earlier.
    const metric = (l: (typeof logs)[number] | undefined, key: keyof LogMetrics) =>
      l ? ((l.metrics as LogMetrics | null)?.[key] ?? null) : null;
    const last = logs.at(-1);
    const weekAgoIdx = logs.findIndex(
      (l) => l.loggedAt.getTime() >= Date.now() - 7 * 86_400_000,
    );
    const prev = weekAgoIdx > 0 ? logs[weekAgoIdx - 1] : logs[0];

    const stats = (['pain', 'sleep', 'activity', 'qol'] as const).map((key) => {
      const current = metric(last, key);
      const before = metric(prev, key);
      return {
        key,
        value: current,
        delta:
          current !== null && before !== null
            ? Math.round((current - before) * 10) / 10
            : null,
      };
    });

    const nextAppointment = await this.prisma.telemedicineSession.findFirst({
      where: { patientId: profile.id, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      firstName: profile.user.firstName,
      day,
      planDays: PLAN_DAYS,
      adherence,
      todayLogged,
      lastDosageG: last?.dosageG ?? null,
      lastStrain: last?.strain ?? null,
      stats,
      nextAppointment,
    };
  }

  async createLog(
    userId: string,
    data: { dosageG: number; strain?: string; metrics: LogMetrics; note?: string },
  ) {
    const profile = await this.profileOf(userId);
    const log = await this.prisma.therapyLog.create({
      data: {
        patientId: profile.id,
        loggedAt: new Date(),
        dosageG: data.dosageG,
        strain: data.strain,
        metrics: data.metrics as Prisma.InputJsonValue,
        note: data.note,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'THERAPY_LOG_CREATED',
        entityType: 'TherapyLog',
        entityId: log.id,
      },
    });

    // Clinical thresholds on daily logs (mirror of the monthly-review rules).
    const hits: Array<{ severity: 'CRITICAL' | 'WARNING'; message: string }> = [];
    if (data.metrics.pain != null && data.metrics.pain >= 9) {
      hits.push({
        severity: 'CRITICAL',
        message:
          'Sehr starke Schmerzen im Tageseintrag (NRS ≥ 9) — ärztliche Prüfung erforderlich.',
      });
    }
    if (data.metrics.sleep != null && data.metrics.sleep <= 2) {
      hits.push({
        severity: 'WARNING',
        message: 'Sehr schlechte Schlafqualität im Tageseintrag (≤ 2/10).',
      });
    }
    if (hits.length) {
      await this.prisma.redFlagHit.createMany({
        data: hits.map((h) => ({
          patientId: profile.id,
          severity: h.severity,
          message: h.message,
          source: 'daily_log',
        })),
      });
    }

    // Push the alert to the care team live — a CRITICAL pain score should not
    // wait for the doctor to navigate. Goes to the practice AND the pharmacy.
    const patientName =
      [profile.user.firstName, profile.user.lastName].filter(Boolean).join(' ') ||
      profile.user.email;
    const worst = hits.find((h) => h.severity === 'CRITICAL') ?? hits[0];

    for (const orgId of [profile.orgId, profile.pharmacyId].filter(
      (id): id is string => !!id,
    )) {
      if (worst) {
        this.notifications.publish({
          target: { orgId },
          kind: 'red_flag',
          severity: worst.severity === 'CRITICAL' ? 'critical' : 'warning',
          title: patientName,
          text: worst.message,
          href: `/doctor/patients/${profile.id}`,
        });
      } else {
        this.notifications.publish({
          target: { orgId },
          kind: 'log_submitted',
          severity: 'info',
          title: patientName,
          text: 'Neuer Tageseintrag erfasst.',
          href: `/doctor/patients/${profile.id}`,
        });
      }
    }

    return log;
  }

  /** Series for the progress screen (default last 7 logged days). */
  async stats(userId: string, days = 7) {
    const profile = await this.profileOf(userId);
    const since = new Date(Date.now() - days * 86_400_000);
    const logs = await this.prisma.therapyLog.findMany({
      where: { patientId: profile.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });

    const series = logs.map((l) => {
      const m = (l.metrics as LogMetrics | null) ?? {};
      return {
        date: l.loggedAt.toISOString().slice(0, 10),
        dosageMg: l.dosageG !== null ? Math.round((l.dosageG ?? 0) * 1000) : null,
        pain: m.pain ?? null,
        sleep: m.sleep ?? null,
        activity: m.activity ?? null,
        qol: m.qol ?? null,
        // Relief proxy: inverse pain on a 0-100 scale.
        relief: m.pain != null ? Math.round((10 - m.pain) * 10) : null,
      };
    });

    const reliefVals = series.map((s) => s.relief).filter((v): v is number => v != null);
    const efficacy = reliefVals.length
      ? Math.round(reliefVals.reduce((a, b) => a + b, 0) / reliefVals.length)
      : null;
    const totalDosageMg = series.reduce((a, s) => a + (s.dosageMg ?? 0), 0);

    const summary = await this.summary(userId);

    return {
      efficacy,
      totalDosageMg,
      adherence: summary.adherence,
      day: summary.day,
      planDays: summary.planDays,
      series,
    };
  }

  /** Patient reschedules their own appointment. */
  async rescheduleAppointment(userId: string, sessionId: string, scheduledAt: string) {
    const profile = await this.profileOf(userId);
    const session = await this.prisma.telemedicineSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.patientId !== profile.id) {
      throw new NotFoundException('APPOINTMENT_NOT_FOUND');
    }
    const updated = await this.prisma.telemedicineSession.update({
      where: { id: sessionId },
      data: { scheduledAt: new Date(scheduledAt) },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'APPOINTMENT_RESCHEDULED_BY_PATIENT',
        entityType: 'TelemedicineSession',
        entityId: sessionId,
      },
    });
    return updated;
  }

  async appointments(userId: string) {
    const profile = await this.profileOf(userId);
    const now = new Date();
    const [upcoming, past] = await Promise.all([
      this.prisma.telemedicineSession.findMany({
        where: { patientId: profile.id, scheduledAt: { gte: now } },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.telemedicineSession.findMany({
        where: { patientId: profile.id, scheduledAt: { lt: now } },
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      }),
    ]);
    return { upcoming, past };
  }

  async profile(userId: string) {
    const p = await this.profileOf(userId);
    const pharmacies = await this.prisma.organization.findMany({
      where: { type: 'PHARMACY' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return {
      fullName: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
      patientRef: p.patientRef ?? `CT-${p.id.slice(-6).toUpperCase()}`,
      email: p.user.email,
      // The pharmacy, NOT `orgId` — that one is the treating practice and the
      // patient must never be able to change it from their own profile.
      pharmacyOrgId: p.pharmacyId,
      pharmacies,
    };
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; pharmacyOrgId?: string | null },
  ) {
    const p = await this.profileOf(userId);
    if (data.firstName !== undefined || data.lastName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { firstName: data.firstName, lastName: data.lastName },
      });
    }
    if (data.pharmacyOrgId !== undefined) {
      // Guard the choice: it must be a real PHARMACY org, so a crafted request
      // can't reassign the patient to a practice or an enterprise partner.
      if (data.pharmacyOrgId) {
        const org = await this.prisma.organization.findFirst({
          where: { id: data.pharmacyOrgId, type: 'PHARMACY' },
          select: { id: true },
        });
        if (!org) throw new BadRequestException('INVALID_PHARMACY');
      }
      await this.prisma.patientProfile.update({
        where: { id: p.id },
        data: { pharmacyId: data.pharmacyOrgId },
      });
    }
    await this.prisma.auditLog.create({
      data: { userId, action: 'PROFILE_UPDATED', entityType: 'PatientProfile', entityId: p.id },
    });
    return this.profile(userId);
  }

  /** 90-day plan phases with status derived from current day. */
  async plan(userId: string) {
    const summary = await this.summary(userId);
    const phases = [
      { key: 'initialAssessment', day: 1 },
      { key: 'titrationCommencement', day: 14 },
      { key: 'doseAdjustmentReview', day: 45 },
      { key: 'monthlyClinicalReview', day: 60 },
      { key: 'cycleCompletion', day: 90 },
    ].map((p, i, arr) => {
      const next = arr[i + 1]?.day ?? PLAN_DAYS + 1;
      let status: 'achieved' | 'inProgress' | 'pending';
      if (summary.day >= next) status = 'achieved';
      else if (summary.day >= p.day) status = 'inProgress';
      else status = 'pending';
      return { ...p, status };
    });
    const progressPct = Math.round((summary.day / PLAN_DAYS) * 100);
    return { day: summary.day, planDays: PLAN_DAYS, progressPct, phases };
  }
}
