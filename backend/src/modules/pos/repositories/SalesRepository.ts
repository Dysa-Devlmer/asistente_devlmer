/**
 * Sales Repository
 * Database access layer for VentaDirecta (sales)
 */

import { Pool, PoolClient } from 'pg';

export interface SaleDTO {
  id_venta?: number;
  Num_Mesa: string;
  id_camarero: string;
  id_caja: number;
  cerrada: 'S' | 'N';
  tarifa: string;
  fecha_venta?: Date;
  fecha_cierre?: Date;
  total?: number;
  forma_pago?: string;
  importe_pagado?: number;
  observaciones?: string;
}

export interface SaleLineDTO {
  id_linea?: number;
  id_venta: number;
  id_complementog: string;
  cantidad: number;
  precio: number;
  total: number;
  avgiva: number;
  servido: 'S' | 'N';
  observaciones?: string;
  fecha_hora?: Date;
}

export interface SaleWithDetails extends SaleDTO {
  mesa_descripcion?: string;
  camarero_nombre?: string;
  num_items?: number;
  subtotal?: number;
  total_iva?: number;
  lineas?: SaleLineWithProduct[];
}

export interface SaleLineWithProduct extends SaleLineDTO {
  des_complementog?: string;
  imagen_producto?: string;
}

export class SalesRepository {
  constructor(private pool: Pool) {}

  /**
   * Create new sale
   */
  async create(sale: SaleDTO, client?: PoolClient): Promise<number> {
    const db = client || this.pool;

    const result = await db.query(
      `INSERT INTO ventadirecta
       ("Num_Mesa", id_camarero, id_caja, cerrada, tarifa, fecha_venta, observaciones)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       RETURNING id_venta`,
      [
        sale.Num_Mesa,
        sale.id_camarero,
        sale.id_caja,
        sale.cerrada || 'N',
        sale.tarifa,
        sale.observaciones
      ]
    );

    return result.rows[0].id_venta;
  }

  /**
   * Find sale by ID with full details
   */
  async findById(id_venta: number): Promise<SaleWithDetails | null> {
    const query = `
      SELECT
        v.*,
        m.descripcion as mesa_descripcion,
        c.nombre as camarero_nombre,
        (SELECT COUNT(*) FROM ventadir_comg WHERE id_venta = v.id_venta) as num_items,
        (SELECT SUM(precio * cantidad) FROM ventadir_comg WHERE id_venta = v.id_venta) as subtotal,
        (SELECT SUM(total) FROM ventadir_comg WHERE id_venta = v.id_venta) as total_iva
      FROM ventadirecta v
      LEFT JOIN mesa m ON v."Num_Mesa" = m."Num_Mesa"
      LEFT JOIN camareros c ON v.id_camarero = c.id_camarero
      WHERE v.id_venta = $1
    `;

    const result = await this.pool.query(query, [id_venta]);

    if (result.rows.length === 0) return null;

    const sale = result.rows[0];

    // Get lines
    const lines = await this.getSaleLines(id_venta);

    return {
      ...sale,
      lineas: lines,
      num_items: parseInt(sale.num_items || '0', 10),
      subtotal: parseFloat(sale.subtotal || '0'),
      total_iva: parseFloat(sale.total_iva || '0')
    };
  }

  /**
   * Get sale lines with product details
   */
  async getSaleLines(id_venta: number): Promise<SaleLineWithProduct[]> {
    const query = `
      SELECT
        l.*,
        p.des_complementog,
        p.imagen as imagen_producto
      FROM ventadir_comg l
      INNER JOIN complementog p ON l.id_complementog = p.id_complementog
      WHERE l.id_venta = $1
      ORDER BY l.id_linea
    `;

    const result = await this.pool.query(query, [id_venta]);

    return result.rows;
  }

