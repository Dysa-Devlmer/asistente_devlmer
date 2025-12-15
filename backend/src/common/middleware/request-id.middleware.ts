/**
 * Request ID Middleware
 *
 * Genera un request_id único para cada request y lo añade a:
 * - Response headers (x-request-id)
 * - Request object (req.request_id)
 * - Logs
 */

import { Request, Response, NextFunction } from 'express';
import { StructuredLogger } from '../logging/structured-logger';

// Extender Request type para incluir request_id
declare global {
  namespace Express {
    interface Request {
      request_id?: string;
      start_time?: number;
    }
  }
}

/**
 * Middleware para generar/extraer request_id
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Intentar extraer request_id de headers (si viene del cliente)
  const existingRequestId = StructuredLogger.extractRequestId(req.headers);

  // 2. Generar nuevo request_id si no existe
  const requestId = existingRequestId || StructuredLogger.generateRequestId();

  // 3. Añadir a request object
  req.request_id = requestId;
  req.start_time = Date.now();

  // 4. Añadir a response headers
  res.setHeader('x-request-id', requestId);

  next();
}
