/**
 * Orders Service - Gestión de Pedidos y Comandas
 * Soporta pedidos con items, modificadores y destinos múltiples
 */

import { apiClient } from './client';
import { branchService } from './branchService';

// Types
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'open' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type ItemStatus = 'pending' | 'sent' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type Destination = 'kitchen' | 'bar' | 'kitchen_1' | 'kitchen_2' | 'kitchen_3' | 'kitchen_4';

export interface OrderItemModifier {
  id: number;
  name: string;
  price: number;
  group_name?: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  modifiers: OrderItemModifier[];
  modifiers_total: number;
  discount_amount: number;
  total_price: number;
  destination: Destination;
  status: ItemStatus;
  notes?: string;
  kitchen_notes?: string;
  added_by?: number;
  comanda_number?: number;
  sent_at?: string;
  ready_at?: string;
  delivered_at?: string;
  created_at?: string;
}

export interface Order {
  id?: number;
  branch_id: number;
  order_number?: string;
  table_id?: number;
  table_number?: string;
  salon_id?: number;
  salon_name?: string;
  waiter_id: number;
  waiter_name?: string;
  cashier_id?: number;
  order_type: OrderType;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_count: number;
  delivery_address?: string;
  delivery_notes?: string;
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  tax_amount: number;
  tip_amount: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  notes?: string;
  kitchen_notes?: string;
  opened_at?: string;
  sent_to_kitchen_at?: string;
  ready_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface CreateOrderDTO {
  table_id?: number;
  order_type?: OrderType;
  customer_name?: string;
  customer_phone?: string;
  customer_count?: number;
  delivery_address?: string;
  notes?: string;
}

export interface AddItemDTO {
  product_id: number;
  quantity: number;
  modifiers?: number[];
  notes?: string;
  destination?: Destination;
}

export interface SendToKitchenResult {
  success: boolean;
  comanda_number: number;
  items_sent: number;
  kitchen_items: number;
  bar_items: number;
}

class OrdersService {
  private branchId(): number {
    return branchService.getCurrentBranchId();
  }

  // ==================== PEDIDOS ====================

  /**
   * Obtener pedidos activos (para mapa de mesas)
   */
  async getActiveOrders(): Promise<Order[]> {
    const response = await apiClient.get('/orders', {
      params: {
        branch_id: this.branchId(),
        status: ['open', 'in_progress', 'ready']
      }
    });
    return response.data.data || response.data;
  }

  /**
   * Obtener pedido por ID
   */
  async getOrder(orderId: number): Promise<Order> {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data || response.data;
  }

  /**
   * Obtener pedido por mesa
   */
  async getOrderByTable(tableId: number): Promise<Order | null> {
    const response = await apiClient.get('/orders', {
      params: {
        table_id: tableId,
        status: ['open', 'in_progress']
      }
    });
    const orders = response.data.data || response.data;
    return orders.length > 0 ? orders[0] : null;
  }

  /**
   * Crear nuevo pedido
   */
  async createOrder(data: CreateOrderDTO): Promise<Order> {
    const response = await apiClient.post('/orders', {
      ...data,
      branch_id: this.branchId()
    });
    return response.data.data || response.data;
  }

  /**
   * Actualizar pedido
   */
  async updateOrder(orderId: number, data: Partial<Order>): Promise<Order> {
    const response = await apiClient.put(`/orders/${orderId}`, data);
    return response.data.data || response.data;
  }