  /**
   * Find all open sales
   */
  async findOpenSales(id_camarero?: string): Promise<SaleWithDetails[]> {
    const query = `
      SELECT
        v.*,
        m.descripcion as mesa_descripcion,
        c.nombre as camarero_nombre,
        (SELECT COUNT(*) FROM ventadir_comg WHERE id_venta = v.id_venta) as num_items,
        (SELECT SUM(precio * cantidad) FROM ventadir_comg WHERE id_venta = v.id_venta) as subtotal,
        (SELECT SUM(total) FROM ventadir_comg WHERE id_venta = v.id_venta) as total_iva
      FROM ventadirecta v
      LEFT JOIN mesa m ON v."Num_Mesa" = m."Num_Mesa"
      LEFT JOIN camareros c ON v.id_camarero = c.id_camarero
      WHERE v.cerrada = 'N'
        ${id_camarero ? "AND v.id_camarero = $1" : ""}
      ORDER BY v.fecha_venta DESC
    `;

    const params = id_camarero ? [id_camarero] : [];
    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      ...row,
      num_items: parseInt(row.num_items || '0', 10),
      subtotal: parseFloat(row.subtotal || '0'),
      total_iva: parseFloat(row.total_iva || '0')
    }));
  }

  /**
   * Add line to sale
   */
  async addLine(line: SaleLineDTO, client?: PoolClient): Promise<number> {
    const db = client || this.pool;

    const result = await db.query(
      `INSERT INTO ventadir_comg
       (id_venta, id_complementog, cantidad, precio, total, avgiva, servido, observaciones, fecha_hora)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id_linea`,
      [
        line.id_venta,
        line.id_complementog,
        line.cantidad,
        line.precio,
        line.total,
        line.avgiva,
        line.servido || 'N',
        line.observaciones
      ]
    );

    return result.rows[0].id_linea;
  }

  /**
   * Update sale line
   */
  async updateLine(
    id_linea: number,
    updates: Partial<SaleLineDTO>,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.cantidad !== undefined) {
      fields.push(`cantidad = $${paramIndex++}`);
      values.push(updates.cantidad);

      // Recalculate total if cantidad changed
      if (updates.precio !== undefined || updates.avgiva !== undefined) {
        const lineResult = await db.query(
          'SELECT precio, avgiva FROM ventadir_comg WHERE id_linea = $1',
          [id_linea]
        );
        const line = lineResult.rows[0];
        const precio = updates.precio ?? line.precio;
        const avgiva = updates.avgiva ?? line.avgiva;
        const pvp = precio * (1 + (avgiva / 100));
        const total = pvp * updates.cantidad;

        fields.push(`total = $${paramIndex++}`);
        values.push(total);
      }
    }

    if (updates.precio !== undefined) {
      fields.push(`precio = $${paramIndex++}`);
      values.push(updates.precio);
    }

    if (updates.observaciones !== undefined) {
      fields.push(`observaciones = $${paramIndex++}`);
      values.push(updates.observaciones);
    }

    if (updates.servido !== undefined) {
      fields.push(`servido = $${paramIndex++}`);
      values.push(updates.servido);
    }

    if (fields.length === 0) return;

    values.push(id_linea);

    await db.query(
      `UPDATE ventadir_comg SET ${fields.join(', ')} WHERE id_linea = $${paramIndex}`,
      values
    );
  }

  /**
   * Delete sale line
   */
  async deleteLine(id_linea: number, client?: PoolClient): Promise<void> {
    const db = client || this.pool;

    await db.query('DELETE FROM ventadir_comg WHERE id_linea = $1', [id_linea]);
  }

  /**
   * Update sale
   */
  async update(
    id_venta: number,
    updates: Partial<SaleDTO>,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.Num_Mesa !== undefined) {
      fields.push(`"Num_Mesa" = $${paramIndex++}`);
      values.push(updates.Num_Mesa);
    }

    if (updates.tarifa !== undefined) {
      fields.push(`tarifa = $${paramIndex++}`);
      values.push(updates.tarifa);
    }

    if (updates.observaciones !== undefined) {
      fields.push(`observaciones = $${paramIndex++}`);
      values.push(updates.observaciones);
    }

    if (updates.cerrada !== undefined) {
      fields.push(`cerrada = $${paramIndex++}`);
      values.push(updates.cerrada);

      if (updates.cerrada === 'S') {
        fields.push(`fecha_cierre = NOW()`);
      }
    }

    if (updates.total !== undefined) {
      fields.push(`total = $${paramIndex++}`);
      values.push(updates.total);
    }

    if (updates.forma_pago !== undefined) {
      fields.push(`forma_pago = $${paramIndex++}`);
      values.push(updates.forma_pago);
    }

    if (updates.importe_pagado !== undefined) {
      fields.push(`importe_pagado = $${paramIndex++}`);
      values.push(updates.importe_pagado);
    }

    if (fields.length === 0) return;

    values.push(id_venta);

    await db.query(
      `UPDATE ventadirecta SET ${fields.join(', ')} WHERE id_venta = $${paramIndex}`,
      values
    );
  }

  /**
   * Get product price for sale's rate
   */
  async getProductPrice(
    id_complementog: string,
    tarifa: string
  ): Promise<{ pvp: number; avgiva: number }> {
    // Try to get rate-specific price
    let query = `
      SELECT
        COALESCE(
          (SELECT pvptarifa FROM comg_tarifa
           WHERE id_complementog = $1
             AND id_tarifa = (SELECT id_tarifa FROM tarifa WHERE nombre = $2)),
          (SELECT pvp FROM complementog WHERE id_complementog = $1)
        ) as pvp,
        avgiva
      FROM complementog
      WHERE id_complementog = $1
    `;

    const result = await this.pool.query(query, [id_complementog, tarifa]);

    if (result.rows.length === 0) {
      throw new Error(`Product ${id_complementog} not found`);
    }

    return {
      pvp: parseFloat(result.rows[0].pvp),
      avgiva: parseFloat(result.rows[0].avgiva)
    };
  }

  /**
   * Recalculate sale lines for new rate
   */
  async recalculateLinesForRate(
    id_venta: number,
    tarifa: string,
    client?: PoolClient
  ): Promise<void> {
    const db = client || this.pool;

    const lines = await db.query(
      'SELECT * FROM ventadir_comg WHERE id_venta = $1 AND precio <> 0',
      [id_venta]
    );

    for (const line of lines.rows) {
      const { pvp, avgiva } = await this.getProductPrice(
        line.id_complementog,
        tarifa
      );

      const precio = pvp / (1 + (avgiva / 100));
      const total = pvp * line.cantidad;

      await db.query(
        'UPDATE ventadir_comg SET precio = $1, total = $2, avgiva = $3 WHERE id_linea = $4',
        [precio, total, avgiva, line.id_linea]
      );
    }
  }

  /**
   * Get kitchen pending orders
   */
  async getKitchenPending(): Promise<any[]> {
    const query = `
      SELECT
        v.id_venta,
        v."Num_Mesa",
        v.id_camarero,
        c.nombre as nombre_camarero,
        v.fecha_venta,
        json_agg(
          json_build_object(
            'id_linea', l.id_linea,
            'id_complementog', l.id_complementog,
            'des_producto', p.des_complementog,
            'cantidad', l.cantidad,
            'observaciones', l.observaciones,
            'fecha_hora', l.fecha_hora
          ) ORDER BY l.fecha_hora
        ) FILTER (WHERE l.servido = 'N') as lineas_pendientes
      FROM ventadirecta v
      INNER JOIN camareros c ON v.id_camarero = c.id_camarero
      INNER JOIN ventadir_comg l ON v.id_venta = l.id_venta
      INNER JOIN complementog p ON l.id_complementog = p.id_complementog
      WHERE v.cerrada = 'N' AND l.servido = 'N'
      GROUP BY v.id_venta, v."Num_Mesa", v.id_camarero, c.nombre, v.fecha_venta
      ORDER BY v.fecha_venta
    `;

    const result = await this.pool.query(query);

    return result.rows;
  }
}
