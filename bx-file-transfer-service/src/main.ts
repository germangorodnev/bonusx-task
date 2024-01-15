import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { logger } from './configs/logger';
import mqttConfig from './configs/mqtt';
import { AppModule } from './modules/app.module';
import { handleBootstrapIssue } from './utils/handle-bootstrap-issue';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    ...mqttConfig,
    logger,
  });

  const loggerService = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.enableShutdownHooks();

  process.on('SIGTERM', function beforeExitFromProcess() {
    loggerService.log('Exit signal');
    app.close();
    process.exit(0);
  });

  await app.listen();
}

bootstrap().catch(handleBootstrapIssue);
