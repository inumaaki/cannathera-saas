import {
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RescheduleDto {
  @IsISO8601()
  scheduledAt!: string;
}

export class CreateLogDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  dosageG!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  strain?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  pain?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  sleep?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  activity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  qol?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  intakeTime?: string;

  @IsOptional()
  @IsString({ each: true })
  sideEffects?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  benefitRating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  benefitOnset?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  benefitDuration?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  pharmacyOrgId?: string | null;
}
