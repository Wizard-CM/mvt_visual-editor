import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvConfig } from './env.config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService<EnvConfig>) {}

  /**
   * Get the application environment
   */
  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  /**
   * Get the application port
   */
  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  /**
   * Get the application host
   */
  get host(): string {
    return this.configService.get('HOST', { infer: true });
  }

  /**
   * Get proxy timeout
   */
  get proxyTimeout(): number {
    return this.configService.get('PROXY_TIMEOUT', { infer: true });
  }

  /**
   * Get proxy max redirects
   */
  get proxyMaxRedirects(): number {
    return this.configService.get('PROXY_MAX_REDIRECTS', { infer: true });
  }

  /**
   * Get proxy user agent
   */
  get proxyUserAgent(): string {
    return this.configService.get('PROXY_USER_AGENT', { infer: true });
  }

  /**
   * Get session TTL
   */
  get sessionTtl(): number {
    return this.configService.get('SESSION_TTL', { infer: true });
  }

  /**
   * Get session max length
   */
  get sessionMaxLength(): number {
    return this.configService.get('SESSION_MAX_LENGTH', { infer: true });
  }

  /**
   * Get log level
   */
  get logLevel(): string {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  /**
   * Get log format
   */
  get logFormat(): string {
    return this.configService.get('LOG_FORMAT', { infer: true });
  }

  /**
   * Get whether to log to file
   */
  get logToFile(): boolean {
    return this.configService.get('LOG_TO_FILE', { infer: true });
  }

  /**
   * Get log directory
   */
  get logDir(): string {
    return this.configService.get('LOG_DIR', { infer: true });
  }

  /**
   * Get CORS origin
   */
  get corsOrigin(): string {
    return this.configService.get('CORS_ORIGIN', { infer: true });
  }

  /**
   * Get rate limit window
   */
  get rateLimitWindow(): string {
    return this.configService.get('RATE_LIMIT_WINDOW', { infer: true });
  }

  /**
   * Get rate limit max
   */
  get rateLimitMax(): number {
    return this.configService.get('RATE_LIMIT_MAX', { infer: true });
  }

  /**
   * Check if the application is running in development mode
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  /**
   * Check if the application is running in production mode
   */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  /**
   * Check if the application is running in test mode
   */
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
