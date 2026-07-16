import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
export declare class StripeService {
    private readonly config;
    private readonly prisma;
    private readonly notifications;
    private readonly stripe;
    private readonly logger;
    private readonly isMock;
    constructor(config: ConfigService, prisma: PrismaService, notifications: NotificationsService);
    createCheckoutSession(userId: string, planTier: SubscriptionTier, successUrl: string, cancelUrl: string): Promise<{
        url: string | null;
        isMock: boolean;
    }>;
    handleWebhook(signature: string, rawBody: Buffer): Promise<{
        status: string;
        received?: undefined;
    } | {
        received: boolean;
        status?: undefined;
    }>;
    fulfillPatientCheckout(userId: string, tier: SubscriptionTier): Promise<void>;
    fulfillSimulatedCheckout(orgId: string, planTier: SubscriptionTier): Promise<void>;
    fulfillOrganizationCheckout(orgId: string, planTier: SubscriptionTier): Promise<void>;
    retrieveCheckoutSession(sessionId: string): Promise<import("node_modules/stripe/cjs/lib").Response<import("node_modules/stripe/cjs/resources/Checkout").Session> | null>;
}
