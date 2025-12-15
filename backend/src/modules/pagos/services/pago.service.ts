/**
 * Service: Pago
 *
 * Lógica de negocio para pagos (efectivo y Webpay)
 */

import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { PagoRepository } from '../repositories/pago.repository';
import { PagoIntentoRepository } from '../repositories/pago-intento.repository';
import { WebpayService } from './webpay.service';
import {
  CrearPagoDto,
  ConfirmarPagoWebpayDto,
  AnularPagoDto,
  PagoEfectivoResponseDto,
  PagoWebpayIniciadoResponseDto,
  PagoWebpayConfirmadoResponseDto,
  PagoDetalladoResponseDto,
  PagosVentaResponseDto,
  MetodoPago,
  EstadoPago,
} from '../dto/pago.dto';
import {
  VentaNotFoundError,
  FormaPagoNotFoundError,
  InvalidAmountError,
  InsufficientCashError,
  PagoNotFoundError,
  InvalidPaymentStateError,
  TokenMismatchError,
  PagoAlreadyCancelledError,
  CannotCancelApprovedError,
} from '../../../common/errors/typed-errors';
import { logger } from '../../../common/logging/structured-logger';

export class PagoService {
  private pagoRepo: PagoRepository;
  private pagoIntentoRepo: PagoIntentoRepository;
  private webpayService: WebpayService;

  constructor(private db: Pool) {
    this.pagoRepo = new PagoRepository(db);
    this.pagoIntentoRepo = new PagoIntentoRepository(db);
    this.webpayService = new WebpayService();
  }

  /**
   * Crear pago (efectivo o iniciar Webpay)
   */
  async crearPago(dto: CrearPagoDto): Promise<PagoEfectivoResponseDto | PagoWebpayIniciadoResponseDto> {
    const pagoId = dto.pago_id || uuidv4();

    // Idempotencia: Si ya existe, retornar
    const pagoExistente = await this.pagoRepo.obtenerPorId(pagoId);
    if (pagoExistente) {
      return this.construirRespuestaExistente(pagoExistente);
    }

    // Validar venta existe
    if (!(await this.pagoRepo.existeVenta(dto.venta_id))) {
      throw new VentaNotFoundError(dto.venta_id);
    }

    // Validar forma de pago existe
    if (!(await this.pagoRepo.existeFormaPago(dto.forma_pago_id))) {
      throw new FormaPagoNotFoundError(dto.forma_pago_id);
    }

    // Validar monto
    if (dto.monto <= 0) {
      throw new InvalidAmountError(dto.monto, 'El monto debe ser mayor a 0');
    }

    // Procesar según método
    if (dto.metodo === MetodoPago.EFECTIVO) {
      return await this.procesarPagoEfectivo(pagoId, dto);
    } else if (dto.metodo === MetodoPago.WEBPAY || dto.metodo === MetodoPago.WEBPAY_PLUS) {
      return await this.iniciarPagoWebpay(pagoId, dto);
    } else {
      throw new InvalidAmountError(dto.monto, `Método ${dto.metodo} no soportado`);
    }
  }

  /**
   * Procesar pago en efectivo (aprobación inmediata)
   */
  private async procesarPagoEfectivo(
    pagoId: string,
    dto: CrearPagoDto
  ): Promise<PagoEfectivoResponseDto> {
    // Validar monto recibido
    if (!dto.monto_recibido || dto.monto_recibido < dto.monto) {
      throw new InsufficientCashError(dto.monto, dto.monto_recibido || 0);
    }

    const montoCambio = dto.monto_recibido - dto.monto;
    const fechaInicio = dto.fecha_inicio || new Date().toISOString();

    // Crear pago aprobado
    await this.pagoRepo.crear({
      id: pagoId,
      venta_id: dto.venta_id,
      sesion_caja_id: dto.sesion_caja_id || null,
      forma_pago_id: dto.forma_pago_id,
      monto: dto.monto,
      estado: EstadoPago.APPROVED,
      metodo: dto.metodo,
      monto_recibido: dto.monto_recibido,
      monto_cambio: montoCambio,
      fecha_inicio: fechaInicio,
      empleado_id: dto.empleado_id,
      terminal_id: dto.terminal_id,
      ip_address: dto.ip_address,
      notas: dto.notas,
    });

    // Actualizar con monto_pagado y fecha_completado
    await this.pagoRepo.actualizar({
      id: pagoId,
      monto_pagado: dto.monto,
      fecha_completado: fechaInicio, // Efectivo se completa inmediatamente
    });

    logger.info('Pago efectivo procesado', { pago_id: pagoId, monto: dto.monto });

    return {
      pago_id: pagoId,
      numero_pago: null,
      venta_id: dto.venta_id,
      sesion_caja_id: dto.sesion_caja_id || null,
      estado: EstadoPago.APPROVED,
      metodo: MetodoPago.EFECTIVO,
      monto: dto.monto,
      monto_pagado: dto.monto,
      monto_recibido: dto.monto_recibido,
      monto_cambio: montoCambio,
      fecha_inicio: fechaInicio,
      fecha_completado: fechaInicio,
      empleado_id: dto.empleado_id,
    };
  }

