/**
 * Controller: Pago
 *
 * Endpoints HTTP para sistema de pagos
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PagoService } from '../services/pago.service';
import {
  CrearPagoDto,
  ConfirmarPagoWebpayDto,
  AnularPagoDto,
} from '../dto/pago.dto';
import { createSuccessResponse } from '../dto/pago-response.dto';
import {
  ValidationError,
  InvalidUUIDError,
} from '../../../common/errors/typed-errors';
import { logger } from '../../../common/logging/structured-logger';
import { validate as isUUID } from 'uuid';

export class PagoController {
  private pagoService: PagoService;

  constructor(private db: Pool) {
    this.pagoService = new PagoService(db);
  }

  /**
   * POST /api/pagos/crear
   * Crear un nuevo pago (efectivo o iniciar Webpay)
   */
  async crearPago(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = plainToInstance(CrearPagoDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
        throw new ValidationError(messages);
      }

      logger.info('POST /api/pagos/crear', {
        request_id: req.request_id,
        venta_id: dto.venta_id,
        metodo: dto.metodo,
      });

      const resultado = await this.pagoService.crearPago(dto);

      res.status(201).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en crearPago', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * POST /api/pagos/webpay/confirmar
   * Confirmar pago Webpay (callback después de redirección)
   */
  async confirmarPagoWebpay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = plainToInstance(ConfirmarPagoWebpayDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
        throw new ValidationError(messages);
      }

      logger.info('POST /api/pagos/webpay/confirmar', {
        request_id: req.request_id,
        token: dto.token_ws,
      });

      const resultado = await this.pagoService.confirmarPagoWebpay(dto);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en confirmarPagoWebpay', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * GET /api/pagos/:id
   * Obtener detalles de un pago
   */
  async obtenerPago(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!isUUID(id)) {
        throw new InvalidUUIDError('id', id);
      }

      logger.info('GET /api/pagos/:id', {
        request_id: req.request_id,
        pago_id: id,
      });

      const resultado = await this.pagoService.obtenerPago(id);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en obtenerPago', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * GET /api/pagos/venta/:venta_id
   * Obtener todos los pagos de una venta
   */
  async obtenerPagosPorVenta(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { venta_id } = req.params;

      if (!isUUID(venta_id)) {
        throw new InvalidUUIDError('venta_id', venta_id);
      }

      logger.info('GET /api/pagos/venta/:venta_id', {
        request_id: req.request_id,
        venta_id,
      });

      const resultado = await this.pagoService.obtenerPagosPorVenta(venta_id);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en obtenerPagosPorVenta', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }

  /**
   * DELETE /api/pagos/:id/anular
   * Anular un pago
   */
  async anularPago(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!isUUID(id)) {
        throw new InvalidUUIDError('id', id);
      }

      const dto = plainToInstance(AnularPagoDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
        throw new ValidationError(messages);
      }

      logger.info('DELETE /api/pagos/:id/anular', {
        request_id: req.request_id,
        pago_id: id,
        empleado_id: dto.empleado_id,
      });

      const resultado = await this.pagoService.anularPago(id, dto);

      res.status(200).json(createSuccessResponse(resultado));
    } catch (error: any) {
      logger.error('Error en anularPago', {
        request_id: req.request_id,
        error_message: error.message,
      }, error);
      next(error);
    }
  }
}
