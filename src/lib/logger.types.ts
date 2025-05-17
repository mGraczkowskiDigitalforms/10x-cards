import { z } from 'zod';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Sensitive data patterns
export const SENSITIVE_PATTERNS = {
  API_KEY: /sk-[a-zA-Z0-9]{32,}/g,
  AUTH_TOKEN: /Bearer\s+[a-zA-Z0-9._-]+/g,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PASSWORD: /password['"]?\s*[:=]\s*['"]?[^'"}\s]+['"]?/gi,
  CREDIT_CARD: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  ACCESS_KEY: /access_key['"]?\s*[:=]\s*['"]?[^'"}\s]+['"]?/gi,
  SECRET_KEY: /secret_key['"]?\s*[:=]\s*['"]?[^'"}\s]+['"]?/gi,
};

export interface LogContext {
  timestamp: string;
  service: string;
  environment: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
}

export interface SanitizeOptions {
  patterns?: RegExp[];
  replacement?: string;
  excludeKeys?: string[];
}

export interface Logger {
  debug(message: string, context?: Partial<LogContext>): void;
  info(message: string, context?: Partial<LogContext>): void;
  warn(message: string, context?: Partial<LogContext>): void;
  error(message: string, error?: Error, context?: Partial<LogContext>): void;
  sanitize(data: unknown, options?: SanitizeOptions): unknown;
}

// Validation schemas
export const logContextSchema = z.object({
  timestamp: z.string(),
  service: z.string(),
  environment: z.string(),
}).catchall(z.unknown());

export const logEntrySchema = z.object({
  level: z.nativeEnum(LogLevel),
  message: z.string(),
  context: logContextSchema,
  error: z.instanceof(Error).optional(),
});

export const sanitizeOptionsSchema = z.object({
  patterns: z.array(z.instanceof(RegExp)).optional(),
  replacement: z.string().optional(),
  excludeKeys: z.array(z.string()).optional(),
}); 