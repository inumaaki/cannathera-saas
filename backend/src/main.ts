import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Railway/Vercel-style deployments terminate the public connection at a
  // reverse proxy. Trust only the configured number of nearest proxy hops so
  // Express/Nest's `@Ip()` resolves the client from X-Forwarded-For without
  // accepting an arbitrary spoofed header on local/direct connections.
  const configuredProxyHops = process.env.TRUST_PROXY_HOPS;
  const trustProxyHops = Number(
    configuredProxyHops ?? (process.env.NODE_ENV === 'production' ? '1' : '0'),
  );
  if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  }

  app.use(cookieParser());
  // Public assets only — practice logos. Report PDFs are Art. 9 health data and
  // are NEVER served statically; they go through GET /reports/file/:id, which
  // checks that the caller is on that patient's case.
  app.useStaticAssets(join(process.cwd(), 'uploads', 'public'), {
    prefix: '/uploads/',
  });
  const rawOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const allowedOrigins = rawOrigin.endsWith('/')
    ? [rawOrigin, rawOrigin.slice(0, -1)]
    : [rawOrigin, rawOrigin + '/'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  // Web (Next.js) runs on 3000; API defaults to 4000.
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
