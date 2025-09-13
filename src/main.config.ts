import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config';

/**
 * Application configuration and initialization
 * Contains all the setup logic for the NestJS application
 */
export class MainConfig {
  /**
   * Configure global pipes and middleware for the application
   * @param app The NestJS application instance
   */
  static configureApp(app: NestExpressApplication): void {
    // Enable CORS using environment configuration
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',').map((origin) =>
        origin.trim(),
      ) || [
        'http://localhost:3333',
        'http://localhost:3000',
        'http://127.0.0.1:3333',
        'http://127.0.0.1:3000',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });

    // Enable global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
  }

  /**
   * Get the application port from configuration
   * @param configService The configuration service instance
   * @returns The port number to run the application on
   */
  static getPort(configService: ConfigService): number {
    return configService.port;
  }

  /**
   * Get the application host from configuration
   * @param configService The configuration service instance
   * @returns The host to bind the application to
   */
  static getHost(configService: ConfigService): string {
    return configService.host;
  }

  /**
   * Get application environment from configuration
   * @param configService The configuration service instance
   * @returns The current environment (development, production, etc.)
   */
  static getEnvironment(configService: ConfigService): string {
    return configService.nodeEnv;
  }

  /**
   * Check if the application is running in development mode
   * @param configService The configuration service instance
   * @returns True if in development mode
   */
  static isDevelopment(configService: ConfigService): boolean {
    return configService.isDevelopment;
  }

  /**
   * Check if the application is running in production mode
   * @param configService The configuration service instance
   * @returns True if in production mode
   */
  static isProduction(configService: ConfigService): boolean {
    return configService.isProduction;
  }
}
