import { createLogger, format, transports } from 'winston';
import { ConfigService } from '../config';

export class LoggerConfig {
  static createLogger(configService: ConfigService) {
    const { combine, timestamp, errors, json, colorize, printf } = format;

    // Custom format for console output
    const consoleFormat = combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      colorize(),
      printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
          log += `\n${stack}`;
        }
        return log;
      }),
    );

    // JSON format for file output
    const fileFormat = combine(timestamp(), errors({ stack: true }), json());

    // Create transports based on configuration
    const loggerTransports: (
      | transports.ConsoleTransportInstance
      | transports.FileTransportInstance
    )[] = [];

    // Console transport (always enabled)
    loggerTransports.push(
      new transports.Console({
        level: configService.logLevel,
        format: consoleFormat,
      }),
    );

    // File transport (enabled for production or when explicitly configured)
    if (configService.isProduction || configService.logToFile) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DailyRotateFile = require('winston-daily-rotate-file');

        // Application log file
        loggerTransports.push(
          new DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: configService.logLevel,
            format: fileFormat,
          }),
        );

        // Error log file
        loggerTransports.push(
          new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: fileFormat,
          }),
        );
      } catch (error) {
        console.warn(
          'Failed to load winston-daily-rotate-file, file logging disabled:',
          error.message,
        );
      }
    }

    return createLogger({
      level: configService.logLevel,
      format: fileFormat,
      transports: loggerTransports,
      exitOnError: false,
    });
  }
}
