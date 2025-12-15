/**
 * Bootstrap Module - Bootstrap API v2.0
 *
 * Módulo principal que exporta el controller y configura las rutas
 */

import { Router } from 'express';
import { BootstrapController } from './controllers/bootstrap.controller';

/**
 * Crear router de Bootstrap con todas las rutas
 *
 * @param db - Conexión a base de datos MySQL
 * @returns Router configurado
 */
export function createBootstrapRouter(db: any): Router {
  const router = Router();
  const controller = new BootstrapController(db);

  // GET /api/bootstrap/catalogo
  router.get('/catalogo', (req, res) => controller.getCatalogo(req, res));

  // GET /api/bootstrap/empleados
  router.get('/empleados', (req, res) => controller.getEmpleados(req, res));

  // GET /api/bootstrap/delta
  router.get('/delta', (req, res) => controller.getDelta(req, res));

  return router;
}
