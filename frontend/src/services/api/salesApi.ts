/**
 * Sales API Client
 * Frontend service for sales/orders operations
 */

import {
  Sale,
  CreateSaleRequest,
  CreateSaleResponse,
  AddSaleLineRequest,
  AddSaleLineResponse,
  UpdateSaleLineRequest,
  ChangeSaleTableRequest,
  ChangeSaleRateRequest,
  FinalizeSaleRequest,
  FinalizeSaleResponse,
  APIResponse,
} from '../../types/pos';

const API_BASE = '/api/pos/sales';

/**
 * Create new sale
 */
export async function createSale(params: CreateSaleRequest): Promise<CreateSaleResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: APIResponse<CreateSaleResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al crear venta');
  }

  return data.data;
}

/**
 * Get sale by ID
 */
export async function getSale(id_venta: number): Promise<Sale> {
  const response = await fetch(`${API_BASE}/${id_venta}`);
  const data: APIResponse<Sale> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener venta');
  }

  return data.data;
}

/**
 * Get all open sales
 */
export async function getOpenSales(id_camarero?: string): Promise<Sale[]> {
  const url = id_camarero ? `${API_BASE}?id_camarero=${id_camarero}` : API_BASE;
  const response = await fetch(url);
  const data: APIResponse<Sale[]> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al obtener ventas');
  }

  return data.data;
}

/**
 * Add line to sale
 */
export async function addSaleLine(
  id_venta: number,
  params: AddSaleLineRequest
): Promise<AddSaleLineResponse> {
  const response = await fetch(`${API_BASE}/${id_venta}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: APIResponse<AddSaleLineResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al agregar producto');
  }

  return data.data;
}

/**
 * Update sale line
 */
export async function updateSaleLine(
  id_venta: number,
  id_linea: number,
  params: UpdateSaleLineRequest
): Promise<Sale> {
  const response = await fetch(`${API_BASE}/${id_venta}/lines/${id_linea}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: APIResponse<Sale> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al actualizar línea');
  }

  return data.data;
}

/**
 * Delete sale line
 */
export async function deleteSaleLine(id_venta: number, id_linea: number): Promise<Sale> {
  const response = await fetch(`${API_BASE}/${id_venta}/lines/${id_linea}`, {
    method: 'DELETE',
  });

  const data: APIResponse<Sale> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al eliminar línea');
  }

  return data.data;
}

/**
 * Change sale table
 */
export async function changeSaleTable(
  id_venta: number,
  params: ChangeSaleTableRequest
): Promise<Sale> {
  const response = await fetch(`${API_BASE}/${id_venta}/table`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: APIResponse<Sale> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al cambiar mesa');
  }

  return data.data;
}

/**
 * Change sale rate/tarifa
 */
export async function changeSaleRate(
  id_venta: number,
  params: ChangeSaleRateRequest
): Promise<Sale> {
  const response = await fetch(`${API_BASE}/${id_venta}/rate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: APIResponse<Sale> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al cambiar tarifa');
  }

  return data.data;
}

/**
 * Finalize/close sale
 */
export async function finalizeSale(
  id_venta: number,
  params: FinalizeSaleRequest
): Promise<FinalizeSaleResponse> {
  const response = await fetch(`${API_BASE}/${id_venta}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data: APIResponse<FinalizeSaleResponse> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al finalizar venta');
  }

  return data.data;
}

/**
 * Park/pause sale
 */
export async function parkSale(id_venta: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id_venta}/park`, {
    method: 'POST',
  });

  const data: APIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Error al aparcar venta');
  }
}

/**
 * Cancel sale
 */
export async function cancelSale(id_venta: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id_venta}`, {
    method: 'DELETE',
  });

  const data: APIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Error al cancelar venta');
  }
}

/**
 * Mark line as served
 */
export async function markLineServed(id_venta: number, id_linea: number): Promise<Sale> {
  const response = await fetch(`${API_BASE}/${id_venta}/lines/${id_linea}/served`, {
    method: 'POST',
  });

  const data: APIResponse<Sale> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Error al marcar como servido');
  }

  return data.data;
}
