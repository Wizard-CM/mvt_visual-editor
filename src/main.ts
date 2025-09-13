import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { MainConfig } from './main.config';
import { ConfigService } from './config';
import { LoggerService } from './logger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure the application using the config class
  MainConfig.configureApp(app);

  // Get configuration service and logger
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  const port = configService.port;
  const host = configService.host;

  await app.listen(port, host);

  const bootstrapLogger = logger.setContext('Bootstrap');
  bootstrapLogger.info(`Application is running on: http://${host}:${port}`);
  bootstrapLogger.info(`Environment: ${configService.nodeEnv}`);
}
bootstrap();
