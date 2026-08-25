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
import { Readable } from 'stream';
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
  ): Promise<void> {
    try {
      await this.reports.assertCanAccessPatient(user.sub, patientId);
      const { buffer: generatedBuffer, filename } = await this.reports.generate(
        user.sub,
        patientId,
        toType(type),
      );

      const buffer = Buffer.isBuffer(generatedBuffer)
        ? generatedBuffer
        : Buffer.from(generatedBuffer);

      const pdfHeader = buffer.subarray(0, 5).toString();

      if (buffer.length < 1000 || pdfHeader !== '%PDF-') {
        throw new Error(
          `Invalid PDF generated: size=${buffer.length}, header=${pdfHeader}`,
        );
      }

      res.status(200);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(buffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown PDF error';
      console.error('[ReportsController] doctorReport error:', err);

      if (!res.headersSent) {
        const status = Number(
          (err as any)?.status ?? (err as any)?.statusCode ?? 500,
        );
        res.status(status).json({
          statusCode: status,
          message: (err as any)?.message ?? 'Internal Server Error',
          error: message,
        });
        return;
      }
      res.end();
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
  ): Promise<void> {
    try {
      const { buffer: generatedBuffer, filename } = await this.reports.fileById(
        user.sub,
        reportId,
      );

      const buffer = Buffer.isBuffer(generatedBuffer)
        ? generatedBuffer
        : Buffer.from(generatedBuffer);

      const pdfHeader = buffer.subarray(0, 5).toString();

      if (buffer.length < 1000 || pdfHeader !== '%PDF-') {
        throw new Error(
          `Invalid PDF generated: size=${buffer.length}, header=${pdfHeader}`,
        );
      }

      res.status(200);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(buffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown PDF error';
      console.error('[ReportsController] file error:', err);

      if (!res.headersSent) {
        const status = Number(
          (err as any)?.status ?? (err as any)?.statusCode ?? 500,
        );
        res.status(status).json({
          statusCode: status,
          message: (err as any)?.message ?? 'Internal Server Error',
          error: message,
        });
        return;
      }
      res.end();
    }
  }

  /** Patient: their own reports only. */
  @Get('mine')
  async myReport(
    @CurrentUser() user: SessionPayload,
    @Query('type') type: string,
    @Res() res: Response,
  ): Promise<void> {
    if (user.role !== Role.PATIENT) {
      throw new ForbiddenException();
    }

    console.log(
      `[ReportsController] Received request for myReport (type: ${type}) from user ${user.sub}`,
    );

    const patientId = await this.reports.patientIdOfUser(user.sub);

    try {
      const { buffer: generatedBuffer, filename } = await this.reports.generate(
        user.sub,
        patientId,
        toType(type),
      );

      const buffer = Buffer.isBuffer(generatedBuffer)
        ? generatedBuffer
        : Buffer.from(generatedBuffer);

      const pdfHeader = buffer.subarray(0, 5).toString();

      console.log(
        `[ReportsController] Sending PDF: filename=${filename}, size=${buffer.length}, header=${pdfHeader}`,
      );

      if (buffer.length < 1000 || pdfHeader !== '%PDF-') {
        throw new Error(
          `Invalid PDF generated: size=${buffer.length}, header=${pdfHeader}`,
        );
      }

      res.status(200);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      });

      res.end(buffer);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown PDF generation error';

      console.error(
        '[ReportsController] Fatal error during PDF generation:',
        err,
      );

      if (!res.headersSent) {
        res.status(500).json({
          statusCode: 500,
          message: 'PDF generation failed',
          error: message,
        });
        return;
      }

      res.end();
    }
  }

  @Get('mine/history')
  async myHistory(@CurrentUser() user: SessionPayload) {
    if (user.role !== Role.PATIENT) throw new ForbiddenException();
    const patientId = await this.reports.patientIdOfUser(user.sub);
    return this.reports.history(patientId);
  }
}
