import client from './client';

export const listTables = (params = {}) =>
  client.get('/tables', { params });

export const updateTableStatus = (id, status, currentOrderId) =>
  client.patch(`/tables/${id}/status`, {
    status,
    currentOrderId: currentOrderId ?? null
  });

export const getOpenShift = async () => {
  const response = await client.get('/shifts', {
    params: { status: 'open', limit: 1 }
  });
  return response.data?.data?.[0] ?? null;
};

export const createOrder = (payload) =>
  client.post('/orders', payload);

export const getOrder = (id) =>
  client.get(`/orders/${id}`);

export const addItem = (orderId, payload) =>
  client.post(`/orders/${orderId}/items`, payload);

export const updateItem = (itemId, payload) =>
  client.patch(`/orders/items/${itemId}`, payload);

export const removeItem = (itemId, cancellationReason) =>
  client.delete(`/orders/items/${itemId}`, {
    data: { cancellationReason }
  });

export const closeOrder = (orderId, payload = {}) =>
  client.patch(`/orders/${orderId}`, {
    status: 'closed',
    ...payload
  });

export const createPayment = (payload) =>
  client.post('/payments', payload);

export const createInvoice = (payload) =>
  client.post('/invoices', payload);

export const getConsistency = (params = {}) =>
  client.get('/validators/consistency', { params });
