/**
 * Caja Module
 *
 * Módulo principal que exporta el controller y configura las rutas
 *
 * CONSOLIDACIÓN:
 * - Rate limiting específico
 * - Manejo de errores tipificados
 * - Request tracking con request_id
 * - Logging estructurado
 */

import { Router } from 'express';
import { Pool } from 'mysql2/promise';
import { CajaController } from './controllers/caja.controller';
import { rateLimiters } from '../../common/middleware/rate-limiter.middleware';

/**
 * Crear router de Caja con todas las rutas
 *
 * @param db - Pool de conexiones a MySQL
 * @returns Router configurado con middlewares de consolidación
 */
export function createCajaRouter(db: Pool): Router {
  const router = Router();
  const controller = new CajaController(db);

  // POST /api/caja/abrir
  // Rate limit: 10 requests/60s (operación crítica)
  router.post(
    '/abrir',
    rateLimiters.deltaSync, // Mismo limiter restrictivo que delta
    (req, res, next) => controller.abrirCaja(req, res, next)
  );

  // POST /api/caja/cerrar
  // Rate limit: 10 requests/60s (operación crítica)
  router.post(
    '/cerrar',
    rateLimiters.deltaSync,
    (req, res, next) => controller.cerrarCaja(req, res, next)
  );

  // POST /api/caja/movimiento
  // Rate limit: 30 requests/60s (operación frecuente)
  router.post(
    '/movimiento',
    rateLimiters.bootstrap,
    (req, res, next) => controller.crearMovimiento(req, res, next)
  );

  // GET /api/caja/sesion/:id
  // Rate limit: 30 requests/60s
  router.get(
    '/sesion/:id',
    rateLimiters.bootstrap,
    (req, res, next) => controller.obtenerSesion(req, res, next)
  );

  // GET /api/caja/activa?sucursal_id=xxx
  // Rate limit: 30 requests/60s
  router.get(
    '/activa',
    rateLimiters.bootstrap,
    (req, res, next) => controller.obtenerSesionActiva(req, res, next)
  );

  // GET /api/caja/movimientos/:sesion_id
  // Rate limit: 30 requests/60s
  router.get(
    '/movimientos/:sesion_id',
    rateLimiters.bootstrap,
    (req, res, next) => controller.obtenerMovimientos(req, res, next)
  );

  // DELETE /api/caja/movimiento/:id (Anular movimiento)
  // Rate limit: 30 requests/60s
  router.delete(
    '/movimiento/:id',
    rateLimiters.bootstrap,
    (req, res, next) => controller.anularMovimiento(req, res, next)
  );

  return router;
}
