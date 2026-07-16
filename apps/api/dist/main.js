"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, cookie_parser_1.default)());
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads', 'public'), {
        prefix: '/uploads/',
    });
    app.enableCors({
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }));
    await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
//# sourceMappingURL=main.js.map