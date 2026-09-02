import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CurrentUser,
  Roles,
  RolesGuard,
  SessionGuard,
  SubscriptionGuard,
} from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { PharmacyService } from './pharmacy.service';

const CATEGORIES = ['Flower', 'Oil', 'Extract', 'Capsule'] as const;
const UNITS = ['g', 'ml', 'Stk.'] as const;
const STOCK_STATUS = ['all', 'inStock', 'low', 'critical', 'pending'] as const;
const SORTS = ['name', 'sku', 'stock', 'category'] as const;

class CreateItemDto {
  @IsString()
  @MaxLength(40)
  sku!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsIn(CATEGORIES)
  category!: string;

  @IsNumber()
  @Min(0)
  thc!: number;

  @IsNumber()
  @Min(0)
  cbd!: number;

  @IsIn(UNITS)
  unit!: string;

  @IsNumber()
  @Min(0)
  stockLevel!: number;

  @IsNumber()
  @Min(0)
  safetyThreshold!: number;
}

class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  thc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cbd?: number;

  @IsOptional()
  @IsIn(UNITS)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyThreshold?: number;
}

class QuantityDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  qty?: number;
}

class CompleteReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

class CreateInventoryTransactionDto {
  @IsString()
  @IsIn(['INBOUND', 'OUTFLOW'])
  type!: string;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  batch?: string;

  @IsOptional()
  @IsString()
  prescriptionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class UpdatePharmacySettingsDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  productFocus?: string;
}

class UpdatePrescriptionStatusDto {
  @IsString()
  @IsIn(['RECEIVED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
  status!: any;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

class UploadAiPrescriptionDto {
  @IsString()
  fileUrl!: string;
}

@Controller('pharmacy')
@UseGuards(SessionGuard, RolesGuard, SubscriptionGuard)
@Roles(Role.PHARMACY)
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyService) {}

  @Post('prescriptions/upload')
  uploadAiPrescription(
    @CurrentUser() user: SessionPayload,
    @Body() dto: UploadAiPrescriptionDto,
  ) {
    return this.pharmacy.uploadAiPrescription(user.sub, dto.fileUrl);
  }

  @Get('prescriptions')
  prescriptions(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.prescriptions(user.sub);
  }

  @Patch('prescriptions/:id')
  updatePrescriptionStatus(
    @Param('id') id: string,
    @CurrentUser() user: SessionPayload,
    @Body() dto: UpdatePrescriptionStatusDto,
  ) {
    return this.pharmacy.updatePrescriptionStatus(
      user.sub,
      id,
      dto.status,
      dto.rejectionReason,
    );
  }

  @Post('prescriptions/:id/process')
  processPrescription(
    @Param('id') id: string,
    @CurrentUser() user: SessionPayload,
  ) {
    return this.pharmacy.processPrescription(user.sub, id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.getSettings(user.sub);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: SessionPayload,
    @Body() dto: UpdatePharmacySettingsDto,
  ) {
    return this.pharmacy.updateSettings(user.sub, dto);
  }

  @Get('overview')
  overview(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.overview(user.sub);
  }

  @Get('reviews')
  reviews(
    @CurrentUser() user: SessionPayload,
    @Query('filter') filter?: string,
  ) {
    const f = ['overdue', 'dueSoon', 'onTrack', 'flagged'].includes(
      filter ?? '',
    )
      ? filter!
      : 'all';
    return this.pharmacy.reviews(user.sub, f);
  }

  // Must stay above `reviews/:patientId` or the param route swallows "export".
  @Get('reviews/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="cannathera-reviews.csv"',
  )
  exportReviews(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.exportReviewsCsv(user.sub);
  }

  @Get('reviews/:patientId')
  reviewSummary(
    @CurrentUser() user: SessionPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.pharmacy.reviewSummary(user.sub, patientId);
  }

  @Post('reviews/:patientId/complete')
  completeReview(
    @CurrentUser() user: SessionPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CompleteReviewDto,
  ) {
    return this.pharmacy.completeReview(user.sub, patientId, dto.note);
  }

  @Get('logs')
  logs(
    @CurrentUser() user: SessionPayload,
    @Query('days') days?: string,
    @Query('q') q?: string,
    @Query('flagged') flagged?: string,
  ) {
    return this.pharmacy.treatmentLogs(user.sub, {
      days: Math.min(365, Math.max(1, Number(days) || 30)),
      q,
      flaggedOnly: flagged === '1',
    });
  }

  @Get('logs/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="cannathera-behandlungslogs.csv"',
  )
  exportLogs(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.exportLogsCsv(user.sub);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.analytics(user.sub);
  }

  @Get('analytics/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="cannathera-analytik.csv"',
  )
  exportAnalytics(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.exportAnalyticsCsv(user.sub);
  }

  @Get('inventory/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="cannathera-warenbestand.csv"',
  )
  exportInventory(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.exportInventoryCsv(user.sub);
  }

  @Get('inventory')
  inventory(
    @CurrentUser() user: SessionPayload,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.pharmacy.inventory(user.sub, {
      category,
      q,
      status: STOCK_STATUS.includes(status as (typeof STOCK_STATUS)[number])
        ? status
        : 'all',
      sort: SORTS.includes(sort as (typeof SORTS)[number]) ? sort : 'name',
    });
  }

  @Post('inventory')
  createItem(@CurrentUser() user: SessionPayload, @Body() dto: CreateItemDto) {
    return this.pharmacy.createItem(user.sub, dto);
  }

  @Get('inventory/:id/history')
  itemHistory(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.pharmacy.itemHistory(user.sub, id);
  }

  @Post('inventory/:id/transactions')
  addInventoryTransaction(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: CreateInventoryTransactionDto,
  ) {
    return this.pharmacy.addInventoryTransaction(user.sub, id, dto);
  }

  @Patch('inventory/:id')
  updateItem(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.pharmacy.updateItem(user.sub, id, dto);
  }

  @Post('inventory/:id/reorder')
  reorder(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: QuantityDto,
  ) {
    return this.pharmacy.reorderItem(user.sub, id, dto.qty);
  }

  @Post('inventory/:id/receive')
  receive(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: QuantityDto,
  ) {
    return this.pharmacy.receiveItem(user.sub, id, dto.qty);
  }

  @Post('inventory/:id/cancel-order')
  cancelOrder(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.pharmacy.cancelOrder(user.sub, id);
  }

  @Delete('inventory/:id')
  archiveItem(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.pharmacy.archiveItem(user.sub, id);
  }

  @Get('network/physicians')
  networkPhysicians(
    @CurrentUser() user: SessionPayload,
    @Query('q') q?: string,
  ) {
    return this.pharmacy.getNetworkPhysicians(user.sub, q);
  }

  @Get('chat/threads')
  @ApiOperation({ summary: 'Get chat threads' })
  getChatThreads(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.getChatThreads(user.sub);
  }

  @Get('chat/:practiceId/messages')
  @ApiOperation({ summary: 'Get chat messages with practice' })
  getChatMessages(
    @CurrentUser() user: SessionPayload,
    @Param('practiceId') practiceId: string,
  ) {
    return this.pharmacy.getChatMessages(user.sub, practiceId);
  }

  @Post('chat/:practiceId/messages')
  @ApiOperation({ summary: 'Send a chat message to practice' })
  sendChatMessage(
    @CurrentUser() user: SessionPayload,
    @Param('practiceId') practiceId: string,
    @Body('content') content: string,
  ) {
    return this.pharmacy.sendChatMessage(user.sub, practiceId, content);
  }
}
