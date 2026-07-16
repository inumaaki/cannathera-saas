import type { Response } from 'express';
import { SubscriptionTier } from '@prisma/client';
import type { AuthedRequest } from '../auth/auth.guard';
import { StripeService } from './stripe.service';
declare class CreateCheckoutDto {
    planTier: SubscriptionTier;
    successUrl: string;
    cancelUrl: string;
}
export declare class StripeController {
    private readonly stripeService;
    constructor(stripeService: StripeService);
    createCheckout(req: AuthedRequest, dto: CreateCheckoutDto): Promise<{
        url: string | null;
        isMock: boolean;
    }>;
    simulateSuccess(sessionId: string | undefined, orgId: string | undefined, userId: string | undefined, tier: SubscriptionTier, res: Response): Promise<void>;
    handleWebhook(signature: string, req: any): Promise<{
        status: string;
        received?: undefined;
    } | {
        received: boolean;
        status?: undefined;
    }>;
}
export {};
