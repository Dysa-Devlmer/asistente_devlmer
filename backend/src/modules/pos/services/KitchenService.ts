/**
 * Kitchen Service
 * Business logic for kitchen operations
 */

import { PoolClient } from 'pg';
import { getPool } from '../../../config/postgres';
import {
  KitchenRepository,
  KitchenItem,
  KitchenStats,
  MarkServedResult,
} from '../repositories/KitchenRepository';

export interface KitchenItemsResponse {
  items: KitchenItem[];
  summary: {
    totalPending: number;
    byStation: {
      [station: number]: number;
    };
  };
}

export class KitchenService {
  private kitchenRepo: KitchenRepository;

  constructor() {
    this.kitchenRepo = new KitchenRepository();
  }

  /**
   * Initialize kitchen module
   * Checks and adds servido_cocina field if missing
   */
  async initialize(): Promise<void> {
    console.log('[KitchenService] Initializing kitchen module...');

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check and add servido_cocina field if needed
      await this.kitchenRepo.addServidoCocinaField(client);

      await client.query('COMMIT');
      console.log('[KitchenService] Kitchen module initialized successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[KitchenService] Failed to initialize kitchen module:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all pending kitchen items
   * @param filters - Optional filters (station, mesa)
   * @returns Kitchen items with summary
   */
  async getPendingItems(filters?: {
    station?: number;
    mesa?: string;
  }): Promise<KitchenItemsResponse> {
    const items = await this.kitchenRepo.findPendingItems(filters);

    // Calculate summary
    const summary = {
      totalPending: items.length,
      byStation: {} as { [station: number]: number },
    };

    items.forEach((item) => {
      if (!summary.byStation[item.bloque_cocina]) {
        summary.byStation[item.bloque_cocina] = 0;
      }
      summary.byStation[item.bloque_cocina]++;
    });

    return { items, summary };
  }

  /**
   * Mark an item (or partial quantity) as served
   * @param id_venta - Sale ID
   * @param id_linea - Line ID
   * @param quantity - Optional: quantity to mark (default: all pending)
   * @returns Result with updated quantities
   */
  async markItemServed(
    id_venta: number,
    id_linea: number,
    quantity?: number
  ): Promise<MarkServedResult> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await this.kitchenRepo.markItemServed(
        id_venta,
        id_linea,
        quantity,
        client
      );

      await client.query('COMMIT');

      console.log(
        `[KitchenService] Marked item served: venta=${id_venta}, line=${id_linea}, ` +
          `served=${result.newServed}, remaining=${result.remaining}`
      );

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[KitchenService] Failed to mark item served:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark all items from an order as served
   * @param id_venta - Sale ID
   * @param bloque_cocina - Optional: only mark items from this station
   * @returns Number of items updated
   */
  async markAllServed(id_venta: number, bloque_cocina?: number): Promise<number> {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const count = await this.kitchenRepo.markAllServed(id_venta, bloque_cocina, client);

      await client.query('COMMIT');

      console.log(
        `[KitchenService] Marked all items served: venta=${id_venta}, ` +
          `station=${bloque_cocina || 'all'}, count=${count}`
      );

      return count;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[KitchenService] Failed to mark all served:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get kitchen statistics
   * @returns Kitchen stats by station
   */
  async getStats(): Promise<KitchenStats> {
    return await this.kitchenRepo.getStats();
  }

  /**
   * Get a specific kitchen item by ID
   * @param id_venta - Sale ID
   * @param id_linea - Line ID
   * @returns Kitchen item or null
   */
  async getItemById(id_venta: number, id_linea: number): Promise<KitchenItem | null> {
    return await this.kitchenRepo.findById(id_venta, id_linea);
  }

  /**
   * Get all kitchen items for a specific order
   * @param id_venta - Sale ID
   * @returns Array of kitchen items
   */
  async getItemsByOrder(id_venta: number): Promise<KitchenItem[]> {
    return await this.kitchenRepo.findByOrder(id_venta);
  }

  /**
   * Validate that servido_cocina field exists
   * @returns true if field exists
   */
  async validateDatabase(): Promise<boolean> {
    const fieldExists = await this.kitchenRepo.checkServidoCocinaField();
    if (!fieldExists) {
      console.warn(
        '[KitchenService] Warning: servido_cocina field does not exist. ' +
          'Please run initialize() to add it.'
      );
    }
    return fieldExists;
  }
}
