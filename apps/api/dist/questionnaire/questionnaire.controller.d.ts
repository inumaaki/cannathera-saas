import type { SessionPayload } from '../auth/auth.service';
import { QuestionnaireService } from './questionnaire.service';
declare class SubmitDto {
    answers: Record<string, unknown>;
}
export declare class QuestionnaireController {
    private readonly service;
    constructor(service: QuestionnaireService);
    list(locale?: string): Promise<{
        key: string;
        title: string;
        description: string | null;
        version: number;
    }[]>;
    mySubmissions(user: SessionPayload): Promise<{
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
    structure(key: string, locale?: string): Promise<{
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
                config: import("@prisma/client/runtime/library").JsonValue;
                showIf: import("@prisma/client/runtime/library").JsonValue;
                options: {
                    value: string;
                    label: string;
                }[];
            }[];
        }[];
    }>;
    submit(user: SessionPayload, key: string, dto: SubmitDto, locale?: string): Promise<{
        submissionId: string;
        redFlags: {
            severity: import("@prisma/client").$Enums.RedFlagSeverity;
        }[];
    }>;
}
export {};
