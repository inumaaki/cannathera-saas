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
exports.QuestionnaireController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const auth_guard_1 = require("../auth/auth.guard");
const questionnaire_service_1 = require("./questionnaire.service");
class SubmitDto {
    answers;
}
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitDto.prototype, "answers", void 0);
function toLocale(value) {
    return Object.values(client_1.Locale).includes(value) ? value : client_1.Locale.de;
}
let QuestionnaireController = class QuestionnaireController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(locale) {
        return this.service.list(toLocale(locale));
    }
    mySubmissions(user) {
        return this.service.mySubmissions(user.sub);
    }
    structure(key, locale) {
        return this.service.structure(key, toLocale(locale));
    }
    submit(user, key, dto, locale) {
        return this.service.submit(user.sub, key, dto.answers, toLocale(locale));
    }
};
exports.QuestionnaireController = QuestionnaireController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('submissions/mine'),
    (0, auth_guard_1.Roles)(client_1.Role.PATIENT),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "mySubmissions", null);
__decorate([
    (0, common_1.Get)(':key'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "structure", null);
__decorate([
    (0, common_1.Post)(':key/submissions'),
    (0, auth_guard_1.Roles)(client_1.Role.PATIENT),
    __param(0, (0, auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('key')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Query)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, SubmitDto, String]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "submit", null);
exports.QuestionnaireController = QuestionnaireController = __decorate([
    (0, common_1.Controller)('questionnaires'),
    (0, common_1.UseGuards)(auth_guard_1.SessionGuard, auth_guard_1.RolesGuard),
    __metadata("design:paramtypes", [questionnaire_service_1.QuestionnaireService])
], QuestionnaireController);
//# sourceMappingURL=questionnaire.controller.js.map