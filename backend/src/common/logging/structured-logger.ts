/**
 * Logging Estructurado con Request ID
 *
 * Logger centralizado con:
 * - Request ID único por request
 * - Logs estructurados en JSON
 * - Niveles: error, warn, info, debug
 * - Metadata contextual
 */

import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogMetadata {
  request_id?: string;
  user_id?: string;
  sucursal_id?: string;
  method?: string;
  path?: string;
  status_code?: number;
  duration_ms?: number;
  error_code?: string;
  [key: string]: any;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata: LogMetadata;
}

/**
 * Logger estructurado
 */
export class StructuredLogger {
  private serviceName: string;

  constructor(serviceName: string = 'pos-venta-api') {
    this.serviceName = serviceName;
  }

  /**
   * Log de error
   */
  error(message: string, metadata: LogMetadata = {}, error?: Error): void {
    this.log(LogLevel.ERROR, message, {
      ...metadata,
      error_message: error?.message,
      error_stack: error?.stack,
    });
  }

  /**
   * Log de warning
   */
  warn(message: string, metadata: LogMetadata = {}): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log de info
   */
  info(message: string, metadata: LogMetadata = {}): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log de debug
   */
  debug(message: string, metadata: LogMetadata = {}): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log genérico estructurado
   */
  private log(level: LogLevel, message: string, metadata: LogMetadata): void {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: {
        ...metadata,
        service: this.serviceName,
      },
    };

    // En producción, enviar a sistema de logs centralizado (Loki, CloudWatch, etc.)
    // Por ahora, imprimir en consola como JSON
    const logString = JSON.stringify(log);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
    }
  }

  /**
   * Generar request ID único
   */
  static generateRequestId(): string {
    return uuidv4();
  }

  /**
   * Extraer request ID de headers (si existe)
   */
  static extractRequestId(headers: any): string | undefined {
    return headers['x-request-id'] || headers['X-Request-ID'];
  }
}

/**
 * Instancia singleton del logger
 */
export const logger = new StructuredLogger();
