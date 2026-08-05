import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SubscriptionTier } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { SessionGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.guard';
import { StripeService } from './stripe.service';

class CreateCheckoutDto {
  @IsEnum(SubscriptionTier)
  planTier: SubscriptionTier;

  @IsString()
  @IsNotEmpty()
  successUrl: string;

  @IsString()
  @IsNotEmpty()
  cancelUrl: string;
}

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  @Post('checkout')
  @UseGuards(SessionGuard)
  async createCheckout(
    @Req() req: AuthedRequest,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.stripeService.createCheckoutSession(
      req.user.sub,
      dto.planTier,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  // Local development callback bypass to activate mock session locally.
  // Requires an authenticated session and is blocked entirely in production.
  @Get('simulate-success')
  @UseGuards(SessionGuard)
  async simulateSuccess(
    @Query('session_id') sessionId: string | undefined,
    @Query('orgId') orgId: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('tier') tier: SubscriptionTier,
    @Query('returnUrl') returnUrl: string | undefined,
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('NOT_AVAILABLE_IN_PRODUCTION');
    }

    const webOrigin =
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';

    if (sessionId && sessionId.startsWith('cs_')) {
      try {
        const session =
          await this.stripeService.retrieveCheckoutSession(sessionId);
        if (session) {
          const uId = session.metadata?.userId;
          const oId = session.metadata?.orgId;
          const t = session.metadata?.planTier as SubscriptionTier;
          if (oId && t) {
            await this.stripeService.fulfillSimulatedCheckout(oId, t);
            return res.redirect(
              `${webOrigin}${returnUrl || '/en/enterprise/billing'}?success=true`,
            );
          }
          if (uId && t) {
            await this.stripeService.fulfillPatientCheckout(uId, t);
            return res.redirect(
              `${webOrigin}${returnUrl || '/en/patient/plan'}?success=true`,
            );
          }
        }
      } catch {
        // Fall through
      }
    }

    if (orgId && tier) {
      await this.stripeService.fulfillSimulatedCheckout(orgId, tier);
      return res.redirect(
        `${webOrigin}${returnUrl || '/en/enterprise/billing'}?success=true`,
      );
    }
    if (userId && tier) {
      await this.stripeService.fulfillPatientCheckout(userId, tier);
      return res.redirect(
        `${webOrigin}${returnUrl || '/en/patient/plan'}?success=true`,
      );
    }
    return res.redirect(`${webOrigin}/en/login`);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: import('express').Request & { rawBody: Buffer },
  ) {
    return this.stripeService.handleWebhook(signature, req.rawBody);
  }
}
