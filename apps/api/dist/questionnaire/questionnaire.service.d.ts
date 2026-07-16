import { Locale, Prisma } from '@prisma/client';
import { type AnswerMap } from '@cannathera/shared';
import { PrismaService } from '../prisma/prisma.service';
export declare class QuestionnaireService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(locale: Locale): Promise<{
        key: string;
        title: string;
        description: string | null;
        version: number;
    }[]>;
    structure(key: string, locale: Locale): Promise<{
        key: string;
        versionId: string;
        version: number;
        title: string;
        description: string | null;
        sections: {
            key: string;
            title: string;
            questions: {
                key: string;
                type: import("@prisma/client").$Enums.QuestionType;
                label: string;
                helpText: string | null;
                required: boolean;
                config: Prisma.JsonValue;
                showIf: Prisma.JsonValue;
                options: {
                    value: string;
                    label: string;
                }[];
            }[];
        }[];
    }>;
    submit(userId: string, key: string, answers: AnswerMap, locale: Locale): Promise<{
        submissionId: string;
        redFlags: {
            severity: import("@prisma/client").$Enums.RedFlagSeverity;
        }[];
    }>;
    mySubmissions(userId: string): Promise<{
        id: string;
        version: {
            questionnaire: {
                key: string;
                title: string;
            };
            version: number;
        };
        submittedAt: Date | null;
    }[]>;
}
