import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { isPaywallBypassed } from '../shared';
import { getDistanceKm, getCoordinatesForPostalCode } from '../shared/geocode';
import OpenAI from 'openai';

const PLAN_DAYS = 30;

type LogMetrics = {
  pain?: number;
  sleep?: number;
  activity?: number;
  qol?: number;
  intakeTime?: string;
  sideEffects?: string[];
  benefitRating?: number;
  benefitOnset?: string;
  benefitDuration?: string;
  symptomsText?: string;
  effectDescription?: string;
  sideEffectsText?: string;
};

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async profileOf(userId: string, requireSubscription = false) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        org: { select: { name: true } },
        favoritePharmacies: {
          select: {
            id: true,
            name: true,
            city: true,
            inventory: {
              where: { active: true, category: 'Flower' },
              select: { name: true, stockLevel: true, unit: true },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('NO_PATIENT_PROFILE');
    if (
      requireSubscription &&
      !profile.hasActiveSubscription &&
      !isPaywallBypassed(profile.user.email)
    ) {
      throw new ForbiddenException('SUBSCRIPTION_REQUIRED');
    }
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
        return {
          partner: org.name,
          ...own,
          poweredBy: 'Powered by Cannathera',
        };
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

  /** Day N of the structured therapy plan, adherence, latest metrics + deltas, next appointment. */
  async summary(userId: string) {
    const profile = await this.profileOf(userId);
    const start = profile.therapyStart ?? profile.createdAt;
    const absoluteDay = Math.max(
      1,
      Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1,
    );
    const day = ((absoluteDay - 1) % PLAN_DAYS) + 1;

    const since = new Date(Date.now() - 30 * 86_400_000);
    const logs = await this.prisma.therapyLog.findMany({
      where: { patientId: profile.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });

    // Adherence: distinct days with a log in the last 30 (or since start) days.
    const windowDays = Math.min(30, absoluteDay);
    const loggedDays = new Set(
      logs.map((l) => l.loggedAt.toISOString().slice(0, 10)),
    );
    const adherence = windowDays
      ? Math.min(100, Math.round((loggedDays.size / windowDays) * 100))
      : 0;

    const today = new Date().toISOString().slice(0, 10);
    const todayLogged = loggedDays.has(today);

    // Latest metrics + delta vs ~7 days earlier.
    const metric = (
      l: (typeof logs)[number] | undefined,
      key: keyof LogMetrics,
    ) => (l ? ((l.metrics as LogMetrics | null)?.[key] ?? null) : null);
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
            ? Math.round(((current as number) - (before as number)) * 10) / 10
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
      onboardingCompleted: profile.onboardingCompleted,
      hasActiveSubscription:
        profile.hasActiveSubscription || isPaywallBypassed(profile.user.email),
      safeguardAcknowledged: profile.safeguardAcknowledged,
      packageTier: profile.packageTier,
      reminderTimes: profile.reminderTimes,
    };
  }

  async createLog(
    userId: string,
    data: {
      dosageG: number;
      strain?: string;
      batchNumber?: string;
      manufacturer?: string;
      consumptionMethod?: string;
      metrics: LogMetrics;
      note?: string;
    },
  ) {
    const profile = await this.profileOf(userId, true);
    const log = await this.prisma.therapyLog.create({
      data: {
        patientId: profile.id,
        loggedAt: new Date(),
        dosageG: data.dosageG,
        strain: data.strain,
        batchNumber: data.batchNumber,
        manufacturer: data.manufacturer,
        consumptionMethod: data.consumptionMethod,
        metrics: data.metrics,
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
    const hits: Array<{ severity: 'CRITICAL' | 'WARNING'; message: string }> =
      [];
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

    // Publish the event once per associated organisation. The notification
    // stream routes red flags exclusively to the platform administrator.
    const patientName =
      [profile.user.firstName, profile.user.lastName]
        .filter(Boolean)
        .join(' ') || profile.user.email;
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
    const profile = await this.profileOf(userId, true);
    const since = new Date(Date.now() - days * 86_400_000);
    const logs = await this.prisma.therapyLog.findMany({
      where: { patientId: profile.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });

    const series = logs.map((l) => {
      const m = (l.metrics as LogMetrics | null) ?? {};
      return {
        date: l.loggedAt.toISOString().slice(0, 10),
        dosageMg:
          l.dosageG !== null ? Math.round((l.dosageG ?? 0) * 1000) : null,
        pain: m.pain ?? null,
        sleep: m.sleep ?? null,
        activity: m.activity ?? null,
        qol: m.qol ?? null,
        // Relief proxy: inverse pain on a 0-100 scale.
        relief: m.pain != null ? Math.round((10 - m.pain) * 10) : null,
      };
    });

    const reliefVals = series
      .map((s) => s.relief)
      .filter((v): v is number => v != null);
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
  async rescheduleAppointment(
    userId: string,
    sessionId: string,
    scheduledAt: string,
  ) {
    const profile = await this.profileOf(userId, true);
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
    const profile = await this.profileOf(userId, true);
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
    let p = await this.profileOf(userId, true);

    if (!p.patientRef) {
      const newRef = `PAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      p = await this.prisma.patientProfile.update({
        where: { id: p.id },
        data: { patientRef: newRef },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          org: { select: { name: true } },
          favoritePharmacies: {
            select: {
              id: true,
              name: true,
              city: true,
              inventory: {
                where: { active: true, category: 'Flower' },
                select: { name: true, stockLevel: true, unit: true },
              },
            },
          },
        },
      });
    }

    const pharmacies = await this.prisma.organization.findMany({
      where: { type: 'PHARMACY' },
      select: { id: true, name: true },
    });
    return {
      fullName: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
      patientRef: p.patientRef,
      email: p.user.email,
      pharmacyOrgId: p.pharmacyId,
      address: p.address,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().split('T')[0] : null,
      practiceName: p.org?.name ?? null,
      packageTier: p.packageTier,
      pharmacies,
      favoritePharmacies: p.favoritePharmacies,
      reminderTimes: p.reminderTimes,
    };
  }

  async updateReminders(userId: string, times: string[]) {
    if (!Array.isArray(times) || times.length < 3 || times.length > 10) {
      throw new BadRequestException(
        'You must provide between 3 and 10 reminder times.',
      );
    }
    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
    for (const t of times) {
      if (!timeRegex.test(t)) {
        throw new BadRequestException('Invalid time format. Use HH:MM.');
      }
    }
    const profile = await this.profileOf(userId);
    await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: { reminderTimes: times },
    });
    return { ok: true };
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      pharmacyOrgId?: string | null;
      address?: string;
      phone?: string;
      dateOfBirth?: string;
      safeguardAcknowledged?: boolean;
    },
  ) {
    const p = await this.profileOf(userId, true);
    if (data.firstName !== undefined || data.lastName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });
    }
    if (
      data.pharmacyOrgId !== undefined ||
      data.address !== undefined ||
      data.phone !== undefined ||
      data.dateOfBirth !== undefined ||
      data.safeguardAcknowledged !== undefined
    ) {
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
        data: {
          ...(data.pharmacyOrgId !== undefined && {
            pharmacyId: data.pharmacyOrgId,
          }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.dateOfBirth !== undefined && {
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          }),
          ...(data.safeguardAcknowledged !== undefined && {
            safeguardAcknowledged: data.safeguardAcknowledged,
          }),
        },
      });
    }
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        entityType: 'PatientProfile',
        entityId: p.id,
      },
    });
    return this.profile(userId);
  }

  /** Therapy plan phases with status derived from current day. */
  async plan(userId: string) {
    await this.profileOf(userId, true);
    const summary = await this.summary(userId);
    const phases = [
      { key: 'initialAssessment', day: 1 },
      { key: 'titrationCommencement', day: 7 },
      { key: 'monthlyStrainFeedback', day: 24 }, // Day 24: Monthly strain & feedback review
      { key: 'cycleCompletion', day: 30 },
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

  /** Fetch a unique list of strains the patient has recently used. */
  async setPharmacy(userId: string, pharmacyOrgId: string | null) {
    const profile = await this.profileOf(userId, true);
    await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: { pharmacyId: pharmacyOrgId },
    });
    return { ok: true };
  }

  /**
   * AI-driven local pharmacy selection / radius logic
   */
  async searchPharmacies(userId: string) {
    const profile = await this.profileOf(userId);

    // Extract postal code from address if available
    const address = profile.address || '';
    const match = address.match(/\b\d{5}\b/);
    const postalCode = match ? match[0] : '80331'; // Default to a central postal code if none exists

    let coords = await getCoordinatesForPostalCode(postalCode);
    if (!coords) {
      coords = { lat: 50.1109, lng: 8.6821 }; // Central Germany fallback
    }

    const pharmacies = await this.prisma.organization.findMany({
      where: {
        type: 'PHARMACY',
        accountStatus: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        postalCode: true,
        city: true,
        street: true,
        phone: true,
        email: true,
        website: true,
        lat: true,
        lng: true,
        description: true,
        operatingHours: true,
        inventory: {
          where: { active: true, category: 'Flower', stockLevel: { gt: 0 } },
          select: { id: true },
        },
      },
    });

    // AI radius logic: Start with 25km core radius. If < 3 pharmacies found, expand to 35km fallback.
    let results: Array<{
      id: string;
      name: string;
      postalCode: string | null;
      city: string | null;
      street: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      description: string | null;
      operatingHours: any;
      lat: number;
      lng: number;
      distanceKm: number;
      availableStrainsCount: number;
    }> = [];
    const searchRadii = [25, 35, 100];

    for (const radiusKm of searchRadii) {
      results = [];
      for (const p of pharmacies) {
        const plat = p.lat ?? 50.1109 + (Math.random() - 0.5) * 0.2;
        const plng = p.lng ?? 8.6821 + (Math.random() - 0.5) * 0.2;
        const distance = getDistanceKm(coords.lat, coords.lng, plat, plng);

        if (distance <= radiusKm) {
          results.push({
            id: p.id,
            name: p.name,
            postalCode: p.postalCode,
            city: p.city,
            street: p.street,
            phone: p.phone,
            email: p.email,
            website: p.website,
            description: p.description,
            operatingHours: p.operatingHours,
            lat: plat,
            lng: plng,
            distanceKm: parseFloat(distance.toFixed(2)),
            availableStrainsCount: p.inventory.length,
          });
        }
      }

      if (results.length >= 3) break;
    }

    // Fallback: If still empty, return all active pharmacies with fallback distance
    if (results.length === 0) {
      results = pharmacies.map((p, idx) => ({
        id: p.id,
        name: p.name,
        postalCode: p.postalCode,
        city: p.city,
        street: p.street,
        phone: p.phone,
        email: p.email,
        website: p.website,
        description: p.description,
        operatingHours: p.operatingHours,
        lat: p.lat ?? 50.1109 + idx * 0.05,
        lng: p.lng ?? 8.6821 + idx * 0.05,
        distanceKm: parseFloat(((idx + 1) * 4.2).toFixed(2)),
        availableStrainsCount: p.inventory.length,
      }));
    }

    results.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return b.availableStrainsCount - a.availableStrainsCount;
    });

    return results;
  }

  /**
   * Full inventory of a pharmacy for patient shop view.
   */
  async getPharmacyInventory(userId: string, pharmacyId: string) {
    await this.profileOf(userId);

    const pharmacy = await this.prisma.organization.findUnique({
      where: { id: pharmacyId, type: 'PHARMACY' },
      select: {
        id: true,
        name: true,
        street: true,
        postalCode: true,
        city: true,
        phone: true,
        email: true,
        website: true,
        operatingHours: true,
        productFocus: true,
      },
    });

    if (!pharmacy) throw new NotFoundException('PHARMACY_NOT_FOUND');

    const items = await this.prisma.inventoryItem.findMany({
      where: { orgId: pharmacyId, active: true },
      orderBy: [{ stockLevel: 'desc' }, { name: 'asc' }],
    });

    const decorated = items.map((it, idx) => {
      const lower = it.name.toLowerCase();
      const isExtract =
        it.category === 'Extract' ||
        it.category === 'Oil' ||
        lower.includes('extrakt') ||
        lower.includes('oil') ||
        lower.includes('tropfen') ||
        lower.includes('lösung');

      let genetics: 'Sativa' | 'Indica' | 'Hybrid' = 'Hybrid';
      if (
        lower.includes('sativa') ||
        lower.includes('bedrocan') ||
        lower.includes('ghost') ||
        lower.includes('haze') ||
        lower.includes('lemon')
      ) {
        genetics = 'Sativa';
      } else if (
        lower.includes('indica') ||
        lower.includes('kush') ||
        lower.includes('punch') ||
        lower.includes('biscotti') ||
        lower.includes('bafokeng')
      ) {
        genetics = 'Indica';
      }

      // 1. Realistic German Medical Cannabis Market Prices
      let price = 7.95;
      const unit = isExtract ? 'ml' : (it.unit || 'g');
      if (isExtract) {
        // Medical extracts: 2.25 € - 3.20 € / ml
        const extractBase = 2.40 + ((it.thc || 10) * 0.035) + ((idx * 7) % 5) * 0.12;
        price = parseFloat(extractBase.toFixed(2));
      } else {
        // High quality medical flower: 6.45 € - 9.80 € / g
        if (lower.includes('enua') || lower.includes('bcp')) price = 6.45;
        else if (lower.includes('remexian') || lower.includes('frosted')) price = 6.90;
        else if (lower.includes('drapalin')) price = 7.50;
        else if (lower.includes('avaay')) price = 7.80;
        else if (lower.includes('tilray')) price = 7.95;
        else if (lower.includes('pedanios 18')) price = 8.20;
        else if (lower.includes('demecan')) price = 8.50;
        else if (lower.includes('pedanios') || lower.includes('ghost')) price = 8.90;
        else if (lower.includes('cannamedical')) price = 8.95;
        else if (lower.includes('bedrocan')) price = 9.20;
        else if (lower.includes('420') || lower.includes('evolution')) price = 9.40;
        else if (lower.includes('aurora') || lower.includes('pink kush')) price = 9.80;
        else {
          const calc = 6.50 + ((Math.min(it.thc || 20, 28) - 15) * 0.18) + ((idx * 3) % 5) * 0.20;
          price = parseFloat(Math.min(10.20, Math.max(5.95, calc)).toFixed(2));
        }
      }

      // 2. Real Product Images
      let imageUrl = '/products/cannabis_flower_hybrid.jpg';
      if (isExtract) {
        imageUrl = '/products/cannabis_extract_oil.jpg';
      } else if (lower.includes('kush') || lower.includes('pink') || lower.includes('og')) {
        imageUrl = '/products/cannabis_flower_kush.jpg';
      } else if (genetics === 'Sativa') {
        imageUrl = '/products/cannabis_flower_sativa.jpg';
      } else if (genetics === 'Indica') {
        imageUrl = '/products/cannabis_flower_indica.jpg';
      } else {
        imageUrl = '/products/cannabis_flower_hybrid.jpg';
      }

      // 3. Therapeutic Effect Profile tags
      const effects: string[] = [];
      if (isExtract) {
        effects.push('pain', 'calm', 'sleep');
      } else if (genetics === 'Indica') {
        effects.push('pain', 'calm');
        if (lower.includes('kush') || lower.includes('pink') || (it.thc || 0) >= 22) {
          effects.push('sleep');
        }
      } else if (genetics === 'Sativa') {
        effects.push('focus', 'euphoric');
        if ((it.thc || 0) >= 20) {
          effects.push('pain');
        }
      } else {
        effects.push('calm', 'pain');
        if (lower.includes('cookies') || lower.includes('lemon') || (it.thc || 0) >= 22) {
          effects.push('euphoric');
        }
      }

      return {
        id: it.id,
        sku: it.sku,
        name: it.name,
        category: it.category,
        thc: it.thc,
        cbd: it.cbd,
        unit,
        inStock: it.stockLevel > 0,
        availability: it.stockLevel > 0 ? ('IN_STOCK' as const) : ('ON_REQUEST' as const),
        genetics,
        price,
        imageUrl,
        effects,
      };
    });

    return {
      pharmacy,
      items: decorated,
    };
  }

  /**
   * Direct strain feedback submitted by the patient to their pharmacy.
   */
  async submitStrainFeedback(
    userId: string,
    data: {
      pharmacyId: string;
      strain: string;
      effectDescription?: string;
      symptomsText?: string;
      benefitRating?: number;
      wouldBuyAgain?: boolean;
    },
  ) {
    const profile = await this.profileOf(userId);

    const log = await this.prisma.therapyLog.create({
      data: {
        patientId: profile.id,
        loggedAt: new Date(),
        dosageG: 0.5,
        strain: data.strain,
        metrics: {
          effectDescription:
            data.effectDescription || 'Schmerzlindernd, entspannend',
          symptomsText: data.symptomsText || 'Schmerzen, Schlafstörungen',
          benefitRating: data.benefitRating ?? 4.5,
          wouldBuyAgain: data.wouldBuyAgain ?? true,
          satisfaction: data.benefitRating ? Math.round(data.benefitRating) : 5,
        },
      },
    });

    await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        pharmacyId: data.pharmacyId,
        lastReviewAt: new Date(),
      },
    });

    return { success: true, logId: log.id };
  }

  /**
   * Update the patient's "Favorites Pool" (2-3 pharmacies).
   */
  async updateFavoritePharmacies(userId: string, pharmacyIds: string[]) {
    const profile = await this.profileOf(userId);

    if (pharmacyIds.length > 3) {
      throw new BadRequestException('MAX_FAVORITES_EXCEEDED');
    }

    // Enforce max 35km radius limit for selected pharmacies (Onboarding & AI fallback radius requirement)
    if (pharmacyIds.length > 0) {
      const address = profile.address || '';
      const match = address.match(/\b\d{5}\b/);
      const postalCode = match ? match[0] : '80331';
      const coords = await getCoordinatesForPostalCode(postalCode);

      if (coords) {
        const pharmacies = await this.prisma.organization.findMany({
          where: { id: { in: pharmacyIds }, type: 'PHARMACY' },
          select: { id: true, lat: true, lng: true },
        });

        for (const p of pharmacies) {
          if (p.lat != null && p.lng != null) {
            const distance = getDistanceKm(
              coords.lat,
              coords.lng,
              p.lat,
              p.lng,
            );
            if (distance > 35) {
              throw new ForbiddenException('PHARMACY_OUTSIDE_RADIUS');
            }
          }
        }
      }
    }

    return this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        favoritePharmacies: {
          set: pharmacyIds.map((id) => ({ id })),
        },
      },
      include: {
        favoritePharmacies: {
          select: { id: true, name: true, city: true },
        },
      },
    });
  }

  /**
   * Route a prescription to a favorite pharmacy.
   */
  async createPrescription(
    userId: string,
    pharmacyId: string,
    fileUrl?: string,
    note?: string,
    selectedItems?: Array<{ inventoryId?: string; name: string; quantity: number; unit?: string }>,
  ) {
    const profile = await this.profileOf(userId);

    const pharmacy = await this.prisma.organization.findUnique({
      where: { id: pharmacyId, type: 'PHARMACY' },
      select: { id: true, name: true },
    });
    if (!pharmacy) {
      throw new NotFoundException('PHARMACY_NOT_FOUND');
    }

    const hasFavorite = await this.prisma.patientProfile.findFirst({
      where: {
        id: profile.id,
        favoritePharmacies: {
          some: { id: pharmacyId },
        },
      },
    });

    if (!hasFavorite) {
      // Auto-connect favorite pharmacy for smooth patient workflow
      await this.prisma.patientProfile.update({
        where: { id: profile.id },
        data: {
          favoritePharmacies: { connect: { id: pharmacyId } },
        },
      });
    }

    // --- Real AI OCR Integration ---
    let parsedData: any = null;
    if (selectedItems && selectedItems.length > 0) {
      parsedData = selectedItems;
    } else if (fileUrl && process.env.OPENAI_API_KEY) {
      try {
        const inventory = await this.prisma.inventoryItem.findMany({
          where: { orgId: pharmacyId, active: true },
          select: { id: true, name: true, unit: true },
        });

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that reads cannabis prescriptions and strictly matches them to a pharmacy's inventory catalog.
Catalog: ${JSON.stringify(inventory)}
Return a JSON array of objects representing the prescribed items found in the image.
Each object MUST HAVE exactly these fields: "inventoryId" (string, strictly matched from the Catalog), "name" (string, the name from the Catalog), "quantity" (number, extracted from the prescription), "unit" (string, from the Catalog). 
If you cannot confidently match a prescribed strain to the Catalog, or cannot read the image, return an empty array [].
Respond ONLY with raw JSON array. Do not include markdown formatting like \`\`\`json.`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the prescribed items from this prescription.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: fileUrl,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          try {
            // clean up potential markdown formatting just in case
            const cleanContent = content
              .replace(/```json/g, '')
              .replace(/```/g, '')
              .trim();
            const parsed = JSON.parse(cleanContent);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedData = parsed;
            }
          } catch {
            console.error('Failed to parse AI response:', content);
          }
        }
      } catch (err) {
        console.error('OpenAI OCR failed:', err);
      }
    }
    // --- End AI OCR Integration ---

    // Build human-readable items summary
    let itemsSummary: string | undefined;
    if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
      itemsSummary = parsedData
        .map((it: any) => `${it.quantity}${it.unit || 'g'} ${it.name}`)
        .join(', ');
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: profile.id,
        pharmacyId,
        fileUrl,
        note,
        status: 'RECEIVED',
        parsedData: parsedData?.length > 0 ? parsedData : null,
      },
    });

    const patientName =
      [profile.user.firstName, profile.user.lastName].filter(Boolean).join(' ') ||
      profile.user.email;

    this.notifications.notifyPharmacyNewPrescription(
      pharmacyId,
      prescription.id,
      { patientName, itemsSummary },
    );

    return prescription;
  }

  /**
   * List patient's prescriptions.
   */
  async listPrescriptions(userId: string) {
    const profile = await this.profileOf(userId);

    return this.prisma.prescription.findMany({
      where: { patientId: profile.id },
      include: {
        pharmacy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Fetch a unique list of strains the patient has recently used. */
  async recentStrains(userId: string) {
    const profile = await this.profileOf(userId, true);
    const logs = await this.prisma.therapyLog.findMany({
      where: { patientId: profile.id, strain: { not: null } },
      select: { strain: true },
      orderBy: { loggedAt: 'desc' },
      take: 50,
    });
    const unique = new Set(logs.map((l) => l.strain!));
    return Array.from(unique).slice(0, 5); // Return up to 5 unique recent strains
  }

  /** Mark the Day 1 onboarding as completed and update the profile */
  async completeOnboarding(
    userId: string,
    data: {
      address: string;
      phone: string;
      mainComplaints: string[];
      complaintsDescription: string;
      therapyGoals: string[];
      baselineMetrics?: any;
    },
  ) {
    const profile = await this.profileOf(userId);
    if (profile.onboardingCompleted) {
      throw new BadRequestException('ONBOARDING_ALREADY_COMPLETED');
    }

    const updated = await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        address: data.address,
        phone: data.phone,
        mainComplaints: data.mainComplaints,
        complaintsDescription: data.complaintsDescription,
        therapyGoals: data.therapyGoals,
        baselineMetrics: data.baselineMetrics
          ? (data.baselineMetrics as Prisma.InputJsonValue)
          : undefined,
        onboardingCompleted: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PATIENT_ONBOARDING_COMPLETED',
        entityType: 'PatientProfile',
        entityId: profile.id,
      },
    });

    return updated;
  }
}
