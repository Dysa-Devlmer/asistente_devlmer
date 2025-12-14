import { Injectable, ConflictException } from '@nestjs/common';
import { Knex } from 'knex';
import { SyncEventRepository } from '../repositories/sync-event.repository';

@Injectable()
export class IdempotencyService {
  constructor(private syncEventRepository: SyncEventRepository) {}

  /**
   * Verificar si un evento ya fue procesado (idempotencia) SIN TRANSACCIÓN
   * ⚠️ DEPRECADO: Usar checkDuplicateInTransaction() en su lugar
   *
   * @throws ConflictException si el evento ya existe
   */
  async checkDuplicate(idempotencyKey: string): Promise<void> {
    const exists = await this.syncEventRepository.existsByIdempotencyKey(
      idempotencyKey,
    );

    if (exists) {
      throw new ConflictException(
        `Evento duplicado: idempotency_key '${idempotencyKey}' ya fue procesado`,
      );
    }
  }

  /**
   * Verificar si un evento ya fue procesado DENTRO DE TRANSACCIÓN con LOCK
   * ⭐ CORRIGE RACE CONDITION: Usa SELECT ... FOR UPDATE
   *
   * @throws ConflictException si el evento ya existe
   */
  async checkDuplicateInTransaction(
    idempotencyKey: string,
    trx: Knex.Transaction,
  ): Promise<void> {
    const exists = await this.syncEventRepository.checkDuplicateWithLock(
      idempotencyKey,
      trx,
    );

    if (exists) {
      throw new ConflictException(
        `Evento duplicado: idempotency_key '${idempotencyKey}' ya fue procesado`,
      );
    }
  }

  /**
   * Validar formato de idempotency_key
   *
   * Formato esperado: {entity_type}:{entity_id}:{action}
   * Ejemplo: pago:uuid-123:created
   */
  validateFormat(idempotencyKey: string): boolean {
    const regex = /^[a-z_]+:[a-f0-9-]{36}:[a-z_]+$/;
    return regex.test(idempotencyKey);
  }

  /**
   * Generar idempotency_key desde evento
   */
  generateKey(
    entityType: string,
    entityId: string,
    action: string,
  ): string {
    return `${entityType}:${entityId}:${action}`;
  }
}
