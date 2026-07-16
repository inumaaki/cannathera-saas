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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const auth_guard_1 = require("../auth/auth.guard");
const admin_service_1 = require("./admin.service");
class OnboardPartnerDto {
    name;
    type;
    adminEmail;
    adminFirstName;
    adminLastName;
    planTier;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OnboardPartnerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.OrgType),
    __metadata("design:type", String)
], OnboardPartnerDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], OnboardPartnerDto.prototype, "adminEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OnboardPartnerDto.prototype, "adminFirstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OnboardPartnerDto.prototype, "adminLastName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionTier),
    __metadata("design:type", String)
], OnboardPartnerDto.prototype, "planTier", void 0);
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async listPartners() {
        return this.adminService.listPartners();
    }
    async togglePartner(orgId) {
        return this.adminService.togglePartner(orgId);
    }
    async onboardPartner(dto) {
        return this.adminService.onboardPartner(dto);
    }
    async listAuditLogs() {
        return this.adminService.listAuditLogs();
    }
    async listUsers() {
        return this.adminService.listUsers();
    }
    async toggleUser(userId) {
        return this.adminService.toggleUser(userId);
    }
    async listPricingPlans() {
        return this.adminService.listPricingPlans();
    }
    async updatePricingPlan(id, dto) {
        return this.adminService.updatePricingPlan(id, dto);
    }
    async togglePartner2FA(orgId) {
        return this.adminService.togglePartner2FA(orgId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('partners'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listPartners", null);
__decorate([
    (0, common_1.Patch)('partners/:orgId/toggle'),
    __param(0, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "togglePartner", null);
__decorate([
    (0, common_1.Post)('partners'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OnboardPartnerDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "onboardPartner", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAuditLogs", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)('users/:userId/toggle'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleUser", null);
__decorate([
    (0, common_1.Get)('pricing-plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listPricingPlans", null);
__decorate([
    (0, common_1.Patch)('pricing-plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePricingPlan", null);
__decorate([
    (0, common_1.Patch)('partners/:orgId/toggle-2fa'),
    __param(0, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "togglePartner2FA", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.RolesGuard),
    (0, auth_guard_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map