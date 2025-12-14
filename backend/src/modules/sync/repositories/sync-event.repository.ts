import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KnexService } from '@common/database/knex.service';
import { SyncEventDto } from '../dto/sync-event.dto';

export interface SyncEventRecord {
  id: string;
  dispositivo_id: string;
  sucursal_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  user_id?: string;
  client_timestamp: string;
  server_timestamp: string;
  sync_status: 'PENDIENTE' | 'PROCESADO' | 'ERROR' | 'IGNORADO' | 'DEPENDENCIA_PENDIENTE';
  sync_priority: number;
  sync_retries: number;
  sync_error?: string;
  processed_at?: string;
  idempotency_key: string;
  missing_dependencies?: string; // JSON array de FKs faltantes
  created_at: string;
}

@Injectable()
export class SyncEventRepository {
  private knex: Knex;

  constructor(private knexService: KnexService) {
    this.knex = this.knexService.instance;
  }

  /**
   * Verificar si ya existe un evento con la misma idempotency_key
   */
  async existsByIdempotencyKey(key: string): Promise<boolean> {
    const result = await this.knex('sync_event')
      .where({ idempotency_key: key })
      .first();

    return !!result;
  }

  /**
   * Insertar nuevo evento de sincronización
   */
  async create(
    event: SyncEventDto,
    trx?: Knex.Transaction,
  ): Promise<SyncEventRecord> {
    const query = trx || this.knex;

    // Determinar prioridad si no fue provista
    const priority = event.sync_priority || this.getPriorityByEventType(event.event_type);

    const [created] = await query('sync_event')
      .insert({
        id: this.generateUUID(),
        dispositivo_id: event.dispositivo_id,
        sucursal_id: event.sucursal_id,
        event_type: event.event_type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: JSON.stringify(event.payload),
        user_id: event.user_id,
        client_timestamp: event.client_timestamp,
        server_timestamp: new Date().toISOString(),
        sync_status: 'PENDIENTE',
        sync_priority: priority,
        sync_retries: 0,
        idempotency_key: event.idempotency_key,
        created_at: new Date().toISOString(),
      })
      .returning('*');

    return created;
  }

  /**
   * Marcar evento como procesado
   */
  async markAsProcessed(
    idempotencyKey: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const query = trx || this.knex;

    await query('sync_event')
      .where({ idempotency_key: idempotencyKey })
      .update({
        sync_status: 'PROCESADO',
        processed_at: new Date().toISOString(),
      });
  }

  /**
   * Marcar evento como error
   */
  async markAsError(
    idempotencyKey: string,
    errorMessage: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const query = trx || this.knex;

    await query('sync_event')
      .where({ idempotency_key: idempotencyKey })
      .update({
        sync_status: 'ERROR',
        sync_error: errorMessage,
        sync_retries: this.knex.raw('sync_retries + 1'),
      });
  }

  /**
   * Marcar evento como ignorado (duplicado)
   */
  async markAsIgnored(
    idempotencyKey: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const query = trx || this.knex;

    await query('sync_event')
      .where({ idempotency_key: idempotencyKey })
      .update({
        sync_status: 'IGNORADO',
        processed_at: new Date().toISOString(),
      });
  }

  /**
   * Marcar evento como dependencia pendiente
   */
  async markAsDependencyPending(
    idempotencyKey: string,
    missingDependencies: string[],
    trx?: Knex.Transaction,
  ): Promise<void> {
    const query = trx || this.knex;

    await query('sync_event')
      .where({ idempotency_key: idempotencyKey })
      .update({
        sync_status: 'DEPENDENCIA_PENDIENTE',
        missing_dependencies: JSON.stringify(missingDependencies),
        sync_retries: this.knex.raw('sync_retries + 1'),
      });
  }

  /**
   * Verificar si evento existe CON LOCK (para idempotencia en transacción)
   * Usa SELECT ... FOR UPDATE para prevenir race conditions
   */
  async checkDuplicateWithLock(
    idempotencyKey: string,
    trx: Knex.Transaction,
  ): Promise<boolean> {
    const result = await trx('sync_event')
      .where({ idempotency_key: idempotencyKey })
      .forUpdate() // ⭐ ROW-LEVEL LOCK
      .first();

    return !!result;
  }

  /**
   * Obtener eventos pendientes por prioridad
   */
  async getPendingEvents(limit = 100): Promise<SyncEventRecord[]> {
    return this.knex('sync_event')
      .where({ sync_status: 'PENDIENTE' })
      .orderBy([
        { column: 'sync_priority', order: 'asc' },
        { column: 'created_at', order: 'asc' },
      ])
      .limit(limit);
  }

  /**
   * Determinar prioridad según tipo de evento
   */
  private getPriorityByEventType(eventType: string): number {
    const priorities: Record<string, number> = {
      // Prioridad 1 (MÁXIMA - Fiscal)
      PAGO_REGISTRADO: 1,
      PAGO_ANULADO: 1,

      // Prioridad 2 (ALTA - Control)
      CAJA_ABIERTA: 2,
      CAJA_CERRADA: 2,

      // Prioridad 3 (MEDIA - Operativa)
      PEDIDO_CREADO: 3,
      PEDIDO_ACTUALIZADO: 3,
      PEDIDO_COMPLETADO: 3,
      PEDIDO_CANCELADO: 3,

      // Prioridad 4 (MEDIA - Estado)
      MESA_OCUPADA: 4,
      MESA_LIBERADA: 4,

      // Prioridad 5-10 (BAJA - Configuración)
      PRODUCTO_ACTUALIZADO: 5,
      EMPLEADO_ACTUALIZADO: 6,
    };

    return priorities[eventType] || 10;
  }

  /**
   * Generar UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