  /**
   * Iniciar pago Webpay (crear registro y obtener URL)
   */
  private async iniciarPagoWebpay(
    pagoId: string,
    dto: CrearPagoDto
  ): Promise<PagoWebpayIniciadoResponseDto> {
    const fechaInicio = dto.fecha_inicio || new Date().toISOString();
    const buyOrder = pagoId;
    const sessionId = dto.webpay_session_id || uuidv4();
    const returnUrl = process.env.WEBPAY_RETURN_URL || 'http://localhost:3000/api/pagos/webpay/callback';

    // Iniciar transacción con Webpay
    const webpayResponse = await this.webpayService.initTransaction(
      buyOrder,
      sessionId,
      dto.monto,
      returnUrl
    );

    // Crear pago en estado pending
    await this.pagoRepo.crear({
      id: pagoId,
      venta_id: dto.venta_id,
      sesion_caja_id: dto.sesion_caja_id || null,
      forma_pago_id: dto.forma_pago_id,
      monto: dto.monto,
      estado: EstadoPago.PENDING,
      metodo: dto.metodo,
      fecha_inicio: fechaInicio,
      empleado_id: dto.empleado_id,
      terminal_id: dto.terminal_id,
      ip_address: dto.ip_address,
      notas: dto.notas,
    });

    // Actualizar con datos de Webpay y cambiar a processing
    await this.pagoRepo.actualizar({
      id: pagoId,
      estado: EstadoPago.PROCESSING,
      webpay_token: webpayResponse.token,
      webpay_buy_order: buyOrder,
    });

    // Registrar primer intento
    await this.pagoIntentoRepo.crear({
      id: uuidv4(),
      pago_id: pagoId,
      numero_intento: 1,
      estado_resultante: 'success',
      request_payload: { buy_order: buyOrder, session_id: sessionId, amount: dto.monto },
      response_payload: webpayResponse,
      fecha_inicio: fechaInicio,
      fecha_fin: new Date().toISOString(),
      duracion_ms: 0,
    });

    logger.info('Pago Webpay iniciado', { pago_id: pagoId, token: webpayResponse.token });

    return {
      pago_id: pagoId,
      numero_pago: null,
      venta_id: dto.venta_id,
      sesion_caja_id: dto.sesion_caja_id || null,
      estado: EstadoPago.PROCESSING,
      metodo: dto.metodo as MetodoPago,
      monto: dto.monto,
      webpay_token: webpayResponse.token,
      webpay_url: webpayResponse.url,
      webpay_buy_order: buyOrder,
      fecha_inicio: fechaInicio,
      empleado_id: dto.empleado_id,
    };
  }

