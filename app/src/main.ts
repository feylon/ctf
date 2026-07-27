// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Reverse proxy (nginx) ortida haqiqiy client IP ni olish uchun
  if (process.env.TRUST_PROXY !== 'false') {
    app.set('trust proxy', 1);
  }

  // API JSON qaytaradi, CSP esa Swagger UI ni buzadi, shuning uchun o'chirilgan
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidUnknownValues: true,
  }));

  if (process.env.SWAGGER_ENABLED !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('CTF Platform API')
      .setDescription('CTF musobaqalari va masalalar platformasi uchun REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, documentFactory, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Yuklangan fayllar /uploads/... manzili orqali ochiq beriladi
  // Brauzerda ochilib ketishi xavfli fayllar (html, svg va h.k.) faqat yuklab olinadi
  const inlineSafe = /\.(png|jpe?g|gif|webp|pdf|txt)$/i;
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res, filePath) => {
      if (!inlineSafe.test(filePath)) {
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Server http://localhost:${port} da ishga tushdi`, 'Bootstrap');
}
bootstrap();
