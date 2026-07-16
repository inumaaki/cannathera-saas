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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const shared_1 = require("@cannathera/shared");
const auth_guard_1 = require("../auth/auth.guard");
const doctor_service_1 = require("./doctor.service");
class CreatePatientDto {
    firstName;
    lastName;
    email;
    dateOfBirth;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "dateOfBirth", void 0);
class NoteDto {
    text;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], NoteDto.prototype, "text", void 0);
class InviteDto {
    firstName;
    lastName;
    email;
    orgRole;
    permissions;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], InviteDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], InviteDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], InviteDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsIn)(shared_1.ORG_ROLES),
    __metadata("design:type", String)
], InviteDto.prototype, "orgRole", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsIn)(shared_1.PERMISSIONS, { each: true }),
    __metadata("design:type", Array)
], InviteDto.prototype, "permissions", void 0);
class UpdateMemberDto {
    orgRole;
    permissions;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(shared_1.ORG_ROLES),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "orgRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsIn)(shared_1.PERMISSIONS, { each: true }),
    __metadata("design:type", Array)
], UpdateMemberDto.prototype, "permissions", void 0);
class RescheduleDto {
    scheduledAt;
}
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], RescheduleDto.prototype, "scheduledAt", void 0);
let DoctorController = class DoctorController {
    doctors;
    constructor(doctors) {
        this.doctors = doctors;
    }
    overview(user) {
        return this.doctors.overview(user.sub);
    }
    reports(user, days) {
        const n = days === 'all' ? 0 : Math.max(0, Number(days) || 30);
        return this.doctors.reportsSummary(user.sub, n);
    }
    async exportReports(user) {
        return this.doctors.exportCsv(user.sub);
    }
    async complianceAudit(user, res) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="cannathera-compliance-audit.json"');
        return this.doctors.complianceAudit(user.sub);
    }
    practice(user) {
        return this.doctors.practice(user.sub);
    }
    updatePractice(user, body) {
        return this.doctors.updatePractice(user.sub, body);
    }
    uploadLogo(user, file) {
        return this.doctors.saveLogo(user.sub, file);
    }
    team(user) {
        return this.doctors.team(user.sub);
    }
    invite(user, dto) {
        return this.doctors.inviteTeamMember(user.sub, dto);
    }
    updateMember(user, membershipId, dto) {
        return this.doctors.updateTeamMember(user.sub, membershipId, dto);
    }
    patients(user) {
        return this.doctors.patients(user.sub);
    }
    createPatient(user, dto) {
        return this.doctors.createPatient(user.sub, dto);
    }
    redFlags(user, view) {
        const v = view === 'reviewed' || view === 'all' ? view : 'unreviewed';
        return this.doctors.redFlags(user.sub, v);
    }
    acknowledge(user, id) {
        return this.doctors.acknowledgeFlag(user.sub, id);
    }
    patientDetail(user, id) {
        return this.doctors.patientDetail(user.sub, id);
    }
    addNote(user, id, dto) {
        return this.doctors.addNote(user.sub, id, dto.text);
    }
    reschedule(user, id, dto) {
        return this.doctors.reschedule(user.sub, id, dto.scheduledAt);
    }
    submissionDetail(user, id) {
        return this.doctors.submissionDetail(user.sub, id);
    }
};
exports.DoctorController = DoctorController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, auth_guard_1.Perms)('patients:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, auth_guard_1.Perms)('reports:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "reports", null);
__decorate([
    (0, common_1.Get)('reports/export'),
    (0, auth_guard_1.Perms)('reports:view'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-bericht.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "exportReports", null);
__decorate([
    (0, common_1.Get)('compliance/audit'),
    (0, auth_guard_1.Perms)('compliance:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DoctorController.prototype, "complianceAudit", null);
__decorate([
    (0, common_1.Get)('practice'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "practice", null);
__decorate([
    (0, common_1.Patch)('practice'),
    (0, auth_guard_1.Perms)('settings:practice'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "updatePractice", null);
__decorate([
    (0, common_1.Post)('practice/logo'),
    (0, auth_guard_1.Perms)('settings:practice'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, auth_guard_1.Perms)('settings:team'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "team", null);
__decorate([
    (0, common_1.Post)('team/invite'),
    (0, auth_guard_1.Perms)('settings:team'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, InviteDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "invite", null);
__decorate([
    (0, common_1.Patch)('team/:membershipId'),
    (0, auth_guard_1.Perms)('settings:team'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('membershipId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Get)('patients'),
    (0, auth_guard_1.Perms)('patients:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "patients", null);
__decorate([
    (0, common_1.Post)('patients'),
    (0, auth_guard_1.Perms)('patients:create'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePatientDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "createPatient", null);
__decorate([
    (0, common_1.Get)('red-flags'),
    (0, auth_guard_1.Perms)('alerts:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('view')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "redFlags", null);
__decorate([
    (0, common_1.Post)('red-flags/:id/acknowledge'),
    (0, auth_guard_1.Perms)('alerts:acknowledge'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Get)('patients/:id'),
    (0, auth_guard_1.Perms)('patients:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "patientDetail", null);
__decorate([
    (0, common_1.Post)('patients/:id/notes'),
    (0, auth_guard_1.Perms)('patients:note'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, NoteDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "addNote", null);
__decorate([
    (0, common_1.Patch)('appointments/:id'),
    (0, auth_guard_1.Perms)('appointments:manage'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, RescheduleDto]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Get)('submissions/:id'),
    (0, auth_guard_1.Perms)('patients:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DoctorController.prototype, "submissionDetail", null);
exports.DoctorController = DoctorController = __decorate([
    (0, common_1.Controller)('doctor'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.RolesGuard, auth_guard_1.SubscriptionGuard, auth_guard_1.PermissionsGuard),
    (0, auth_guard_1.Roles)(client_1.Role.DOCTOR),
    __metadata("design:paramtypes", [doctor_service_1.DoctorService])
], DoctorController);
//# sourceMappingURL=doctor.controller.js.map