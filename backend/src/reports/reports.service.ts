import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportType, Role, SubscriptionTier } from '@prisma/client';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { renderReportPdf } from './report-template';

/* Report PDFs live outside `uploads/` so no static handler can ever expose them. */
const REPORT_DIR = join(process.cwd(), 'storage', 'reports');

type Metrics = {
  pain?: number;
  sleep?: number;
  activity?: number;
  qol?: number;
};
type LogMetrics = Metrics & {
  symptomsText?: string;
  effectDescription?: string;
  sideEffectsText?: string;
};

export type ReportData = {
  type: ReportType;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  patient: {
    name: string;
    patientRef: string | null;
    dateOfBirth: Date | null;
    therapyDay: number | null;
  };
  practice: { name: string | null; logoUrl: string | null } | null;
  dosage: {
    weeks: Array<{ label: string; avgG: number | null }>;
    avgDailyG: number | null;
    totalG: number;
  };
  strains: Array<{ name: string; days: number }>;
  metrics: Array<{
    key: 'pain' | 'sleep' | 'activity' | 'qol';
    label: string;
    unit: string;
    start: number | null;
    end: number | null;
    changePct: number | null;
    betterWhenDown: boolean;
  }>;
  adherence: { loggedDays: number; totalDays: number; pct: number };
  sideEffects: string[];
  satisfaction: number | null;
  goalsReached: string | null;
  notes: string | null;
  redFlags: Array<{ severity: string; message: string; createdAt: Date }>;
  nextAppointmentPrep: string[];
  summary: string;
};

const METRIC_META = [
  {
    key: 'pain',
    label: 'Schmerz (NRS 0–10)',
    unit: '/10',
    betterWhenDown: true,
  },
  {
    key: 'sleep',
    label: 'Schlafqualität (0–10)',
    unit: '/10',
    betterWhenDown: false,
  },
  {
    key: 'activity',
    label: 'Aktivität (0–10)',
    unit: '/10',
    betterWhenDown: false,
  },
  {
    key: 'qol',
    label: 'Lebensqualität (0–10)',
    unit: '/10',
    betterWhenDown: false,
  },
] as const;

/** Period presets. LONG_TERM = whole therapy (answers the client's >90-day ask). */
const PERIOD_DAYS: Record<ReportType, number | null> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  YEARLY: 365,
  LONG_TERM: null, // since therapy start
};

