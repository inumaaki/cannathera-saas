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
exports.PatientController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const auth_guard_1 = require("../auth/auth.guard");
const patient_service_1 = require("./patient.service");
const patient_dto_1 = require("./patient.dto");
let PatientController = class PatientController {
    patients;
    constructor(patients) {
        this.patients = patients;
    }
    summary(user) {
        return this.patients.summary(user.sub);
    }
    createLog(user, dto) {
        return this.patients.createLog(user.sub, {
            dosageG: dto.dosageG,
            strain: dto.strain,
            metrics: {
                pain: dto.pain,
                sleep: dto.sleep,
                activity: dto.activity,
                qol: dto.qol,
            },
            note: dto.note,
        });
    }
    stats(user, days) {
        const n = Math.min(90, Math.max(1, Number(days) || 7));
        return this.patients.stats(user.sub, n);
    }
    appointments(user) {
        return this.patients.appointments(user.sub);
    }
    reschedule(user, id, dto) {
        return this.patients.rescheduleAppointment(user.sub, id, dto.scheduledAt);
    }
    profile(user) {
        return this.patients.profile(user.sub);
    }
    updateProfile(user, dto) {
        return this.patients.updateProfile(user.sub, dto);
    }
    plan(user) {
        return this.patients.plan(user.sub);
    }
    branding(user) {
        return this.patients.branding(user.sub);
    }
};
exports.PatientController = PatientController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "summary", null);
__decorate([
    (0, common_1.Post)('logs'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, patient_dto_1.CreateLogDto]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "createLog", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('appointments'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "appointments", null);
__decorate([
    (0, common_1.Patch)('appointments/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, patient_dto_1.RescheduleDto]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "profile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, patient_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('plan'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "plan", null);
__decorate([
    (0, common_1.Get)('branding'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatientController.prototype, "branding", null);
exports.PatientController = PatientController = __decorate([
    (0, common_1.Controller)('patient'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)(client_1.Role.PATIENT),
    __metadata("design:paramtypes", [patient_service_1.PatientService])
], PatientController);
//# sourceMappingURL=patient.controller.js.map