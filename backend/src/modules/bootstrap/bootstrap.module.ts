/**
 * Bootstrap Module - Bootstrap API v2.0
 *
 * Módulo principal que exporta el controller y configura las rutas
 *
 * CONSOLIDACIÓN:
 * - Rate limiting específico por endpoint
 * - Manejo de errores tipificados
 * - Request tracking con request_id
 */

import { Router } from 'express';
import { BootstrapController } from './controllers/bootstrap.controller';
import { rateLimiters } from '../../common/middleware/rate-limiter.middleware';

/**
 * Crear router de Bootstrap con todas las rutas
 *
 * @param db - Conexión a base de datos MySQL
 * @returns Router configurado con middlewares de consolidación
 */
export function createBootstrapRouter(db: any): Router {
  const router = Router();
  const controller = new BootstrapController(db);

  // GET /api/bootstrap/catalogo
  // Rate limit: 30 requests/60s
  router.get('/catalogo', rateLimiters.bootstrap, (req, res, next) =>
    controller.getCatalogo(req, res, next)
  );

  // GET /api/bootstrap/empleados
  // Rate limit: 30 requests/60s
  router.get('/empleados', rateLimiters.bootstrap, (req, res, next) =>
    controller.getEmpleados(req, res, next)
  );

  // GET /api/bootstrap/delta
  // Rate limit: 10 requests/60s (más restrictivo por ser operación costosa)
  router.get('/delta', rateLimiters.deltaSync, (req, res, next) =>
    controller.getDelta(req, res, next)
  );

  return router;
}
