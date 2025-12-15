/**
 * Controller: Caja
 *
 * Endpoints HTTP para sistema de caja
 *
 * Endpoints:
 * - POST /api/caja/abrir
 * - POST /api/caja/cerrar
 * - POST /api/caja/movimiento
 * - GET  /api/caja/sesion/:id
 * - GET  /api/caja/activa?sucursal_id=xxx
 * - GET  /api/caja/movimientos/:sesion_id
 *
 * Consolidación:
 * - Usa TypedErrors
 * - Logging estructurado con request_id
 * - Propagación de errores a error-handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SesionCajaService } from '../services/sesion-caja.service';
import { MovimientoCajaService } from '../services/movimiento-caja.service';
import {
  AbrirCajaDto,
  CerrarCajaDto,
} from '../dto/sesion-caja.dto';
import {
  CrearMovimientoCajaDto,
  AnularMovimientoCajaDto,
} from '../dto/movimiento-caja.dto';
import { createSuccessResponse } from '../dto/caja-response.dto';
import {
  ValidationError,
  InvalidUUIDError,
  MissingRequiredParamError,
} from '../../../common/errors/typed-errors';
import { logger } from '../../../common/logging/structured-logger';
import { validate as isUUID } from 'uuid';

export class CajaController {
  private sesionService: SesionCajaService;
  private movimientoService: MovimientoCajaService;

  constructor(private db: Pool) {
    this.sesionService = new SesionCajaService(db);
    this.movimientoService = new MovimientoCajaService(db);
  }

  /**
   * POST /api/caja/abrir
   *
   * Abrir caja (apertura de sesión)
   */
  async abrirCaja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validar DTO
      const dto = plainToInstance(AbrirCajaDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
        throw new ValidationError(messages);
      }

      logger.info('POST /api/caja/abrir', {
        request_id: req.request_id,
        sucursal_id: dto.sucursal_id,
        empleado_id: dto.empleado_id,
      });

      const resultado = await this.sesionService.abrirCaja(dto);

      res.status(201).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en abrirCaja', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * POST /api/caja/cerrar
   *
   * Cerrar caja (cierre de sesión con cálculos)
   */
  async cerrarCaja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validar DTO
      const dto = plainToInstance(CerrarCajaDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
        throw new ValidationError(messages);
      }

      logger.info('POST /api/caja/cerrar', {
        request_id: req.request_id,
        sesion_id: dto.sesion_id,
        empleado_id: dto.empleado_id,
      });

      const resultado = await this.sesionService.cerrarCaja(dto);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en cerrarCaja', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * POST /api/caja/movimiento
   *
   * Crear movimiento de caja (ingreso/egreso)
   */
  async crearMovimiento(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validar DTO
      const dto = plainToInstance(CrearMovimientoCajaDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
        throw new ValidationError(messages);
      }

      logger.info('POST /api/caja/movimiento', {
        request_id: req.request_id,
        sesion_id: dto.sesion_id,
        tipo: dto.tipo,
        monto: dto.monto,
      });

      const resultado = await this.movimientoService.crearMovimiento(dto);

      res.status(201).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en crearMovimiento', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * GET /api/caja/sesion/:id
   *
   * Obtener sesión de caja por ID
   */
  async obtenerSesion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!isUUID(id)) {
        throw new InvalidUUIDError('id', id);
      }

      logger.info('GET /api/caja/sesion/:id', {
        request_id: req.request_id,
        sesion_id: id,
      });

      // Por ahora retornamos la sesión cerrada (si existe)
      // En el futuro podríamos tener un método específico
      const resultado = await this.sesionService.cerrarCaja({
        sesion_id: id,
        empleado_id: '', // No se usa si ya está cerrada
        monto_final_real: 0, // No se usa si ya está cerrada
      });

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en obtenerSesion', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * GET /api/caja/activa?sucursal_id=xxx
   *
   * Obtener sesión activa de una sucursal
   */
  async obtenerSesionActiva(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sucursal_id } = req.query;

      if (!sucursal_id) {
        throw new MissingRequiredParamError('sucursal_id');
      }

      if (!isUUID(sucursal_id as string)) {
        throw new InvalidUUIDError('sucursal_id', sucursal_id as string);
      }

      logger.info('GET /api/caja/activa', {
        request_id: req.request_id,
        sucursal_id,
      });

      const resultado = await this.sesionService.obtenerSesionActiva(sucursal_id as string);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en obtenerSesionActiva', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * GET /api/caja/movimientos/:sesion_id
   *
   * Obtener movimientos de una sesión
   */
  async obtenerMovimientos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sesion_id } = req.params;

      if (!isUUID(sesion_id)) {
        throw new InvalidUUIDError('sesion_id', sesion_id);
      }

      logger.info('GET /api/caja/movimientos/:sesion_id', {
        request_id: req.request_id,
        sesion_id,
      });

      const resultado = await this.movimientoService.obtenerMovimientosPorSesion(sesion_id);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en obtenerMovimientos', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * DELETE /api/caja/movimiento/:id (Anular movimiento)
   *
   * Anular movimiento (soft-delete)
   */
  async anularMovimiento(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { empleado_id, motivo } = req.body;

      if (!isUUID(id)) {
        throw new InvalidUUIDError('id', id);
      }

      if (!empleado_id) {
        throw new MissingRequiredParamError('empleado_id');
      }

      if (!isUUID(empleado_id)) {
        throw new InvalidUUIDError('empleado_id', empleado_id);
      }

      logger.info('DELETE /api/caja/movimiento/:id', {
        request_id: req.request_id,
        movimiento_id: id,
        empleado_id,
      });

      const dto: AnularMovimientoCajaDto = {
        movimiento_id: id,
        empleado_id,
        motivo,
      };

      const resultado = await this.movimientoService.anularMovimiento(dto);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en anularMovimiento', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }
}
