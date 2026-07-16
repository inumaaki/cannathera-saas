import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsHexColor,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser, Roles, RolesGuard, SessionGuard, SubscriptionGuard } from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { BillingService } from './billing.service';
import { EnterpriseService } from './enterprise.service';
import { IntegrationsService, WEBHOOK_EVENTS } from './integrations.service';
import { SettingsService } from './settings.service';

class BrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  fontFamily?: string;
}

class AddPartnerDto {
  @IsString()
  orgId!: string;
}

class CreateKeyDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['READ', 'WRITE', 'ALL_ACCESS'], { each: true })
  scopes!: string[];

  @IsOptional()
  @IsBoolean()
  live?: boolean;
}

class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  @MaxLength(300)
  url!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(WEBHOOK_EVENTS, { each: true })
  events!: string[];
}

class ToggleWebhookDto {
  @IsBoolean()
  active!: boolean;
}

class InviteDto {
  @IsString()
  @MaxLength(160)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsIn(['SUPER_ADMIN', 'SUPPORT', 'BILLING', 'VIEWER'])
  orgRole!: string;
}

class UpdateMemberDto {
  @IsIn(['SUPER_ADMIN', 'SUPPORT', 'BILLING', 'VIEWER'])
  orgRole!: string;
}

class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  mandatory2fa?: boolean;

  @IsOptional()
  @IsInt()
  @Min(5)
  sessionTimeoutMin?: number;
}

@Controller('enterprise')
@UseGuards(SessionGuard, RolesGuard, SubscriptionGuard)
@Roles(Role.ENTERPRISE)
export class EnterpriseController {
  constructor(
    private readonly enterprise: EnterpriseService,
    private readonly integrations: IntegrationsService,
    private readonly billing: BillingService,
    private readonly settings: SettingsService,
  ) {}

  @Get('overview')
  overview(@CurrentUser() user: SessionPayload) {
    return this.enterprise.overview(user.sub);
  }

  @Get('partners')
  partners(@CurrentUser() user: SessionPayload, @Query('type') type?: string) {
    return this.enterprise.partners(user.sub, type);
  }

  // Must stay above `partners/:id` so the literal path is not read as an id.
  @Get('partners/available')
  available(@CurrentUser() user: SessionPayload) {
    return this.enterprise.availablePartners(user.sub);
  }

  @Get('partners/:id')
  partnerDetail(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.enterprise.partnerDetail(user.sub, id);
  }

  @Post('partners')
  addPartner(@CurrentUser() user: SessionPayload, @Body() dto: AddPartnerDto) {
    return this.enterprise.addPartner(user.sub, dto.orgId);
  }

  @Delete('partners/:id')
  removePartner(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.enterprise.removePartner(user.sub, id);
  }

  @Patch('branding')
  updateBranding(@CurrentUser() user: SessionPayload, @Body() dto: BrandingDto) {
    return this.enterprise.updateBranding(user.sub, dto);
  }

  @Post('branding/logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadLogo(
    @CurrentUser() user: SessionPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.enterprise.saveLogo(user.sub, file);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cannathera-netzwerk.csv"')
  exportCsv(@CurrentUser() user: SessionPayload) {
    return this.enterprise.exportCsv(user.sub);
  }

  // ------------------------------------------------ API & Integrations (8.4) ---
  @Get('integrations/status')
  integrationStatus(@CurrentUser() user: SessionPayload) {
    return this.integrations.status(user.sub);
  }

  @Get('integrations/keys')
  listKeys(@CurrentUser() user: SessionPayload) {
    return this.integrations.listKeys(user.sub);
  }

  @Post('integrations/keys')
  createKey(@CurrentUser() user: SessionPayload, @Body() dto: CreateKeyDto) {
    return this.integrations.createKey(user.sub, dto.name, dto.scopes, dto.live ?? true);
  }

  @Delete('integrations/keys/:id')
  revokeKey(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.integrations.revokeKey(user.sub, id);
  }

  @Get('integrations/webhooks')
  listWebhooks(@CurrentUser() user: SessionPayload) {
    return this.integrations.listWebhooks(user.sub);
  }

  @Post('integrations/webhooks')
  createWebhook(@CurrentUser() user: SessionPayload, @Body() dto: CreateWebhookDto) {
    return this.integrations.createWebhook(user.sub, dto.url, dto.events);
  }

  @Patch('integrations/webhooks/:id')
  toggleWebhook(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: ToggleWebhookDto,
  ) {
    return this.integrations.toggleWebhook(user.sub, id, dto.active);
  }

  @Delete('integrations/webhooks/:id')
  deleteWebhook(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.integrations.deleteWebhook(user.sub, id);
  }

  @Get('integrations/deliveries')
  deliveries(@CurrentUser() user: SessionPayload, @Query('limit') limit?: string) {
    return this.integrations.deliveries(user.sub, Number(limit) || 25);
  }

  @Post('integrations/deliveries/:id/retry')
  retryDelivery(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.integrations.retry(user.sub, id);
  }

  // ---------------------------------------------------- Billing & Usage (8.2) ---
  @Get('billing/usage')
  usage(@CurrentUser() user: SessionPayload) {
    return this.billing.usage(user.sub);
  }

  @Get('billing/invoices')
  invoices(@CurrentUser() user: SessionPayload, @Query('status') status?: string) {
    return this.billing.invoices(user.sub, status);
  }

  @Post('billing/invoices')
  generateInvoice(@CurrentUser() user: SessionPayload) {
    return this.billing.generateInvoice(user.sub);
  }

  @Get('billing/invoices/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cannathera-rechnungen.csv"')
  exportInvoices(@CurrentUser() user: SessionPayload) {
    return this.billing.exportInvoicesCsv(user.sub);
  }

  // ------------------------------------------- Team (8.7) + Settings (8.8) ---
  @Get('team')
  team(@CurrentUser() user: SessionPayload) {
    return this.settings.team(user.sub);
  }

  @Post('team')
  invite(@CurrentUser() user: SessionPayload, @Body() dto: InviteDto) {
    return this.settings.invite(user.sub, dto);
  }

  @Patch('team/:id')
  updateMember(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.settings.updateMember(user.sub, id, dto.orgRole);
  }

  @Delete('team/:id')
  removeMember(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.settings.removeMember(user.sub, id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: SessionPayload) {
    return this.settings.settings(user.sub);
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: SessionPayload, @Body() dto: UpdateSettingsDto) {
    return this.settings.updateSettings(user.sub, dto);
  }

  @Get('settings/audit')
  audit(
    @CurrentUser() user: SessionPayload,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.settings.auditLog(user.sub, Number(limit) || 25, action);
  }
}
