import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare const WEBHOOK_EVENTS: readonly ["patient.created", "report.finalized", "alert.triggered", "session.updated"];
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export declare class IntegrationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private orgOf;
    private orgOfAdmin;
    private hash;
    listKeys(userId: string): Promise<{
        id: string;
        name: string;
        masked: string;
        scopes: string[];
        createdAt: Date;
        lastUsedAt: Date | null;
        revoked: boolean;
    }[]>;
    createKey(userId: string, name: string, scopes: string[], live?: boolean): Promise<{
        id: string;
        name: string;
        scopes: string[];
        key: string;
    }>;
    revokeKey(userId: string, keyId: string): Promise<{
        ok: boolean;
    }>;
    verifyKey(plaintext: string): Promise<{
        orgId: string;
        scopes: string[];
    } | null>;
    listWebhooks(userId: string): Promise<{
        id: string;
        url: string;
        events: string[];
        active: boolean;
        createdAt: Date;
        successRate: number | null;
    }[]>;
    createWebhook(userId: string, url: string, events: string[]): Promise<{
        id: string;
        url: string;
        events: string[];
        secret: string;
    }>;
    toggleWebhook(userId: string, id: string, active: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        url: string;
        active: boolean;
        events: string[];
        secret: string;
    }>;
    deleteWebhook(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
    deliveries(userId: string, limit?: number): Promise<{
        id: string;
        event: string;
        url: string;
        statusCode: number | null;
        ok: boolean;
        error: string | null;
        attempts: number;
        createdAt: Date;
    }[]>;
    retry(userId: string, deliveryId: string): Promise<{
        error: string | null;
        id: string;
        createdAt: Date;
        endpointId: string;
        event: string;
        payload: Prisma.JsonValue;
        statusCode: number | null;
        ok: boolean;
        attempts: number;
        deliveredAt: Date | null;
    }>;
    private send;
    dispatch(orgIds: string[], event: WebhookEvent, payload: Prisma.JsonObject): Promise<void>;
    status(userId: string): Promise<{
        zoom: {
            status: string;
            sessions: number;
        };
        zapier: {
            status: string;
            hooks: number;
        };
        webhooks: {
            status: string;
            active: number;
            successRate: number | null;
        };
        restApi: {
            status: string;
            version: string;
            activeKeys: number;
        };
    }>;
}
