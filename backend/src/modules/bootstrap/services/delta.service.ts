/**
 * Delta Service - Bootstrap API v2.0
 *
 * Especificación: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 *
 * Responsabilidades:
 * - Validar sucursal_id
 * - Validar y parsear timestamp 'since' (ISO 8601)
 * - Delegar a repository
 * - Envolver respuesta con bootstrap_version y generated_at
 *
 * Reglas de Negocio:
 * - Si 'since' es futuro, retorna array vacío
 * - Sin paginación (asumimos delta razonable < 1000 registros)
 * - Ordenamiento: changed_at ASC
 */

import { DeltaRepository } from '../repositories/delta.repository';
import { DeltaResponseDataDto } from '../dto/delta.dto';
import { BootstrapResponseWrapper } from '../dto/bootstrap-response.dto';

export class DeltaService {
  private deltaRepository: DeltaRepository;

  constructor(db: any) {
    this.deltaRepository = new DeltaRepository(db);
  }

  /**
   * Obtener cambios incrementales desde timestamp
   *
   * @param sucursalId - UUID de sucursal
   * @param since - Timestamp ISO 8601 de última sincronización
   * @returns Response wrapper con cambios incrementales
   * @throws Error si sucursal no existe
   * @throws Error si 'since' no es ISO 8601 válido
   */
  async getDelta(
    sucursalId: string,
    since: string
  ): Promise<BootstrapResponseWrapper<DeltaResponseDataDto>> {
    // 1. Validar y parsear timestamp
    const sinceDate = this.parseISOTimestamp(since);

    // 2. Verificar que sucursal existe
    const sucursalExists = await this.deltaRepository.sucursalExists(sucursalId);
    if (!sucursalExists) {
      throw new Error(`Sucursal con ID ${sucursalId} no encontrada o inactiva`);
    }

    // 3. Si 'since' es futuro, retornar array vacío
    const now = new Date();
    if (sinceDate > now) {
      const responseData: DeltaResponseDataDto = {
        sucursal_id: sucursalId,
        since: sinceDate.toISOString(),
        until: now.toISOString(),
        total_changes: 0,
        changes: [],
      };
      return new BootstrapResponseWrapper(responseData);
    }

    // 4. Obtener cambios desde repository
    const deltaData = await this.deltaRepository.getChanges(sucursalId, sinceDate);

    // 5. Construir response data
    const responseData: DeltaResponseDataDto = {
      sucursal_id: deltaData.sucursal_id,
      since: deltaData.since,
      until: deltaData.until,
      total_changes: deltaData.total_changes,
      changes: deltaData.changes,
    };

    // 6. Envolver con wrapper estándar
    return new BootstrapResponseWrapper(responseData);
  }

  /**
   * Validar y parsear timestamp ISO 8601
   *
   * @param timestamp - String ISO 8601
   * @returns Date parseada
   * @throws Error si no es ISO 8601 válido
   */
  private parseISOTimestamp(timestamp: string): Date {
    // Validar formato ISO 8601 básico
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!iso8601Regex.test(timestamp)) {
      throw new Error('since debe ser ISO 8601 válido (ejemplo: 2025-01-15T10:00:00.000Z)');
    }

    const date = new Date(timestamp);

    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      throw new Error('since debe ser ISO 8601 válido');
    }

    return date;
  }
}
