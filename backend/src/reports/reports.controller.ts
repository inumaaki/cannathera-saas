import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ReportType, Role } from '@prisma/client';
import type { Response } from 'express';
import {
  CurrentUser,
  Perms,
  PermissionsGuard,
  SessionGuard,
} from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { ReportsService } from './reports.service';

function toType(value?: string): ReportType {
  const upper = (value ?? 'MONTHLY').toUpperCase();
  return Object.values(ReportType).includes(upper as ReportType)
    ? (upper as ReportType)
    : ReportType.MONTHLY;
}

@Controller('documents')
@UseGuards(SessionGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** Practice team or pharmacy: report for a patient on their own case. */
  @Get('patient/:patientId')
  @Perms('reports:view')
  async doctorReport(
    @CurrentUser() user: SessionPayload,
    @Param('patientId') patientId: string,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    try {
      await this.reports.assertCanAccessPatient(user.sub, patientId);
      const { buffer, filename } = await this.reports.generate(
        user.sub,
        patientId,
        toType(type),
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.end(buffer);
    } catch (err: any) {
      console.error('[ReportsController] doctorReport error:', err?.message ?? err);
      if (!res.headersSent) {
        const status = err?.status ?? err?.statusCode ?? 500;
        res.status(status).json({ statusCode: status, message: err?.message ?? 'Internal Server Error' });
      }
    }
  }

  @Get('patient/:patientId/history')
  @Perms('reports:view')
  async doctorHistory(
    @CurrentUser() user: SessionPayload,
    @Param('patientId') patientId: string,
  ) {
    await this.reports.assertCanAccessPatient(user.sub, patientId);
    return this.reports.history(patientId);
  }

  /** Authenticated download of a stored report (replaces the public /uploads path). */
  @Get('file/:reportId')
  async file(
    @CurrentUser() user: SessionPayload,
    @Param('reportId') reportId: string,
    @Res() res: Response,
  ) {
    try {
      const { buffer, filename } = await this.reports.fileById(
        user.sub,
        reportId,
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.end(buffer);
    } catch (err: any) {
      console.error('[ReportsController] file error:', err?.message ?? err);
      if (!res.headersSent) {
        const status = err?.status ?? err?.statusCode ?? 500;
        res.status(status).json({ statusCode: status, message: err?.message ?? 'Internal Server Error' });
      }
    }
  }

  /** Patient: their own reports only. */
  @Get('mine')
  async myReport(
    @CurrentUser() user: SessionPayload,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    if (user.role !== Role.PATIENT) throw new ForbiddenException();
    
    console.log(`[ReportsController] Received request for myReport (type: ${type}) from user ${user.sub}`);
    
    const patientId = await this.reports.patientIdOfUser(user.sub);
    try {
      const { buffer, filename } = await this.reports.generate(
        user.sub,
        patientId,
        toType(type),
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.end(buffer);
    } catch (err: any) {
      console.error("[ReportsController] Fatal error during PDF generation:", err);
      res.status(500).json({ statusCode: 500, message: 'Internal Server Error', error: err.message, stack: err.stack });
    }
  }

  @Get('mine/history')
  async myHistory(@CurrentUser() user: SessionPayload) {
    if (user.role !== Role.PATIENT) throw new ForbiddenException();
    const patientId = await this.reports.patientIdOfUser(user.sub);
    return this.reports.history(patientId);
  }
}
