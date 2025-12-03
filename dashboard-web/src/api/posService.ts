/**
 * POS Service - Servicio unificado para el Punto de Venta
 * Integra productos, categorías, pedidos y comandas
 */

import { apiClient } from './client';
import { branchService } from './branchService';

// ==================== TYPES ====================

export type Destination = 'kitchen' | 'bar' | 'kitchen_1' | 'kitchen_2' | 'kitchen_3' | 'kitchen_4';
export type ItemStatus = 'pending' | 'sent' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderStatus = 'open' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  default_destination: Destination;
  kitchen_order: number;
  is_active: boolean;
  product_count?: number;
}

export interface ModifierGroup {
  id: number;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  modifiers: Modifier[];
}

export interface Modifier {
  id: number;
  name: string;
  price_adjustment: number;
  is_available: boolean;
  group_id: number;
  group_name?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id: number;
  category_name?: string;
  image_url?: string;
  default_destination: Destination;
  is_available: boolean;
  is_active: boolean;
  has_modifiers: boolean;
  modifier_groups?: ModifierGroup[];
  stock_quantity?: number;
  tags?: string[];
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  modifiers: Array<{
    id: number;
    name: string;
    price: number;
    group_name?: string;
  }>;
  modifiers_total: number;
  discount_amount: number;
  total_price: number;
  destination: Destination;
  status: ItemStatus;
  notes?: string;
  kitchen_notes?: string;
  comanda_number?: number;
  sent_at?: string;
  ready_at?: string;
}

export interface Table {
  id: number;
  table_number: string;
  salon_id: number;
  salon_name?: string;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved' | 'cleaning';
  position_x: number;
  position_y: number;
  shape: 'square' | 'round' | 'rectangle';
  tarifa_id?: number;
  tarifa_name?: string;
  tarifa_multiplier?: number;
  current_order_id?: number;
  current_order_total?: number;
  waiter_name?: string;
  guests?: number;
}

export interface Salon {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  tables_count?: number;
  occupied_count?: number;
}

export interface Order {
  id?: number;
  order_number?: string;
  branch_id: number;
  table_id?: number;
  table_number?: string;
  salon_id?: number;
  salon_name?: string;
  waiter_id: number;
  waiter_name?: string;
  order_type: OrderType;
  customer_name?: string;
  customer_phone?: string;
  customer_count: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
  status: OrderStatus;
  payment_status: 'pending' | 'partial' | 'paid';
  items: OrderItem[];
  notes?: string;
  created_at?: string;
  sent_to_kitchen_at?: string;
}

export interface KitchenOrder {
  id: number;
  order_number: string;
  table_number?: string;
  salon_name?: string;
  waiter_name: string;
  destination: Destination;
  status: 'pending' | 'preparing' | 'ready';
  priority: 'normal' | 'high' | 'urgent';
  items: OrderItem[];
  notes?: string;
  elapsed_minutes: number;
  created_at: string;
  started_at?: string;
}

// ==================== POS SERVICE ====================

class POSService {
  private branchId(): number {
    return branchService.getCurrentBranchId();
  }

