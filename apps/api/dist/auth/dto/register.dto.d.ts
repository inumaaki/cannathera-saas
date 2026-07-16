import { Locale } from '@prisma/client';
export declare const SIGNUP_ROLES: readonly ["patient", "doctor", "pharmacy", "enterprise"];
export type SignupRole = (typeof SIGNUP_ROLES)[number];
declare class PatientDataDto {
    dateOfBirth: string;
    preferredLanguage: Locale;
    consentArt9: boolean;
    consentShareDoctor?: boolean;
}
declare class DoctorDataDto {
    practiceName: string;
    lanr: string;
    bsnr: string;
    specialty: string;
    phone?: string;
}
declare class PharmacyDataDto {
    pharmacyName: string;
    contactPerson: string;
    address: string;
    phone?: string;
    idf?: string;
}
declare class EnterpriseDataDto {
    companyName: string;
    contactPerson: string;
    partnerType: string;
    phone?: string;
}
export declare class RegisterDto {
    role: SignupRole;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    locale?: Locale;
    roleData?: PatientDataDto | DoctorDataDto | PharmacyDataDto | EnterpriseDataDto;
}
export type { PatientDataDto, DoctorDataDto, PharmacyDataDto, EnterpriseDataDto };
