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
exports.EnterpriseController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const auth_guard_1 = require("../auth/auth.guard");
const billing_service_1 = require("./billing.service");
const enterprise_service_1 = require("./enterprise.service");
const integrations_service_1 = require("./integrations.service");
const settings_service_1 = require("./settings.service");
class BrandingDto {
    logoUrl;
    primaryColor;
    accentColor;
    fontFamily;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], BrandingDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], BrandingDto.prototype, "primaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)(),
    __metadata("design:type", String)
], BrandingDto.prototype, "accentColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], BrandingDto.prototype, "fontFamily", void 0);
class AddPartnerDto {
    orgId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddPartnerDto.prototype, "orgId", void 0);
class CreateKeyDto {
    name;
    scopes;
    live;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateKeyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsIn)(['READ', 'WRITE', 'ALL_ACCESS'], { each: true }),
    __metadata("design:type", Array)
], CreateKeyDto.prototype, "scopes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateKeyDto.prototype, "live", void 0);
class CreateWebhookDto {
    url;
    events;
}
__decorate([
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateWebhookDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsIn)(integrations_service_1.WEBHOOK_EVENTS, { each: true }),
    __metadata("design:type", Array)
], CreateWebhookDto.prototype, "events", void 0);
class ToggleWebhookDto {
    active;
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ToggleWebhookDto.prototype, "active", void 0);
class InviteDto {
    email;
    firstName;
    lastName;
    orgRole;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], InviteDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], InviteDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], InviteDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['SUPER_ADMIN', 'SUPPORT', 'BILLING', 'VIEWER']),
    __metadata("design:type", String)
], InviteDto.prototype, "orgRole", void 0);
class UpdateMemberDto {
    orgRole;
}
__decorate([
    (0, class_validator_1.IsIn)(['SUPER_ADMIN', 'SUPPORT', 'BILLING', 'VIEWER']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "orgRole", void 0);
class UpdateSettingsDto {
    mandatory2fa;
    sessionTimeoutMin;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSettingsDto.prototype, "mandatory2fa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    __metadata("design:type", Number)
], UpdateSettingsDto.prototype, "sessionTimeoutMin", void 0);
let EnterpriseController = class EnterpriseController {
    enterprise;
    integrations;
    billing;
    settings;
    constructor(enterprise, integrations, billing, settings) {
        this.enterprise = enterprise;
        this.integrations = integrations;
        this.billing = billing;
        this.settings = settings;
    }
    overview(user) {
        return this.enterprise.overview(user.sub);
    }
    partners(user, type) {
        return this.enterprise.partners(user.sub, type);
    }
    available(user) {
        return this.enterprise.availablePartners(user.sub);
    }
    partnerDetail(user, id) {
        return this.enterprise.partnerDetail(user.sub, id);
    }
    addPartner(user, dto) {
        return this.enterprise.addPartner(user.sub, dto.orgId);
    }
    removePartner(user, id) {
        return this.enterprise.removePartner(user.sub, id);
    }
    updateBranding(user, dto) {
        return this.enterprise.updateBranding(user.sub, dto);
    }
    uploadLogo(user, file) {
        return this.enterprise.saveLogo(user.sub, file);
    }
    exportCsv(user) {
        return this.enterprise.exportCsv(user.sub);
    }
    integrationStatus(user) {
        return this.integrations.status(user.sub);
    }
    listKeys(user) {
        return this.integrations.listKeys(user.sub);
    }
    createKey(user, dto) {
        return this.integrations.createKey(user.sub, dto.name, dto.scopes, dto.live ?? true);
    }
    revokeKey(user, id) {
        return this.integrations.revokeKey(user.sub, id);
    }
    listWebhooks(user) {
        return this.integrations.listWebhooks(user.sub);
    }
    createWebhook(user, dto) {
        return this.integrations.createWebhook(user.sub, dto.url, dto.events);
    }
    toggleWebhook(user, id, dto) {
        return this.integrations.toggleWebhook(user.sub, id, dto.active);
    }
    deleteWebhook(user, id) {
        return this.integrations.deleteWebhook(user.sub, id);
    }
    deliveries(user, limit) {
        return this.integrations.deliveries(user.sub, Number(limit) || 25);
    }
    retryDelivery(user, id) {
        return this.integrations.retry(user.sub, id);
    }
    usage(user) {
        return this.billing.usage(user.sub);
    }
    invoices(user, status) {
        return this.billing.invoices(user.sub, status);
    }
    generateInvoice(user) {
        return this.billing.generateInvoice(user.sub);
    }
    exportInvoices(user) {
        return this.billing.exportInvoicesCsv(user.sub);
    }
    team(user) {
        return this.settings.team(user.sub);
    }
    invite(user, dto) {
        return this.settings.invite(user.sub, dto);
    }
    updateMember(user, id, dto) {
        return this.settings.updateMember(user.sub, id, dto.orgRole);
    }
    removeMember(user, id) {
        return this.settings.removeMember(user.sub, id);
    }
    getSettings(user) {
        return this.settings.settings(user.sub);
    }
    updateSettings(user, dto) {
        return this.settings.updateSettings(user.sub, dto);
    }
    audit(user, limit, action) {
        return this.settings.auditLog(user.sub, Number(limit) || 25, action);
    }
};
exports.EnterpriseController = EnterpriseController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('partners'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "partners", null);
__decorate([
    (0, common_1.Get)('partners/available'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "available", null);
__decorate([
    (0, common_1.Get)('partners/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "partnerDetail", null);
__decorate([
    (0, common_1.Post)('partners'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AddPartnerDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "addPartner", null);
__decorate([
    (0, common_1.Delete)('partners/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "removePartner", null);
__decorate([
    (0, common_1.Patch)('branding'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, BrandingDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "updateBranding", null);
__decorate([
    (0, common_1.Post)('branding/logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-netzwerk.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('integrations/status'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "integrationStatus", null);
__decorate([
    (0, common_1.Get)('integrations/keys'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "listKeys", null);
__decorate([
    (0, common_1.Post)('integrations/keys'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateKeyDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "createKey", null);
__decorate([
    (0, common_1.Delete)('integrations/keys/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "revokeKey", null);
__decorate([
    (0, common_1.Get)('integrations/webhooks'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "listWebhooks", null);
__decorate([
    (0, common_1.Post)('integrations/webhooks'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateWebhookDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "createWebhook", null);
__decorate([
    (0, common_1.Patch)('integrations/webhooks/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ToggleWebhookDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "toggleWebhook", null);
__decorate([
    (0, common_1.Delete)('integrations/webhooks/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Get)('integrations/deliveries'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "deliveries", null);
__decorate([
    (0, common_1.Post)('integrations/deliveries/:id/retry'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "retryDelivery", null);
__decorate([
    (0, common_1.Get)('billing/usage'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "usage", null);
__decorate([
    (0, common_1.Get)('billing/invoices'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "invoices", null);
__decorate([
    (0, common_1.Post)('billing/invoices'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "generateInvoice", null);
__decorate([
    (0, common_1.Get)('billing/invoices/export'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-rechnungen.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "exportInvoices", null);
__decorate([
    (0, common_1.Get)('team'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "team", null);
__decorate([
    (0, common_1.Post)('team'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, InviteDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "invite", null);
__decorate([
    (0, common_1.Patch)('team/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)('team/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateSettingsDto]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('settings/audit'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], EnterpriseController.prototype, "audit", null);
exports.EnterpriseController = EnterpriseController = __decorate([
    (0, common_1.Controller)('enterprise'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.RolesGuard, auth_guard_1.SubscriptionGuard),
    (0, auth_guard_1.Roles)(client_1.Role.ENTERPRISE),
    __metadata("design:paramtypes", [enterprise_service_1.EnterpriseService,
        integrations_service_1.IntegrationsService,
        billing_service_1.BillingService,
        settings_service_1.SettingsService])
], EnterpriseController);
//# sourceMappingURL=enterprise.controller.js.map