/**
 * Sales Service
 * Business logic for sales/orders management
 */

import { Pool, PoolClient } from 'pg';
import { SalesRepository, SaleDTO, SaleLineDTO } from '../repositories/SalesRepository';
import { TablesRepository } from '../repositories/TablesRepository';

export interface CreateSaleParams {
  Num_Mesa: string;
  id_camarero: string;
  id_caja: number;
  observaciones?: string;
}

export interface AddLineParams {
  id_complementog: string;
  cantidad: number;
  observaciones?: string;
}

export interface FinalizeSaleParams {
  forma_pago: 'efectivo' | 'tarjeta' | 'mixto';
  importe_pagado: number;
  importe_efectivo?: number;
  importe_tarjeta?: number;
}

export class SalesService {
  constructor(
    private salesRepo: SalesRepository,
    private tablesRepo: TablesRepository,
    private pool: Pool
  ) {}

  /**
   * Create new sale
   */
  async createSale(params: CreateSaleParams) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if table is available
      const isAvailable = await this.tablesRepo.isAvailable(params.Num_Mesa);
      if (!isAvailable) {
        throw new Error('Mesa ya tiene una venta abierta');
      }

      // Get table's rate
      const tableRate = await this.tablesRepo.getTableRate(params.Num_Mesa);
      const tarifa = tableRate?.nombre || 'Default';

      // Create sale
      const sale: SaleDTO = {
        Num_Mesa: params.Num_Mesa,
        id_camarero: params.id_camarero,
        id_caja: params.id_caja,
        cerrada: 'N',
        tarifa,
        observaciones: params.observaciones
      };

      const id_venta = await this.salesRepo.create(sale, client);

      // Update table status
      await this.tablesRepo.updateStatus(params.Num_Mesa, 'ocupada', client);

      await client.query('COMMIT');

      // Get full sale details
      const fullSale = await this.salesRepo.findById(id_venta);

