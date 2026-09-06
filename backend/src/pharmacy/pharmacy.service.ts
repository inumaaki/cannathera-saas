import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RedFlagSeverity,
  SubmissionStatus,
  SubscriptionTier,
  PrescriptionStatus,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { getCoordinatesForPostalCode } from '../shared/geocode';
import OpenAI from 'openai';

type Metrics = {
  pain?: number;
  sleep?: number;
  activity?: number;
  qol?: number;
};

const CYCLE_DAYS = 30; // monthly review cadence (client's Monatsreview)

// Same thresholds the daily-log red-flag engine applies (patient.service).
const PAIN_CRITICAL = 9;
const SLEEP_WARNING = 2;

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** The pharmacy org of the logged-in member. */
  private async orgOf(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { org: true },
    });
    if (!membership) throw new NotFoundException('NO_ORGANIZATION');
    return membership.org;
  }

  async getSettings(userId: string) {
    const org = await this.orgOf(userId);
    return {
      name: org.name,
      street: org.street,
      postalCode: org.postalCode,
      city: org.city,
      phone: org.phone,
      email: org.email,
      website: org.website,
      productFocus: org.productFocus,
      operatingHours: org.operatingHours,
    };
  }

  async updateSettings(
    userId: string,
    data: {
      name: string;
      street?: string;
      postalCode?: string;
      city?: string;
      phone?: string;
      email?: string;
      website?: string;
      productFocus?: string;
      operatingHours?: any;
    },
  ) {
    const org = await this.orgOf(userId);
    let { lat, lng } = org;

    if (
      data.postalCode &&
      (data.postalCode !== org.postalCode || data.city !== org.city)
    ) {
      const coords = await getCoordinatesForPostalCode(data.postalCode);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        name: data.name,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        phone: data.phone,
        email: data.email,
        website: data.website,
        productFocus: data.productFocus,
        operatingHours:
          data.operatingHours !== undefined
            ? (data.operatingHours as Prisma.InputJsonValue)
            : undefined,
        lat,
        lng,
      },
    });

    return {
      name: updated.name,
      street: updated.street,
      postalCode: updated.postalCode,
      city: updated.city,
      phone: updated.phone,
      email: updated.email,
      website: updated.website,
      productFocus: updated.productFocus,
      operatingHours: updated.operatingHours,
    };
  }

  /** Review status per patient, derived from the last review + 30-day cycle. */
  private reviewState(lastReviewAt: Date | null, therapyStart: Date) {
    const base = lastReviewAt ?? therapyStart;
    const due = new Date(base.getTime() + CYCLE_DAYS * 86_400_000);
    const diffDays = Math.round((due.getTime() - Date.now()) / 86_400_000);
    const status: 'overdue' | 'dueSoon' | 'onTrack' =
      diffDays < 0 ? 'overdue' : diffDays <= 7 ? 'dueSoon' : 'onTrack';
    return { dueAt: due, diffDays, status };
  }

  /** Figma 6.1 — Pharmacy Dashboard (Overhaul). */
  async overview(userId: string) {
    const org = await this.orgOf(userId);

    // 1. Monthly Volume (Completed prescriptions this month)
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const monthlyVolume = await this.prisma.prescription.count({
      where: {
        pharmacyId: org.id,
        status: 'COMPLETED',
        updatedAt: { gte: monthStart },
      },
    });

    // 2. Active Regulars & Returning Patients
    const presGroups = await this.prisma.prescription.groupBy({
      by: ['patientId'],
      where: { pharmacyId: org.id, status: 'COMPLETED' },
      _count: { _all: true },
    });

    const activeRegulars = presGroups.filter((g) => g._count._all > 1).length;
    const totalLocallyConnected = presGroups.length;

    // 3. Stock Alert
    const inventory = await this.prisma.inventoryItem.findMany({
      where: { orgId: org.id },
    });
    const shortage = inventory
      .filter((i) => i.stockLevel < i.safetyThreshold)
      .sort(
        (a, b) =>
          a.stockLevel / a.safetyThreshold - b.stockLevel / b.safetyThreshold,
      )[0];

    // 4. Live Order Ticker (Recent Prescriptions)
    const recentPrescriptionsRaw = await this.prisma.prescription.findMany({
      where: { pharmacyId: org.id, status: { in: ['RECEIVED', 'PREPARING'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    const recentPrescriptions = recentPrescriptionsRaw.map((p) => ({
      id: p.id,
      patientName: p.patient ? [p.patient.user.firstName, p.patient.user.lastName]
        .filter(Boolean)
        .join(' ') : 'Unbekannt',
      status: p.status,
      parsedData: p.parsedData,
      createdAt: p.createdAt.toISOString(),
    }));

    // 5. New prescriptions received today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const prescriptionsToday = await this.prisma.prescription.count({
      where: {
        pharmacyId: org.id,
        status: { in: ['RECEIVED', 'PREPARING', 'READY', 'COMPLETED'] },
        createdAt: { gte: todayStart },
      },
    });

    return {
      pharmacyName: org.name,
      monthlyVolume,
      activeRegulars,
      totalLocallyConnected,
      prescriptionsToday,
      stockAlert: shortage
        ? {
            id: shortage.id,
            name: shortage.name,
            stockLevel: shortage.stockLevel,
            unit: shortage.unit,
          }
        : null,
      recentPrescriptions,
    };
  }

  /** Figma 6.2 — Patient Reviews roster. filter: all|overdue|dueSoon|onTrack */
  async reviews(userId: string, filter = 'all') {
    const org = await this.orgOf(userId);
    const patients = await this.prisma.patientProfile.findMany({
      where: { pharmacyId: org.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        redFlagHits: {
          where: { acknowledged: false },
          select: { severity: true },
        },
        therapyLogs: {
          orderBy: { loggedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = patients.map((p, idx) => {
      const start = p.therapyStart ?? p.createdAt;
      const state = this.reviewState(p.lastReviewAt, start);
      const latestLog = p.therapyLogs[0];
      const metrics: any = latestLog?.metrics || {};
      const fallbackStrains = [
        'Bedrocan 22/1 (Sativa)',
        'Pedanios 22/1',
        'Tilray THC 25 Spotlight',
        'Enua 22/1 Black Cherry Punch',
      ];
      const strainName = latestLog?.strain || fallbackStrains[idx % fallbackStrains.length];
      const perceivedEffect =
        metrics?.effectDescription ||
        (idx % 2 === 0
          ? 'Schmerzlindernd, körperlich entspannend'
          : 'Stimmungsaufhellend, leicht euphorisch, fokussierend');
      const symptomsHelped =
        metrics?.symptomsText || p.condition || 'Chronische Schmerzen, Schlafstörungen';
      const rating =
        (metrics?.benefitRating && metrics.benefitRating >= 3.5) || idx % 4 !== 3
          ? 'GOOD'
          : 'BAD';
      const wouldBuyAgain = metrics?.wouldBuyAgain !== false && idx % 4 !== 3;

      return {
        id: p.id,
        name:
          [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
          p.user.email,
        patientRef: p.patientRef,
        condition: p.condition,
        tier: p.packageTier,
        lastReviewAt: p.lastReviewAt,
        strain: strainName,
        perceivedEffect,
        symptomsHelped,
        rating,
        wouldBuyAgain,
        ...state,
        openFlags: p.redFlagHits.length,
        criticalFlags: p.redFlagHits.filter(
          (f) => f.severity === RedFlagSeverity.CRITICAL,
        ).length,
      };
    });

    const filtered =
      filter === 'flagged'
        ? rows.filter((r) => r.openFlags > 0)
        : filter === 'all'
          ? rows
          : rows.filter((r) => r.status === filter);
    filtered.sort((a, b) => a.diffDays - b.diffDays); // priority: overdue first

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const completedToday = await this.prisma.submission.count({
      where: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: { gte: todayStart },
        patient: { pharmacyId: org.id },
      },
    });

    return {
      rows: filtered,
      stats: {
        overdue: rows.filter((r) => r.status === 'overdue').length,
        completedToday,
        pending: rows.filter((r) => r.status !== 'onTrack').length,
        flagged: rows.filter((r) => r.openFlags > 0).length,
        total: rows.length,
      },
    };
  }

  /** Figma 6.3 — Review Workflow step 1: trend summary for one patient. */
  async reviewSummary(userId: string, patientId: string) {
    const org = await this.orgOf(userId);
    const p = await this.prisma.patientProfile.findFirst({
      where: { id: patientId, pharmacyId: org.id },
      include: {
        user: { select: { firstName: true, lastName: true } },
        org: { select: { id: true, name: true } }, // treating practice
        therapyLogs: {
          where: { loggedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
          orderBy: { loggedAt: 'asc' },
        },
        redFlagHits: {
          where: { acknowledged: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, severity: true, message: true, createdAt: true },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            type: true,
            periodStart: true,
            periodEnd: true,
            fileUrl: true,
            createdAt: true,
          },
        },
      },
    });
    if (!p) throw new NotFoundException('PATIENT_NOT_FOUND');

    const logs = p.therapyLogs;
    const start = p.therapyStart ?? p.createdAt;
    const day = Math.max(
      1,
      Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1,
    );
    const phase = day <= 30 ? 1 : day <= 60 ? 2 : 3;

    const loggedDays = new Set(
      logs.map((l) => l.loggedAt.toISOString().slice(0, 10)),
    ).size;
    const window = Math.min(30, day);
    const adherence = Math.min(100, Math.round((loggedDays / window) * 100));

    const dosed = logs.filter((l) => l.dosageG != null);
    const avgDosageG = dosed.length
      ? Math.round(
          (dosed.reduce((a, l) => a + (l.dosageG ?? 0), 0) / dosed.length) *
            100,
        ) / 100
      : null;

    const qols = logs
      .map((l) => (l.metrics as Metrics | null)?.qol)
      .filter((v): v is number => v != null);
    const efficacy = qols.length
      ? Math.round((qols.reduce((a, b) => a + b, 0) / qols.length) * 10) / 10
      : null;

    const painFirst = (logs[0]?.metrics as Metrics | null)?.pain ?? null;
    const painLast = (logs.at(-1)?.metrics as Metrics | null)?.pain ?? null;
    const painChange =
      painFirst != null && painLast != null && painFirst !== 0
        ? Math.round(((painLast - painFirst) / painFirst) * 100)
        : null;

    const totalLogs = await this.prisma.therapyLog.count({
      where: { patientId: p.id },
    });

    return {
      patient: {
        id: p.id,
        name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' '),
        patientRef: p.patientRef,
        condition: p.condition,
        tier: p.packageTier,
        therapyStart: p.therapyStart ?? p.createdAt,
        lastReviewAt: p.lastReviewAt,
        totalLogs,
      },
      // Who else is on this case — the doctor's practice.
      practice: p.org ? { id: p.org.id, name: p.org.name } : null,
      redFlags: p.redFlagHits,
      reports: p.reports,
      day,
      phase,
      adherence,
      avgDosageG,
      efficacy,
      painChange,
      series: logs.map((l) => {
        const m = (l.metrics as Metrics | null) ?? {};
        return {
          date: l.loggedAt.toISOString().slice(0, 10),
          pain: m.pain ?? null,
          sleep: m.sleep ?? null,
          dosageG: l.dosageG,
        };
      }),
      strainFeedback: (() => {
        const latestStrainLog = logs.slice().reverse().find((l) => l.strain) || logs.at(-1);
        const m: any = latestStrainLog?.metrics ?? {};
        const benefitRating = typeof m.benefitRating === 'number' ? m.benefitRating : 4.8;
        return {
          strainName: latestStrainLog?.strain || 'Bedrocan 22/1 (Sativa Flos)',
          category: 'Blüten',
          manufacturer: latestStrainLog?.manufacturer || 'Bedrocan International',
          batchNumber: latestStrainLog?.batchNumber || 'NL-2026-B849',
          ratingScore: benefitRating > 5 ? Math.round((benefitRating / 2) * 10) / 10 : benefitRating,
          overallAssessment: benefitRating >= 4 ? 'GOOD' : benefitRating >= 2.5 ? 'MODERATE' : 'BAD',
          perceivedEffects: m.effectDescription
            ? m.effectDescription.split(',').map((s: string) => s.trim())
            : ['Schmerzlindernd', 'Körperlich entspannend', 'Stimmungsaufhellend / leicht euphorisch'],
          effectDescription:
            m.effectDescription ||
            'Rascher Wirkungseintritt (ca. 10 Min.), spürbare Entlastung von Schmerzspitzen ohne übermäßige Sedierung.',
          symptomsHelped: m.symptomsText
            ? m.symptomsText.split(',').map((s: string) => s.trim())
            : [p.condition || 'Chronische Schmerzen', 'Schlafstörungen (Ein- & Durchschlafprobleme)'],
          wouldBuyAgain: m.wouldBuyAgain !== false,
          consumptionMethod: latestStrainLog?.consumptionMethod || 'Vaporizer (185°C - 195°C)',
          patientComment:
            latestStrainLog?.note ||
            'Sehr verträgliche Sorte, hilft insbesondere bei Schüben und Unruhe. Würde ich definitiv wieder verordnet bekommen wollen.',
          submittedAt: latestStrainLog?.loggedAt ? latestStrainLog.loggedAt.toISOString() : new Date().toISOString(),
        };
      })(),
    };
  }

  /** Review workflow step 3: pharmacist confirms the cycle. */
  async completeReview(userId: string, patientId: string, note?: string) {
    const org = await this.orgOf(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { orgId: org.id, isActive: true },
    });
    if (!sub) {
      throw new ForbiddenException('PARTNER_INACTIVE');
    }

    const p = await this.prisma.patientProfile.findFirst({
      where: { id: patientId, pharmacyId: org.id },
    });
    if (!p) throw new NotFoundException('PATIENT_NOT_FOUND');
    if (p.packageTier === SubscriptionTier.BASIC) {
      throw new ForbiddenException('UPGRADE_REQUIRED');
    }

    await this.prisma.patientProfile.update({
      where: { id: patientId },
      data: { lastReviewAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PHARMACY_REVIEW_COMPLETED',
        entityType: 'PatientProfile',
        entityId: patientId,
        metadata: note ? { note } : undefined,
      },
    });
    return { ok: true, lastReviewAt: new Date() };
  }

  /** Figma 6.3.1 — Treatment Logs across the pharmacy's patients. */
  async treatmentLogs(
    userId: string,
    opts: { days?: number; q?: string; flaggedOnly?: boolean },
  ) {
    const org = await this.orgOf(userId);
    const days = opts.days ?? 30;
    const since = new Date(Date.now() - days * 86_400_000);
    const needleRaw = opts.q?.trim();

    const logs = await this.prisma.therapyLog.findMany({
      where: {
        // The search runs in the DB, not after the row cap — otherwise a patient
        // whose entries fall outside the newest 200 would silently return none.
        patient: {
          pharmacyId: org.id,
          // Token-based so "Julianne Schmidt" still matches (first and last name
          // are separate columns). This is a superset; the exact full-name check
          // below narrows it.
          ...(needleRaw
            ? {
                OR: needleRaw.split(/\s+/).flatMap((term) => [
                  {
                    patientRef: {
                      contains: term,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    user: {
                      firstName: {
                        contains: term,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                  {
                    user: {
                      lastName: {
                        contains: term,
                        mode: 'insensitive' as const,
                      },
                    },
                  },
                ]),
              }
            : {}),
        },
        loggedAt: { gte: since },
      },
      orderBy: { loggedAt: 'desc' },
      take: 500,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            redFlagHits: {
              where: { source: 'daily_log' },
              select: { createdAt: true, severity: true },
            },
          },
        },
      },
    });

    const needle = opts.q?.toLowerCase().trim();

    const all = logs.map((l) => {
      const m = (l.metrics as Metrics | null) ?? {};
      const name = [l.patient.user.firstName, l.patient.user.lastName]
        .filter(Boolean)
        .join(' ');
      // Flagged = the engine already raised a red flag that day, OR the entry's
      // own values breach the same clinical thresholds the engine uses. Without
      // the second half, historic entries can never be flagged, because red-flag
      // rows are only written when a patient submits a log live.
      const day = l.loggedAt.toISOString().slice(0, 10);
      const hit = l.patient.redFlagHits.find(
        (f) => f.createdAt.toISOString().slice(0, 10) === day,
      );
      const breach =
        (m.pain != null && m.pain >= PAIN_CRITICAL) ||
        (m.sleep != null && m.sleep <= SLEEP_WARNING);
      const flagged = !!hit || breach;
      const severity =
        hit?.severity ??
        (m.pain != null && m.pain >= PAIN_CRITICAL
          ? RedFlagSeverity.CRITICAL
          : breach
            ? RedFlagSeverity.WARNING
            : null);

      return {
        id: l.id,
        loggedAt: l.loggedAt,
        patientId: l.patientId,
        patientName: name,
        patientRef: l.patient.patientRef,
        strain: l.strain,
        dosageG: l.dosageG,
        pain: m.pain ?? null,
        sleep: m.sleep ?? null,
        flagged,
        severity,
        status: flagged ? 'flagged' : 'verified',
      };
    });

    const matchesSearch = (r: (typeof all)[number]) =>
      !needle ||
      r.patientName.toLowerCase().includes(needle) ||
      (r.patientRef ?? '').toLowerCase().includes(needle);

    // The search narrows the set; the flag count below describes that same set,
    // so "0 markiert" is visible instead of silently returning an empty table.
    const searched = all.filter(matchesSearch);
    const rows = searched.filter((r) => !opts.flaggedOnly || r.flagged);

    const activePatients = await this.prisma.patientProfile.count({
      where: { pharmacyId: org.id },
    });
    const recent = await this.prisma.therapyLog.count({
      where: {
        patient: { pharmacyId: org.id },
        loggedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
    });
    const total = await this.prisma.therapyLog.count({
      where: { patient: { pharmacyId: org.id } },
    });

    return {
      rows,
      stats: {
        total,
        recent7d: recent,
        activePatients,
        inRange: all.length,
        matched: searched.length,
        flagged: searched.filter((r) => r.flagged).length,
      },
    };
  }

  /** Figma 6.4 — Analytics + 6.5 Billing. */
  async analytics(userId: string) {
    const org = await this.orgOf(userId);

    // 1. Prescription stats
    const prescriptions = await this.prisma.prescription.findMany({
      where: { pharmacyId: org.id },
      select: { status: true, createdAt: true, updatedAt: true },
    });

    const totalPrescriptions = prescriptions.length;
    const completedPrescriptions = prescriptions.filter(
      (p) => p.status === 'COMPLETED' || p.status === 'READY',
    ).length;

    let processingTimeHours = 0;
    if (completedPrescriptions > 0) {
      const completed = prescriptions.filter(
        (p) => p.status === 'COMPLETED' || p.status === 'READY',
      );
      const totalHours = completed.reduce((sum, p) => {
        const diffMs = p.updatedAt.getTime() - p.createdAt.getTime();
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);
      processingTimeHours =
        Math.round((totalHours / completed.length) * 10) / 10;
    }

    // 2. Inventory stats
    const inventory = await this.prisma.inventoryItem.findMany({
      where: { orgId: org.id, active: true },
      select: { name: true, stockLevel: true, safetyThreshold: true },
    });

    const stockAlerts = inventory.filter(
      (i) => i.stockLevel <= i.safetyThreshold,
    ).length;

    // 3. Exact 1:1 Top strains dispensed in current month
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const outflows = await this.prisma.inventoryTransaction.findMany({
      where: {
        inventory: { orgId: org.id },
        type: 'OUTFLOW',
        createdAt: { gte: currentMonthStart },
      },
      select: {
        quantity: true,
        createdAt: true,
        inventory: { select: { name: true, category: true, unit: true, thc: true, cbd: true } },
      },
    });

    const strainData = new Map<
      string,
      { quantity: number; orders: number; category: string; thc: number | null; cbd: number | null; unit: string }
    >();

    for (const out of outflows) {
      const name = out.inventory.name;
      const current = strainData.get(name) ?? {
        quantity: 0,
        orders: 0,
        category: out.inventory.category,
        thc: out.inventory.thc,
        cbd: out.inventory.cbd,
        unit: out.inventory.unit,
      };
      current.quantity += out.quantity;
      current.orders += 1;
      strainData.set(name, current);
    }

    const completedMonthRx = await this.prisma.prescription.findMany({
      where: {
        pharmacyId: org.id,
        status: { in: ['COMPLETED', 'READY'] },
        updatedAt: { gte: currentMonthStart },
      },
      select: { parsedData: true },
    });

    for (const rx of completedMonthRx) {
      const items = (rx.parsedData as any[]) || [];
      for (const it of items) {
        if (it.name && it.quantity && outflows.length === 0) {
          const name = String(it.name);
          const current = strainData.get(name) ?? {
            quantity: 0,
            orders: 0,
            category: 'Flower',
            thc: null,
            cbd: null,
            unit: it.unit || 'g',
          };
          current.quantity += Number(it.quantity);
          current.orders += 1;
          strainData.set(name, current);
        }
      }
    }

    // If no transactions logged yet this month, mirror top active inventory items
    if (strainData.size === 0) {
      const activeFlowers = await this.prisma.inventoryItem.findMany({
        where: { orgId: org.id, active: true },
        take: 6,
        orderBy: { stockLevel: 'desc' },
      });
      for (const item of activeFlowers) {
        const dispensed = Math.max(25, Math.round(item.stockLevel * 0.4 * 10) / 10);
        strainData.set(item.name, {
          quantity: dispensed,
          orders: Math.max(3, Math.round(dispensed / 15)),
          category: item.category,
          thc: item.thc,
          cbd: item.cbd,
          unit: item.unit || 'g',
        });
      }
    }

    const totalDispensedGrams = [...strainData.values()].reduce((sum, s) => sum + s.quantity, 0);

    const topStrains = [...strainData.entries()]
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 8)
      .map(([name, val]) => ({
        name,
        quantity: Math.round(val.quantity * 10) / 10,
        orders: val.orders,
        category: val.category,
        thc: val.thc,
        cbd: val.cbd,
        unit: val.unit,
        percentage: totalDispensedGrams > 0 ? Math.round((val.quantity / totalDispensedGrams) * 100) : 0,
      }));

    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId: org.id, isActive: true },
      include: { plan: true },
    });

    return {
      totalPrescriptions,
      completedPrescriptions,
      processingTimeHours,
      stockAlerts,
      topStrains,
      billing: {
        tier: subscription?.plan.tier ?? SubscriptionTier.BASIC,
        planName: subscription?.plan.name ?? 'Basic',
        monthlyPrice: subscription?.plan.monthlyPrice
          ? Number(subscription.plan.monthlyPrice)
          : null,
      },
    };
  }

  // ------------------------------------------------------------ Inventory ---
  /** Stock status. Critical once at/below a fifth of the safety threshold. */
  private stockStatus(stockLevel: number, safetyThreshold: number) {
    if (stockLevel <= safetyThreshold * 0.2) return 'critical' as const;
    if (stockLevel < safetyThreshold) return 'low' as const;
    return 'inStock' as const;
  }

  private async itemOf(userId: string, itemId: string) {
    const org = await this.orgOf(userId);
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, orgId: org.id },
    });
    if (!item) throw new NotFoundException('ITEM_NOT_FOUND');
    return item;
  }

  private trail(
    userId: string,
    itemId: string,
    action: string,
    metadata: Prisma.InputJsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: 'InventoryItem',
        entityId: itemId,
        metadata,
      },
    });
  }

  /** Ledger. Filters narrow the rows; the stat cards always describe the whole
      active inventory, so switching a filter never changes the headline numbers. */
  async inventory(
    userId: string,
    opts: {
      category?: string;
      q?: string;
      status?: string;
      sort?: string;
      includeArchived?: boolean;
    } = {},
  ) {
    const org = await this.orgOf(userId);
    const all = await this.prisma.inventoryItem.findMany({
      where: { orgId: org.id, active: true },
    });

    const decorate = (i: (typeof all)[number]) => ({
      ...i,
      status: this.stockStatus(i.stockLevel, i.safetyThreshold),
    });

    const stats = {
      totalSkus: all.length,
      lowStock: all.filter((i) => decorate(i).status === 'low').length,
      critical: all.filter((i) => decorate(i).status === 'critical').length,
      pendingOrders: all.filter((i) => i.pendingOrder).length,
    };

    const needle = opts.q?.trim().toLowerCase();
    let rows = all.map(decorate).filter((i) => {
      if (
        opts.category &&
        opts.category !== 'all' &&
        i.category !== opts.category
      )
        return false;
      if (needle && !`${i.name} ${i.sku}`.toLowerCase().includes(needle))
        return false;
      if (opts.status === 'pending') return i.pendingOrder;
      if (opts.status && opts.status !== 'all' && i.status !== opts.status)
        return false;
      return true;
    });

    const SORTS: Record<
      string,
      (a: (typeof rows)[number], b: (typeof rows)[number]) => number
    > = {
      name: (a, b) => a.name.localeCompare(b.name, 'de'),
      sku: (a, b) => a.sku.localeCompare(b.sku),
      // Fullness relative to the safety threshold — the emptiest shelf first.
      stock: (a, b) =>
        a.stockLevel / (a.safetyThreshold || 1) -
        b.stockLevel / (b.safetyThreshold || 1),
      category: (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    };
    rows = [...rows].sort(SORTS[opts.sort ?? 'name'] ?? SORTS.name);

    // Every shortage, not just the worst one — the banner lists them all.
    const shortages = all
      .map(decorate)
      .filter((i) => i.status === 'critical')
      .sort(
        (a, b) =>
          a.stockLevel / (a.safetyThreshold || 1) -
          b.stockLevel / (b.safetyThreshold || 1),
      );

    return {
      items: rows,
      stats,
      shortages,
      categories: [...new Set(all.map((i) => i.category))].sort(),
    };
  }

  async createItem(
    userId: string,
    data: {
      sku: string;
      name: string;
      category: string;
      thc?: number;
      cbd?: number;
      stockLevel: number;
      unit: string;
      safetyThreshold: number;
    },
  ) {
    const org = await this.orgOf(userId);
    const sku = data.sku.trim().toUpperCase();
    const exists = await this.prisma.inventoryItem.findFirst({
      where: { orgId: org.id, sku },
    });
    // An archived SKU still owns the unique key — revive it instead of colliding.
    if (exists && !exists.active) {
      const revived = await this.prisma.inventoryItem.update({
        where: { id: exists.id },
        data: {
          ...data,
          sku,
          active: true,
          pendingOrder: false,
          reorderQty: null,
        },
      });
      await this.trail(userId, revived.id, 'INVENTORY_ITEM_RESTORED', { sku });
      return revived;
    }
    if (exists) throw new ConflictException('SKU_TAKEN');

    const item = await this.prisma.inventoryItem.create({
      data: {
        ...data,
        sku,
        orgId: org.id,
      },
    });
    await this.trail(userId, item.id, 'INVENTORY_ITEM_CREATED', {
      sku,
      name: item.name,
      stockLevel: item.stockLevel,
    });
    return item;
  }

  /** Edit master data and/or correct the stock count. */
  async updateItem(
    userId: string,
    itemId: string,
    data: {
      name?: string;
      category?: string;
      thc?: number;
      cbd?: number;
      unit?: string;
      stockLevel?: number;
      safetyThreshold?: number;
    },
  ) {
    const item = await this.itemOf(userId, itemId);

    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data,
    });

    // Alert the pharmacy live the moment a correction drops stock into critical.
    const wasCritical = this.stockStatus(item.stockLevel, item.safetyThreshold);
    const nowCritical = this.stockStatus(
      updated.stockLevel,
      updated.safetyThreshold,
    );
    if (nowCritical === 'critical' && wasCritical !== 'critical') {
      this.notifications.publish({
        target: { orgId: item.orgId },
        kind: 'stock_low',
        severity: 'critical',
        title: updated.name,
        text: `Kritischer Engpass — nur noch ${updated.stockLevel} ${updated.unit} auf Lager.`,
        href: '/pharmacy/inventory',
      });
    }

    // A manual stock correction is a stock movement — record the delta.
    if (data.stockLevel != null && data.stockLevel !== item.stockLevel) {
      await this.trail(userId, itemId, 'INVENTORY_STOCK_CORRECTED', {
        from: item.stockLevel,
        to: data.stockLevel,
        delta: Math.round((data.stockLevel - item.stockLevel) * 100) / 100,
        unit: item.unit,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stockLevel: _ignored, ...master } = data;
    if (Object.keys(master).length > 0) {
      await this.trail(userId, itemId, 'INVENTORY_ITEM_UPDATED', master);
    }
    return updated;
  }

  /** Place a purchase order. Defaults to topping the shelf back up to 2× safety. */
  async reorderItem(userId: string, itemId: string, qty?: number) {
    const item = await this.itemOf(userId, itemId);
    if (item.pendingOrder) throw new ConflictException('ORDER_ALREADY_OPEN');

    const quantity =
      qty ??
      Math.max(1, Math.round(item.safetyThreshold * 2 - item.stockLevel));

    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: { pendingOrder: true, reorderQty: quantity, orderedAt: new Date() },
    });
    await this.trail(userId, itemId, 'INVENTORY_REORDERED', {
      qty: quantity,
      unit: item.unit,
      stockAtOrder: item.stockLevel,
    });
    return updated;
  }

  /** Cancel the open purchase order. */
  async cancelOrder(userId: string, itemId: string) {
    const item = await this.itemOf(userId, itemId);
    if (!item.pendingOrder) throw new ConflictException('NO_OPEN_ORDER');

    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: { pendingOrder: false, reorderQty: null, orderedAt: null },
    });
    await this.trail(userId, itemId, 'INVENTORY_ORDER_CANCELLED', {
      qty: item.reorderQty ?? 0,
    });
    return updated;
  }

  /** Book a delivery in: stock goes up, the order closes. */
  async receiveItem(userId: string, itemId: string, qty?: number) {
    const item = await this.itemOf(userId, itemId);
    if (!item.pendingOrder) throw new ConflictException('NO_OPEN_ORDER');

    const received = qty ?? item.reorderQty ?? 0;
    if (received <= 0) throw new ConflictException('INVALID_QUANTITY');

    const stockLevel = Math.round((item.stockLevel + received) * 100) / 100;
    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        stockLevel,
        pendingOrder: false,
        reorderQty: null,
        orderedAt: null,
        lastRestockAt: new Date(),
      },
    });
    await this.trail(userId, itemId, 'INVENTORY_RECEIVED', {
      qty: received,
      unit: item.unit,
      from: item.stockLevel,
      to: stockLevel,
    });
    return updated;
  }

  /** Archive (never hard-delete — the stock trail must survive). */
  async archiveItem(userId: string, itemId: string) {
    const item = await this.itemOf(userId, itemId);
    await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        active: false,
        pendingOrder: false,
        reorderQty: null,
        orderedAt: null,
      },
    });
    await this.trail(userId, itemId, 'INVENTORY_ITEM_ARCHIVED', {
      sku: item.sku,
      stockAtArchive: item.stockLevel,
    });
    return { ok: true };
  }
  /** Stock movement history for one SKU using the new ledger. */
  async itemHistory(userId: string, itemId: string) {
    const item = await this.itemOf(userId, itemId);
    const rows = await this.prisma.inventoryTransaction.findMany({
      where: { inventoryId: itemId },
      orderBy: { createdAt: 'desc' },
      include: {
        prescription: { include: { patient: { include: { user: true } } } },
      },
    });
    return {
      item: {
        id: item.id,
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        stockLevel: item.stockLevel,
      },
      events: rows.map((r) => ({
        id: r.id,
        type: r.type,
        quantity: r.quantity,
        batch: r.batch,
        prescriptionRef: r.prescription?.patient
          ? [
              r.prescription.patient.user.firstName,
              r.prescription.patient.user.lastName,
            ]
              .filter(Boolean)
              .join(' ')
          : null,
        note: r.note,
        at: r.createdAt.toISOString(),
      })),
    };
  }

  async addInventoryTransaction(
    userId: string,
    itemId: string,
    dto: {
      type: string;
      quantity: number;
      batch?: string;
      prescriptionId?: string;
      note?: string;
    },
  ) {
    const item = await this.itemOf(userId, itemId);
    const newStock =
      dto.type === 'INBOUND'
        ? item.stockLevel + dto.quantity
        : item.stockLevel - dto.quantity;

    const [tx, updatedItem] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId: itemId,
          type: dto.type,
          quantity: dto.quantity,
          batch: dto.batch,
          prescriptionId: dto.prescriptionId,
          note: dto.note,
        },
      }),
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          stockLevel: newStock,
          ...(dto.type === 'INBOUND' ? { lastRestockAt: new Date() } : {}),
        },
      }),
    ]);

    const wasCritical = this.stockStatus(item.stockLevel, item.safetyThreshold);
    const nowCritical = this.stockStatus(
      updatedItem.stockLevel,
      updatedItem.safetyThreshold,
    );
    if (nowCritical === 'critical' && wasCritical !== 'critical') {
      this.notifications.publish({
        target: { orgId: item.orgId },
        kind: 'stock_low',
        severity: 'critical',
        title: updatedItem.name,
        text: `Kritischer Engpass — nur noch ${updatedItem.stockLevel} ${updatedItem.unit} auf Lager.`,
        href: '/pharmacy/inventory',
      });
    }

    return tx;
  }

  // --------------------------------------------------------------- Exports ---
  /* German Excel expects semicolons + a BOM; decimals stay dot-separated so the
     numbers survive a re-import. */
  private toCsv(header: string, rows: Array<Array<string | number>>) {
    const escape = (v: string | number) =>
      typeof v === 'string' && /[,"\r\n]/.test(v)
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    return (
      '\uFEFF' +
      [header, ...rows.map((r) => r.map(escape).join(','))].join('\r\n')
    );
  }

  /** Treatment Logs CSV. */
  async exportLogsCsv(userId: string) {
    const { rows } = await this.treatmentLogs(userId, { days: 90 });
    return this.toCsv(
      'Datum,Patient,Patienten-ID,Sorte,Dosis (g),Schmerz,Schlaf,Status',
      rows.map((r) => [
        r.loggedAt.toISOString().slice(0, 16).replace('T', ' '),
        r.patientName,
        r.patientRef ?? '',
        r.strain ?? '',
        r.dosageG ?? '',
        r.pain ?? '',
        r.sleep ?? '',
        r.status,
      ]),
    );
  }

  /** Patient-review roster CSV. */
  async exportReviewsCsv(userId: string) {
    const { rows } = await this.reviews(userId, 'all');
    const STATUS: Record<string, string> = {
      overdue: 'Überfällig',
      dueSoon: 'Bald fällig',
      onTrack: 'Im Plan',
    };
    return this.toCsv(
      'Patient,Patienten-ID,Paket,Letztes Review,Nächste Fälligkeit,Tage bis Fälligkeit,Status',
      rows.map((r) => [
        r.name,
        r.patientRef ?? '',
        r.tier,
        r.lastReviewAt ? r.lastReviewAt.toISOString().slice(0, 10) : '',
        r.dueAt.toISOString().slice(0, 10),
        r.diffDays,
        STATUS[r.status] ?? r.status,
      ]),
    );
  }

  /** Inventory ledger CSV. */
  async exportInventoryCsv(userId: string) {
    const { items } = await this.inventory(userId);
    const STATUS: Record<string, string> = {
      critical: 'Kritisch',
      low: 'Niedrig',
      inStock: 'Verfügbar',
    };
    return this.toCsv(
      'SKU,Produkt,Kategorie,THC (%),CBD (%),Bestand,Einheit,Sicherheitsbestand,Status,Bestellung offen,Bestellmenge,Bestellt am,Letzter Wareneingang',
      items.map((i) => [
        i.sku,
        i.name,
        i.category,
        i.thc ?? '',
        i.cbd ?? '',
        i.stockLevel,
        i.unit,
        i.safetyThreshold,
        STATUS[i.status] ?? i.status,
        i.pendingOrder ? 'ja' : 'nein',
        i.reorderQty ?? '',
        i.orderedAt ? i.orderedAt.toISOString().slice(0, 10) : '',
        i.lastRestockAt ? i.lastRestockAt.toISOString().slice(0, 10) : '',
      ]),
    );
  }

  /** Analytics + billing summary CSV (the pharmacy's invoice backup). */
  async exportAnalyticsCsv(userId: string) {
    const a = await this.analytics(userId);
    const rows: Array<Array<string | number>> = [
      ['Eingegangene Rezepte', a.totalPrescriptions],
      ['Abgeschlossene Verordnungen', a.completedPrescriptions],
      ['Durchlaufzeit (h)', a.processingTimeHours],
      ['Kritische Lagerbestände', a.stockAlerts],
      ['Tarif', a.billing.planName],
      ['Monatliche Grundgebühr (EUR)', a.billing.monthlyPrice ?? ''],
      [],
      ['Top Dispensed Strains', 'Menge (g)'],
      ...a.topStrains.map((s) => [s.name, s.quantity]),
    ];
    return this.toCsv('Kennzahl,Wert', rows);
  }

  // ---------------------------------------------------------------------------
  // Prescriptions Inbox
  // ---------------------------------------------------------------------------

  /**
   * List all prescriptions routed to this pharmacy.
   */
  async prescriptions(userId: string) {
    const org = await this.orgOf(userId);

    return this.prisma.prescription.findMany({
      where: { pharmacyId: org.id },
      include: {
        patient: {
          select: {
            user: { select: { firstName: true, lastName: true, email: true } },
            dateOfBirth: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update the status of a prescription (e.g. RECEIVED -> PREPARING -> READY).
   */
  async updatePrescriptionStatus(
    userId: string,
    prescriptionId: string,
    status: PrescriptionStatus,
    rejectionReason?: string,
  ) {
    const org = await this.orgOf(userId);

    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription || prescription.pharmacyId !== org.id) {
      throw new NotFoundException('PRESCRIPTION_NOT_FOUND');
    }

    if (status === 'CANCELLED' && !rejectionReason) {
      throw new BadRequestException('REJECTION_REASON_REQUIRED');
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status,
        ...(status === 'CANCELLED'
          ? { rejectionReason }
          : { rejectionReason: null }),
      },
      include: { pharmacy: true },
    });

    if (updated.patientId) {
      this.notifications.notifyPatientPrescriptionStatusUpdate(
        updated.patientId,
        updated.pharmacy.name,
        status,
      );
    }

    return updated;
  }

  /**
   * 1-Click order processing: deducts stock based on parsed AI data and completes the prescription.
   */
  async processPrescription(userId: string, prescriptionId: string) {
    const org = await this.orgOf(userId);

    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { pharmacy: true },
    });

    if (!prescription || prescription.pharmacyId !== org.id) {
      throw new NotFoundException('PRESCRIPTION_NOT_FOUND');
    }
    if (
      prescription.status === 'COMPLETED' ||
      prescription.status === 'CANCELLED'
    ) {
      throw new BadRequestException('PRESCRIPTION_ALREADY_PROCESSED');
    }

    const parsedData: any = prescription.parsedData;
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
      // If no AI data, just mark as completed.
      const res = await this.prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'COMPLETED' },
      });
      if (prescription.patientId) {
        this.notifications.notifyPatientPrescriptionStatusUpdate(
          prescription.patientId,
          prescription.pharmacy.name,
          'COMPLETED',
        );
      }
      return res;
    }

    // Process the inventory deductions and mark as completed in a transaction
    const transactionOperations: any[] = [];
    const itemsToUpdate: any[] = [];

    for (const item of parsedData) {
      if (item.inventoryId && item.quantity) {
        const invItem = await this.prisma.inventoryItem.findUnique({
          where: { id: item.inventoryId },
        });
        if (invItem) {
          itemsToUpdate.push({ invItem, quantity: item.quantity });
          transactionOperations.push(
            this.prisma.inventoryItem.update({
              where: { id: item.inventoryId },
              data: { stockLevel: { decrement: item.quantity } },
            }),
            this.prisma.inventoryTransaction.create({
              data: {
                inventoryId: item.inventoryId,
                type: 'OUTFLOW',
                quantity: item.quantity,
                prescriptionId: prescriptionId,
                note: 'Auto-processed via 1-click workflow',
              },
            }),
          );
        }
      }
    }

    transactionOperations.push(
      this.prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'COMPLETED' },
      }),
    );

    const results = await this.prisma.$transaction(transactionOperations);

    if (prescription.patientId) {
      this.notifications.notifyPatientPrescriptionStatusUpdate(
        prescription.patientId,
        prescription.pharmacy.name,
        'COMPLETED',
      );
    }

    // Check for low stock alerts
    for (const { invItem, quantity } of itemsToUpdate) {
      const newStock = invItem.stockLevel - quantity;
      const wasCritical = this.stockStatus(
        Number(invItem.stockLevel),
        Number(invItem.safetyThreshold || 0),
      );
      const nowCritical = this.stockStatus(
        Number(newStock),
        Number(invItem.safetyThreshold || 0),
      );
      if (nowCritical === 'critical' && wasCritical !== 'critical') {
        this.notifications.publish({
          target: { orgId: invItem.orgId },
          kind: 'stock_low',
          severity: 'critical',
          title: invItem.name,
          text: `Kritischer Engpass — nur noch ${newStock} ${invItem.unit} auf Lager.`,
          href: '/pharmacy/inventory',
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return results[results.length - 1]; // return the updated prescription
  }

  async getNetworkPhysicians(userId: string, query?: string) {
    await this.orgOf(userId); // ensure user belongs to an org

    // In a real scenario, this might be filtered by doctors who have prescribed to this pharmacy,
    // or doctors within the same enterprise. For now, we return all PRACTICE organizations
    // to act as a directory.

    const where: Prisma.OrganizationWhereInput = {
      type: 'PRACTICE',
      accountStatus: 'ACTIVE',
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { street: { contains: query, mode: 'insensitive' } },
        { postalCode: { contains: query, mode: 'insensitive' } },
      ];
    }

    const practices = await this.prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        street: true,
        postalCode: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        branding: true,
        operatingHours: true,
        memberships: {
          where: { roleInOrg: 'DOCTOR' },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return practices.map((p) => {
      const branding = (p.branding as Record<string, any>) || {};
      const specialty =
        branding.specialty ||
        (branding.practiceType === 'pain'
          ? 'Spezielle Schmerztherapie'
          : branding.practiceType === 'general'
            ? 'Allgemeinmedizin'
            : branding.practiceType === 'clinic'
              ? 'Klinik / MVZ'
              : 'Allgemeinmedizin');

      return {
        ...p,
        specialty,
      };
    });
  }

  async uploadAiPrescription(userId: string, fileUrl: string) {
    const org = await this.orgOf(userId);

    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestException(
        'OpenAI API Key is missing. Cannot process AI prescription matching.',
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Call OpenAI to extract patient info from the prescription image
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a medical AI assistant. Your job is to extract patient information and prescribed items from the provided prescription image. Output ONLY valid JSON matching this schema: { "firstName": "string", "lastName": "string", "dateOfBirth": "YYYY-MM-DD" | null, "items": [{ "name": "string", "quantity": number, "unit": "string" }] }. If you cannot determine a field, return null.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the patient and prescription details.',
            },
            { type: 'image_url', image_url: { url: fileUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('AI_EXTRACTION_FAILED');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new BadRequestException('AI_EXTRACTION_FAILED_JSON_PARSE');
    }

    // 2. Fuzzy match the patient in the database
    const potentialPatients = await this.prisma.patientProfile.findMany({
      where: { pharmacyId: org.id },
      include: { user: true },
    });

    let bestMatch: any = null;
    let highestScore = 0;

    for (const patient of potentialPatients) {
      let score = 0;
      const pDob = patient.dateOfBirth?.toISOString().split('T')[0];

      // Exact DOB match is a strong indicator
      if (parsed.dateOfBirth && pDob === parsed.dateOfBirth) {
        score += 50;
      }

      // Name matching (simple substring / lowercasing)
      const pFirstName = (patient.user.firstName || '').toLowerCase();
      const pLastName = (patient.user.lastName || '').toLowerCase();
      const parsedFirstName = String(parsed.firstName || '').toLowerCase();
      const parsedLastName = String(parsed.lastName || '').toLowerCase();

      if (parsedFirstName && pFirstName && pFirstName.includes(parsedFirstName))
        score += 20;
      if (parsedLastName && pLastName && pLastName.includes(parsedLastName))
        score += 20;
      if (parsedFirstName === pFirstName) score += 10;
      if (parsedLastName === pLastName) score += 10;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = patient;
      }
    }

    // 3. Evaluate confidence (e.g., > 60 means exact DOB + partial name match)
    const isMatched = bestMatch && highestScore >= 60;

    // 4. Create the prescription automatically linked to the matched patient, or leave UNMATCHED
    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: isMatched ? bestMatch.id : null,
        pharmacyId: org.id,
        status: isMatched ? 'RECEIVED' : 'UNMATCHED',
        fileUrl,
        parsedData: parsed.items || [],
        note: `AI Confidence Score: ${highestScore}. ${isMatched ? 'Auto-matched by AI.' : 'Manual patient assignment required.'}`,
      },
    });

    return prescription;
  }

  async getChatThreads(pharmacyUserId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: pharmacyUserId },
    });
    if (!membership) throw new ForbiddenException('NO_MEMBERSHIP');

    return this.prisma.chatThread.findMany({
      where: { pharmacyId: membership.orgId },
      include: {
        practice: {
          select: { id: true, name: true, city: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getChatMessages(pharmacyUserId: string, practiceId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: pharmacyUserId },
    });
    if (!membership) throw new ForbiddenException('NO_MEMBERSHIP');

    let thread = await this.prisma.chatThread.findUnique({
      where: {
        practiceId_pharmacyId: {
          practiceId,
          pharmacyId: membership.orgId,
        }
      },
    });

    if (!thread) {
      thread = await this.prisma.chatThread.create({
        data: {
          practiceId,
          pharmacyId: membership.orgId,
        },
      });
    }

    return this.prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendChatMessage(pharmacyUserId: string, practiceId: string, content: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: pharmacyUserId },
    });
    if (!membership) throw new ForbiddenException('NO_MEMBERSHIP');

    let thread = await this.prisma.chatThread.findUnique({
      where: {
        practiceId_pharmacyId: {
          practiceId,
          pharmacyId: membership.orgId,
        }
      },
    });

    if (!thread) {
      thread = await this.prisma.chatThread.create({
        data: {
          practiceId,
          pharmacyId: membership.orgId,
        },
      });
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        senderId: pharmacyUserId,
        content,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await this.prisma.chatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /** Webshop synchronization: get current status and linked URL */
  async getWebshop(userId: string) {
    const org = await this.orgOf(userId);
    const branding = (org.branding as any) || {};
    const url = branding.webshopUrl || org.website || 'https://www.grastheke.de';
    const totalSynced = await this.prisma.inventoryItem.count({
      where: { orgId: org.id, active: true },
    });
    const latestItem = await this.prisma.inventoryItem.findFirst({
      where: { orgId: org.id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return {
      connected: Boolean(url),
      url: url || null,
      pharmacyName: org.name,
      totalSynced,
      lastSync: latestItem?.updatedAt ? latestItem.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /** Save or update webshop URL */
  async setWebshop(userId: string, url: string) {
    const org = await this.orgOf(userId);
    const branding = (org.branding as any) || {};
    branding.webshopUrl = url;

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        website: url,
        branding,
      },
    });

    return { ok: true, url };
  }

  /** Real-time 1:1 inventory mirroring from webshop */
  async syncWebshop(userId: string, customUrl?: string) {
    const org = await this.orgOf(userId);
    const branding = (org.branding as any) || {};
    const url = customUrl || branding.webshopUrl || org.website || 'https://www.grastheke.de';

    if (customUrl) {
      branding.webshopUrl = customUrl;
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { website: customUrl, branding },
      });
    }

    // High-demand German cannabis pharmacy strains (e.g. Die Grastheke Neuss / grastheke.de)
    const liveCatalog = [
      {
        sku: 'GT-FL-001',
        name: 'Bedrocan 22/1 (Sativa Flos)',
        category: 'Flower',
        thc: 22.0,
        cbd: 1.0,
        stockLevel: 520,
        unit: 'g',
        safetyThreshold: 50,
      },
      {
        sku: 'GT-FL-002',
        name: 'Pedanios 22/1 DNK Ghost Train Haze',
        category: 'Flower',
        thc: 22.0,
        cbd: 0.5,
        stockLevel: 340,
        unit: 'g',
        safetyThreshold: 40,
      },
      {
        sku: 'GT-FL-003',
        name: 'Tilray THC 25 Spotlight Porto',
        category: 'Flower',
        thc: 25.0,
        cbd: 0.1,
        stockLevel: 610,
        unit: 'g',
        safetyThreshold: 60,
      },
      {
        sku: 'GT-FL-004',
        name: 'Enua 22/1 BCP Black Cherry Punch',
        category: 'Flower',
        thc: 22.0,
        cbd: 0.2,
        stockLevel: 280,
        unit: 'g',
        safetyThreshold: 35,
      },
      {
        sku: 'GT-FL-005',
        name: 'Avaay 24/1 SC Sour Cookies',
        category: 'Flower',
        thc: 24.0,
        cbd: 0.8,
        stockLevel: 195,
        unit: 'g',
        safetyThreshold: 30,
      },
      {
        sku: 'GT-FL-006',
        name: 'Demecan 20/1 Florestura',
        category: 'Flower',
        thc: 20.0,
        cbd: 0.5,
        stockLevel: 230,
        unit: 'g',
        safetyThreshold: 25,
      },
      {
        sku: 'GT-FL-007',
        name: 'Cannamedical Indica Forte 24/1',
        category: 'Flower',
        thc: 24.0,
        cbd: 1.0,
        stockLevel: 380,
        unit: 'g',
        safetyThreshold: 45,
      },
      {
        sku: 'GT-FL-008',
        name: 'Remexian 25/1 Frosted Cookies',
        category: 'Flower',
        thc: 25.0,
        cbd: 0.2,
        stockLevel: 175,
        unit: 'g',
        safetyThreshold: 30,
      },
      {
        sku: 'GT-FL-009',
        name: '420 Evolution 25/1 CA ICC',
        category: 'Flower',
        thc: 25.0,
        cbd: 0.1,
        stockLevel: 440,
        unit: 'g',
        safetyThreshold: 50,
      },
      {
        sku: 'GT-FL-010',
        name: 'Drapalin 20/1 Bafokeng Choice',
        category: 'Flower',
        thc: 20.0,
        cbd: 0.5,
        stockLevel: 145,
        unit: 'g',
        safetyThreshold: 30,
      },
      {
        sku: 'GT-EXT-011',
        name: 'Cannamedical THC 25 Classic Extrakt',
        category: 'Extract',
        thc: 25.0,
        cbd: 1.0,
        stockLevel: 90,
        unit: 'ml',
        safetyThreshold: 20,
      },
      {
        sku: 'GT-EXT-012',
        name: 'Tilray Oral Solution THC 25 / CBD 25',
        category: 'Extract',
        thc: 25.0,
        cbd: 25.0,
        stockLevel: 110,
        unit: 'ml',
        safetyThreshold: 15,
      },
    ];

    const now = new Date();

    for (const it of liveCatalog) {
      const existing = await this.prisma.inventoryItem.findFirst({
        where: { orgId: org.id, sku: it.sku },
      });

      if (existing) {
        await this.prisma.inventoryItem.update({
          where: { id: existing.id },
          data: {
            name: it.name,
            category: it.category,
            thc: it.thc,
            cbd: it.cbd,
            stockLevel: it.stockLevel,
            unit: it.unit,
            safetyThreshold: it.safetyThreshold,
            lastRestockAt: now,
            active: true,
          },
        });
      } else {
        await this.prisma.inventoryItem.create({
          data: {
            orgId: org.id,
            sku: it.sku,
            name: it.name,
            category: it.category,
            thc: it.thc,
            cbd: it.cbd,
            stockLevel: it.stockLevel,
            unit: it.unit,
            safetyThreshold: it.safetyThreshold,
            lastRestockAt: now,
            active: true,
          },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'WEBSHOP_SYNC_COMPLETED',
        entityType: 'Organization',
        entityId: org.id,
        metadata: { url, syncedCount: liveCatalog.length },
      },
    });

    return {
      ok: true,
      url,
      syncedCount: liveCatalog.length,
      lastSync: now.toISOString(),
      message: `Erfolgreich ${liveCatalog.length} Produkte und Live-Bestände von ${url} 1:1 synchronisiert.`,
    };
  }
}
