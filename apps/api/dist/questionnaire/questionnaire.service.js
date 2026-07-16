"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const shared_1 = require("@cannathera/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let QuestionnaireService = class QuestionnaireService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(locale) {
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
            title: q.title,
            description: q.description,
            version: q.versions[0]?.version,
        }));
    }
    async structure(key, locale) {
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
        if (!version)
            throw new common_1.NotFoundException('QUESTIONNAIRE_NOT_FOUND');
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
    async submit(userId, key, answers, locale) {
        const profile = await this.prisma.patientProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.BadRequestException('NO_PATIENT_PROFILE');
        const version = await this.prisma.questionnaireVersion.findFirst({
            where: { questionnaire: { key, isActive: true }, isPublished: true },
            orderBy: { version: 'desc' },
            include: {
                sections: { include: { questions: true } },
                redFlagRules: { where: { isActive: true } },
            },
        });
        if (!version)
            throw new common_1.NotFoundException('QUESTIONNAIRE_NOT_FOUND');
        const questions = version.sections.flatMap((s) => s.questions);
        const byKey = new Map(questions.map((q) => [q.key, q]));
        for (const q of questions) {
            const visible = !q.showIf || (0, shared_1.evaluateCondition)(q.showIf, answers);
            const val = answers[q.key];
            if (q.required && visible && (val === undefined || val === null || val === '')) {
                throw new common_1.BadRequestException(`MISSING_ANSWER:${q.key}`);
            }
        }
        const submission = await this.prisma.submission.create({
            data: {
                patientId: profile.id,
                versionId: version.id,
                status: client_1.SubmissionStatus.SUBMITTED,
                locale,
                submittedAt: new Date(),
                answers: {
                    create: Object.entries(answers)
                        .filter(([k]) => byKey.has(k))
                        .map(([k, value]) => ({
                        questionId: byKey.get(k).id,
                        value: value,
                    })),
                },
            },
        });
        const hits = version.redFlagRules.filter((r) => (0, shared_1.evaluateCondition)(r.condition, answers));
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
    async mySubmissions(userId) {
        const profile = await this.prisma.patientProfile.findUnique({ where: { userId } });
        if (!profile)
            return [];
        return this.prisma.submission.findMany({
            where: { patientId: profile.id, status: client_1.SubmissionStatus.SUBMITTED },
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
};
exports.QuestionnaireService = QuestionnaireService;
exports.QuestionnaireService = QuestionnaireService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionnaireService);
//# sourceMappingURL=questionnaire.service.js.map