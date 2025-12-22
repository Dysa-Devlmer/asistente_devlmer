/**
 * useTables Hook
 * Custom hook for table operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Table, TableFilters } from '../../types/pos';
import * as tablesApi from '../../services/api/tablesApi';

export function useTables(filters?: TableFilters) {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load tables from API
   */
  const loadTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await tablesApi.getTables(filters);
      setTables(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar mesas';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Load tables on mount and when filters change
   */
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  /**
   * Refresh tables
   */
  const refresh = useCallback(() => {
    loadTables();
  }, [loadTables]);

  /**
   * Get table by number
   */
  const getTable = useCallback(
    async (num_mesa: string): Promise<Table> => {
      try {
        return await tablesApi.getTable(num_mesa);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al obtener mesa';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  /**
   * Check if table can be used for new sale
   */
  const checkAvailability = useCallback(async (num_mesa: string) => {
    try {
      return await tablesApi.canOpenSale(num_mesa);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al verificar disponibilidad';
      setError(errorMsg);
      throw err;
    }
  }, []);

  /**
   * Get table rate
   */
  const getTableRate = useCallback(async (num_mesa: string) => {
    try {
      return await tablesApi.getTableRate(num_mesa);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al obtener tarifa';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Computed values
  const occupiedTables = tables.filter((t) => t.estado === 'ocupada');
  const freeTables = tables.filter((t) => t.estado === 'libre');
  const reservedTables = tables.filter((t) => t.estado === 'reservada');
  const occupancyRate =
    tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0;

  return {
    // Data
    tables,
    occupiedTables,
    freeTables,
    reservedTables,

    // Stats
    occupancyRate,
    totalTables: tables.length,
    occupiedCount: occupiedTables.length,
    freeCount: freeTables.length,
    reservedCount: reservedTables.length,

    // State
    isLoading,
    error,

    // Actions
    refresh,
    getTable,
    checkAvailability,
    getTableRate,
  };
}
