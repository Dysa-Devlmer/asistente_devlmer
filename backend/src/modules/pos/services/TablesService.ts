/**
 * Tables Service
 * Business logic for table management
 */

import { TablesRepository, TableWithSale } from '../repositories/TablesRepository';

export class TablesService {
  constructor(private tablesRepo: TablesRepository) {}

  /**
   * Get all tables with real-time status
   */
  async getAllTables(id_salon?: string): Promise<TableWithSale[]> {
    return this.tablesRepo.findAll(id_salon);
  }

  /**
   * Get table by number with status
   */
  async getTableByNumber(Num_Mesa: string): Promise<TableWithSale | null> {
    return this.tablesRepo.findByNumber(Num_Mesa);
  }

  /**
   * Get tables grouped by salon
   */
  async getTablesBySalon(): Promise<Record<string, TableWithSale[]>> {
    const allTables = await this.tablesRepo.findAll();

    const grouped = allTables.reduce((acc, table) => {
      if (!acc[table.id_salon]) {
        acc[table.id_salon] = [];
      }
      acc[table.id_salon].push(table);
      return acc;
    }, {} as Record<string, TableWithSale[]>);

    return grouped;
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<{
    total: number;
    occupied: number;
    free: number;
    reserved: number;
    occupancy_rate: number;
  }> {
    const allTables = await this.tablesRepo.findAll();

    const stats = {
      total: allTables.length,
      occupied: allTables.filter(t => t.estado === 'ocupada').length,
      free: allTables.filter(t => t.estado === 'libre').length,
      reserved: allTables.filter(t => t.estado === 'reservada').length,
      occupancy_rate: 0
    };

    stats.occupancy_rate = stats.total > 0
      ? Math.round((stats.occupied / stats.total) * 100)
      : 0;

    return stats;
  }

  /**
   * Check if table can be used for new sale
   */
  async canOpenSale(Num_Mesa: string): Promise<{ can_open: boolean; reason?: string }> {
    const table = await this.tablesRepo.findByNumber(Num_Mesa);

    if (!table) {
      return { can_open: false, reason: 'Mesa no encontrada' };
    }

    if (table.id_venta) {
      return { can_open: false, reason: 'Mesa ya tiene una venta abierta' };
    }

    if (table.estado === 'reservada') {
      return { can_open: false, reason: 'Mesa está reservada' };
    }

    return { can_open: true };
  }

  /**
   * Get table's rate for pricing
   */
  async getTableRate(Num_Mesa: string): Promise<{ id_tarifa: number; nombre: string } | null> {
    return this.tablesRepo.getTableRate(Num_Mesa);
  }
}
