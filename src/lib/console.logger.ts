import type { Logger, LogContext, SanitizeOptions } from './logger.types';
import { LogLevel, logEntrySchema, SENSITIVE_PATTERNS, sanitizeOptionsSchema } from './logger.types';

export class ConsoleLogger implements Logger {
  private readonly defaultContext: Partial<LogContext>;
  private readonly defaultSanitizeOptions: Required<SanitizeOptions> = {
    patterns: Object.values(SENSITIVE_PATTERNS),
    replacement: '[REDACTED]',
    excludeKeys: ['timestamp', 'service', 'environment', 'level']
  };

  constructor(service: string) {
    this.defaultContext = {
      service,
      environment: process.env.NODE_ENV ?? 'development'
    };
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Partial<LogContext>
  ) {
    const timestamp = new Date().toISOString();
    const fullContext = {
      ...this.defaultContext,
      ...context,
      timestamp
    };

    // Sanitize context before creating log entry
    const sanitizedContext = this.sanitize(fullContext) as LogContext;
    const sanitizedMessage = this.sanitize(message) as string;
    const sanitizedError = error ? this.sanitizeError(error) : undefined;

    return logEntrySchema.parse({
      level,
      message: sanitizedMessage,
      context: sanitizedContext,
      error: sanitizedError
    });
  }

  private formatError(error: Error): string {
    return `${error.name}: ${error.message}\n${error.stack ?? ''}`;
  }

  private sanitizeError(error: Error): Error {
    const sanitizedMessage = this.sanitize(error.message) as string;
    const sanitizedStack = error.stack ? this.sanitize(error.stack) as string : undefined;
    
    const sanitizedError = new Error(sanitizedMessage);
    sanitizedError.name = error.name;
    sanitizedError.stack = sanitizedStack;
    
    return sanitizedError;
  }

  public sanitize(data: unknown, options?: SanitizeOptions): unknown {
    const sanitizeOpts = sanitizeOptionsSchema.parse({
      ...this.defaultSanitizeOptions,
      ...options
    });

    const sanitizeValue = (value: string): string => {
      let result = value;
      for (const pattern of sanitizeOpts.patterns ?? []) {
        result = result.replace(pattern, sanitizeOpts.replacement ?? '[REDACTED]');
      }
      return result;
    };

    const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        // Skip excluded keys
        if (sanitizeOpts.excludeKeys?.includes(key)) {
          result[key] = value;
          continue;
        }

        if (typeof value === 'string') {
          result[key] = sanitizeValue(value);
        } else if (value instanceof Error) {
          result[key] = this.sanitizeError(value);
        } else if (Array.isArray(value)) {
          result[key] = value.map(item => this.sanitize(item, sanitizeOpts));
        } else if (value && typeof value === 'object') {
          result[key] = this.sanitize(value, sanitizeOpts);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    if (typeof data === 'string') {
      return sanitizeValue(data);
    } else if (data instanceof Error) {
      return this.sanitizeError(data);
    } else if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, sanitizeOpts));
    } else if (data && typeof data === 'object') {
      return sanitizeObject(data as Record<string, unknown>);
    }

    return data;
  }

  debug(message: string, context?: Partial<LogContext>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, undefined, context);
    console.debug(`[${entry.context.service}] ${entry.message}`, { context: entry.context });
  }

  info(message: string, context?: Partial<LogContext>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, undefined, context);
    console.info(`[${entry.context.service}] ${entry.message}`, { context: entry.context });
  }

  warn(message: string, context?: Partial<LogContext>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, undefined, context);
    console.warn(`[${entry.context.service}] ${entry.message}`, { context: entry.context });
  }

  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, error, context);
    console.error(
      `[${entry.context.service}] ${entry.message}`,
      error ? `\n${this.formatError(entry.error as Error)}` : '',
      { context: entry.context }
    );
  }
} 