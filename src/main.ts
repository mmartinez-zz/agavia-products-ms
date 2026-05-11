import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AgaviaLoggerService } from '@mmartinez-zz/agavia-observability';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AgaviaLoggerService);
  app.useLogger(logger);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
