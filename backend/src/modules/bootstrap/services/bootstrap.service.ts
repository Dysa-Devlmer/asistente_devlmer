import { Injectable, NotFoundException } from '@nestjs/common';
import { SucursalRepository } from '../repositories/sucursal.repository';
import { DispositivoRepository } from '../repositories/dispositivo.repository';
import {
  BootstrapMetaDto,
  BootstrapMetaResponseDto,
} from '../dto/bootstrap-meta.dto';
import {
  SucursalDto,
  SucursalResponseDto,
} from '../dto/sucursal.dto';
import {
  DispositivoDto,
  DispositivoResponseDto,
} from '../dto/dispositivo.dto';

/**
 * Versión del sistema de bootstrap
 * Constante que se incluye en todas las respuestas
 */
const BOOTSTRAP_VERSION = '1.0.0';

/**
 * Versión del catálogo (simple en Iteración 1)
 * En futuras iteraciones puede ser hash o timestamp dinámico
 */
const CATALOG_VERSION = 'BOOTSTRAP_V1';

/**
 * Service para operaciones de bootstrap
 * Iteración 1: Meta, Sucursal, Dispositivo
 *
 * Restricciones:
 * - Solo operaciones de lectura (SELECTs)
 * - Sin campos sensibles
 * - Todas las respuestas incluyen bootstrap_version y generated_at
 */
@Injectable()
export class BootstrapService {
  constructor(
    private readonly sucursalRepository: SucursalRepository,
    private readonly dispositivoRepository: DispositivoRepository,
  ) {}

  /**
   * Obtener metadata de bootstrap
   * Endpoint: GET /api/bootstrap/meta?sucursal_id={id}
   *
   * Propósito: Proveer versión del catálogo y timestamp del servidor
   *            para que el cliente decida si necesita sync completo
   *
   * Nota Iteración 1:
   * - catalog_version es constante simple (BOOTSTRAP_V1)
   * - requires_full_sync es solo informativo, NO dispara sync automático
   */
  async getMeta(sucursalId: string): Promise<BootstrapMetaResponseDto> {
    // Verificar que la sucursal existe y está activa
    const exists = await this.sucursalRepository.exists(sucursalId);
    if (!exists) {
      throw new NotFoundException(
        `Sucursal con ID ${sucursalId} no encontrada o inactiva`,
      );
    }

    const data: BootstrapMetaDto = {
      sucursal_id: sucursalId,
      catalog_version: CATALOG_VERSION,
      server_timestamp: new Date().toISOString(),
      requires_full_sync: false, // Iteración 1: siempre false (solo informativo)
    };

    return this.wrapResponse(data);
  }

  /**
   * Obtener datos de sucursal
   * Endpoint: GET /api/bootstrap/sucursal/:id
   *
   * Query SQL:
   * SELECT id, codigo, nombre, rut, direccion, telefono, email, timezone, esta_activa, configuracion
   * FROM sucursal
   * WHERE id = ? AND esta_activa = true
   * LIMIT 1;
   */
  async getSucursal(id: string): Promise<SucursalResponseDto> {
    const sucursal = await this.sucursalRepository.findById(id);

    if (!sucursal) {
      throw new NotFoundException(
        `Sucursal con ID ${id} no encontrada o inactiva`,
      );
    }

    return this.wrapResponse(sucursal);
  }

  /**
   * Obtener datos de dispositivo
   * Endpoint: GET /api/bootstrap/dispositivo?sucursal_id={id}&dispositivo_id={id}
   *
   * Query SQL:
   * SELECT id, sucursal_id, codigo, nombre, tipo, dispositivo_info,
   *        esta_activo, ultima_sincronizacion, version_app
   * FROM dispositivo
   * WHERE sucursal_id = ? AND id = ? AND esta_activo = true
   * LIMIT 1;
   */
  async getDispositivo(
    sucursalId: string,
    dispositivoId: string,
  ): Promise<DispositivoResponseDto> {
    const dispositivo = await this.dispositivoRepository.findBySucursalAndId(
      sucursalId,
      dispositivoId,
    );

    if (!dispositivo) {
      throw new NotFoundException(
        `Dispositivo con ID ${dispositivoId} no encontrado en sucursal ${sucursalId} o inactivo`,
      );
    }

    return this.wrapResponse(dispositivo);
  }

  /**
   * Envuelve los datos en la estructura estándar de respuesta
   * Incluye bootstrap_version y generated_at en todas las respuestas
   */
  private wrapResponse<T>(data: T): any {
    return {
      bootstrap_version: BOOTSTRAP_VERSION,
      generated_at: new Date().toISOString(),
      data,
    };
  }
}
