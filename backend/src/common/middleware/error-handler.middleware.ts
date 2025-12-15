/**
 * Error Handler Middleware
 *
 * Manejador centralizado de errores con:
 * - Errores tipificados
 * - Logging estructurado
 * - Responses consistentes 4xx/5xx
 */

import { Request, Response, NextFunction } from 'express';
import { TypedError } from '../errors/typed-errors';
import { logger } from '../logging/structured-logger';

/**
 * Middleware de manejo de errores
 */
export function errorHandlerMiddleware(
  err: Error | TypedError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Si ya se envió response, delegar a Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Determinar si es error tipificado o genérico
  const isTypedError = err instanceof TypedError;

  if (isTypedError) {
    // Error tipificado - usar información del error
    const typedError = err as TypedError;

    logger.error('Request failed with typed error', {
      request_id: req.request_id,
      method: req.method,
      path: req.path,
      error_code: typedError.code,
      error_message: typedError.message,
      status_code: typedError.statusCode,
      is_operational: typedError.isOperational,
    }, typedError);

    res.status(typedError.statusCode).json({
      ...typedError.toJSON(),
      request_id: req.request_id,
    });
  } else {
    // Error no tipificado - error 500 genérico
    logger.error('Request failed with unhandled error', {
      request_id: req.request_id,
      method: req.method,
      path: req.path,
      error_message: err.message,
      error_stack: err.stack,
    }, err);

    // NO exponer detalles internos en producción
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(500).json({
      statusCode: 500,
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      request_id: req.request_id,
      ...(isDevelopment && { stack: err.stack }),
    });
  }
}

/**
 * Middleware para capturar errores asíncronos
 */
export function asyncErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
