import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { ConfigService } from '../config';
import { LoggerConfig } from './logger.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;
  private context?: string;

  constructor(private readonly configService: ConfigService) {
    this.logger = this.createLogger();
  }

  private createLogger(): Logger {
    return LoggerConfig.createLogger(this.configService);
  }

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  log(message: string, context?: string): void {
    const logContext = context || this.context || 'Application';
    this.logger.info(message, { context: logContext });
  }

  error(message: string, trace?: string, context?: string): void {
    const logContext = context || this.context || 'Application';
    this.logger.error(message, { trace, context: logContext });
  }

  warn(message: string, context?: string): void {
    const logContext = context || this.context || 'Application';
    this.logger.warn(message, { context: logContext });
  }

  debug(message: string, context?: string): void {
    const logContext = context || this.context || 'Application';
    this.logger.debug(message, { context: logContext });
  }

  verbose(message: string, context?: string): void {
    const logContext = context || this.context || 'Application';
    this.logger.verbose(message, { context: logContext });
  }

  // Additional utility methods
  info(message: string, context?: string): void {
    this.log(message, context);
  }

  // Structured logging with metadata
  logWithMeta(
    level: 'info' | 'warn' | 'error' | 'debug' | 'verbose',
    message: string,
    meta: Record<string, unknown>,
    context?: string,
  ): void {
    const logContext = context || this.context || 'Application';
    this.logger[level](message, { ...meta, context: logContext });
  }

  // HTTP request logging
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: string,
  ): void {
    const logContext = context || this.context || 'HTTP';
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      context: logContext,
    });
  }

  // Session logging
  logSession(
    sessionId: string,
    action: string,
    details: Record<string, unknown>,
    context?: string,
  ): void {
    const logContext = context || this.context || 'Session';
    this.logger.info('Session Action', {
      sessionId,
      action,
      details,
      context: logContext,
    });
  }

  // Proxy logging
  logProxy(
    sessionId: string,
    action: string,
    targetUrl: string,
    details: Record<string, unknown>,
    context?: string,
  ): void {
    const logContext = context || this.context || 'Proxy';
    this.logger.info('Proxy Action', {
      sessionId,
      targetUrl,
      action,
      details,
      context: logContext,
    });
  }
}
