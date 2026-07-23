import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CurrentUser,
  Roles,
  RolesGuard,
  SessionGuard,
} from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { PatientService } from './patient.service';
import { CreateLogDto, RescheduleDto, UpdateProfileDto } from './patient.dto';

@Controller('patient')
@UseGuards(SessionGuard, RolesGuard)
@Roles(Role.PATIENT)
export class PatientController {
  constructor(private readonly patients: PatientService) {}

  @Get('summary')
  summary(@CurrentUser() user: SessionPayload) {
    return this.patients.summary(user.sub);
  }

  @Post('logs')
  createLog(@CurrentUser() user: SessionPayload, @Body() dto: CreateLogDto) {
    return this.patients.createLog(user.sub, {
      dosageG: dto.dosageG,
      strain: dto.strain,
      metrics: {
        pain: dto.pain,
        sleep: dto.sleep,
        activity: dto.activity,
        qol: dto.qol,
        intakeTime: dto.intakeTime,
        sideEffects: dto.sideEffects,
        benefitRating: dto.benefitRating,
        benefitOnset: dto.benefitOnset,
        benefitDuration: dto.benefitDuration,
      },
      note: dto.note,
    });
  }

  @Get('stats')
  stats(@CurrentUser() user: SessionPayload, @Query('days') days?: string) {
    const n = Math.min(90, Math.max(1, Number(days) || 7));
    return this.patients.stats(user.sub, n);
  }

  @Get('appointments')
  appointments(@CurrentUser() user: SessionPayload) {
    return this.patients.appointments(user.sub);
  }

  @Patch('appointments/:id')
  reschedule(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.patients.rescheduleAppointment(user.sub, id, dto.scheduledAt);
  }

  @Get('profile')
  profile(@CurrentUser() user: SessionPayload) {
    return this.patients.profile(user.sub);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: SessionPayload, @Body() dto: UpdateProfileDto) {
    return this.patients.updateProfile(user.sub, dto);
  }

  @Get('plan')
  plan(@CurrentUser() user: SessionPayload) {
    return this.patients.plan(user.sub);
  }

  /** Co-branding of the patient's practice / pharmacy / enterprise network. */
  @Get('branding')
  branding(@CurrentUser() user: SessionPayload) {
    return this.patients.branding(user.sub);
  }
}
