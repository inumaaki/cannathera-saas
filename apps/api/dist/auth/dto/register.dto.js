"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDto = exports.SIGNUP_ROLES = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
exports.SIGNUP_ROLES = ['patient', 'doctor', 'pharmacy', 'enterprise'];
class PatientDataDto {
    dateOfBirth;
    preferredLanguage;
    consentArt9;
    consentShareDoctor;
}
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], PatientDataDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Locale),
    __metadata("design:type", String)
], PatientDataDto.prototype, "preferredLanguage", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatientDataDto.prototype, "consentArt9", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PatientDataDto.prototype, "consentShareDoctor", void 0);
class DoctorDataDto {
    practiceName;
    lanr;
    bsnr;
    specialty;
    phone;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], DoctorDataDto.prototype, "practiceName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], DoctorDataDto.prototype, "lanr", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], DoctorDataDto.prototype, "bsnr", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], DoctorDataDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], DoctorDataDto.prototype, "phone", void 0);
class PharmacyDataDto {
    pharmacyName;
    contactPerson;
    address;
    phone;
    idf;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], PharmacyDataDto.prototype, "pharmacyName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], PharmacyDataDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], PharmacyDataDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], PharmacyDataDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], PharmacyDataDto.prototype, "idf", void 0);
class EnterpriseDataDto {
    companyName;
    contactPerson;
    partnerType;
    phone;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], EnterpriseDataDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], EnterpriseDataDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['telemedicine', 'clinic', 'platform', 'other']),
    __metadata("design:type", String)
], EnterpriseDataDto.prototype, "partnerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], EnterpriseDataDto.prototype, "phone", void 0);
class RegisterDto {
    role;
    email;
    password;
    firstName;
    lastName;
    locale;
    roleData;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsIn)(exports.SIGNUP_ROLES),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Locale),
    __metadata("design:type", String)
], RegisterDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)((opts) => {
        switch (opts?.object?.role) {
            case 'doctor':
                return DoctorDataDto;
            case 'pharmacy':
                return PharmacyDataDto;
            case 'enterprise':
                return EnterpriseDataDto;
            default:
                return PatientDataDto;
        }
    }),
    __metadata("design:type", Object)
], RegisterDto.prototype, "roleData", void 0);
//# sourceMappingURL=register.dto.js.map