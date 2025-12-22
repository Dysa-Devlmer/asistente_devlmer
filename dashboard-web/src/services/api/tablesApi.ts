/**
 * Tables API Client
 * Frontend service for table operations
 */

import { Table, TableFilters, APIResponse } from '../../types/pos';

const API_BASE = '/api/pos/tables';

/**
 * Get all tables with current status
 */
export async function getTables(filters?: TableFilters): Promise<Table[]> {
  const params = new URLSearchParams();

  if (filters?.id_salon) {
    params.append('id_salon', filters.id_salon);
  }

  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  const response = await fetch(url);
  const data: APIResponse<Table[]> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener mesas');
  }

  return data.data;
}

/**
 * Get tables grouped by salon
 */
export async function getTablesBySalon(): Promise<Record<string, Table[]>> {
  const response = await fetch(`${API_BASE}/by-salon`);
  const data: APIResponse<Record<string, Table[]>> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener mesas por salón');
  }

  return data.data;
}

/**
 * Get table statistics
 */
export async function getTableStats(): Promise<{
  total: number;
  occupied: number;
  free: number;
  reserved: number;
  occupancy_rate: number;
}> {
  const response = await fetch(`${API_BASE}/stats`);
  const data: APIResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener estadísticas');
  }

  return data.data;
}

/**
 * Get table by number
 */
export async function getTable(num_mesa: string): Promise<Table> {
  const response = await fetch(`${API_BASE}/${num_mesa}`);
  const data: APIResponse<Table> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Mesa no encontrada');
  }

  return data.data;
}

/**
 * Check if table can be used for new sale
 */
export async function canOpenSale(num_mesa: string): Promise<{ can_open: boolean; reason?: string }> {
  const response = await fetch(`${API_BASE}/${num_mesa}/can-open`);
  const data: APIResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al verificar disponibilidad');
  }

  return data.data;
}

/**
 * Get table's pricing rate
 */
export async function getTableRate(num_mesa: string): Promise<{ id_tarifa: number | null; nombre: string }> {
  const response = await fetch(`${API_BASE}/${num_mesa}/rate`);
  const data: APIResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener tarifa');
  }

  return data.data;
}
