import { Injectable } from '@nestjs/common';
import { KnexService } from '../../../common/database/knex.service';
import { DispositivoDto } from '../dto/dispositivo.dto';

/**
 * Repository para operaciones de lectura de Dispositivo
 * Iteración 1: Solo SELECTs
 */
@Injectable()
export class DispositivoRepository {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Obtener dispositivo por ID y sucursal
   * Query SQL exacta:
   * SELECT id, sucursal_id, codigo, nombre, tipo, dispositivo_info,
   *        esta_activo, ultima_sincronizacion, version_app
   * FROM dispositivo
   * WHERE sucursal_id = ? AND id = ? AND esta_activo = true
   * LIMIT 1;
   */
  async findBySucursalAndId(
    sucursalId: string,
    dispositivoId: string,
  ): Promise<DispositivoDto | null> {
    const knex = this.knexService.instance;

    const result = await knex('dispositivo')
      .select(
        'id',
        'sucursal_id',
        'codigo',
        'nombre',
        'tipo',
        'dispositivo_info',
        'esta_activo',
        'ultima_sincronizacion',
        'version_app',
      )
      .where({
        sucursal_id: sucursalId,
        id: dispositivoId,
        esta_activo: true,
      })
      .first();

    return result || null;
  }

  /**
   * Verificar si dispositivo existe y pertenece a la sucursal
   * Query SQL exacta:
   * SELECT EXISTS(
   *   SELECT 1 FROM dispositivo
   *   WHERE sucursal_id = ? AND id = ? AND esta_activo = true
   * );
   */
  async exists(sucursalId: string, dispositivoId: string): Promise<boolean> {
    const knex = this.knexService.instance;

    const result = await knex('dispositivo')
      .select(knex.raw('1'))
      .where({
        sucursal_id: sucursalId,
        id: dispositivoId,
        esta_activo: true,
      })
      .first();

    return !!result;
  }
}
