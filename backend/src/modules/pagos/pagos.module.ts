/**
 * Pagos Module
 *
 * Módulo principal que exporta el controller y configura las rutas
 */

import { Router } from 'express';
import { Pool } from 'mysql2/promise';
import { PagoController } from './controllers/pago.controller';
import { rateLimiters } from '../../common/middleware/rate-limiter.middleware';

/**
 * Crear router de Pagos con todas las rutas
 *
 * @param db - Pool de conexiones a MySQL
 * @returns Router configurado con middlewares
 */
export function createPagosRouter(db: Pool): Router {
  const router = Router();
  const controller = new PagoController(db);

  // POST /api/pagos/crear
  // Rate limit: 30 requests/60s (operación frecuente)
  router.post(
    '/crear',
    rateLimiters.bootstrap,
    (req, res, next) => controller.crearPago(req, res, next)
  );

  // POST /api/pagos/webpay/confirmar
  // Rate limit: 30 requests/60s
  router.post(
    '/webpay/confirmar',
    rateLimiters.bootstrap,
    (req, res, next) => controller.confirmarPagoWebpay(req, res, next)
  );

  // GET /api/pagos/:id
  // Rate limit: 30 requests/60s
  router.get(
    '/:id',
    rateLimiters.bootstrap,
    (req, res, next) => controller.obtenerPago(req, res, next)
  );

  // GET /api/pagos/venta/:venta_id
  // Rate limit: 30 requests/60s
  router.get(
    '/venta/:venta_id',
    rateLimiters.bootstrap,
    (req, res, next) => controller.obtenerPagosPorVenta(req, res, next)
  );

  // DELETE /api/pagos/:id/anular
  // Rate limit: 10 requests/60s (operación crítica)
  router.delete(
    '/:id/anular',
    rateLimiters.deltaSync,
    (req, res, next) => controller.anularPago(req, res, next)
  );

  return router;
}
