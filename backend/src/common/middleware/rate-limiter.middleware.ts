/**
 * Rate Limiter Middleware
 *
 * Límites de tasa por endpoint con:
 * - Límites configurables
 * - Headers informativos (X-RateLimit-*)
 * - Error 429 con retry-after
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitExceededError } from '../errors/typed-errors';
import { logger } from '../logging/structured-logger';

interface RateLimitConfig {
  windowMs: number;    // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests en ventana
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiter simple en memoria
 * En producción usar Redis para distributed rate limiting
 */
class InMemoryRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  constructor(private config: RateLimitConfig) {
    // Limpiar registros expirados cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Verificar si request está dentro del límite
   */
  checkLimit(key: string): { allowed: boolean; resetTime: number; current: number } {
    const now = Date.now();
    const record = this.records.get(key);

    // Si no existe registro o expiró, crear nuevo
    if (!record || now > record.resetTime) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.records.set(key, newRecord);
      return { allowed: true, resetTime: newRecord.resetTime, current: 1 };
    }

    // Incrementar contador
    record.count++;

    // Verificar si excede límite
    if (record.count > this.config.maxRequests) {
      return { allowed: false, resetTime: record.resetTime, current: record.count };
    }

    return { allowed: true, resetTime: record.resetTime, current: record.count };
  }

  /**
   * Limpiar registros expirados
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }
}

/**
 * Crear middleware de rate limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = new InMemoryRateLimiter(config);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Usar IP como key (en producción, considerar user_id o API key)
    const key = req.ip || 'unknown';

    const { allowed, resetTime, current } = limiter.checkLimit(key);

    // Añadir headers informativos
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current));
    res.setHeader('X-RateLimit-Reset', Math.floor(resetTime / 1000));

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);

      logger.warn('Rate limit exceeded', {
        request_id: req.request_id,
        ip: req.ip,
        path: req.path,
        current_count: current,
        limit: config.maxRequests,
        window_ms: config.windowMs,
      });

      throw new RateLimitExceededError(config.maxRequests, config.windowMs, {
        request_id: req.request_id,
        retry_after: retryAfter,
      });
    }

    next();
  };
}

/**
 * Rate limiters predefinidos
 */
export const rateLimiters = {
  // General: 100 requests por minuto
  general: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),

  // Bootstrap endpoints: 30 requests por minuto (más restrictivo)
  bootstrap: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
  }),

  // Delta sync: 10 requests por minuto (muy restrictivo)
  deltaSyncreateRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
  }),
};
