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
exports.StripeController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const auth_guard_1 = require("../auth/auth.guard");
const stripe_service_1 = require("./stripe.service");
class CreateCheckoutDto {
    planTier;
    successUrl;
    cancelUrl;
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionTier),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "planTier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "successUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCheckoutDto.prototype, "cancelUrl", void 0);
let StripeController = class StripeController {
    stripeService;
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async createCheckout(req, dto) {
        return this.stripeService.createCheckoutSession(req.user.sub, dto.planTier, dto.successUrl, dto.cancelUrl);
    }
    async simulateSuccess(sessionId, orgId, userId, tier, res) {
        if (sessionId && sessionId.startsWith('cs_')) {
            try {
                const session = await this.stripeService.retrieveCheckoutSession(sessionId);
                if (session) {
                    const uId = session.metadata?.userId;
                    const oId = session.metadata?.orgId;
                    const t = session.metadata?.planTier;
                    if (oId && t) {
                        await this.stripeService.fulfillSimulatedCheckout(oId, t);
                        return res.redirect('http://localhost:3000/en/enterprise/billing?success=true');
                    }
                    if (uId && t) {
                        await this.stripeService.fulfillPatientCheckout(uId, t);
                        return res.redirect('http://localhost:3000/en/patient/plan?success=true');
                    }
                }
            }
            catch (err) {
            }
        }
        if (orgId && tier) {
            await this.stripeService.fulfillSimulatedCheckout(orgId, tier);
            return res.redirect('http://localhost:3000/en/enterprise/billing?success=true');
        }
        if (userId && tier) {
            await this.stripeService.fulfillPatientCheckout(userId, tier);
            return res.redirect('http://localhost:3000/en/patient/plan?success=true');
        }
        return res.redirect('http://localhost:3000/en/login');
    }
    async handleWebhook(signature, req) {
        return this.stripeService.handleWebhook(signature, req.body);
    }
};
exports.StripeController = StripeController;
__decorate([
    (0, common_1.Post)('checkout'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateCheckoutDto]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Get)('simulate-success'),
    __param(0, (0, common_1.Query)('session_id')),
    __param(1, (0, common_1.Query)('orgId')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('tier')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, Object]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "simulateSuccess", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('stripe-signature')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "handleWebhook", null);
exports.StripeController = StripeController = __decorate([
    (0, common_1.Controller)('stripe'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService])
], StripeController);
//# sourceMappingURL=stripe.controller.js.map