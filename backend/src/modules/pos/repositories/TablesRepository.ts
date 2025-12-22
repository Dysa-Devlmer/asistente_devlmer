/**
 * Tables Repository
 * Database access layer for Mesa (tables)
 */

import { Pool, PoolClient } from 'pg';

export interface TableDTO {
  id_mesa?: number;
  Num_Mesa: string;
  descripcion: string;
  id_salon: string;
  id_tarifa?: number;
  estado: 'libre' | 'ocupada' | 'reservada';
  top: number;
  izq: number;
  width: number;
  height: number;
}

export interface TableWithSale extends TableDTO {
  id_venta?: number;
  tarifa_nombre?: string;
  venta_total?: number;
  venta_items?: number;
}

export class TablesRepository {
  constructor(private pool: Pool) {}

  /**
   * Get all tables with current status
   * Includes active sale information if table is occupied
   */
  async findAll(id_salon?: string): Promise<TableWithSale[]> {
    const query = `
      SELECT
        m.*,
        v.id_venta,
        t.nombre as tarifa_nombre,
        (SELECT SUM(total) FROM ventadir_comg WHERE id_venta = v.id_venta) as venta_total,
        (SELECT COUNT(*) FROM ventadir_comg WHERE id_venta = v.id_venta) as venta_items
      FROM mesa m
      LEFT JOIN tarifa t ON m.id_tarifa = t.id_tarifa
      LEFT JOIN ventadirecta v ON m."Num_Mesa" = v."Num_Mesa" AND v.cerrada = 'N'
      WHERE m."Num_Mesa" <> '00'
        ${id_salon ? "AND m.id_salon = $1" : ""}
      ORDER BY m.id_salon, m."Num_Mesa"
    `;

    const params = id_salon ? [id_salon] : [];
    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      ...row,
      estado: row.id_venta ? 'ocupada' : (row.estado || 'libre')
    }));
  }

  /**
   * Get table by number
   */
  async findByNumber(Num_Mesa: string): Promise<TableWithSale | null> {
    const query = `
      SELECT
        m.*,
        v.id_venta,
        t.nombre as tarifa_nombre,
        (SELECT SUM(total) FROM ventadir_comg WHERE id_venta = v.id_venta) as venta_total,
        (SELECT COUNT(*) FROM ventadir_comg WHERE id_venta = v.id_venta) as venta_items
      FROM mesa m
      LEFT JOIN tarifa t ON m.id_tarifa = t.id_tarifa
      LEFT JOIN ventadirecta v ON m."Num_Mesa" = v."Num_Mesa" AND v.cerrada = 'N'
      WHERE m."Num_Mesa" = $1
    `;

    const result = await this.pool.query(query, [Num_Mesa]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      estado: row.id_venta ? 'ocupada' : (row.estado || 'libre')
    };
  }

  /**
   * Get table's rate/tarifa
   */
  async getTableRate(Num_Mesa: string): Promise<{ id_tarifa: number; nombre: string } | null> {
    const query = `
      SELECT t.id_tarifa, t.nombre
      FROM tarifa t
      INNER JOIN mesa m ON t.id_tarifa = m.id_tarifa
      WHERE m."Num_Mesa" = $1
    `;

    const result = await this.pool.query(query, [Num_Mesa]);

    return result.rows[0] || null;
  }

  /**
   * Update table status
   */
  async updateStatus(
    Num_Mesa: string,
    estado: 'libre' | 'ocupada' | 'reservada',
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    await db.query(
      'UPDATE mesa SET estado = $1 WHERE "Num_Mesa" = $2',
      [estado, Num_Mesa]
    );
  }

  /**
   * Get tables by salon
   */
  async findBySalon(id_salon: string): Promise<TableWithSale[]> {
    return this.findAll(id_salon);
  }

  /**
   * Get occupied tables count
   */
  async getOccupiedCount(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM mesa m
      WHERE EXISTS (
        SELECT 1 FROM ventadirecta v
        WHERE v."Num_Mesa" = m."Num_Mesa" AND v.cerrada = 'N'
      )
      AND m."Num_Mesa" <> '00'
    `;

    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if table is available
   */
  async isAvailable(Num_Mesa: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM ventadirecta
      WHERE "Num_Mesa" = $1 AND cerrada = 'N'
    `;

    const result = await this.pool.query(query, [Num_Mesa]);
    return parseInt(result.rows[0].count, 10) === 0;
  }
}