      return {
        id_venta,
        tarifa,
        venta: fullSale
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get sale by ID
   */
  async getSale(id_venta: number) {
    const sale = await this.salesRepo.findById(id_venta);

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    // Check if still open
    if (sale.cerrada === 'S') {
      throw new Error('Venta ya está cerrada');
    }

    return sale;
  }

  /**
   * Get all open sales
   */
  async getOpenSales(id_camarero?: string) {
    return this.salesRepo.findOpenSales(id_camarero);
  }

  /**
   * Add line to sale
   */
  async addLine(id_venta: number, params: AddLineParams) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get sale to check status and get tarifa
      const sale = await this.salesRepo.findById(id_venta);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      if (sale.cerrada === 'S') {
        throw new Error('No se pueden agregar productos a una venta cerrada');
      }

      // Get product price according to sale's rate
      const { pvp, avgiva } = await this.salesRepo.getProductPrice(
        params.id_complementog,
        sale.tarifa
      );

      // Calculate prices
      const precio = pvp / (1 + (avgiva / 100));
      const total = pvp * params.cantidad;

      // Create line
      const line: SaleLineDTO = {
        id_venta,
        id_complementog: params.id_complementog,
        cantidad: params.cantidad,
        precio,
        total,
        avgiva,
        servido: 'N',
        observaciones: params.observaciones
      };

      const id_linea = await this.salesRepo.addLine(line, client);

      await client.query('COMMIT');

      // Get updated sale
      const updatedSale = await this.salesRepo.findById(id_venta);

      return {
        id_linea,
        precio,
        total,
        venta: updatedSale
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update sale line
   */
  async updateLine(
    id_venta: number,
    id_linea: number,
    updates: { cantidad?: number; observaciones?: string; servido?: 'S' | 'N' }
  ) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Verify line belongs to sale
      const lines = await this.salesRepo.getSaleLines(id_venta);
      const line = lines.find(l => l.id_linea === id_linea);

      if (!line) {
        throw new Error('Línea no encontrada en esta venta');
      }

      // Update line
      await this.salesRepo.updateLine(id_linea, updates, client);

      await client.query('COMMIT');

      // Get updated sale
      const updatedSale = await this.salesRepo.findById(id_venta);

      return updatedSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete sale line
   */
  async deleteLine(id_venta: number, id_linea: number) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Verify line belongs to sale
      const lines = await this.salesRepo.getSaleLines(id_venta);
      const line = lines.find(l => l.id_linea === id_linea);

      if (!line) {
        throw new Error('Línea no encontrada en esta venta');
      }

      // Delete line
      await this.salesRepo.deleteLine(id_linea, client);

      await client.query('COMMIT');

      // Get updated sale
      const updatedSale = await this.salesRepo.findById(id_venta);

      return updatedSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Change sale table
   */
  async changeSaleTable(id_venta: number, nueva_mesa: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get current sale
      const sale = await this.salesRepo.findById(id_venta);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // Check new table is available
      const isAvailable = await this.tablesRepo.isAvailable(nueva_mesa);
      if (!isAvailable) {
        throw new Error('La nueva mesa ya tiene una venta abierta');
      }

      const old_mesa = sale.Num_Mesa;

      // Get new table's rate
      const newRate = await this.tablesRepo.getTableRate(nueva_mesa);
      const tarifa = newRate?.nombre || 'Default';

      // Update sale
      await this.salesRepo.update(
        id_venta,
        { Num_Mesa: nueva_mesa, tarifa },
        client
      );

      // Recalculate prices if rate changed
      if (tarifa !== sale.tarifa) {
        await this.salesRepo.recalculateLinesForRate(id_venta, tarifa, client);
      }

      // Update table statuses
      await this.tablesRepo.updateStatus(old_mesa, 'libre', client);
      await this.tablesRepo.updateStatus(nueva_mesa, 'ocupada', client);

      await client.query('COMMIT');

      // Get updated sale
      const updatedSale = await this.salesRepo.findById(id_venta);

      return updatedSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Change sale rate
   */
  async changeSaleRate(id_venta: number, id_tarifa: number | 'default') {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get tarifa name
      let tarifa = 'Default';
      if (id_tarifa !== 'default') {
        const result = await client.query(
          'SELECT nombre FROM tarifa WHERE id_tarifa = $1',
          [id_tarifa]
        );
        if (result.rows.length === 0) {
          throw new Error('Tarifa no encontrada');
        }
        tarifa = result.rows[0].nombre;
      }

      // Update sale
      await this.salesRepo.update(id_venta, { tarifa }, client);

      // Recalculate all lines
      await this.salesRepo.recalculateLinesForRate(id_venta, tarifa, client);

      await client.query('COMMIT');

      // Get updated sale
      const updatedSale = await this.salesRepo.findById(id_venta);

      return updatedSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Finalize/close sale
   */
  async finalizeSale(id_venta: number, params: FinalizeSaleParams) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get sale
      const sale = await this.salesRepo.findById(id_venta);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      if (sale.cerrada === 'S') {
        throw new Error('Venta ya está cerrada');
      }

      // Calculate total
      const total = sale.total_iva || 0;

      if (params.importe_pagado < total) {
        throw new Error('Importe pagado insuficiente');
      }

      // Update sale
      await this.salesRepo.update(
        id_venta,
        {
          cerrada: 'S',
          total,
          forma_pago: params.forma_pago,
          importe_pagado: params.importe_pagado
        },
        client
      );

      // Free table
      await this.tablesRepo.updateStatus(sale.Num_Mesa, 'libre', client);

      await client.query('COMMIT');

      const cambio = params.importe_pagado - total;

      return {
        id_venta,
        total,
        cambio,
        ticket_url: `/api/pos/sales/${id_venta}/ticket`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Park/pause sale (keep it open but allow to work on other sales)
   */
  async parkSale(id_venta: number) {
    // In the legacy system, parking just saves current state
    // We just need to ensure sale is still open
    const sale = await this.salesRepo.findById(id_venta);

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    if (sale.cerrada === 'S') {
      throw new Error('No se puede aparcar una venta cerrada');
    }

    return {
      id_venta,
      message: 'Venta aparcada correctamente',
      venta: sale
    };
  }

  /**
   * Cancel sale
   */
  async cancelSale(id_venta: number) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get sale
      const sale = await this.salesRepo.findById(id_venta);
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // Delete all lines
      await client.query('DELETE FROM ventadir_comg WHERE id_venta = $1', [id_venta]);

      // Delete sale
      await client.query('DELETE FROM ventadirecta WHERE id_venta = $1', [id_venta]);

      // Free table
      await this.tablesRepo.updateStatus(sale.Num_Mesa, 'libre', client);

      await client.query('COMMIT');

      return {
        id_venta,
        message: 'Venta cancelada correctamente'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get kitchen pending orders
   */
  async getKitchenPending() {
    const orders = await this.salesRepo.getKitchenPending();

    return orders.map(order => ({
      ...order,
      lineas_pendientes: order.lineas_pendientes || [],
      total_pendiente: (order.lineas_pendientes || []).length
    }));
  }

  /**
   * Mark line as served
   */
  async markLineServed(id_venta: number, id_linea: number) {
    return this.updateLine(id_venta, id_linea, { servido: 'S' });
  }
}
