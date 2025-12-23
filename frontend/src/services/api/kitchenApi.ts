/**
 * Kitchen API Service
 * Client for kitchen operations
 */

import type {
  APIResponse,
  KitchenItem,
  KitchenItemsResponse,
  KitchenStats,
  MarkServedRequest,
  MarkServedResponse,
  MarkAllServedRequest,
  MarkAllServedResponse,
} from '../../types/pos';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7777/api';

/**
 * Get all pending kitchen items
 */
export async function getPendingItems(filters?: {
  station?: number;
  mesa?: string;
}): Promise<KitchenItemsResponse> {
  const params = new URLSearchParams();
  if (filters?.station) {
    params.append('station', filters.station.toString());
  }
  if (filters?.mesa) {
    params.append('mesa', filters.mesa);
  }

  const url = `${API_BASE_URL}/pos/kitchen/items${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: APIResponse<KitchenItemsResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener items de cocina');
  }

  return data.data;
}

/**
 * Mark an item (or partial quantity) as served
 */
export async function markItemServed(
  id_venta: number,
  id_linea: number,
  quantity?: number
): Promise<MarkServedResponse> {
  const response = await fetch(
    `${API_BASE_URL}/pos/kitchen/items/${id_venta}/${id_linea}/mark-served`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity } as MarkServedRequest),
    }
  );

  const data: APIResponse<MarkServedResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al marcar item como servido');
  }

  return data.data;
}

/**
 * Mark all items from an order as served
 */
export async function markAllServed(
  id_venta: number,
  bloque_cocina?: number
): Promise<MarkAllServedResponse> {
  const response = await fetch(`${API_BASE_URL}/pos/kitchen/items/mark-all-served`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id_venta, bloque_cocina } as MarkAllServedRequest),
  });

  const data: APIResponse<MarkAllServedResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al marcar todos los items');
  }

  return data.data;
}

/**
 * Get kitchen statistics
 */
export async function getStats(): Promise<KitchenStats> {
  const response = await fetch(`${API_BASE_URL}/pos/kitchen/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: APIResponse<KitchenStats> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener estadísticas de cocina');
  }

  return data.data;
}

/**
 * Get all kitchen items for a specific order
 */
export async function getItemsByOrder(id_venta: number): Promise<KitchenItem[]> {
  const response = await fetch(`${API_BASE_URL}/pos/kitchen/items/order/${id_venta}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: APIResponse<KitchenItem[]> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener items del pedido');
  }

  return data.data;
}

/**
 * Initialize kitchen module (add servido_cocina field if missing)
 */
export async function initialize(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/pos/kitchen/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: APIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Error al inicializar módulo de cocina');
  }
}

/**
 * Validate that database has required fields
 */
export async function validateDatabase(): Promise<{ isValid: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/pos/kitchen/validate`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data: APIResponse<{ isValid: boolean; message: string }> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al validar base de datos');
  }

  return data.data;
}