  // ==================== CATEGORIES ====================

  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/categories', {
        params: { branch_id: this.branchId(), is_active: true }
      });
      return response.data.data || response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback con categorías por defecto si falla
      return this.getDefaultCategories();
    }
  }

  private getDefaultCategories(): Category[] {
    return [
      { id: 1, name: 'Entradas', icon: '🥗', color: '#10B981', default_destination: 'kitchen', kitchen_order: 1, is_active: true },
      { id: 2, name: 'Platos Principales', icon: '🍽️', color: '#3B82F6', default_destination: 'kitchen', kitchen_order: 2, is_active: true },
      { id: 3, name: 'Postres', icon: '🍰', color: '#EC4899', default_destination: 'kitchen', kitchen_order: 3, is_active: true },
      { id: 4, name: 'Bebidas', icon: '🥤', color: '#F59E0B', default_destination: 'bar', kitchen_order: 4, is_active: true },
      { id: 5, name: 'Cervezas', icon: '🍺', color: '#8B5CF6', default_destination: 'bar', kitchen_order: 5, is_active: true },
      { id: 6, name: 'Vinos', icon: '🍷', color: '#DC2626', default_destination: 'bar', kitchen_order: 6, is_active: true },
      { id: 7, name: 'Cocktails', icon: '🍹', color: '#06B6D4', default_destination: 'bar', kitchen_order: 7, is_active: true },
    ];
  }

  // ==================== PRODUCTS ====================

  async getProducts(params?: {
    category_id?: number;
    search?: string;
    destination?: Destination;
    is_available?: boolean;
  }): Promise<Product[]> {
    try {
      const response = await apiClient.get('/products', {
        params: {
          branch_id: this.branchId(),
          is_active: true,
          ...params
        }
      });
      return response.data.data || response.data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return this.getProducts({ category_id: categoryId });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.getProducts({ search: query });
  }

  async getProductWithModifiers(productId: number): Promise<Product | null> {
    try {
      const response = await apiClient.get(`/products/${productId}/modifiers`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching product with modifiers:', error);
      return null;
    }
  }

  // ==================== TABLES & SALONS ====================

  async getSalons(): Promise<Salon[]> {
    try {
      const response = await apiClient.get('/tables/salons', {
        params: { branch_id: this.branchId() }
      });
      return response.data.data?.salons || response.data.salons || [];
    } catch (error) {
      console.error('Error fetching salons:', error);
      return [{ id: 1, name: 'Salón Principal', is_active: true }];
    }
  }

  async getTables(salonId?: number): Promise<Table[]> {
    try {
      const response = await apiClient.get('/tables', {
        params: {
          branch_id: this.branchId(),
          salon_id: salonId,
          include_order: true
        }
      });
      return response.data.data?.tables || response.data.tables || [];
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  async getTableWithOrder(tableId: number): Promise<{ table: Table; order: Order | null }> {
    try {
      const response = await apiClient.get(`/tables/${tableId}/order`);
      return response.data.data || { table: response.data.table, order: response.data.order };
    } catch (error) {
      console.error('Error fetching table with order:', error);
      throw error;
    }
  }

  async updateTableStatus(tableId: number, status: Table['status']): Promise<void> {
    await apiClient.put(`/tables/${tableId}`, { status });
  }

  // ==================== ORDERS ====================

  async createOrder(data: {
    table_id?: number;
    order_type: OrderType;
    customer_name?: string;
    customer_phone?: string;
    customer_count?: number;
    notes?: string;
  }): Promise<Order> {
    const response = await apiClient.post('/orders', {
      ...data,
      branch_id: this.branchId()
    });
    return response.data.data || response.data.order;
  }

  async getOrder(orderId: number): Promise<Order> {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data || response.data.order;
  }

  async getActiveOrders(): Promise<Order[]> {
    const response = await apiClient.get('/orders', {
      params: {
        branch_id: this.branchId(),
        status: ['open', 'in_progress', 'ready']
      }
    });
    return response.data.data || response.data.orders || [];
  }

  async addItemToOrder(orderId: number, item: {
    product_id: number;
    quantity: number;
    modifiers?: number[];
    notes?: string;
    destination?: Destination;
  }): Promise<OrderItem> {
    const response = await apiClient.post(`/orders/${orderId}/items`, item);
    return response.data.data || response.data.item;
  }

  async updateOrderItem(orderId: number, itemId: number, data: Partial<OrderItem>): Promise<OrderItem> {
    const response = await apiClient.put(`/orders/${orderId}/items/${itemId}`, data);
    return response.data.data || response.data.item;
  }

  async removeOrderItem(orderId: number, itemId: number, reason?: string): Promise<void> {
    await apiClient.delete(`/orders/${orderId}/items/${itemId}`, {
      data: { reason }
    });
  }

  // ==================== COMANDAS (Kitchen) ====================

  async sendToKitchen(orderId: number, itemIds?: number[]): Promise<{
    success: boolean;
    comanda_number: number;
    items_sent: number;
    destinations: Record<Destination, number>;
  }> {
    const response = await apiClient.post(`/orders/${orderId}/send-to-kitchen`, {
      item_ids: itemIds
    });
    return response.data.data || response.data;
  }

  async getKitchenOrders(destination?: Destination): Promise<KitchenOrder[]> {
    try {
      const response = await apiClient.get('/kitchen/orders', {
        params: {
          branch_id: this.branchId(),
          destination,
          status: ['pending', 'preparing']
        }
      });
      return response.data.data || response.data.orders || [];
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      return [];
    }
  }

  async updateKitchenItemStatus(itemId: number, status: ItemStatus): Promise<void> {
    await apiClient.post(`/kitchen/items/${itemId}/status`, { status });
  }

  async markOrderReady(orderId: number): Promise<void> {
    await apiClient.post(`/kitchen/orders/${orderId}/ready`);
  }

  // ==================== PAYMENTS ====================

  async processPayment(orderId: number, payment: {
    amount: number;
    payment_method: string;
    tip_amount?: number;
    amount_received?: number;
  }): Promise<{ success: boolean; order: Order; change?: number }> {
    const response = await apiClient.post(`/orders/${orderId}/pay`, payment);
    return response.data.data || response.data;
  }

  async splitBill(orderId: number, splits: Array<{
    items?: number[];
    amount: number;
    payment_method: string;
  }>): Promise<{ success: boolean; receipts: any[] }> {
    const response = await apiClient.post(`/orders/${orderId}/split`, { splits });
    return response.data.data || response.data;
  }

  // ==================== TABLE OPERATIONS ====================

  async transferOrder(orderId: number, newTableId: number): Promise<Order> {
    const response = await apiClient.post(`/orders/${orderId}/transfer`, {
      new_table_id: newTableId
    });
    return response.data.data || response.data.order;
  }

  async joinOrders(mainOrderId: number, orderIdsToJoin: number[]): Promise<Order> {
    const response = await apiClient.post(`/orders/${mainOrderId}/join`, {
      order_ids: orderIdsToJoin
    });
    return response.data.data || response.data.order;
  }

  // ==================== UTILITIES ====================

  getDestinationLabel(destination: Destination): string {
    const labels: Record<Destination, string> = {
      'kitchen': 'Cocina',
      'bar': 'Barra',
      'kitchen_1': 'Cocina 1',
      'kitchen_2': 'Cocina 2',
      'kitchen_3': 'Cocina 3',
      'kitchen_4': 'Cocina 4'
    };
    return labels[destination] || destination;
  }

  getDestinationColor(destination: Destination): string {
    const colors: Record<Destination, string> = {
      'kitchen': '#EF4444',
      'bar': '#3B82F6',
      'kitchen_1': '#F97316',
      'kitchen_2': '#EAB308',
      'kitchen_3': '#22C55E',
      'kitchen_4': '#8B5CF6'
    };
    return colors[destination] || '#6B7280';
  }

  calculateOrderTotals(items: OrderItem[], taxRate: number = 0.19): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

export const posService = new POSService();
export default posService;
