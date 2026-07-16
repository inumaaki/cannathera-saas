import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ORG_ROLES, PERMISSIONS } from '../shared';
import {
  CurrentUser,
  Perms,
  PermissionsGuard,
  Roles,
  RolesGuard,
  SessionGuard,
  SubscriptionGuard,
} from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { DoctorService } from './doctor.service';

class CreatePatientDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;
}

class NoteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  text!: string;
}

class InviteDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsIn(ORG_ROLES)
  orgRole!: string;

  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSIONS, { each: true })
  permissions!: string[];
}

class UpdateMemberDto {
  @IsOptional()
  @IsIn(ORG_ROLES)
  orgRole?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSIONS, { each: true })
  permissions?: string[];
}

class RescheduleDto {
  @IsISO8601()
  scheduledAt!: string;
}

@Controller('doctor')
@UseGuards(SessionGuard, RolesGuard, SubscriptionGuard, PermissionsGuard)
/* Practice-scoped: platform Role.ADMIN has no practice and is deliberately not
   admitted here. Running a practice is `membership.orgRole === 'ADMIN'`. */
@Roles(Role.DOCTOR)
export class DoctorController {
  constructor(private readonly doctors: DoctorService) {}

  @Get('overview')
  @Perms('patients:view')
  overview(@CurrentUser() user: SessionPayload) {
    return this.doctors.overview(user.sub);
  }

  @Get('reports')
  @Perms('reports:view')
  reports(@CurrentUser() user: SessionPayload, @Query('days') days?: string) {
    const n = days === 'all' ? 0 : Math.max(0, Number(days) || 30);
    return this.doctors.reportsSummary(user.sub, n);
  }

  @Get('reports/export')
  @Perms('reports:view')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cannathera-bericht.csv"')
  async exportReports(@CurrentUser() user: SessionPayload) {
    return this.doctors.exportCsv(user.sub);
  }

  @Get('compliance/audit')
  @Perms('compliance:view')
  async complianceAudit(
    @CurrentUser() user: SessionPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="cannathera-compliance-audit.json"',
    );
    return this.doctors.complianceAudit(user.sub);
  }

  @Get('practice')
  practice(@CurrentUser() user: SessionPayload) {
    return this.doctors.practice(user.sub);
  }

  @Patch('practice')
  @Perms('settings:practice')
  updatePractice(
    @CurrentUser() user: SessionPayload,
    @Body() body: { name?: string; branding?: Record<string, unknown> },
  ) {
    return this.doctors.updatePractice(user.sub, body);
  }

  @Post('practice/logo')
  @Perms('settings:practice')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadLogo(
    @CurrentUser() user: SessionPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.doctors.saveLogo(user.sub, file);
  }

  @Get('team')
  @Perms('settings:team')
  team(@CurrentUser() user: SessionPayload) {
    return this.doctors.team(user.sub);
  }

  @Post('team/invite')
  @Perms('settings:team')
  invite(@CurrentUser() user: SessionPayload, @Body() dto: InviteDto) {
    return this.doctors.inviteTeamMember(user.sub, dto);
  }

  @Patch('team/:membershipId')
  @Perms('settings:team')
  updateMember(
    @CurrentUser() user: SessionPayload,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.doctors.updateTeamMember(user.sub, membershipId, dto);
  }

  @Get('patients')
  @Perms('patients:view')
  patients(@CurrentUser() user: SessionPayload) {
    return this.doctors.patients(user.sub);
  }

  @Post('patients')
  @Perms('patients:create')
  createPatient(@CurrentUser() user: SessionPayload, @Body() dto: CreatePatientDto) {
    return this.doctors.createPatient(user.sub, dto);
  }

  @Get('red-flags')
  @Perms('alerts:view')
  redFlags(@CurrentUser() user: SessionPayload, @Query('view') view?: string) {
    const v = view === 'reviewed' || view === 'all' ? view : ('unreviewed' as const);
    return this.doctors.redFlags(user.sub, v);
  }

  @Post('red-flags/:id/acknowledge')
  @Perms('alerts:acknowledge')
  acknowledge(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.doctors.acknowledgeFlag(user.sub, id);
  }

  @Get('patients/:id')
  @Perms('patients:view')
  patientDetail(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.doctors.patientDetail(user.sub, id);
  }

  @Post('patients/:id/notes')
  @Perms('patients:note')
  addNote(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: NoteDto,
  ) {
    return this.doctors.addNote(user.sub, id, dto.text);
  }

  @Patch('appointments/:id')
  @Perms('appointments:manage')
  reschedule(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.doctors.reschedule(user.sub, id, dto.scheduledAt);
  }

  @Get('submissions/:id')
  @Perms('patients:view')
  submissionDetail(@CurrentUser() user: SessionPayload, @Param('id') id: string) {
    return this.doctors.submissionDetail(user.sub, id);
  }
}
