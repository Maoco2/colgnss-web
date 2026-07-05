import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(process.env.API_PREFIX || 'api/v1');

  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:4200,https://colgnss-web-w42d-lemon.vercel.app').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ColGNSS API')
    .setDescription('API for GNSS Survey Planning in Colombia')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
  logger.log(`API docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
