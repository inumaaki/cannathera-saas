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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const auth_guard_1 = require("../auth/auth.guard");
const reports_service_1 = require("./reports.service");
function toType(value) {
    const upper = (value ?? 'MONTHLY').toUpperCase();
    return Object.values(client_1.ReportType).includes(upper)
        ? upper
        : client_1.ReportType.MONTHLY;
}
let ReportsController = class ReportsController {
    reports;
    constructor(reports) {
        this.reports = reports;
    }
    async doctorReport(user, patientId, type, res) {
        await this.reports.assertCanAccessPatient(user.sub, patientId);
        const { buffer, filename } = await this.reports.generate(user.sub, patientId, toType(type));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(buffer);
    }
    async doctorHistory(user, patientId) {
        await this.reports.assertCanAccessPatient(user.sub, patientId);
        return this.reports.history(patientId);
    }
    async file(user, reportId, res) {
        const { buffer, filename } = await this.reports.fileById(user.sub, reportId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(buffer);
    }
    async myReport(user, type, res) {
        if (user.role !== client_1.Role.PATIENT)
            throw new common_1.ForbiddenException();
        const patientId = await this.reports.patientIdOfUser(user.sub);
        const { buffer, filename } = await this.reports.generate(user.sub, patientId, toType(type));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(buffer);
    }
    async myHistory(user) {
        if (user.role !== client_1.Role.PATIENT)
            throw new common_1.ForbiddenException();
        const patientId = await this.reports.patientIdOfUser(user.sub);
        return this.reports.history(patientId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, auth_guard_1.Perms)('reports:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('patientId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "doctorReport", null);
__decorate([
    (0, common_1.Get)('patient/:patientId/history'),
    (0, auth_guard_1.Perms)('reports:view'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "doctorHistory", null);
__decorate([
    (0, common_1.Get)('file/:reportId'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('reportId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "file", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "myReport", null);
__decorate([
    (0, common_1.Get)('mine/history'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "myHistory", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map