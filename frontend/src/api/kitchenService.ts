/**
 * Kitchen Service - Gestión de Pantallas de Cocina/Barra
 * Soporta múltiples destinos: Cocina 1-4, Barra
 */

import { apiClient } from './client';
import { branchService } from './branchService';

// Types
export type Destination = 'kitchen' | 'bar' | 'kitchen_1' | 'kitchen_2' | 'kitchen_3' | 'kitchen_4';
export type KitchenItemStatus = 'pending' | 'sent' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type KitchenOrderPriority = 'normal' | 'high' | 'urgent';

export interface KitchenStation {
  id: number;
  code: string;
  name: string;
  destination: Destination;
  printer_id?: number;
  is_active: boolean;
  categories: number[]; // IDs de categorías que maneja
}

export interface KitchenItem {
  id: number;
  order_id: number;
  order_number: string;
  table_number?: string;
  salon_name?: string;
  product_id: number;
  product_name: string;
  quantity: number;
  destination: Destination;
  status: KitchenItemStatus;
  notes?: string;
  modifiers: Array<{
    name: string;
    price: number;
  }>;
  comanda_number: number;
  waiter_name: string;
  sent_at: string;
  started_at?: string;
  ready_at?: string;
  elapsed_minutes: number;
}

export interface KitchenOrder {
  id: number;
  order_number: string;
  table_id?: number;
  table_number?: string;
  salon_name?: string;
  waiter_id: number;
  waiter_name: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  destination: Destination;
  status: KitchenItemStatus;
  priority: KitchenOrderPriority;
  items: KitchenItem[];
  notes?: string;
  customer_notes?: string;
  elapsed_minutes: number;
  comanda_number: number;
  created_at: string;
  sent_at: string;
  started_at?: string;
  ready_at?: string;
}

export interface KitchenStats {
  total_pending: number;
  total_preparing: number;
  total_ready: number;
  avg_preparation_time: number;
  orders_by_destination: Record<Destination, number>;
  peak_hour?: number;
}

class KitchenService {
  private branchId(): number {
    return branchService.getCurrentBranchId();
  }

  // ==================== STATIONS ====================

  /**
   * Obtener estaciones de cocina configuradas
   */
  async getStations(): Promise<KitchenStation[]> {
    try {
      const response = await apiClient.get('/kitchen/stations', {
        params: { branch_id: this.branchId() }
      });
      return response.data.data || response.data.stations || this.getDefaultStations();
    } catch (error) {
      console.error('Error fetching kitchen stations:', error);
      return this.getDefaultStations();
    }
  }

  private getDefaultStations(): KitchenStation[] {
    return [
      { id: 1, code: 'COCINA', name: 'Cocina Principal', destination: 'kitchen', is_active: true, categories: [] },
      { id: 2, code: 'BAR', name: 'Barra', destination: 'bar', is_active: true, categories: [] },
      { id: 3, code: 'COC1', name: 'Cocina 1 (Parrilla)', destination: 'kitchen_1', is_active: true, categories: [] },
      { id: 4, code: 'COC2', name: 'Cocina 2 (Frituras)', destination: 'kitchen_2', is_active: true, categories: [] },
      { id: 5, code: 'COC3', name: 'Cocina 3 (Platos Fríos)', destination: 'kitchen_3', is_active: true, categories: [] },
      { id: 6, code: 'COC4', name: 'Cocina 4 (Postres)', destination: 'kitchen_4', is_active: true, categories: [] },
    ];
  }

  // ==================== ORDERS ====================

  /**
   * Obtener pedidos activos para una estación/destino
   */
  async getOrders(destination?: Destination, status?: KitchenItemStatus[]): Promise<KitchenOrder[]> {
    try {
      const response = await apiClient.get('/kitchen/orders', {
        params: {
          branch_id: this.branchId(),
          destination,
          status: status || ['pending', 'sent', 'preparing']
        }
      });

      const orders = response.data.data || response.data.orders || [];
      return this.processOrders(orders);
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      return [];
    }
  }

  /**
   * Obtener pedidos por destino agrupados
   */
  async getOrdersByDestination(): Promise<Record<Destination, KitchenOrder[]>> {
    try {
      const response = await apiClient.get('/kitchen/orders/by-destination', {
        params: { branch_id: this.branchId() }
      });
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching orders by destination:', error);

      // Intentar agrupar manualmente
      const allOrders = await this.getOrders();
      return this.groupOrdersByDestination(allOrders);
    }
  }

  private groupOrdersByDestination(orders: KitchenOrder[]): Record<Destination, KitchenOrder[]> {
    const grouped: Record<string, KitchenOrder[]> = {};

    orders.forEach(order => {
      const dest = order.destination || 'kitchen';
      if (!grouped[dest]) {
        grouped[dest] = [];
      }
      grouped[dest].push(order);
    });

    return grouped as Record<Destination, KitchenOrder[]>;
  }

