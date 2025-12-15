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
 */

import { Request, Response } from 'express';
import { CatalogoService } from '../services/catalogo.service';
import { EmpleadoService } from '../services/empleado.service';
import { DeltaService } from '../services/delta.service';
import { BOOTSTRAP_VERSION } from '../dto/bootstrap-response.dto';
import { validate as isUUID } from 'uuid';

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
  async getCatalogo(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validar query parameters
      const { sucursal_id, page, limit } = req.query;

      if (!sucursal_id) {
        res.status(400).json({
          statusCode: 400,
          message: 'sucursal_id es requerido',
          error: 'Bad Request',
        });
        return;
      }

      if (!isUUID(sucursal_id as string)) {
        res.status(400).json({
          statusCode: 400,
          message: 'sucursal_id debe ser un UUID válido',
          error: 'Bad Request',
        });
        return;
      }

      // 2. Parsear paginación (defaults aplicados en service)
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

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
      this.handleError(res, error);
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
  async getEmpleados(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validar query parameters
      const { sucursal_id, page, limit } = req.query;

      if (!sucursal_id) {
        res.status(400).json({
          statusCode: 400,
          message: 'sucursal_id es requerido',
          error: 'Bad Request',
        });
        return;
      }

      if (!isUUID(sucursal_id as string)) {
        res.status(400).json({
          statusCode: 400,
          message: 'sucursal_id debe ser un UUID válido',
          error: 'Bad Request',
        });
        return;
      }

      // 2. Parsear paginación
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

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
      this.handleError(res, error);
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
  async getDelta(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validar query parameters
      const { sucursal_id, since } = req.query;

      if (!sucursal_id) {
        res.status(400).json({
          statusCode: 400,
          message: 'sucursal_id es requerido',
          error: 'Bad Request',
        });
        return;
      }

      if (!isUUID(sucursal_id as string)) {
        res.status(400).json({
          statusCode: 400,
          message: 'sucursal_id debe ser un UUID válido',
          error: 'Bad Request',
        });
        return;
      }

      if (!since) {
        res.status(400).json({
          statusCode: 400,
          message: 'since es requerido',
          error: 'Bad Request',
        });
        return;
      }

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
      this.handleError(res, error);
    }
  }

  /**
   * Manejador de errores centralizado
   */
  private handleError(res: Response, error: any): void {
    console.error('Bootstrap API Error:', error);

    // Error de validación (400)
    if (
      error.message.includes('debe ser') ||
      error.message.includes('es requerido') ||
      error.message.includes('ISO 8601') ||
      error.message.includes('UUID')
    ) {
      res.status(400).json({
        statusCode: 400,
        message: error.message,
        error: 'Bad Request',
      });
      return;
    }

    // Error de recurso no encontrado (404)
    if (error.message.includes('no encontrada') || error.message.includes('no existe')) {
      res.status(404).json({
        statusCode: 404,
        message: error.message,
        error: 'Not Found',
      });
      return;
    }

    // Error interno del servidor (500)
    res.status(500).json({
      statusCode: 500,
      message: 'Error interno del servidor',
      error: 'Internal Server Error',
    });
  }
}
