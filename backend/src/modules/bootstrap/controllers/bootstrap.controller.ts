/**
 * Bootstrap Controller - Bootstrap API v2.0
 *
 * Especificación: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 *
 * Endpoints:
 * 1. GET /api/bootstrap/catalogo?sucursal_id=&page=&limit=
 * 2. GET /api/bootstrap/empleados?sucursal_id=&page=&limit=
 * 3. GET /api/bootstrap/delta?sucursal_id=&since=
 *
 * Headers obligatorios en TODOS los endpoints:
 * - x-bootstrap-version: 2.0.0
 * - cache-control: public, max-age=300
 *
 * CONSOLIDACIÓN:
 * - Usa TypedErrors para manejo estandarizado
 * - Logging estructurado con request_id
 * - Propagación de errores a error-handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { CatalogoService } from '../services/catalogo.service';
import { EmpleadoService } from '../services/empleado.service';
import { DeltaService } from '../services/delta.service';
import { BOOTSTRAP_VERSION } from '../dto/bootstrap-response.dto';
import { validate as isUUID } from 'uuid';
import {
  InvalidUUIDError,
  MissingRequiredParamError,
} from '../../../common/errors/typed-errors';
import { logger } from '../../../common/logging/structured-logger';

export class BootstrapController {
  private catalogoService: CatalogoService;
  private empleadoService: EmpleadoService;
  private deltaService: DeltaService;

  constructor(db: any) {
    this.catalogoService = new CatalogoService(db);
    this.empleadoService = new EmpleadoService(db);
    this.deltaService = new DeltaService(db);
  }

  /**
   * GET /api/bootstrap/catalogo
   *
   * Query Parameters:
   * - sucursal_id (UUID, required)
   * - page (integer, optional, default: 1)
   * - limit (integer, optional, default: 50, max: 100)
   *
   * Response:
   * - Status: 200 OK
   * - Headers: x-bootstrap-version, cache-control
   * - Body: CatalogoResponseDto
   */
  async getCatalogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validar query parameters
      const { sucursal_id, page, limit } = req.query;

      if (!sucursal_id) {
        throw new MissingRequiredParamError('sucursal_id');
      }

      if (!isUUID(sucursal_id as string)) {
        throw new InvalidUUIDError('sucursal_id', sucursal_id as string);
      }

      // 2. Parsear paginación (defaults aplicados en service)
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

      logger.info('GET /api/bootstrap/catalogo', {
        request_id: req.request_id,
        sucursal_id,
        page: pageNum,
        limit: limitNum,
      });

      // 3. Llamar al servicio
      const response = await this.catalogoService.getCatalogo(
        sucursal_id as string,
        pageNum,
        limitNum
      );

      // 4. Setear headers obligatorios
      res.setHeader('x-bootstrap-version', BOOTSTRAP_VERSION);
      res.setHeader('cache-control', 'public, max-age=300');

      // 5. Enviar response
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error in getCatalogo', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error); // Propagar a error-handler middleware
    }
  }

  /**
   * GET /api/bootstrap/empleados
   *
   * Query Parameters:
   * - sucursal_id (UUID, required)
   * - page (integer, optional, default: 1)
   * - limit (integer, optional, default: 50, max: 100)
   *
   * Response:
   * - Status: 200 OK
   * - Headers: x-bootstrap-version, cache-control
   * - Body: EmpleadoResponseDto
   */
  async getEmpleados(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validar query parameters
      const { sucursal_id, page, limit } = req.query;

      if (!sucursal_id) {
        throw new MissingRequiredParamError('sucursal_id');
      }

      if (!isUUID(sucursal_id as string)) {
        throw new InvalidUUIDError('sucursal_id', sucursal_id as string);
      }

      // 2. Parsear paginación
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

      logger.info('GET /api/bootstrap/empleados', {
        request_id: req.request_id,
        sucursal_id,
        page: pageNum,
        limit: limitNum,
      });

      // 3. Llamar al servicio
      const response = await this.empleadoService.getEmpleados(
        sucursal_id as string,
        pageNum,
        limitNum
      );

      // 4. Setear headers obligatorios
      res.setHeader('x-bootstrap-version', BOOTSTRAP_VERSION);
      res.setHeader('cache-control', 'public, max-age=300');

      // 5. Enviar response
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error in getEmpleados', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * GET /api/bootstrap/delta
   *
   * Query Parameters:
   * - sucursal_id (UUID, required)
   * - since (ISO 8601 timestamp, required)
   *
   * Response:
   * - Status: 200 OK
   * - Headers: x-bootstrap-version, cache-control
   * - Body: DeltaResponseDto
   */
  async getDelta(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validar query parameters
      const { sucursal_id, since } = req.query;

      if (!sucursal_id) {
        throw new MissingRequiredParamError('sucursal_id');
      }

      if (!isUUID(sucursal_id as string)) {
        throw new InvalidUUIDError('sucursal_id', sucursal_id as string);
      }

      if (!since) {
        throw new MissingRequiredParamError('since');
      }

      logger.info('GET /api/bootstrap/delta', {
        request_id: req.request_id,
        sucursal_id,
        since,
      });

      // 2. Llamar al servicio (validación de ISO 8601 en service)
      const response = await this.deltaService.getDelta(
        sucursal_id as string,
        since as string
      );

      // 3. Setear headers obligatorios
      res.setHeader('x-bootstrap-version', BOOTSTRAP_VERSION);
      res.setHeader('cache-control', 'public, max-age=300');

      // 4. Enviar response
      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error in getDelta', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }
}
