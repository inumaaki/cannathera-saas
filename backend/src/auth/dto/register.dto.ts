import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Locale } from '@prisma/client';

export const SIGNUP_ROLES = ['patient', 'doctor', 'pharmacy', 'enterprise'] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

class PatientDataDto {
  @IsISO8601()
  dateOfBirth!: string;

  @IsEnum(Locale)
  preferredLanguage!: Locale;

  @IsBoolean()
  consentArt9!: boolean;

  @IsOptional()
  @IsBoolean()
  consentShareDoctor?: boolean;
}

class DoctorDataDto {
  @IsString()
  @MaxLength(200)
  practiceName!: string;

  @IsString()
  @MaxLength(20)
  lanr!: string;

  @IsString()
  @MaxLength(20)
  bsnr!: string;

  @IsString()
  @MaxLength(120)
  specialty!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

class PharmacyDataDto {
  @IsString()
  @MaxLength(200)
  pharmacyName!: string;

  @IsString()
  @MaxLength(160)
  contactPerson!: string;

  @IsString()
  @MaxLength(300)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  idf?: string;
}

class EnterpriseDataDto {
  @IsString()
  @MaxLength(200)
  companyName!: string;

  @IsString()
  @MaxLength(160)
  contactPerson!: string;

  @IsIn(['telemedicine', 'clinic', 'platform', 'other'])
  partnerType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

export class RegisterDto {
  @IsIn(SIGNUP_ROLES)
  role!: SignupRole;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;

  @IsOptional()
  @ValidateNested()
  @Type((opts) => {
    switch ((opts?.object as RegisterDto | undefined)?.role) {
      case 'doctor':
        return DoctorDataDto;
      case 'pharmacy':
        return PharmacyDataDto;
      case 'enterprise':
        return EnterpriseDataDto;
      default:
        return PatientDataDto;
    }
  })
  roleData?: PatientDataDto | DoctorDataDto | PharmacyDataDto | EnterpriseDataDto;
}

export type { PatientDataDto, DoctorDataDto, PharmacyDataDto, EnterpriseDataDto };
