/**
 * Kitchen Repository
 * Database access layer for kitchen operations
 */

import { Pool, PoolClient } from 'pg';
import { getPool } from '../../../config/postgres';

export interface KitchenItem {
  id_venta: number;
  id_linea: number;
  cantidad: number;
  cocina: number;
  servido_cocina: number;
  bloque_cocina: number;
  complementog: string;
  nota: string | null;
  observaciones: string | null;
  num_mesa: string;
  fecha_venta: string;
  hora: string;
  id_camarero: string;
  pendingQty: number;
}

export interface KitchenStats {
  totalOrders: number;
  totalItems: number;
  byStation: {
    [station: number]: {
      orders: number;
      items: number;
    };
  };
  oldestOrder?: {
    id_venta: number;
    mesa: string;
    waitTime: number;
  };
}

export interface MarkServedResult {
  id_venta: number;
  id_linea: number;
  previousServed: number;
  newServed: number;
  remaining: number;
}

export class KitchenRepository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Check if servido_cocina field exists in ventadir_comg table
   */
  async checkServidoCocinaField(client?: PoolClient): Promise<boolean> {
    const executor = client || this.pool;

    const result = await executor.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'ventadir_comg'
         AND column_name = 'servido_cocina'`
    );

    return result.rows.length > 0;
  }

  /**
   * Add servido_cocina field to ventadir_comg table if it doesn't exist
   */
  async addServidoCocinaField(client?: PoolClient): Promise<void> {
    const executor = client || this.pool;

    // Check if field already exists
    const fieldExists = await this.checkServidoCocinaField(executor);
    if (fieldExists) {
      console.log('[KitchenRepository] servido_cocina field already exists');
      return;
    }

    console.log('[KitchenRepository] Adding servido_cocina field...');

    // Add column
    await executor.query(
      `ALTER TABLE ventadir_comg
       ADD COLUMN servido_cocina INT DEFAULT 0`
    );

    // Create index for performance
    await executor.query(
      `CREATE INDEX IF NOT EXISTS idx_servido_cocina
       ON ventadir_comg(servido_cocina)`
    );

    console.log('[KitchenRepository] servido_cocina field added successfully');
  }

  /**
   * Find all pending kitchen items
   * @param filters - Optional filters (station, mesa)
   * @returns Array of kitchen items with pending quantity > 0
   */
  async findPendingItems(
    filters?: { station?: number; mesa?: string },
    client?: PoolClient
  ): Promise<KitchenItem[]> {
    const executor = client || this.pool;

    let query = `
      SELECT
        vc.id_venta,
        vc.id_linea,
        vc.cantidad,
        vc.cocina,
        COALESCE(vc.servido_cocina, 0) as servido_cocina,
        vc.bloque_cocina,
        vc.complementog,
        vc.nota,
        vc.observaciones,
        v.num_mesa,
        v.fecha_venta,
        v.hora,
        v.id_camarero,
        (vc.cocina - COALESCE(vc.servido_cocina, 0)) as "pendingQty"
      FROM ventadir_comg vc
      INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
      WHERE v.cerrada = 'N'
        AND vc.cocina > 0
        AND vc.cocina > COALESCE(vc.servido_cocina, 0)
        AND vc.bloque_cocina IS NOT NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.station) {
      query += ` AND vc.bloque_cocina = $${paramIndex}`;
      params.push(filters.station);
      paramIndex++;
    }

    if (filters?.mesa) {
      query += ` AND v.num_mesa = $${paramIndex}`;
      params.push(filters.mesa);
      paramIndex++;
    }

    query += ` ORDER BY v.fecha_venta, v.hora, vc.bloque_cocina, vc.id_linea`;

    const result = await executor.query(query, params);

    return result.rows.map((row) => ({
      id_venta: row.id_venta,
      id_linea: row.id_linea,
      cantidad: parseFloat(row.cantidad),
      cocina: row.cocina,
      servido_cocina: row.servido_cocina,
      bloque_cocina: row.bloque_cocina,
      complementog: row.complementog,
      nota: row.nota,
      observaciones: row.observaciones,
      num_mesa: row.num_mesa,
      fecha_venta: row.fecha_venta,
      hora: row.hora,
      id_camarero: row.id_camarero,
      pendingQty: row.pendingQty,
    }));
  }

  /**
   * Mark an item (or partial quantity) as served
   * @param id_venta - Sale ID
   * @param id_linea - Line ID
   * @param quantity - Quantity to mark as served (default: all pending)
   * @returns Updated item information
   */
  async markItemServed(
    id_venta: number,
    id_linea: number,
    quantity?: number,
    client?: PoolClient
  ): Promise<MarkServedResult> {
    const executor = client || this.pool;

    // Get current state
    const current = await executor.query(
      `SELECT cocina, COALESCE(servido_cocina, 0) as servido_cocina
       FROM ventadir_comg
       WHERE id_venta = $1 AND id_linea = $2`,
      [id_venta, id_linea]
    );

    if (current.rows.length === 0) {
      throw new Error(`Item not found: id_venta=${id_venta}, id_linea=${id_linea}`);
    }

    const { cocina, servido_cocina } = current.rows[0];
    const previousServed = servido_cocina;

    // Calculate new served quantity
    let newServed: number;
    if (quantity !== undefined) {
      // Mark partial quantity
      newServed = Math.min(previousServed + quantity, cocina);
    } else {
      // Mark all as served
      newServed = cocina;
    }

    // Prevent exceeding cocina quantity
    if (newServed > cocina) {
      throw new Error(
        `Cannot mark more than sent to kitchen: served=${newServed}, cocina=${cocina}`
      );
    }

    // Update database
    await executor.query(
      `UPDATE ventadir_comg
       SET servido_cocina = $1
       WHERE id_venta = $2 AND id_linea = $3`,
      [newServed, id_venta, id_linea]
    );

    return {
      id_venta,
      id_linea,
      previousServed,
      newServed,
      remaining: cocina - newServed,
    };
  }

  /**
   * Mark all items from an order as served
   * @param id_venta - Sale ID
   * @param bloque_cocina - Optional: only mark items from this station
   * @returns Number of items updated
   */
  async markAllServed(
    id_venta: number,
    bloque_cocina?: number,
    client?: PoolClient
  ): Promise<number> {
    const executor = client || this.pool;

    let query = `
      UPDATE ventadir_comg
      SET servido_cocina = cocina
      WHERE id_venta = $1
        AND cocina > COALESCE(servido_cocina, 0)
    `;

    const params: any[] = [id_venta];

    if (bloque_cocina !== undefined) {
      query += ` AND bloque_cocina = $2`;
      params.push(bloque_cocina);
    }

    const result = await executor.query(query, params);

    return result.rowCount || 0;
  }

  /**
   * Get kitchen statistics
   * @returns Kitchen stats by station
   */
  async getStats(client?: PoolClient): Promise<KitchenStats> {
    const executor = client || this.pool;

    // Get total pending items and orders
    const totalResult = await executor.query(
      `SELECT
         COUNT(DISTINCT vc.id_venta) as total_orders,
         COUNT(*) as total_items
       FROM ventadir_comg vc
       INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
       WHERE v.cerrada = 'N'
         AND vc.cocina > 0
         AND vc.cocina > COALESCE(vc.servido_cocina, 0)
         AND vc.bloque_cocina IS NOT NULL`
    );

    const totalOrders = parseInt(totalResult.rows[0].total_orders, 10);
    const totalItems = parseInt(totalResult.rows[0].total_items, 10);

    // Get stats by station
    const byStationResult = await executor.query(
      `SELECT
         vc.bloque_cocina,
         COUNT(DISTINCT vc.id_venta) as orders,
         COUNT(*) as items
       FROM ventadir_comg vc
       INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
       WHERE v.cerrada = 'N'
         AND vc.cocina > 0
         AND vc.cocina > COALESCE(vc.servido_cocina, 0)
         AND vc.bloque_cocina IS NOT NULL
       GROUP BY vc.bloque_cocina`
    );

    const byStation: KitchenStats['byStation'] = {};
    byStationResult.rows.forEach((row) => {
      byStation[row.bloque_cocina] = {
        orders: parseInt(row.orders, 10),
        items: parseInt(row.items, 10),
      };
    });

    // Get oldest order
    const oldestResult = await executor.query(
      `SELECT
         v.id_venta,
         v.num_mesa,
         EXTRACT(EPOCH FROM (NOW() - (v.fecha_venta::date + v.hora::time)::timestamp)) / 60 as wait_time
       FROM ventadirecta v
       INNER JOIN ventadir_comg vc ON v.id_venta = vc.id_venta
       WHERE v.cerrada = 'N'
         AND vc.cocina > 0
         AND vc.cocina > COALESCE(vc.servido_cocina, 0)
       ORDER BY v.fecha_venta, v.hora
       LIMIT 1`
    );

    let oldestOrder: KitchenStats['oldestOrder'];
    if (oldestResult.rows.length > 0) {
      const row = oldestResult.rows[0];
      oldestOrder = {
        id_venta: row.id_venta,
        mesa: row.num_mesa,
        waitTime: Math.round(parseFloat(row.wait_time)),
      };
    }

    return {
      totalOrders,
      totalItems,
      byStation,
      oldestOrder,
    };
  }

  /**
   * Find a specific kitchen item by ID
   * @param id_venta - Sale ID
   * @param id_linea - Line ID
   * @returns Kitchen item or null if not found
   */
  async findById(
    id_venta: number,
    id_linea: number,
    client?: PoolClient
  ): Promise<KitchenItem | null> {
    const executor = client || this.pool;

    const result = await executor.query(
      `SELECT
         vc.id_venta,
         vc.id_linea,
         vc.cantidad,
         vc.cocina,
         COALESCE(vc.servido_cocina, 0) as servido_cocina,
         vc.bloque_cocina,
         vc.complementog,
         vc.nota,
         vc.observaciones,
         v.num_mesa,
         v.fecha_venta,
         v.hora,
         v.id_camarero,
         (vc.cocina - COALESCE(vc.servido_cocina, 0)) as "pendingQty"
       FROM ventadir_comg vc
       INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
       WHERE vc.id_venta = $1 AND vc.id_linea = $2`,
      [id_venta, id_linea]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id_venta: row.id_venta,
      id_linea: row.id_linea,
      cantidad: parseFloat(row.cantidad),
      cocina: row.cocina,
      servido_cocina: row.servido_cocina,
      bloque_cocina: row.bloque_cocina,
      complementog: row.complementog,
      nota: row.nota,
      observaciones: row.observaciones,
      num_mesa: row.num_mesa,
      fecha_venta: row.fecha_venta,
      hora: row.hora,
      id_camarero: row.id_camarero,
      pendingQty: row.pendingQty,
    };
  }

  /**
   * Get all items for a specific order
   * @param id_venta - Sale ID
   * @returns Array of kitchen items for the order
   */
  async findByOrder(id_venta: number, client?: PoolClient): Promise<KitchenItem[]> {
    const executor = client || this.pool;

    const result = await executor.query(
      `SELECT
         vc.id_venta,
         vc.id_linea,
         vc.cantidad,
         vc.cocina,
         COALESCE(vc.servido_cocina, 0) as servido_cocina,
         vc.bloque_cocina,
         vc.complementog,
         vc.nota,
         vc.observaciones,
         v.num_mesa,
         v.fecha_venta,
         v.hora,
         v.id_camarero,
         (vc.cocina - COALESCE(vc.servido_cocina, 0)) as "pendingQty"
       FROM ventadir_comg vc
       INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
       WHERE vc.id_venta = $1
         AND vc.cocina > 0
       ORDER BY vc.id_linea`,
      [id_venta]
    );

    return result.rows.map((row) => ({
      id_venta: row.id_venta,
      id_linea: row.id_linea,
      cantidad: parseFloat(row.cantidad),
      cocina: row.cocina,
      servido_cocina: row.servido_cocina,
      bloque_cocina: row.bloque_cocina,
      complementog: row.complementog,
      nota: row.nota,
      observaciones: row.observaciones,
      num_mesa: row.num_mesa,
      fecha_venta: row.fecha_venta,
      hora: row.hora,
      id_camarero: row.id_camarero,
      pendingQty: row.pendingQty,
    }));
  }
}
