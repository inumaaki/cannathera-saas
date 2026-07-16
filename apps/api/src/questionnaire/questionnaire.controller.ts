import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Locale, Role } from '@cannathera/db';
import { IsObject } from 'class-validator';
import {
  CurrentUser,
  Roles,
  RolesGuard,
  SessionGuard,
} from '../auth/auth.guard';
import type { SessionPayload } from '../auth/auth.service';
import { QuestionnaireService } from './questionnaire.service';

class SubmitDto {
  @IsObject()
  answers!: Record<string, unknown>;
}

function toLocale(value?: string): Locale {
  return Object.values(Locale).includes(value as Locale) ? (value as Locale) : Locale.de;
}

@Controller('questionnaires')
@UseGuards(SessionGuard, RolesGuard)
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  @Get()
  list(@Query('locale') locale?: string) {
    return this.service.list(toLocale(locale));
  }

  @Get('submissions/mine')
  @Roles(Role.PATIENT)
  mySubmissions(@CurrentUser() user: SessionPayload) {
    return this.service.mySubmissions(user.sub);
  }

  @Get(':key')
  structure(@Param('key') key: string, @Query('locale') locale?: string) {
    return this.service.structure(key, toLocale(locale));
  }

  @Post(':key/submissions')
  @Roles(Role.PATIENT)
  submit(
    @CurrentUser() user: SessionPayload,
    @Param('key') key: string,
    @Body() dto: SubmitDto,
    @Query('locale') locale?: string,
  ) {
    return this.service.submit(user.sub, key, dto.answers, toLocale(locale));
  }
}
