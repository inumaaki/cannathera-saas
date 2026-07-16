import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionTier } from '@cannathera/db';
import Stripe from 'stripe';
import { NotificationsService } from '../notifications/notifications.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);
  private readonly isMock: boolean = true;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secret && secret !== 'mock' && secret.startsWith('sk_')) {
      this.stripe = new Stripe(secret, {
        apiVersion: '2025-01-27.acacia' as any,
      });
      this.isMock = false;
      this.logger.log('Stripe client initialized in real mode.');
    } else {
      this.logger.warn(
        'Stripe secret key missing or set to mock. Running in Simulated Mode.',
      );
    }
  }

  async createCheckoutSession(
    userId: string,
    planTier: SubscriptionTier,
    successUrl: string,
    cancelUrl: string,
  ) {
    // Resolve organization
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { org: true },
    });

    const email = (await this.prisma.user.findUnique({ where: { id: userId } }))?.email;

    if (this.isMock) {
      this.logger.log(
        `[MOCK] Creating checkout session for user ${userId} / plan ${planTier}`,
      );
      // Simulate Stripe checkout callback directly by adding success=true and tier query param
      const simulatedUrl = new URL(successUrl);
      simulatedUrl.searchParams.set('session_id', 'mock_sess_' + Math.random().toString(36).substr(2, 9));
      simulatedUrl.searchParams.set('tier', planTier);
      if (membership) {
        simulatedUrl.searchParams.set('orgId', membership.orgId);
      } else {
        simulatedUrl.searchParams.set('userId', userId);
      }
      return { url: simulatedUrl.toString(), isMock: true };
    }

    try {
      const plan = await this.prisma.pricingPlan.findFirst({
        where: { tier: planTier },
      });

      let priceAmount = 29.99;
      if (membership) {
        // B2B Partner Pricing
        if (planTier === SubscriptionTier.BASIC || planTier === SubscriptionTier.PLUS) {
          priceAmount = 449.00;
        } else if (planTier === SubscriptionTier.PREMIUM) {
          priceAmount = 899.00;
        } else if (planTier === SubscriptionTier.ENTERPRISE) {
          priceAmount = 1599.00;
        }
      } else {
        // Patient Pricing
        if (planTier === SubscriptionTier.BASIC) {
          priceAmount = 9.99;
        } else if (planTier === SubscriptionTier.PLUS) {
          priceAmount = 29.99;
        } else if (planTier === SubscriptionTier.PREMIUM) {
          priceAmount = 49.99;
        }
      }

      // Resolve Stripe price id or map dynamic items
      // (For real implementations, map tier to Stripe Price IDs)
      const session = await this.stripe!.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Cannathera ${planTier} Subscription`,
                description: `Access to professional features under the ${planTier} package.`,
              },
              unit_amount: priceAmount * 100, // in cents
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&tier=${planTier}`,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          orgId: membership?.orgId ?? '',
          planTier,
          planId: plan?.id ?? '',
        },
      });

      return { url: session.url, isMock: false };
    } catch (e) {
      this.logger.error('Stripe checkout error', e);
      throw new BadRequestException('STRIPE_CHECKOUT_FAILED');
    }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    if (this.isMock) return { status: 'mock_ignored' };

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe!.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret ?? '',
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata) {
        if (metadata.orgId && metadata.planTier) {
          this.logger.log(`Activating subscription for organization ${metadata.orgId}`);
          await this.fulfillOrganizationCheckout(metadata.orgId, metadata.planTier as SubscriptionTier);
        } else if (metadata.userId && metadata.planTier) {
          this.logger.log(`Upgrading package tier for patient ${metadata.userId} to ${metadata.planTier}`);
          await this.fulfillPatientCheckout(metadata.userId, metadata.planTier as SubscriptionTier);
        }
      }
    }

    return { received: true };
  }

  async fulfillPatientCheckout(userId: string, tier: SubscriptionTier) {
    await this.prisma.patientProfile.update({
      where: { userId },
      data: { packageTier: tier },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      // 1. Publish live dashboard notification
      this.notifications.publish({
        target: { userId },
        kind: 'report_ready',
        severity: 'info',
        title: 'Subscription Activated',
        text: `Your ${tier} package subscription has been successfully activated.`,
        href: '/patient/plan',
      });

      // 2. Send transaction success email
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const greetingName = user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email;
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          await transporter.sendMail({
            from: process.env.SMTP_FROM ?? '"Cannathera" <no-reply@cannathera.de>',
            to: user.email,
            subject: 'Subscription Activated - Cannathera',
            text: `Hello ${greetingName},\n\nYour ${tier} package subscription has been successfully activated on your Cannathera account.\n\nBest regards,\nYour Cannathera Team`,
            html: `
              <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #0d3a2e 0%, #164e43 100%); padding: 35px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; font-family: 'Outfit', sans-serif;">CANNATHERA</h1>
                    <p style="color: #3cd3ad; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Subscription Active</p>
                  </div>
                  <!-- Body -->
                  <div style="padding: 40px 30px; line-height: 1.6; color: #334155;">
                    <h2 style="color: #0d3a2e; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${greetingName},</h2>
                    <p style="font-size: 15px; margin-bottom: 20px;">We are pleased to inform you that your subscription has been successfully activated.</p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                      <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Active Plan Tier</p>
                      <h3 style="margin: 5px 0 0 0; color: #0d3a2e; font-size: 26px; font-weight: 800;">${tier}</h3>
                    </div>

                    <p style="font-size: 15px;">You now have full access to your personalized portal, patient companion tools, and reports dashboard.</p>

                    <div style="text-align: center; margin: 35px 0 20px 0;">
                      <a href="http://localhost:3000/en/patient/plan" style="background-color: #0d3a2e; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(13, 58, 46, 0.15); transition: background-color 0.2s;">Go to Dashboard</a>
                    </div>
                  </div>
                  <!-- Footer -->
                  <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0;">&copy; 2026 Cannathera GmbH. All rights reserved.</p>
                    <p style="margin: 5px 0 0 0;">This is an automated operational message. Please do not reply.</p>
                  </div>
                </div>
              </div>
            `,
          });
          this.logger.log(`Success email sent to patient ${user.email}`);
        } catch (err) {
          this.logger.error(`Failed to send success email to patient ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // Helper method for simulated activation bypass (when testing mock flow)
  async fulfillSimulatedCheckout(orgId: string, planTier: SubscriptionTier) {
    await this.fulfillOrganizationCheckout(orgId, planTier);
  }

  async fulfillOrganizationCheckout(orgId: string, planTier: SubscriptionTier) {
    const plan = await this.prisma.pricingPlan.findFirst({
      where: { tier: planTier },
    });
    if (!plan) return;

    // Check if subscription exists, update/create active
    const existing = await this.prisma.subscription.findFirst({
      where: { orgId },
    });

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          planId: plan.id,
        },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          orgId,
          planId: plan.id,
          isActive: true,
        },
      });
    }

    // Reactivate user accounts in organization
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { memberships: true },
    });

    if (org) {
      // 1. Publish live dashboard notification to the organization members
      this.notifications.publish({
        target: { orgId },
        kind: 'report_ready',
        severity: 'info',
        title: 'Partner License Activated',
        text: `Your ${planTier} license plan is now active.`,
        href: '/enterprise/billing',
      });

      // 2. Loop through members to reactivate and send email
      for (const m of org.memberships) {
        const updatedUser = await this.prisma.user.update({
          where: { id: m.userId },
          data: { isActive: true },
        });

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            const greetingName = updatedUser.firstName ? `${updatedUser.firstName} ${updatedUser.lastName ?? ''}`.trim() : updatedUser.email;
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          await transporter.sendMail({
            from: process.env.SMTP_FROM ?? '"Cannathera" <no-reply@cannathera.de>',
            to: updatedUser.email,
            subject: 'License Activated - Cannathera',
            text: `Hello ${greetingName},\n\nYour organization license (${planTier} plan) has been successfully activated on Cannathera.\n\nBest regards,\nYour Cannathera Team`,
            html: `
              <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <div style="background: linear-gradient(135deg, #0d3a2e 0%, #164e43 100%); padding: 35px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; font-family: 'Outfit', sans-serif;">CANNATHERA</h1>
                    <p style="color: #3cd3ad; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">License Active</p>
                  </div>
                  <!-- Body -->
                  <div style="padding: 40px 30px; line-height: 1.6; color: #334155;">
                    <h2 style="color: #0d3a2e; margin-top: 0; font-size: 20px; font-weight: 700;">Hello ${greetingName},</h2>
                    <p style="font-size: 15px; margin-bottom: 20px;">Your organization's partner license has been successfully activated.</p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                      <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Active Partner Plan</p>
                      <h3 style="margin: 5px 0 0 0; color: #0d3a2e; font-size: 26px; font-weight: 800;">${planTier}</h3>
                    </div>

                    <p style="font-size: 15px;">Your partner dashboard is fully reactivated. You can manage patient lists, compliance forms, and download monthly legally-compliant reports.</p>

                    <div style="text-align: center; margin: 35px 0 20px 0;">
                      <a href="http://localhost:3000/en/enterprise/billing" style="background-color: #0d3a2e; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(13, 58, 46, 0.15); transition: background-color 0.2s;">Go to Billing Panel</a>
                    </div>
                  </div>
                  <!-- Footer -->
                  <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0;">&copy; 2026 Cannathera GmbH. All rights reserved.</p>
                    <p style="margin: 5px 0 0 0;">This is an automated operational message. Please do not reply.</p>
                  </div>
                </div>
              </div>
            `,
          });
            this.logger.log(`Success email sent to org member ${updatedUser.email}`);
          } catch (err) {
            this.logger.error(`Failed to send success email to B2B member ${updatedUser.email}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
    }
  }

  async retrieveCheckoutSession(sessionId: string) {
    if (this.isMock || !this.stripe) return null;
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