import { AiService } from './ai.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * A report is Art. 9 health data. Holding `reports:view` is not enough — the
   * caller must actually be on this patient's case: their own record, their
   * treating practice, or the pharmacy running their reviews.
   */
  async assertCanAccessPatient(userId: string, patientId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { userId: true, orgId: true, pharmacyId: true },
    });
    if (!profile) throw new NotFoundException('PATIENT_NOT_FOUND');
    if (profile.userId === userId) return; // the patient themselves

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, memberships: { select: { orgId: true } } },
    });
    if (!user || user.role === Role.PATIENT)
      throw new ForbiddenException('FORBIDDEN');

    const orgIds = user.memberships.map((m) => m.orgId);
    const onCase =
      (profile.orgId && orgIds.includes(profile.orgId)) ||
      (profile.pharmacyId && orgIds.includes(profile.pharmacyId));
    if (!onCase) throw new ForbiddenException('PATIENT_NOT_IN_ORGANIZATION');
  }

  /** Gathers everything the PDF shows, from live therapy data. */
  async buildData(patientId: string, type: ReportType): Promise<ReportData> {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        org: { select: { name: true, branding: true } },
      },
    });
    if (!profile) throw new NotFoundException('PATIENT_NOT_FOUND');

    const therapyStart = profile.therapyStart ?? profile.createdAt;
    const periodEnd = new Date();
    const days = PERIOD_DAYS[type];
    const periodStart =
      days === null
        ? therapyStart
        : new Date(
            Math.max(
              therapyStart.getTime(),
              periodEnd.getTime() - days * 86_400_000,
            ),
          );

    const [logs, submissions, redFlags] = await Promise.all([
      this.prisma.therapyLog.findMany({
        where: { patientId, loggedAt: { gte: periodStart, lte: periodEnd } },
        orderBy: { loggedAt: 'asc' },
      }),
      this.prisma.submission.findMany({
        where: {
          patientId,
          status: 'SUBMITTED',
          submittedAt: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { submittedAt: 'desc' },
        include: {
          answers: { include: { question: { include: { options: true } } } },
        },
      }),
      this.prisma.redFlagHit.findMany({
        where: { patientId, createdAt: { gte: periodStart, lte: periodEnd } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // ---- Dosage: weekly averages + totals -----------------------------------
    const weekBuckets = new Map<number, number[]>();
    let totalG = 0;
    for (const l of logs) {
      if (l.dosageG == null) continue;
      totalG += l.dosageG;
      const week = Math.floor(
        (l.loggedAt.getTime() - periodStart.getTime()) / (7 * 86_400_000),
      );
      const bucket = weekBuckets.get(week) ?? [];
      bucket.push(l.dosageG);
      weekBuckets.set(week, bucket);
    }
    const avg = (a: number[]) =>
      a.length
        ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100
        : null;
    const weeks = [...weekBuckets.entries()]
      .sort(([a], [b]) => a - b)
      .map(([w, vals]) => ({ label: `Woche ${w + 1}`, avgG: avg(vals) }));
    const dosedLogs = logs.filter((l) => l.dosageG != null);
    const avgDailyG = avg(dosedLogs.map((l) => l.dosageG!));

    // ---- Strains ------------------------------------------------------------
    const strainCount = new Map<string, number>();
    for (const l of logs) {
      if (!l.strain) continue;
      strainCount.set(l.strain, (strainCount.get(l.strain) ?? 0) + 1);
    }
    const strains = [...strainCount.entries()]
      .map(([name, d]) => ({ name, days: d }))
      .sort((a, b) => b.days - a.days);

    // ---- Metrics: start vs end + % change -----------------------------------
    const firstOf = (k: keyof Metrics) =>
      logs.find((l) => (l.metrics as Metrics | null)?.[k] != null);
    const lastOf = (k: keyof Metrics) =>
      [...logs]
        .reverse()
        .find((l) => (l.metrics as Metrics | null)?.[k] != null);

    const metrics = METRIC_META.map((m) => {
      const start =
        (firstOf(m.key)?.metrics as Metrics | null)?.[m.key] ?? null;
      const end = (lastOf(m.key)?.metrics as Metrics | null)?.[m.key] ?? null;
      const changePct =
        start != null && end != null && start !== 0
          ? Math.round(((end - start) / start) * 100)
          : null;
      return { ...m, start, end, changePct };
    });

    // ---- Adherence ----------------------------------------------------------
    const loggedDays = new Set(
      logs.map((l) => l.loggedAt.toISOString().slice(0, 10)),
    ).size;
    const totalDays = Math.max(
      1,
      Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86_400_000),
    );
    const adherence = {
      loggedDays,
      totalDays,
      pct: Math.min(100, Math.round((loggedDays / totalDays) * 100)),
    };

    // ---- Latest monthly review answers --------------------------------------
    const review = submissions[0];
    const answerOf = (key: string): unknown => {
      const a = review?.answers.find((x) => x.question.key === key);
      if (!a) return null;
      const raw = a.value as unknown;
      if (Array.isArray(raw)) {
        return raw.map(
          (v) =>
            a.question.options.find((o) => o.value === v)?.label ?? String(v),
        );
      }
      if (typeof raw === 'string') {
        return a.question.options.find((o) => o.value === raw)?.label ?? raw;
      }
      return raw;
    };
    const painDesc =
      typeof answerOf('painDescription') === 'string'
        ? (answerOf('painDescription') as string)
        : null;
    const sleepDetails =
      typeof answerOf('sleepQualityDetails') === 'string'
        ? (answerOf('sleepQualityDetails') as string)
        : null;
    const sideEffectsDetails =
      typeof answerOf('sideEffectsDetails') === 'string'
        ? (answerOf('sideEffectsDetails') as string)
        : null;
    const improvementsDetail =
      typeof answerOf('improvementsDetail') === 'string'
        ? (answerOf('improvementsDetail') as string)
        : null;
    const unresolvedIssues =
      typeof answerOf('unresolvedIssues') === 'string'
        ? (answerOf('unresolvedIssues') as string)
        : null;
    const doctorQuestions =
      typeof answerOf('doctorQuestions') === 'string'
        ? (answerOf('doctorQuestions') as string)
        : null;
    const strainUsedText =
      typeof answerOf('strainUsed') === 'string'
        ? (answerOf('strainUsed') as string)
        : null;
    const sideEffects = Array.isArray(answerOf('sideEffects'))
      ? (answerOf('sideEffects') as string[])
      : [];
    const satisfactionVal = answerOf('satisfaction');
    const satisfaction =
      typeof satisfactionVal === 'number'
        ? satisfactionVal
        : typeof satisfactionVal === 'string'
          ? parseInt(satisfactionVal, 10)
          : null;
    const goalsReached =
      typeof answerOf('goalsReached') === 'string'
        ? (answerOf('goalsReached') as string)
        : null;
    const notes =
      typeof answerOf('notes') === 'string'
        ? (answerOf('notes') as string)
        : null;
    const prepVal = answerOf('doctorQuestions');
    const prep: string[] =
      typeof prepVal === 'string' && prepVal.trim() !== '' ? [prepVal] : [];
    // ---- Comprehensive Clinical Summary (AI Engine) --------------------
    let summary = '';
    if (logs.length === 0 && !review) {
      summary =
        'Für diesen Zeitraum liegen noch keine strukturierten Tageseinträge oder Monatsreviews vor.';
    } else {
      const patientNameForAi =
        [profile.user.firstName, profile.user.lastName]
          .filter(Boolean)
          .join(' ') || 'Unbekannt';
      const aiDataPayload = {
        adherence,
        dosage: { avgDailyG, totalG },
        metrics,
        strains,
        dailyNotesAndFreeText: logs.map((l) => {
          const m = l.metrics as LogMetrics | null;
          return {
            date: l.loggedAt.toISOString().slice(0, 10),
            note: l.note,
            symptoms: m?.symptomsText,
            effects: m?.effectDescription,
            sideEffects: m?.sideEffectsText,
          };
        }),
        monthlyReviewAnswers: {
          painDesc,
          sleepDetails,
          sideEffectsDetails,
          improvementsDetail,
          unresolvedIssues,
          doctorQuestions,
          strainUsedText,
          sideEffects,
          satisfaction,
          goalsReached,
          notes,
        },
      };

      summary = await this.aiService.generateClinicalSummary(
        patientNameForAi,
        periodStart.toISOString().slice(0, 10),
        periodEnd.toISOString().slice(0, 10),
        aiDataPayload,
      );
    }

    const branding = (profile.org?.branding ?? null) as {
      logoUrl?: string;
    } | null;
    const therapyDay = Math.max(
      1,
      Math.floor((periodEnd.getTime() - therapyStart.getTime()) / 86_400_000) +
        1,
    );

    return {
      type,
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      patient: {
        name: [profile.user.firstName, profile.user.lastName]
          .filter(Boolean)
          .join(' '),
        patientRef: profile.patientRef,
        dateOfBirth: profile.dateOfBirth,
        therapyDay,
      },
      practice: profile.org
        ? { name: profile.org.name, logoUrl: branding?.logoUrl ?? null }
        : null,
      dosage: { weeks, avgDailyG, totalG: Math.round(totalG * 100) / 100 },
      strains,
      metrics,
      adherence,
      sideEffects,
      satisfaction,
      goalsReached,
      notes,
      redFlags: redFlags.map((f) => ({
        severity: f.severity,
        message: f.message,
        createdAt: f.createdAt,
      })),
      nextAppointmentPrep: prep,
      summary,
    };
  }

  /** Generates the PDF, stores it, records the Report row, returns the buffer. */
  async generate(
    requestedByUserId: string,
    patientId: string,
    type: ReportType,
  ): Promise<{ buffer: Buffer; filename: string; reportId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: requestedByUserId },
      select: {
        role: true,
        memberships: {
          select: {
            org: {
              select: {
                subscriptions: {
                  where: { isActive: true },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    if (user.role === Role.PATIENT) {
      const profile = await this.prisma.patientProfile.findUnique({
        where: { id: patientId },
        select: { packageTier: true },
      });
      if (!profile) throw new NotFoundException('PATIENT_NOT_FOUND');
      if (profile.packageTier === SubscriptionTier.BASIC) {
        throw new ForbiddenException('UPGRADE_REQUIRED');
      }
    } else {
      const hasActiveSub = user.memberships.some(
        (m) => m.org.subscriptions.length > 0,
      );
      if (!hasActiveSub) {
        throw new ForbiddenException('PARTNER_INACTIVE');
      }

      const profile = await this.prisma.patientProfile.findUnique({
        where: { id: patientId },
        select: { packageTier: true },
      });
      if (!profile) throw new NotFoundException('PATIENT_NOT_FOUND');
      if (profile.packageTier === SubscriptionTier.BASIC) {
        throw new ForbiddenException('UPGRADE_REQUIRED');
      }
    }

    const data = await this.buildData(patientId, type);
    const buffer = await renderReportPdf(data);

    const fs = await import('fs/promises');
    const path = await import('path');
    // Outside the statically served folder — health data must not be reachable
    // by URL guessing. Downloads go through GET /reports/file/:id.
    const dir = REPORT_DIR;
    await fs.mkdir(dir, { recursive: true });

    const stamp = data.periodEnd.toISOString().slice(0, 10);
    const filename = `cannathera-${type.toLowerCase()}-${data.patient.patientRef ?? patientId}-${stamp}.pdf`;
    await fs.writeFile(path.join(dir, filename), buffer);

    const report = await this.prisma.report.create({
      data: {
        patientId,
        type,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        fileUrl: filename, // storage key, not a public path
        generatedAt: new Date(),
        coBranded: !!data.practice?.logoUrl,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requestedByUserId,
        action: 'REPORT_GENERATED',
        entityType: 'Report',
        entityId: report.id,
        metadata: { type, patientId },
      },
    });

    return { buffer, filename, reportId: report.id };
  }

  /** Report history for a patient (client's ">90 days" export requirement). */
  async history(patientId: string) {
    return this.prisma.report.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        periodStart: true,
        periodEnd: true,
        fileUrl: true,
        generatedAt: true,
      },
    });
  }

  /**
   * Streams a stored report after checking the caller is on the case. Re-renders
   * from live data if the file is missing (e.g. wiped storage), so a history
   * entry never becomes a dead link.
   */
  async fileById(userId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, patientId: true, fileUrl: true, type: true },
    });
    if (!report) throw new NotFoundException('REPORT_NOT_FOUND');
    await this.assertCanAccessPatient(userId, report.patientId);

    const fs = await import('fs/promises');
    const path = await import('path');
    // Basename only — a stored value can never escape the storage directory.
    const filename = path.basename(report.fileUrl ?? '');
    const full = path.join(REPORT_DIR, filename);

    let buffer: Buffer;
    try {
      if (!filename) throw new Error('NO_FILE');
      buffer = await fs.readFile(full);
    } catch {
      ({ buffer } = await this.generate(userId, report.patientId, report.type));
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REPORT_DOWNLOADED',
        entityType: 'Report',
        entityId: report.id,
      },
    });

    return { buffer, filename };
  }

  async patientIdOfUser(userId: string) {
    const p = await this.prisma.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!p) throw new NotFoundException('NO_PATIENT_PROFILE');
    return p.id;
  }
}
