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
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { getCoordinatesForPostalCode } from '../shared/geocode';

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
      productFocus: org.productFocus,
    };
  }

  async updateSettings(
    userId: string,
    data: {
      name: string;
      street?: string;
      postalCode?: string;
      city?: string;
      productFocus?: string;
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
        productFocus: data.productFocus,
        lat,
        lng,
      },
    });

    return {
      name: updated.name,
      street: updated.street,
      postalCode: updated.postalCode,
      city: updated.city,
      productFocus: updated.productFocus,
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
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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
    const totalPatientsWithPrescriptions = presGroups.length;
    const returningPatientsPercentage = totalPatientsWithPrescriptions > 0
      ? Math.round((activeRegulars / totalPatientsWithPrescriptions) * 100)
      : 0;

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
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    const recentPrescriptions = recentPrescriptionsRaw.map((p) => ({
      id: p.id,
      patientName: [p.patient.user.firstName, p.patient.user.lastName].filter(Boolean).join(' '),
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
      returningPatientsPercentage,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = patients.map((p) => {
      const start = p.therapyStart ?? p.createdAt;
      const state = this.reviewState(p.lastReviewAt, start);
      return {
        id: p.id,
        name:
          [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
          p.user.email,
        patientRef: p.patientRef,
        condition: p.condition,
        tier: p.packageTier,
        lastReviewAt: p.lastReviewAt,
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

    const logs = await this.prisma.therapyLog.findMany({
      where: { patient: { pharmacyId: org.id } },
      select: { loggedAt: true, metrics: true, patientId: true },
      orderBy: { loggedAt: 'asc' },
    });

    // Monthly review volume + adherence trend.
    const byMonth = new Map<
      string,
      { adherenceDays: Set<string>; qol: number[] }
    >();
    for (const l of logs) {
      const key = l.loggedAt.toISOString().slice(0, 7);
      const b = byMonth.get(key) ?? {
        adherenceDays: new Set<string>(),
        qol: [],
      };
      b.adherenceDays.add(
        `${l.patientId}:${l.loggedAt.toISOString().slice(0, 10)}`,
      );
      const m = (l.metrics as Metrics | null) ?? {};
      if (m.qol != null) b.qol.push(m.qol);
      byMonth.set(key, b);
    }
    const months = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, b]) => ({
        month,
        entries: b.adherenceDays.size,
        avgQol: b.qol.length
          ? Math.round((b.qol.reduce((x, y) => x + y, 0) / b.qol.length) * 10) /
            10
          : null,
      }));

    const submissions = await this.prisma.submission.findMany({
      where: {
        patient: { pharmacyId: org.id },
        status: SubmissionStatus.SUBMITTED,
      },
      include: {
        answers: { include: { question: { select: { key: true } } } },
      },
    });
    const ratings = submissions
      .map(
        (s) => s.answers.find((a) => a.question.key === 'satisfaction')?.value,
      )
      .filter((v): v is number => typeof v === 'number');
    const avgRating = ratings.length
      ? Math.round(
          (ratings.reduce((a, b) => a + b, 0) / ratings.length / 2) * 10,
        ) / 10
      : null;

    const patients = await this.prisma.patientProfile.count({
      where: { pharmacyId: org.id },
    });
    // Retention = share of patients still logging in the last 30 days.
    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const activeRecently = await this.prisma.patientProfile.count({
      where: {
        pharmacyId: org.id,
        therapyLogs: { some: { loggedAt: { gte: since30 } } },
      },
    });
    const retention = patients
      ? Math.round((activeRecently / patients) * 100)
      : 0;

    // Billing: tier, usage, projected cost (client's enterprise tiering).
    const subscription = await this.prisma.subscription.findFirst({
      where: { orgId: org.id, isActive: true },
      include: { plan: true },
    });
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const reviewsThisMonth = await this.prisma.submission.count({
      where: {
        patient: { pharmacyId: org.id },
        status: SubmissionStatus.SUBMITTED,
        submittedAt: { gte: monthStart },
        version: { questionnaire: { key: 'monthly_review' } },
      },
    });
    const unitPrice =
      reviewsThisMonth <= 500 ? 8 : reviewsThisMonth <= 1500 ? 6.5 : 5;

    return {
      retention,
      months,
      totalReviews: submissions.length,
      avgRating,
      responseRate: patients
        ? Math.min(
            100,
            Math.round((submissions.length / Math.max(1, patients)) * 100),
          )
        : 0,
      billing: {
        tier: subscription?.plan.tier ?? SubscriptionTier.BASIC,
        planName: subscription?.plan.name ?? 'Basic',
        monthlyPrice: subscription?.plan.monthlyPrice
          ? Number(subscription.plan.monthlyPrice)
          : null,
        reviewCap: subscription?.plan.reviewCap ?? null,
        reviewsThisMonth,
        unitPrice,
        projectedCost: Math.round(reviewsThisMonth * unitPrice * 100) / 100,
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
      include: { prescription: { include: { patient: { include: { user: true } } } } }
    });
    return {
      item: { id: item.id, sku: item.sku, name: item.name, unit: item.unit, stockLevel: item.stockLevel },
      events: rows.map((r) => ({
        id: r.id,
        type: r.type,
        quantity: r.quantity,
        batch: r.batch,
        prescriptionRef: r.prescription ? [r.prescription.patient.user.firstName, r.prescription.patient.user.lastName].filter(Boolean).join(' ') : null,
        note: r.note,
        at: r.createdAt.toISOString(),
      })),
    };
  }

  async addInventoryTransaction(userId: string, itemId: string, dto: { type: string; quantity: number; batch?: string; prescriptionId?: string; note?: string; }) {
    const item = await this.itemOf(userId, itemId);
    const newStock = dto.type === 'INBOUND' ? item.stockLevel + dto.quantity : item.stockLevel - dto.quantity;
    
    const [tx, updatedItem] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.create({
        data: {
          inventoryId: itemId,
          type: dto.type,
          quantity: dto.quantity,
          batch: dto.batch,
          prescriptionId: dto.prescriptionId,
          note: dto.note,
        }
      }),
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          stockLevel: newStock,
          ...(dto.type === 'INBOUND' ? { lastRestockAt: new Date() } : {})
        }
      })
    ]);
    
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
      ['Patientenbindung (%)', a.retention],
      ['Reviews gesamt', a.totalReviews],
      ['Ø Bewertung (1–5)', a.avgRating ?? ''],
      ['Rücklaufquote (%)', a.responseRate],
      ['Tarif', a.billing.planName],
      ['Monatliche Grundgebühr (EUR)', a.billing.monthlyPrice ?? ''],
      ['Inklusive Reviews', a.billing.reviewCap ?? 'unbegrenzt'],
      ['Reviews in diesem Monat', a.billing.reviewsThisMonth],
      ['Preis pro Review (EUR)', a.billing.unitPrice],
      ['Voraussichtliche Kosten (EUR)', a.billing.projectedCost],
      [],
      ['Monat', 'Einträge', 'Ø Lebensqualität'],
      ...a.months.map((m) => [m.month, m.entries, m.avgQol ?? '']),
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
    status: any,
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
    });

    return updated;
  }

  /**
   * 1-Click order processing: deducts stock based on parsed AI data and completes the prescription.
   */
  async processPrescription(userId: string, prescriptionId: string) {
    const org = await this.orgOf(userId);

    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription || prescription.pharmacyId !== org.id) {
      throw new NotFoundException('PRESCRIPTION_NOT_FOUND');
    }
    if (prescription.status === 'COMPLETED' || prescription.status === 'CANCELLED') {
      throw new BadRequestException('PRESCRIPTION_ALREADY_PROCESSED');
    }

    const parsedData: any = prescription.parsedData;
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
      // If no AI data, just mark as completed.
      return this.prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'COMPLETED' },
      });
    }

    // Process the inventory deductions and mark as completed in a transaction
    const transactionOperations: any[] = [];
    
    for (const item of parsedData) {
      if (item.inventoryId && item.quantity) {
        transactionOperations.push(
          this.prisma.inventoryItem.update({
            where: { id: item.inventoryId },
            data: { stockLevel: { decrement: item.quantity } }
          }),
          this.prisma.inventoryTransaction.create({
            data: {
              inventoryId: item.inventoryId,
              type: 'OUTFLOW',
              quantity: item.quantity,
              prescriptionId: prescriptionId,
              note: 'Auto-processed via 1-click workflow',
            }
          })
        );
      }
    }

    transactionOperations.push(
      this.prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'COMPLETED' }
      })
    );

    const results = await this.prisma.$transaction(transactionOperations);
    return results[results.length - 1]; // return the updated prescription
  }

  async getNetworkPhysicians(userId: string, query?: string) {
    const membership = await this.requireMembership(userId);
    
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
      ];
    }
    
    const practices = await this.prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        city: true,
        phone: true,
        email: true,
        website: true,
        description: true,
        memberships: {
          where: { roleInOrg: 'DOCTOR' },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    
    return practices;
  }
}
