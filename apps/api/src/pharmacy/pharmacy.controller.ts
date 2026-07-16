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
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser, Roles, RolesGuard, SessionGuard, SubscriptionGuard } from '../auth/auth.guard';
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

@Controller('pharmacy')
@UseGuards(SessionGuard, RolesGuard, SubscriptionGuard)
@Roles(Role.PHARMACY)
export class PharmacyController {
  constructor(private readonly pharmacy: PharmacyService) {}

  @Get('overview')
  overview(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.overview(user.sub);
  }

  @Get('reviews')
  reviews(@CurrentUser() user: SessionPayload, @Query('filter') filter?: string) {
    const f = ['overdue', 'dueSoon', 'onTrack', 'flagged'].includes(filter ?? '')
      ? filter!
      : 'all';
    return this.pharmacy.reviews(user.sub, f);
  }

  // Must stay above `reviews/:patientId` or the param route swallows "export".
  @Get('reviews/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cannathera-reviews.csv"')
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
  @Header('Content-Disposition', 'attachment; filename="cannathera-behandlungslogs.csv"')
  exportLogs(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.exportLogsCsv(user.sub);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.analytics(user.sub);
  }

  @Get('analytics/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cannathera-analytik.csv"')
  exportAnalytics(@CurrentUser() user: SessionPayload) {
    return this.pharmacy.exportAnalyticsCsv(user.sub);
  }

  @Get('inventory/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cannathera-warenbestand.csv"')
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
}
