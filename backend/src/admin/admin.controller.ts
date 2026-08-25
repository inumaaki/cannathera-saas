import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrgType, Role, SubscriptionTier } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Roles, RolesGuard, SessionGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { AdminService } from './admin.service';

class OnboardPartnerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(OrgType)
  type: OrgType;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @IsEnum(SubscriptionTier)
  planTier: SubscriptionTier;
}

class PilotPricingDto {
  // The pilot price in EUR. null clears the override (revert to plan price);
  // 0 is a valid value meaning "free".
  @ValidateIf((o) => o.price !== null)
  @IsInt()
  @Min(0)
  price: number | null;

  // Optional ISO date string for a trial/agreement end date. null = no expiry.
  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;
}

@Controller('admin')
@UseGuards(SessionGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('partners')
  async listPartners() {
    return this.adminService.listPartners();
  }

  @Patch('partners/:orgId/toggle')
  async togglePartner(@Param('orgId') orgId: string) {
    return this.adminService.togglePartner(orgId);
  }

  @Patch('partners/:orgId/pilot-pricing')
  async setPilotPricing(
    @Param('orgId') orgId: string,
    @Body() dto: PilotPricingDto,
  ) {
    return this.adminService.setPilotPricing(orgId, dto);
  }

  @Post('partners/:orgId/temporary-password')
  async issueTemporaryPassword(@Param('orgId') orgId: string) {
    return this.adminService.issueTemporaryPassword(orgId);
  }

  @Post('partners')
  async onboardPartner(@Body() dto: OnboardPartnerDto) {
    return this.adminService.onboardPartner(dto);
  }

  @Get('red-flags')
  async listRedFlags(@Query('view') view?: string) {
    const v = view === 'reviewed' || view === 'all' ? view : 'unreviewed';
    return this.adminService.listRedFlags(v);
  }

  @Patch('red-flags/:id/acknowledge')
  async acknowledgeRedFlag(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
  ) {
    return this.adminService.acknowledgeRedFlag(user.sub, id);
  }

  @Get('audit-logs')
  async listAuditLogs() {
    return this.adminService.listAuditLogs();
  }

  @Get('users')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:userId/toggle')
  async toggleUser(@Param('userId') userId: string) {
    return this.adminService.toggleUser(userId);
  }

  @Get('pricing-plans')
  async listPricingPlans() {
    return this.adminService.listPricingPlans();
  }

  @Patch('pricing-plans/:id')
  async updatePricingPlan(
    @Param('id') id: string,
    @Body()
    dto: { monthlyPrice?: number; reviewCap?: number; isActive?: boolean },
  ) {
    return this.adminService.updatePricingPlan(id, dto);
  }

  @Patch('partners/:orgId/toggle-2fa')
  async togglePartner2FA(@Param('orgId') orgId: string) {
    return this.adminService.togglePartner2FA(orgId);
  }

  // ── Partner Codes ────────────────────────────────────────────────────────────

  @Get('partner-codes')
  async listPartnerCodes() {
    return this.adminService.listPartnerCodes();
  }

  @Post('partner-codes')
  async createPartnerCode(
    @Body() dto: { orgId: string; label?: string; maxUses?: number },
  ) {
    return this.adminService.createPartnerCode(dto);
  }

  @Patch('partner-codes/:id/toggle')
  async togglePartnerCode(@Param('id') id: string) {
    return this.adminService.togglePartnerCode(id);
  }
}
