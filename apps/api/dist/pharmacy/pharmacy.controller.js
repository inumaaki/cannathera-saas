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
exports.PharmacyController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const auth_guard_1 = require("../auth/auth.guard");
const pharmacy_service_1 = require("./pharmacy.service");
const CATEGORIES = ['Flower', 'Oil', 'Extract', 'Capsule'];
const UNITS = ['g', 'ml', 'Stk.'];
const STOCK_STATUS = ['all', 'inStock', 'low', 'critical', 'pending'];
const SORTS = ['name', 'sku', 'stock', 'category'];
class CreateItemDto {
    sku;
    name;
    category;
    thc;
    cbd;
    unit;
    stockLevel;
    safetyThreshold;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateItemDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsIn)(CATEGORIES),
    __metadata("design:type", String)
], CreateItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "thc", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "cbd", void 0);
__decorate([
    (0, class_validator_1.IsIn)(UNITS),
    __metadata("design:type", String)
], CreateItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "stockLevel", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateItemDto.prototype, "safetyThreshold", void 0);
class UpdateItemDto {
    name;
    category;
    thc;
    cbd;
    unit;
    stockLevel;
    safetyThreshold;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(CATEGORIES),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "thc", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "cbd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(UNITS),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "stockLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateItemDto.prototype, "safetyThreshold", void 0);
class QuantityDto {
    qty;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], QuantityDto.prototype, "qty", void 0);
class CompleteReviewDto {
    note;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CompleteReviewDto.prototype, "note", void 0);
let PharmacyController = class PharmacyController {
    pharmacy;
    constructor(pharmacy) {
        this.pharmacy = pharmacy;
    }
    overview(user) {
        return this.pharmacy.overview(user.sub);
    }
    reviews(user, filter) {
        const f = ['overdue', 'dueSoon', 'onTrack', 'flagged'].includes(filter ?? '')
            ? filter
            : 'all';
        return this.pharmacy.reviews(user.sub, f);
    }
    exportReviews(user) {
        return this.pharmacy.exportReviewsCsv(user.sub);
    }
    reviewSummary(user, patientId) {
        return this.pharmacy.reviewSummary(user.sub, patientId);
    }
    completeReview(user, patientId, dto) {
        return this.pharmacy.completeReview(user.sub, patientId, dto.note);
    }
    logs(user, days, q, flagged) {
        return this.pharmacy.treatmentLogs(user.sub, {
            days: Math.min(365, Math.max(1, Number(days) || 30)),
            q,
            flaggedOnly: flagged === '1',
        });
    }
    exportLogs(user) {
        return this.pharmacy.exportLogsCsv(user.sub);
    }
    analytics(user) {
        return this.pharmacy.analytics(user.sub);
    }
    exportAnalytics(user) {
        return this.pharmacy.exportAnalyticsCsv(user.sub);
    }
    exportInventory(user) {
        return this.pharmacy.exportInventoryCsv(user.sub);
    }
    inventory(user, category, q, status, sort) {
        return this.pharmacy.inventory(user.sub, {
            category,
            q,
            status: STOCK_STATUS.includes(status)
                ? status
                : 'all',
            sort: SORTS.includes(sort) ? sort : 'name',
        });
    }
    createItem(user, dto) {
        return this.pharmacy.createItem(user.sub, dto);
    }
    itemHistory(user, id) {
        return this.pharmacy.itemHistory(user.sub, id);
    }
    updateItem(user, id, dto) {
        return this.pharmacy.updateItem(user.sub, id, dto);
    }
    reorder(user, id, dto) {
        return this.pharmacy.reorderItem(user.sub, id, dto.qty);
    }
    receive(user, id, dto) {
        return this.pharmacy.receiveItem(user.sub, id, dto.qty);
    }
    cancelOrder(user, id) {
        return this.pharmacy.cancelOrder(user.sub, id);
    }
    archiveItem(user, id) {
        return this.pharmacy.archiveItem(user.sub, id);
    }
};
exports.PharmacyController = PharmacyController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)('reviews'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "reviews", null);
__decorate([
    (0, common_1.Get)('reviews/export'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-reviews.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "exportReviews", null);
__decorate([
    (0, common_1.Get)('reviews/:patientId'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "reviewSummary", null);
__decorate([
    (0, common_1.Post)('reviews/:patientId/complete'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('patientId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CompleteReviewDto]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "completeReview", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('flagged')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "logs", null);
__decorate([
    (0, common_1.Get)('logs/export'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-behandlungslogs.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "exportLogs", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('analytics/export'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-analytik.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "exportAnalytics", null);
__decorate([
    (0, common_1.Get)('inventory/export'),
    (0, common_1.Header)('Content-Type', 'text/csv; charset=utf-8'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="cannathera-warenbestand.csv"'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "exportInventory", null);
__decorate([
    (0, common_1.Get)('inventory'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "inventory", null);
__decorate([
    (0, common_1.Post)('inventory'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateItemDto]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)('inventory/:id/history'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "itemHistory", null);
__decorate([
    (0, common_1.Patch)('inventory/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateItemDto]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Post)('inventory/:id/reorder'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, QuantityDto]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "reorder", null);
__decorate([
    (0, common_1.Post)('inventory/:id/receive'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, QuantityDto]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "receive", null);
__decorate([
    (0, common_1.Post)('inventory/:id/cancel-order'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Delete)('inventory/:id'),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PharmacyController.prototype, "archiveItem", null);
exports.PharmacyController = PharmacyController = __decorate([
    (0, common_1.Controller)('pharmacy'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.RolesGuard, auth_guard_1.SubscriptionGuard),
    (0, auth_guard_1.Roles)(client_1.Role.PHARMACY),
    __metadata("design:paramtypes", [pharmacy_service_1.PharmacyService])
], PharmacyController);
//# sourceMappingURL=pharmacy.controller.js.map