  /**
   * Confirmar pago Webpay (después de redirección)
   */
  async confirmarPagoWebpay(dto: ConfirmarPagoWebpayDto): Promise<PagoWebpayConfirmadoResponseDto> {
    // Buscar pago por token
    const pago = await this.pagoRepo.obtenerPorWebpayToken(dto.token_ws);
    if (!pago) {
      throw new TokenMismatchError();
    }

    // Validar estado
    if (pago.estado !== EstadoPago.PROCESSING) {
      throw new InvalidPaymentStateError(pago.id, pago.estado, EstadoPago.PROCESSING);
    }

    const fechaInicio = new Date().toISOString();

    // Confirmar con Webpay
    const webpayResponse = await this.webpayService.confirmTransaction(dto.token_ws);

    const fechaFin = new Date().toISOString();
    const duracionMs = new Date(fechaFin).getTime() - new Date(fechaInicio).getTime();

    // Procesar respuesta
    if (webpayResponse.response_code === 0) {
      // APROBADO
      await this.pagoRepo.actualizar({
        id: pago.id,
        estado: EstadoPago.APPROVED,
        monto_pagado: webpayResponse.amount,
        webpay_authorization_code: webpayResponse.authorization_code,
        webpay_card_number: `**** **** **** ${webpayResponse.card_detail.card_number}`,
        webpay_transaction_date: webpayResponse.transaction_date,
        webpay_response_code: webpayResponse.response_code.toString(),
        fecha_completado: fechaFin,
      });

      // Registrar intento exitoso
      await this.pagoIntentoRepo.crear({
        id: uuidv4(),
        pago_id: pago.id,
        numero_intento: pago.intentos_procesamiento + 1,
        estado_resultante: 'success',
        response_payload: webpayResponse,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        duracion_ms: duracionMs,
      });

      logger.info('Pago Webpay aprobado', { pago_id: pago.id, authorization_code: webpayResponse.authorization_code });

      return {
        pago_id: pago.id,
        numero_pago: pago.numero_pago,
        estado: EstadoPago.APPROVED,
        monto: parseFloat(pago.monto),
        monto_pagado: webpayResponse.amount,
        webpay_authorization_code: webpayResponse.authorization_code,
        webpay_card_number: `**** **** **** ${webpayResponse.card_detail.card_number}`,
        webpay_transaction_date: webpayResponse.transaction_date,
        webpay_response_code: webpayResponse.response_code.toString(),
        fecha_completado: fechaFin,
      };
    } else {
      // RECHAZADO
      await this.pagoRepo.actualizar({
        id: pago.id,
        estado: EstadoPago.REJECTED,
        monto_pagado: 0,
        webpay_response_code: webpayResponse.response_code.toString(),
        fecha_completado: fechaFin,
      });

      // Registrar intento rechazado
      await this.pagoIntentoRepo.crear({
        id: uuidv4(),
        pago_id: pago.id,
        numero_intento: pago.intentos_procesamiento + 1,
        estado_resultante: 'rejected',
        response_payload: webpayResponse,
        error_message: 'Transacción rechazada por el banco',
        error_code: webpayResponse.response_code.toString(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        duracion_ms: duracionMs,
      });

      logger.warn('Pago Webpay rechazado', { pago_id: pago.id, response_code: webpayResponse.response_code });

      return {
        pago_id: pago.id,
        numero_pago: pago.numero_pago,
        estado: EstadoPago.REJECTED,
        monto: parseFloat(pago.monto),
        monto_pagado: 0,
        webpay_authorization_code: null,
        webpay_card_number: null,
        webpay_transaction_date: null,
        webpay_response_code: webpayResponse.response_code.toString(),
        motivo_rechazo: 'Transacción rechazada por el banco',
        fecha_completado: fechaFin,
      };
    }
  }

  /**
   * Anular pago
   */
  async anularPago(pagoId: string, dto: AnularPagoDto): Promise<any> {
    const pago = await this.pagoRepo.obtenerPorId(pagoId);
    if (!pago) {
      throw new PagoNotFoundError(pagoId);
    }

    if (!pago.esta_activo) {
      throw new PagoAlreadyCancelledError(pagoId);
    }

    // Validar si se puede anular
    if (pago.estado === EstadoPago.APPROVED) {
      // Solo si < 24 horas y es Webpay con reversión
      const horasDesdeAprobacion = (Date.now() - new Date(pago.fecha_completado!).getTime()) / (1000 * 60 * 60);
      if (horasDesdeAprobacion > 24) {
        throw new CannotCancelApprovedError(pagoId, 'Han pasado más de 24 horas desde la aprobación');
      }

      if (pago.metodo.includes('webpay')) {
        // Reversar en Webpay
        await this.webpayService.reverseTransaction(pago.webpay_token!, parseFloat(pago.monto));
      }
    }

    // Anular
    const fechaAnulacion = new Date().toISOString();
    await this.pagoRepo.anular({
      id: pagoId,
      motivo: dto.motivo,
      fecha_anulacion: fechaAnulacion,
    });

    logger.info('Pago anulado', { pago_id: pagoId, motivo: dto.motivo });

    return {
      pago_id: pagoId,
      esta_activo: false,
      motivo_anulacion: dto.motivo,
      fecha_anulacion: fechaAnulacion,
      empleado_anulacion_id: dto.empleado_id,
    };
  }

  /**
   * Obtener pago por ID
   */
  async obtenerPago(pagoId: string): Promise<PagoDetalladoResponseDto> {
    const pago = await this.pagoRepo.obtenerPorId(pagoId);
    if (!pago) {
      throw new PagoNotFoundError(pagoId);
    }

    // TODO: Obtener nombres relacionados (forma_pago, empleado)
    return {
      pago_id: pago.id,
      numero_pago: pago.numero_pago,
      venta_id: pago.venta_id,
      sesion_caja_id: pago.sesion_caja_id,
      forma_pago_id: pago.forma_pago_id,
      forma_pago_nombre: 'N/A', // TODO: JOIN
      estado: pago.estado as EstadoPago,
      metodo: pago.metodo as MetodoPago,
      monto: parseFloat(pago.monto),
      monto_pagado: pago.monto_pagado ? parseFloat(pago.monto_pagado) : null,
      monto_recibido: pago.monto_recibido ? parseFloat(pago.monto_recibido) : null,
      monto_cambio: pago.monto_cambio ? parseFloat(pago.monto_cambio) : null,
      webpay_authorization_code: pago.webpay_authorization_code,
      webpay_card_number: pago.webpay_card_number,
      webpay_transaction_date: pago.webpay_transaction_date ? pago.webpay_transaction_date.toISOString() : null,
      webpay_response_code: pago.webpay_response_code,
      fecha_inicio: pago.fecha_inicio.toISOString(),
      fecha_completado: pago.fecha_completado ? pago.fecha_completado.toISOString() : null,
      empleado_id: pago.empleado_id,
      empleado_nombre: 'N/A', // TODO: JOIN
      terminal_id: pago.terminal_id,
      intentos_procesamiento: pago.intentos_procesamiento,
      esta_activo: pago.esta_activo,
      motivo_anulacion: pago.motivo_anulacion,
      fecha_anulacion: pago.fecha_anulacion ? pago.fecha_anulacion.toISOString() : null,
      notas: pago.notas,
      created_at: pago.created_at.toISOString(),
      updated_at: pago.updated_at.toISOString(),
    };
  }

  /**
   * Obtener pagos de una venta
   */
  async obtenerPagosPorVenta(ventaId: string): Promise<PagosVentaResponseDto> {
    const pagos = await this.pagoRepo.obtenerActivosPorVenta(ventaId);

    const montoTotalPagado = pagos.reduce((sum, p) => {
      return sum + (p.monto_pagado ? parseFloat(p.monto_pagado) : 0);
    }, 0);

    return {
      venta_id: ventaId,
      total_pagos: pagos.length,
      monto_total_pagado: montoTotalPagado,
      pagos: pagos.map(p => ({
        pago_id: p.id,
        numero_pago: p.numero_pago,
        estado: p.estado as EstadoPago,
        metodo: p.metodo as MetodoPago,
        monto: parseFloat(p.monto),
        monto_pagado: p.monto_pagado ? parseFloat(p.monto_pagado) : null,
        fecha_inicio: p.fecha_inicio.toISOString(),
        fecha_completado: p.fecha_completado ? p.fecha_completado.toISOString() : null,
        esta_activo: p.esta_activo,
      })),
    };
  }

  /**
   * Construir respuesta de pago existente (idempotencia)
   */
  private construirRespuestaExistente(pago: any): any {
    if (pago.metodo === MetodoPago.EFECTIVO) {
      return {
        pago_id: pago.id,
        numero_pago: pago.numero_pago,
        venta_id: pago.venta_id,
        sesion_caja_id: pago.sesion_caja_id,
        estado: pago.estado,
        metodo: pago.metodo,
        monto: parseFloat(pago.monto),
        monto_pagado: pago.monto_pagado ? parseFloat(pago.monto_pagado) : null,
        monto_recibido: pago.monto_recibido ? parseFloat(pago.monto_recibido) : null,
        monto_cambio: pago.monto_cambio ? parseFloat(pago.monto_cambio) : null,
        fecha_inicio: pago.fecha_inicio.toISOString(),
        fecha_completado: pago.fecha_completado ? pago.fecha_completado.toISOString() : null,
        empleado_id: pago.empleado_id,
      };
    } else {
      return {
        pago_id: pago.id,
        numero_pago: pago.numero_pago,
        venta_id: pago.venta_id,
        sesion_caja_id: pago.sesion_caja_id,
        estado: pago.estado,
        metodo: pago.metodo,
        monto: parseFloat(pago.monto),
        webpay_token: pago.webpay_token,
        webpay_url: pago.webpay_url || '',
        webpay_buy_order: pago.webpay_buy_order,
        fecha_inicio: pago.fecha_inicio.toISOString(),
        empleado_id: pago.empleado_id,
      };
    }
  }
}
