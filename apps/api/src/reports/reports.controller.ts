import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ReportType, Role } from '@cannathera/db';
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

@Controller('reports')
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
    await this.reports.assertCanAccessPatient(user.sub, patientId);
    const { buffer, filename } = await this.reports.generate(
      user.sub,
      patientId,
      toType(type),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
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
    const { buffer, filename } = await this.reports.fileById(user.sub, reportId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }

  /** Patient: their own reports only. */
  @Get('mine')
  async myReport(
    @CurrentUser() user: SessionPayload,
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    if (user.role !== Role.PATIENT) throw new ForbiddenException();
    const patientId = await this.reports.patientIdOfUser(user.sub);
    const { buffer, filename } = await this.reports.generate(
      user.sub,
      patientId,
      toType(type),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }

  @Get('mine/history')
  async myHistory(@CurrentUser() user: SessionPayload) {
    if (user.role !== Role.PATIENT) throw new ForbiddenException();
    const patientId = await this.reports.patientIdOfUser(user.sub);
    return this.reports.history(patientId);
  }
}
