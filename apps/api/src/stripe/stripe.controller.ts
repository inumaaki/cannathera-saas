import {
  Body,
  Controller,
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
import { SubscriptionTier } from '@cannathera/db';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
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
  constructor(private readonly stripeService: StripeService) {}

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

  // Local development callback bypass to activate mock session locally
  @Get('simulate-success')
  async simulateSuccess(
    @Query('session_id') sessionId: string | undefined,
    @Query('orgId') orgId: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('tier') tier: SubscriptionTier,
    @Res() res: Response,
  ) {
    if (sessionId && sessionId.startsWith('cs_')) {
      try {
        const session = await this.stripeService.retrieveCheckoutSession(sessionId);
        if (session) {
          const uId = session.metadata?.userId;
          const oId = session.metadata?.orgId;
          const t = session.metadata?.planTier as SubscriptionTier;
          if (oId && t) {
            await this.stripeService.fulfillSimulatedCheckout(oId, t);
            return res.redirect('http://localhost:3000/en/enterprise/billing?success=true');
          }
          if (uId && t) {
            await this.stripeService.fulfillPatientCheckout(uId, t);
            return res.redirect('http://localhost:3000/en/patient/plan?success=true');
          }
        }
      } catch (err) {
        // Fall through
      }
    }

    if (orgId && tier) {
      await this.stripeService.fulfillSimulatedCheckout(orgId, tier);
      return res.redirect('http://localhost:3000/en/enterprise/billing?success=true');
    }
    if (userId && tier) {
      await this.stripeService.fulfillPatientCheckout(userId, tier);
      return res.redirect('http://localhost:3000/en/patient/plan?success=true');
    }
    return res.redirect('http://localhost:3000/en/login');
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any, // Raw Express Request with buffer body
  ) {
    return this.stripeService.handleWebhook(signature, req.body);
  }
}
