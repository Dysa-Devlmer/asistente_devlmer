/**
 * Request Logger Middleware
 *
 * Log estructurado de todos los requests con:
 * - Request ID
 * - Method, Path
 * - Status Code
 * - Duration
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/structured-logger';

/**
 * Middleware para logging de requests
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log de request entrante
  logger.info('Incoming request', {
    request_id: req.request_id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Interceptar response para loggear al finalizar
  const originalSend = res.send;

  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    // Log de response
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    const message = res.statusCode >= 500
      ? 'Request failed with server error'
      : res.statusCode >= 400
      ? 'Request failed with client error'
      : 'Request completed successfully';

    logger[logLevel](message, {
      request_id: req.request_id,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: duration,
    });

    return originalSend.call(this, data);
  };

  next();
}
