import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrgType, Role, SubscriptionTier } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Roles, RolesGuard, SessionGuard } from '../auth/auth.guard';
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

  @Post('partners')
  async onboardPartner(@Body() dto: OnboardPartnerDto) {
    return this.adminService.onboardPartner(dto);
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
    @Body() dto: { monthlyPrice?: number; reviewCap?: number; isActive?: boolean },
  ) {
    return this.adminService.updatePricingPlan(id, dto);
  }

  @Patch('partners/:orgId/toggle-2fa')
  async togglePartner2FA(@Param('orgId') orgId: string) {
    return this.adminService.togglePartner2FA(orgId);
  }
}
