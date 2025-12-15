import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { KnexService } from '@common/database/knex.service';
import { SyncEventDto, SyncEventsResponseDto, EventType } from '../dto/sync-event.dto';
import { SyncEventRepository } from '../repositories/sync-event.repository';
import { IdempotencyService } from './idempotency.service';
import { DependencyNotMetException } from '../exceptions/dependency-not-met.exception';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private knex: Knex;

  constructor(
    private knexService: KnexService,
    private syncEventRepository: SyncEventRepository,
    private idempotencyService: IdempotencyService,
  ) {
    this.knex = this.knexService.instance;
  }

  /**
   * Procesar lote de eventos de sincronización
   */
  async processEvents(events: SyncEventDto[]): Promise<SyncEventsResponseDto> {
    const results: SyncEventsResponseDto = {
      processed: 0,
      errors: 0,
      pending: 0, // ⭐ NUEVO
      results: [],
    };

    this.logger.log(`📥 Recibiendo ${events.length} eventos para procesar`);

    for (const event of events) {
      try {
        await this.processEvent(event);

        results.processed++;
        results.results.push({
          idempotency_key: event.idempotency_key,
          status: 'PROCESADO',
          message: 'Evento procesado exitosamente',
        });

        this.logger.debug(
          `✅ Evento procesado: ${event.event_type} (${event.idempotency_key})`,
        );
      } catch (error) {
        const errorMessage = error.message || 'Error desconocido';

        // ⭐ NUEVO: Manejar dependencias pendientes
        if (error instanceof DependencyNotMetException) {
          results.pending++;
          results.results.push({
            idempotency_key: event.idempotency_key,
            status: 'DEPENDENCIA_PENDIENTE',
            message: `Dependencias faltantes: ${error.missingDependencies.join(', ')}`,
            missing_dependencies: error.missingDependencies,
          });

          this.logger.warn(
            `⏳ Evento pendiente por dependencias: ${event.idempotency_key}`,
          );
        }
        // Si es duplicado, marcar como IGNORADO
        else if (error.message?.includes('duplicado')) {
          results.results.push({
            idempotency_key: event.idempotency_key,
            status: 'IGNORADO',
            message: 'Evento duplicado (ya procesado)',
          });

          this.logger.warn(
            `⚠️ Evento duplicado ignorado: ${event.idempotency_key}`,
          );
        }
        // Otros errores
        else {
          results.errors++;
          results.results.push({
            idempotency_key: event.idempotency_key,
            status: 'ERROR',
            message: errorMessage,
          });

          this.logger.error(
            `❌ Error procesando evento ${event.idempotency_key}: ${errorMessage}`,
          );
        }
      }
    }

    this.logger.log(
      `📊 Resumen: ${results.processed} procesados, ${results.pending} pendientes, ${results.errors} errores`,
    );

    return results;
  }

  /**
   * Procesar un evento individual
   */
  private async processEvent(event: SyncEventDto): Promise<void> {
    // 1. Validar formato de idempotency_key (antes de transacción)
    if (!this.idempotencyService.validateFormat(event.idempotency_key)) {
      throw new BadRequestException(
        `Formato inválido de idempotency_key: ${event.idempotency_key}`,
      );
    }

    // 2. ⭐ CORRECCIÓN: Procesar TODO dentro de transacción
    try {
      await this.knexService.transaction(async (trx) => {
        // 2.1 ⭐ NUEVO: Verificar duplicados CON LOCK (dentro de transacción)
        await this.idempotencyService.checkDuplicateInTransaction(
          event.idempotency_key,
          trx,
        );

        // 2.2 Insertar evento
        await this.syncEventRepository.create(event, trx);

        // 2.3 ⭐ NUEVO: Validar dependencias FK antes de procesar
        await this.validateDependencies(event, trx);

        // 2.4 Procesar payload según tipo de evento
        await this.processPayload(event, trx);

        // 2.5 Marcar como procesado
        await this.syncEventRepository.markAsProcessed(
          event.idempotency_key,
          trx,
        );
      });
    } catch (error) {
      // Si es dependencia pendiente, guardar evento con estado especial
      if (error instanceof DependencyNotMetException) {
        await this.syncEventRepository.markAsDependencyPending(
          event.idempotency_key,
          error.missingDependencies,
        );
      }
      throw error; // Re-lanzar para que processEvents() lo maneje
    }
  }

  /**
   * ⭐ NUEVO: Validar que las dependencias FK existen antes de procesar
   * Lanza DependencyNotMetException si faltan dependencias
   */
  private async validateDependencies(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const { payload } = event;
    const missingDeps: string[] = [];

    switch (event.event_type) {
      case EventType.PAGO_REGISTRADO:
        // Validar que pedido existe
        if (payload.pedido_id) {
          const pedido = await trx('pedido')
            .where({ id: payload.pedido_id })
            .first();
          if (!pedido) {
            missingDeps.push(`pedido:${payload.pedido_id}`);
          }
        }

        // Validar que sesión de caja existe
        if (payload.sesion_caja_id) {
          const sesion = await trx('sesion_caja')
            .where({ id: payload.sesion_caja_id })
            .first();
          if (!sesion) {
            missingDeps.push(`sesion_caja:${payload.sesion_caja_id}`);
          }
        }
        break;

      case EventType.PAGO_ANULADO:
        // Validar que pago a anular existe
        const pago = await trx('pago')
          .where({ id: event.entity_id })
          .first();
        if (!pago) {
          missingDeps.push(`pago:${event.entity_id}`);
        }
        break;

      case EventType.CAJA_CERRADA:
        // Validar que sesión de caja existe
        const sesionCaja = await trx('sesion_caja')
          .where({ id: event.entity_id })
          .first();
        if (!sesionCaja) {
          missingDeps.push(`sesion_caja:${event.entity_id}`);
        }
        break;

      // Otros tipos de eventos no requieren validación estricta de FK
      default:
        break;
    }

    // Si hay dependencias faltantes, lanzar excepción
    if (missingDeps.length > 0) {
      throw new DependencyNotMetException(
        missingDeps,
        `Evento ${event.event_type} tiene dependencias faltantes`,
      );
    }
  }

  /**
   * Procesar payload según tipo de evento
   */
  private async processPayload(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    switch (event.event_type) {
      case EventType.PAGO_REGISTRADO:
        await this.processPagoRegistrado(event, trx);
        break;

      case EventType.PAGO_ANULADO:
        await this.processPagoAnulado(event, trx);
        break;

      case EventType.CAJA_ABIERTA:
        await this.processCajaAbierta(event, trx);
        break;

      case EventType.CAJA_CERRADA:
        await this.processCajaCerrada(event, trx);
        break;

      case EventType.PEDIDO_CREADO:
        await this.processPedidoCreado(event, trx);
        break;

      case EventType.PEDIDO_COMPLETADO:
        await this.processPedidoCompletado(event, trx);
        break;

      case EventType.MESA_OCUPADA:
      case EventType.MESA_LIBERADA:
        await this.processMesaEstado(event, trx);
        break;

      default:
        this.logger.warn(
          `⚠️ Tipo de evento no manejado: ${event.event_type}`,
        );
    }
  }

  /**
   * Procesar: PAGO_REGISTRADO
   */
  private async processPagoRegistrado(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const { payload } = event;

    // Validar que el pago no exista ya
    const exists = await trx('pago').where({ id: event.entity_id }).first();

    if (exists) {
      // Si ya existe, verificar que sea el mismo (idempotencia)
      if (exists.sync_status === 'SINCRONIZADO') {
        this.logger.warn(
          `⚠️ Pago ${event.entity_id} ya existe y está sincronizado`,
        );
        return; // OK, no es error
      }
    }

    // Insertar o actualizar pago
    await trx('pago').insert({
      id: event.entity_id,
      pedido_id: payload.pedido_id,
      sesion_caja_id: payload.sesion_caja_id,
      empleado_id: payload.empleado_id || event.user_id,
      sucursal_id: event.sucursal_id,
      dispositivo_id: event.dispositivo_id,
      numero_pago: payload.numero_pago,
      metodo: payload.metodo,
      es_mixto: payload.es_mixto || false,
      detalle_mixto: JSON.stringify(payload.detalle_mixto || []),
      monto: payload.monto,
      propina: payload.propina || 0,
      referencia_externa: payload.referencia_externa,
      banco: payload.banco,
      ultimos_4_digitos: payload.ultimos_4_digitos,
      estado: payload.estado || 'COMPLETADO',
      fecha_pago: payload.fecha_pago || new Date().toISOString(),
      sync_status: 'SINCRONIZADO', // ⭐ Importante
      sync_priority: 1,
      synced_at: new Date().toISOString(),
      created_at: payload.created_at || new Date().toISOString(),
    }).onConflict('id').merge(); // Upsert

    // Actualizar totales de sesión de caja
    await this.actualizarTotalesSesionCaja(payload.sesion_caja_id, trx);

    // Actualizar estado del pedido a PAGADO
    await trx('pedido')
      .where({ id: payload.pedido_id })
      .update({
        estado: 'PAGADO',
        fecha_cierre: new Date().toISOString(),
      });

    this.logger.log(`💰 Pago registrado: ${event.entity_id} - $${payload.monto}`);
  }

  /**
   * Procesar: PAGO_ANULADO
   */
  private async processPagoAnulado(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const { payload } = event;

    // Validar que el pago existe
    const pago = await trx('pago').where({ id: event.entity_id }).first();

    if (!pago) {
      throw new BadRequestException(
        `Pago ${event.entity_id} no existe, no se puede anular`,
      );
    }

    // No se modifica el pago original (INMUTABILIDAD)
    // Se marca como anulado
    await trx('pago')
      .where({ id: event.entity_id })
      .update({
        estado: 'ANULADO',
        anulado_por: payload.anulado_por || event.user_id,
        fecha_anulacion: new Date().toISOString(),
        motivo_anulacion: payload.motivo_anulacion,
      });

    // Actualizar totales de sesión de caja
    await this.actualizarTotalesSesionCaja(pago.sesion_caja_id, trx);

    this.logger.log(`❌ Pago anulado: ${event.entity_id}`);
  }

  /**
   * Procesar: CAJA_ABIERTA
   */
  private async processCajaAbierta(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const { payload } = event;

    await trx('sesion_caja').insert({
      id: event.entity_id,
      caja_id: payload.caja_id,
      empleado_id: payload.empleado_id || event.user_id,
      sucursal_id: event.sucursal_id,
      dispositivo_id: event.dispositivo_id,
      numero_sesion: payload.numero_sesion,
      fecha_apertura: payload.fecha_apertura || new Date().toISOString(),
      monto_inicial: payload.monto_inicial || 0,
      estado: 'ABIERTA',
      sync_status: 'SINCRONIZADO',
      synced_at: new Date().toISOString(),
      created_at: payload.created_at || new Date().toISOString(),
    }).onConflict('id').merge();

    this.logger.log(`🔓 Caja abierta: ${payload.numero_sesion}`);
  }

  /**
   * Procesar: CAJA_CERRADA
   * ⭐ CORRECCIÓN: Implementa row-level locking con SELECT ... FOR UPDATE
   */
  private async processCajaCerrada(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const { payload } = event;

    // ⭐ NUEVO: Obtener sesión con LOCK para prevenir concurrencia
    const sesion = await trx('sesion_caja')
      .where({ id: event.entity_id })
      .forUpdate() // ⭐ ROW-LEVEL LOCK
      .first();

    if (!sesion) {
      throw new BadRequestException(
        `Sesión de caja ${event.entity_id} no existe`,
      );
    }

    // ⭐ NUEVO: Verificar que no esté ya cerrada (idempotencia)
    if (sesion.estado === 'CERRADA') {
      this.logger.warn(
        `⚠️ Sesión de caja ${event.entity_id} ya estaba cerrada (idempotente)`,
      );
      return; // No es error, evento duplicado OK
    }

    // Actualizar sesión de caja
    await trx('sesion_caja')
      .where({ id: event.entity_id })
      .update({
        fecha_cierre: new Date().toISOString(),
        monto_esperado: payload.monto_esperado || 0,
        monto_real: payload.monto_real || 0,
        diferencia: (payload.monto_real || 0) - (payload.monto_esperado || 0),
        total_efectivo: payload.total_efectivo || 0,
        total_tarjeta: payload.total_tarjeta || 0,
        total_transferencia: payload.total_transferencia || 0,
        total_otros: payload.total_otros || 0,
        total_propinas: payload.total_propinas || 0,
        estado: 'CERRADA',
        observaciones: payload.observaciones,
      });

    this.logger.log(`🔒 Caja cerrada: ${event.entity_id}`);
  }

  /**
   * Procesar: PEDIDO_CREADO
   */
  private async processPedidoCreado(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const { payload } = event;

    await trx('pedido').insert({
      id: event.entity_id,
      sucursal_id: event.sucursal_id,
      mesa_id: payload.mesa_id,
      empleado_id: payload.empleado_id || event.user_id,
      sesion_caja_id: payload.sesion_caja_id,
      dispositivo_id: event.dispositivo_id,
      numero_pedido: payload.numero_pedido,
      tipo: payload.tipo || 'MESA',
      numero_comensales: payload.numero_comensales || 1,
      nombre_cliente: payload.nombre_cliente,
      subtotal: payload.subtotal || 0,
      iva: payload.iva || 0,
      descuento: payload.descuento || 0,
      propina: payload.propina || 0,
      total: payload.total || 0,
      cuenta_dividida: payload.cuenta_dividida || false,
      numero_divisiones: payload.numero_divisiones || 1,
      estado: payload.estado || 'ABIERTO',
      fecha_creacion: payload.fecha_creacion || new Date().toISOString(),
      observaciones: payload.observaciones,
      sync_status: 'SINCRONIZADO',
      synced_at: new Date().toISOString(),
      created_at: payload.created_at || new Date().toISOString(),
    }).onConflict('id').merge();

    // Insertar items del pedido si existen
    if (payload.items && Array.isArray(payload.items)) {
      for (const item of payload.items) {
        await trx('detalle_pedido').insert({
          id: item.id,
          pedido_id: event.entity_id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_unitario: item.descuento_unitario || 0,
          subtotal: item.subtotal,
          observaciones: item.observaciones,
          modificadores: JSON.stringify(item.modificadores || []),
          estado: item.estado || 'PENDIENTE',
          division_info: JSON.stringify(item.division_info || {}),
          created_at: item.created_at || new Date().toISOString(),
        }).onConflict('id').merge();
      }
    }

    // Actualizar estado de mesa a OCUPADA
    if (payload.mesa_id) {
      await trx('mesa')
        .where({ id: payload.mesa_id })
        .update({ estado: 'OCUPADA' });
    }

    this.logger.log(`📝 Pedido creado: ${payload.numero_pedido}`);
  }

  /**
   * Procesar: PEDIDO_COMPLETADO
   */
  private async processPedidoCompletado(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('pedido')
      .where({ id: event.entity_id })
      .update({
        estado: 'ENTREGADO',
        fecha_entrega: new Date().toISOString(),
      });

    this.logger.log(`✅ Pedido completado: ${event.entity_id}`);
  }

  /**
   * Procesar: MESA_OCUPADA / MESA_LIBERADA
   */
  private async processMesaEstado(
    event: SyncEventDto,
    trx: Knex.Transaction,
  ): Promise<void> {
    const estado =
      event.event_type === EventType.MESA_OCUPADA ? 'OCUPADA' : 'LIBRE';

    await trx('mesa').where({ id: event.entity_id }).update({ estado });

    this.logger.log(`🪑 Mesa ${event.entity_id} → ${estado}`);
  }

  /**
   * Actualizar totales de sesión de caja
   * ⭐ CORRECCIÓN: Implementa row-level locking para prevenir race conditions
   */
  private async actualizarTotalesSesionCaja(
    sesionCajaId: string,
    trx: Knex.Transaction,
  ): Promise<void> {
    // ⭐ NUEVO: Obtener sesión con LOCK antes de calcular totales
    const sesion = await trx('sesion_caja')
      .where({ id: sesionCajaId })
      .forUpdate() // ⭐ ROW-LEVEL LOCK
      .first();

    if (!sesion) {
      this.logger.warn(
        `⚠️ Sesión de caja ${sesionCajaId} no existe (probablemente aún no llegó el evento CAJA_ABIERTA)`,
      );
      return; // No es error, solo log de advertencia
    }

    // Calcular totales de pagos de esta sesión
    const result = await trx.raw<{ rows: any[] }>(`
      SELECT
        SUM(CASE WHEN metodo = 'EFECTIVO' THEN monto ELSE 0 END) as total_efectivo,
        SUM(CASE WHEN metodo IN ('TARJETA_DEBITO', 'TARJETA_CREDITO') THEN monto ELSE 0 END) as total_tarjeta,
        SUM(CASE WHEN metodo = 'TRANSFERENCIA' THEN monto ELSE 0 END) as total_transferencia,
        SUM(CASE WHEN metodo = 'OTRO' THEN monto ELSE 0 END) as total_otros,
        SUM(propina) as total_propinas
      FROM pago
      WHERE sesion_caja_id = ? AND estado = 'COMPLETADO'
    `, [sesionCajaId]);

    const totales = result.rows[0] || {
      total_efectivo: 0,
      total_tarjeta: 0,
      total_transferencia: 0,
      total_otros: 0,
      total_propinas: 0,
    };

    // Actualizar sesión de caja (aún tiene el lock)
    await trx('sesion_caja')
      .where({ id: sesionCajaId })
      .update({
        total_efectivo: totales.total_efectivo || 0,
        total_tarjeta: totales.total_tarjeta || 0,
        total_transferencia: totales.total_transferencia || 0,
        total_otros: totales.total_otros || 0,
        total_propinas: totales.total_propinas || 0,
      });
  }
}