  /**
   * Cancelar pedido
   */
  async cancelOrder(orderId: number, reason: string): Promise<Order> {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason });
    return response.data.data || response.data;
  }

  // ==================== ITEMS ====================

  /**
   * Agregar item al pedido
   */
  async addItem(orderId: number, item: AddItemDTO): Promise<OrderItem> {
    const response = await apiClient.post(`/orders/${orderId}/items`, item);
    return response.data.data || response.data;
  }

  /**
   * Agregar múltiples items
   */
  async addItems(orderId: number, items: AddItemDTO[]): Promise<OrderItem[]> {
    const response = await apiClient.post(`/orders/${orderId}/items/batch`, { items });
    return response.data.data || response.data;
  }

  /**
   * Actualizar item
   */
  async updateItem(orderId: number, itemId: number, data: Partial<OrderItem>): Promise<OrderItem> {
    const response = await apiClient.put(`/orders/${orderId}/items/${itemId}`, data);
    return response.data.data || response.data;
  }

  /**
   * Eliminar item
   */
  async removeItem(orderId: number, itemId: number, reason?: string): Promise<void> {
    await apiClient.delete(`/orders/${orderId}/items/${itemId}`, {
      data: { reason }
    });
  }

  /**
   * Cambiar cantidad de item
   */
  async updateItemQuantity(orderId: number, itemId: number, quantity: number): Promise<OrderItem> {
    return this.updateItem(orderId, itemId, { quantity });
  }

  /**
   * Agregar nota a item
   */
  async addItemNote(orderId: number, itemId: number, notes: string): Promise<OrderItem> {
    return this.updateItem(orderId, itemId, { notes });
  }

  // ==================== COMANDAS ====================

  /**
   * Enviar items pendientes a cocina/barra
   */
  async sendToKitchen(orderId: number, itemIds?: number[]): Promise<SendToKitchenResult> {
    const response = await apiClient.post(`/orders/${orderId}/send-to-kitchen`, {
      item_ids: itemIds // null = enviar todos los pendientes
    });
    return response.data.data || response.data;
  }

  /**
   * Marcar item como preparando
   */
  async markItemPreparing(itemId: number): Promise<OrderItem> {
    const response = await apiClient.post(`/order-items/${itemId}/preparing`);
    return response.data.data || response.data;
  }

  /**
   * Marcar item como listo
   */
  async markItemReady(itemId: number): Promise<OrderItem> {
    const response = await apiClient.post(`/order-items/${itemId}/ready`);
    return response.data.data || response.data;
  }

  /**
   * Marcar item como entregado
   */
  async markItemDelivered(itemId: number): Promise<OrderItem> {
    const response = await apiClient.post(`/order-items/${itemId}/delivered`);
    return response.data.data || response.data;
  }

  /**
   * Obtener items por destino (para pantallas de cocina/barra)
   */
  async getItemsByDestination(destination: Destination, status?: ItemStatus[]): Promise<OrderItem[]> {
    const response = await apiClient.get('/order-items', {
      params: {
        branch_id: this.branchId(),
        destination,
        status: status || ['sent', 'preparing']
      }
    });
    return response.data.data || response.data;
  }

  // ==================== PAGOS ====================

  /**
   * Procesar pago
   */
  async processPayment(orderId: number, payment: {
    amount: number;
    payment_method: string;
    tip_amount?: number;
    amount_received?: number;
  }): Promise<{ success: boolean; order: Order; change?: number }> {
    const response = await apiClient.post(`/orders/${orderId}/pay`, payment);
    return response.data.data || response.data;
  }

  /**
   * Procesar pago mixto (múltiples métodos)
   */
  async processMixedPayment(orderId: number, payments: Array<{
    amount: number;
    payment_method: string;
  }>): Promise<{ success: boolean; order: Order }> {
    const response = await apiClient.post(`/orders/${orderId}/pay/mixed`, { payments });
    return response.data.data || response.data;
  }

  /**
   * Dividir cuenta
   */
  async splitBill(orderId: number, splits: Array<{
    items: number[];
    amount: number;
    payment_method: string;
  }>): Promise<{ success: boolean; receipts: any[] }> {
    const response = await apiClient.post(`/orders/${orderId}/split`, { splits });
    return response.data.data || response.data;
  }

  // ==================== OPERACIONES DE MESA ====================

  /**
   * Transferir pedido a otra mesa
   */
  async transferToTable(orderId: number, newTableId: number): Promise<Order> {
    const response = await apiClient.post(`/orders/${orderId}/transfer`, {
      new_table_id: newTableId
    });
    return response.data.data || response.data;
  }

  /**
   * Unir mesas (combinar pedidos)
   */
  async joinOrders(mainOrderId: number, orderIdsToJoin: number[]): Promise<Order> {
    const response = await apiClient.post(`/orders/${mainOrderId}/join`, {
      order_ids: orderIdsToJoin
    });
    return response.data.data || response.data;
  }

  /**
   * Transferir items entre pedidos
   */
  async transferItems(fromOrderId: number, toOrderId: number, itemIds: number[]): Promise<{
    from_order: Order;
    to_order: Order;
  }> {
    const response = await apiClient.post(`/orders/${fromOrderId}/transfer-items`, {
      to_order_id: toOrderId,
      item_ids: itemIds
    });
    return response.data.data || response.data;
  }

  // ==================== UTILIDADES ====================

  /**
   * Calcular totales del pedido
   */
  calculateTotals(items: OrderItem[], taxRate: number = 0.19): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  /**
   * Verificar si hay items pendientes de enviar
   */
  hasPendingItems(order: Order): boolean {
    return order.items.some(item => item.status === 'pending');
  }

  /**
   * Obtener items por estado
   */
  getItemsByStatus(order: Order, status: ItemStatus): OrderItem[] {
    return order.items.filter(item => item.status === status);
  }

  /**
   * Agrupar items por destino
   */
  groupItemsByDestination(items: OrderItem[]): Record<Destination, OrderItem[]> {
    const groups: Record<string, OrderItem[]> = {};
    items.forEach(item => {
      if (!groups[item.destination]) {
        groups[item.destination] = [];
      }
      groups[item.destination].push(item);
    });
    return groups as Record<Destination, OrderItem[]>;
  }
}

export const ordersService = new OrdersService();
export default ordersService;
