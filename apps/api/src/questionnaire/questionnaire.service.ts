import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Locale, Prisma, SubmissionStatus } from '@cannathera/db';
import { evaluateCondition, type AnswerMap, type Condition } from '@cannathera/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  /** Published questionnaires (patient-facing list). */
  async list(locale: Locale) {
    const questionnaires = await this.prisma.questionnaire.findMany({
      where: { isActive: true, versions: { some: { isPublished: true } } },
      include: {
        versions: {
          where: { isPublished: true },
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, version: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return questionnaires.map((q) => ({
      key: q.key,
      title: q.title, // canonical German; per-locale titles live on questions
      description: q.description,
      version: q.versions[0]?.version,
    }));
  }

  /** Full structure of the latest published version, resolved for a locale.
      Missing translations fall back to canonical German. */
  async structure(key: string, locale: Locale) {
    const version = await this.prisma.questionnaireVersion.findFirst({
      where: { questionnaire: { key, isActive: true }, isPublished: true },
      orderBy: { version: 'desc' },
      include: {
        questionnaire: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: { orderBy: { order: 'asc' }, include: { translations: true } },
                translations: true,
              },
            },
          },
        },
      },
    });
    if (!version) throw new NotFoundException('QUESTIONNAIRE_NOT_FOUND');

    return {
      key,
      versionId: version.id,
      version: version.version,
      title: version.questionnaire.title,
      description: version.questionnaire.description,
      sections: version.sections.map((s) => ({
        key: s.key,
        title: s.title,
        questions: s.questions.map((q) => {
          const tr = q.translations.find((t) => t.locale === locale);
          return {
            key: q.key,
            type: q.type,
            label: tr?.label ?? q.label,
            helpText: tr?.helpText ?? q.helpText,
            required: q.required,
            config: q.config,
            showIf: q.showIf,
            options: q.options.map((o) => ({
              value: o.value,
              label: o.translations.find((t) => t.locale === locale)?.label ?? o.label,
            })),
          };
        }),
      })),
    };
  }

  /** Store a submission and evaluate red-flag rules. */
  async submit(userId: string, key: string, answers: AnswerMap, locale: Locale) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!profile) throw new BadRequestException('NO_PATIENT_PROFILE');

    const version = await this.prisma.questionnaireVersion.findFirst({
      where: { questionnaire: { key, isActive: true }, isPublished: true },
      orderBy: { version: 'desc' },
      include: {
        sections: { include: { questions: true } },
        redFlagRules: { where: { isActive: true } },
      },
    });
    if (!version) throw new NotFoundException('QUESTIONNAIRE_NOT_FOUND');

    const questions = version.sections.flatMap((s) => s.questions);
    const byKey = new Map(questions.map((q) => [q.key, q]));

    // Required check — only for questions currently visible given the answers.
    for (const q of questions) {
      const visible =
        !q.showIf || evaluateCondition(q.showIf as unknown as Condition, answers);
      const val = answers[q.key];
      if (q.required && visible && (val === undefined || val === null || val === '')) {
        throw new BadRequestException(`MISSING_ANSWER:${q.key}`);
      }
    }

    const submission = await this.prisma.submission.create({
      data: {
        patientId: profile.id,
        versionId: version.id,
        status: SubmissionStatus.SUBMITTED,
        locale,
        submittedAt: new Date(),
        answers: {
          create: Object.entries(answers)
            .filter(([k]) => byKey.has(k))
            .map(([k, value]) => ({
              questionId: byKey.get(k)!.id,
              value: value as Prisma.InputJsonValue,
            })),
        },
      },
    });

    // Red-flag evaluation.
    const hits = version.redFlagRules.filter((r) =>
      evaluateCondition(r.condition as unknown as Condition, answers),
    );
    if (hits.length) {
      await this.prisma.redFlagHit.createMany({
        data: hits.map((r) => ({
          submissionId: submission.id,
          ruleId: r.id,
          patientId: profile.id,
          severity: r.severity,
          message: r.message,
        })),
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SUBMISSION_CREATED',
        entityType: 'Submission',
        entityId: submission.id,
        metadata: { questionnaire: key, redFlags: hits.length },
      },
    });

    return {
      submissionId: submission.id,
      redFlags: hits.map((h) => ({ severity: h.severity })),
    };
  }

  /** Patient's own submission history. */
  async mySubmissions(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId } });
    if (!profile) return [];
    return this.prisma.submission.findMany({
      where: { patientId: profile.id, status: SubmissionStatus.SUBMITTED },
      orderBy: { submittedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        submittedAt: true,
        version: {
          select: { version: true, questionnaire: { select: { key: true, title: true } } },
        },
      },
    });
  }
}
