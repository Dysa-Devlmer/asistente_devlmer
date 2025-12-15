import { Injectable } from '@nestjs/common';
import { KnexService } from '../../../common/database/knex.service';
import { SucursalDto } from '../dto/sucursal.dto';

/**
 * Repository para operaciones de lectura de Sucursal
 * Iteración 1: Solo SELECTs
 */
@Injectable()
export class SucursalRepository {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Obtener sucursal por ID
   * Query SQL exacta:
   * SELECT id, codigo, nombre, rut, direccion, telefono, email, timezone, esta_activa, configuracion
   * FROM sucursal
   * WHERE id = ? AND esta_activa = true
   * LIMIT 1;
   */
  async findById(id: string): Promise<SucursalDto | null> {
    const knex = this.knexService.instance;

    const result = await knex('sucursal')
      .select(
        'id',
        'codigo',
        'nombre',
        'rut',
        'direccion',
        'telefono',
        'email',
        'timezone',
        'esta_activa',
        'configuracion',
      )
      .where({ id, esta_activa: true })
      .first();

    return result || null;
  }

  /**
   * Verificar si sucursal existe y está activa
   * Query SQL exacta:
   * SELECT EXISTS(SELECT 1 FROM sucursal WHERE id = ? AND esta_activa = true);
   */
  async exists(id: string): Promise<boolean> {
    const knex = this.knexService.instance;

    const result = await knex('sucursal')
      .select(knex.raw('1'))
      .where({ id, esta_activa: true })
      .first();

    return !!result;
  }

  /**
   * Obtener timestamp de última actualización de sucursal
   * Usado para catalog_version en Iteración 1
   * Query SQL exacta:
   * SELECT updated_at FROM sucursal WHERE id = ? LIMIT 1;
   */
  async getLastUpdated(id: string): Promise<Date | null> {
    const knex = this.knexService.instance;

    const result = await knex('sucursal')
      .select('updated_at')
      .where({ id })
      .first();

    return result?.updated_at || null;
  }
}