  private processOrders(orders: any[]): KitchenOrder[] {
    const now = new Date();

    return orders.map(order => {
      const sentAt = new Date(order.sent_at || order.created_at);
      const elapsedMinutes = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60));

      // Calcular prioridad basada en tiempo
      let priority: KitchenOrderPriority = 'normal';
      if (elapsedMinutes > 30) {
        priority = 'urgent';
      } else if (elapsedMinutes > 15) {
        priority = 'high';
      }

      return {
        ...order,
        elapsed_minutes: elapsedMinutes,
        priority: order.priority || priority
      };
    });
  }

  // ==================== ITEM STATUS ====================

  /**
   * Marcar item como "preparando"
   */
  async startPreparing(itemId: number): Promise<void> {
    await apiClient.post(`/kitchen/items/${itemId}/preparing`);
  }

  /**
   * Marcar item como "listo"
   */
  async markItemReady(itemId: number): Promise<void> {
    await apiClient.post(`/kitchen/items/${itemId}/ready`);
  }

  /**
   * Marcar item como "entregado"
   */
  async markItemDelivered(itemId: number): Promise<void> {
    await apiClient.post(`/kitchen/items/${itemId}/delivered`);
  }

  /**
   * Cancelar item
   */
  async cancelItem(itemId: number, reason: string): Promise<void> {
    await apiClient.post(`/kitchen/items/${itemId}/cancel`, { reason });
  }

  // ==================== ORDER STATUS ====================

  /**
   * Marcar orden completa como "preparando"
   */
  async startPreparingOrder(orderId: number): Promise<void> {
    await apiClient.post(`/kitchen/orders/${orderId}/preparing`);
  }

  /**
   * Marcar orden completa como "lista"
   */
  async markOrderReady(orderId: number): Promise<void> {
    await apiClient.post(`/kitchen/orders/${orderId}/ready`);
  }

  /**
   * Notificar al mesero que el pedido está listo
   */
  async notifyWaiter(orderId: number): Promise<void> {
    await apiClient.post(`/kitchen/orders/${orderId}/notify-waiter`);
  }

  // ==================== STATS ====================

  /**
   * Obtener estadísticas de cocina
   */
  async getStats(): Promise<KitchenStats> {
    try {
      const response = await apiClient.get('/kitchen/stats', {
        params: { branch_id: this.branchId() }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching kitchen stats:', error);
      return {
        total_pending: 0,
        total_preparing: 0,
        total_ready: 0,
        avg_preparation_time: 0,
        orders_by_destination: {} as Record<Destination, number>
      };
    }
  }

  // ==================== PRINTING ====================

  /**
   * Imprimir comanda
   */
  async printComanda(orderId: number, destination?: Destination): Promise<void> {
    await apiClient.post(`/kitchen/orders/${orderId}/print`, { destination });
  }

  /**
   * Reimprimir comanda
   */
  async reprintComanda(orderId: number): Promise<void> {
    await apiClient.post(`/kitchen/orders/${orderId}/reprint`);
  }

  // ==================== UTILITIES ====================

  getStatusLabel(status: KitchenItemStatus): string {
    const labels: Record<KitchenItemStatus, string> = {
      pending: 'Pendiente',
      sent: 'Enviado',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: KitchenItemStatus): string {
    const colors: Record<KitchenItemStatus, string> = {
      pending: '#EAB308', // yellow
      sent: '#3B82F6',    // blue
      preparing: '#F97316', // orange
      ready: '#22C55E',   // green
      delivered: '#6B7280', // gray
      cancelled: '#EF4444' // red
    };
    return colors[status] || '#6B7280';
  }

  getPriorityLabel(priority: KitchenOrderPriority): string {
    const labels: Record<KitchenOrderPriority, string> = {
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority] || priority;
  }

  getPriorityColor(priority: KitchenOrderPriority): string {
    const colors: Record<KitchenOrderPriority, string> = {
      normal: '#3B82F6',  // blue
      high: '#F97316',    // orange
      urgent: '#EF4444'   // red
    };
    return colors[priority] || '#6B7280';
  }

  getDestinationLabel(destination: Destination): string {
    const labels: Record<Destination, string> = {
      kitchen: 'Cocina',
      bar: 'Barra',
      kitchen_1: 'Cocina 1',
      kitchen_2: 'Cocina 2',
      kitchen_3: 'Cocina 3',
      kitchen_4: 'Cocina 4'
    };
    return labels[destination] || destination;
  }

  getDestinationIcon(destination: Destination): string {
    const icons: Record<Destination, string> = {
      kitchen: '🍳',
      bar: '🍺',
      kitchen_1: '🔥',
      kitchen_2: '🍟',
      kitchen_3: '🥗',
      kitchen_4: '🍰'
    };
    return icons[destination] || '🍽️';
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}

export const kitchenService = new KitchenService();
export default kitchenService;
