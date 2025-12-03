/**
 * JARVIS - Integración con SYSME-POS API
 * Conecta JARVIS con el sistema de punto de venta
 */

import { dbService } from '../../backend/src/config/database.js';

class SysmeAPIIntegration {
  constructor() {
    this.branchId = 1; // Sucursal por defecto
  }

  /**
   * Configurar sucursal activa
   */
  setBranch(branchId) {
    this.branchId = branchId;
  }

  // ==================== MESAS ====================

  /**
   * Obtener estado de todas las mesas
   */
  async getTablesStatus() {
    return await dbService.query(`
      SELECT
        t.*,
        s.name as salon_name,
        o.id as active_order_id,
        o.total as current_total,
        u.first_name as waiter_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM tables t
      LEFT JOIN salons s ON t.salon_id = s.id
      LEFT JOIN orders o ON t.id = o.table_id AND o.status IN ('open', 'in_progress')
      LEFT JOIN users u ON o.waiter_id = u.id
      WHERE t.branch_id = ? AND t.is_active = 1
      ORDER BY s.name, t.table_number
    `, [this.branchId]);
  }

  /**
   * Obtener detalle de una mesa
   */
  async getTableDetail(tableId) {
    const table = await dbService.findById('tables', tableId);
    if (!table) return null;

    const activeOrder = await dbService.findOne('orders', {
      table_id: tableId,
      status: ['open', 'in_progress']
    });

    if (activeOrder) {
      const items = await dbService.query(`
        SELECT oi.*, p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.created_at DESC
      `, [activeOrder.id]);

      return { table, order: activeOrder, items };
    }

    return { table, order: null, items: [] };
  }

  /**
   * Cambiar estado de mesa
   */
  async setTableStatus(tableId, status) {
    return await dbService.update('tables', tableId, { status });
  }

  // ==================== PEDIDOS ====================

  /**
   * Crear nuevo pedido
   */
  async createOrder(data) {
    const { tableId, waiterId, orderType = 'dine_in', customerCount } = data;

    // Generar número de pedido
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await dbService.count('orders', {});
    const orderNumber = `ORD-${today}-${String(count + 1).padStart(5, '0')}`;

    const order = await dbService.create('orders', {
      order_number: orderNumber,
      branch_id: this.branchId,
      table_id: tableId,
      waiter_id: waiterId,
      order_type: orderType,
      customer_count: customerCount,
      status: 'open',
      subtotal: 0,
      tax: 0,
      total: 0,
      created_at: new Date().toISOString()
    });

    // Actualizar estado de mesa
    if (tableId) {
      await this.setTableStatus(tableId, 'occupied');
    }

    return order;
  }

  /**
   * Agregar producto a pedido
   */
  async addOrderItem(orderId, data) {
    const { productId, quantity, modifiers = [], notes, destination } = data;

    const product = await dbService.findById('products', productId);
    if (!product) throw new Error('Producto no encontrado');

    // Calcular precio con modificadores
    let unitPrice = product.price;
    const modifierDetails = [];

    for (const modifierId of modifiers) {
      const modifier = await dbService.findById('modifiers', modifierId);
      if (modifier) {
        unitPrice += modifier.price_adjustment || 0;
        modifierDetails.push({
          id: modifier.id,
          name: modifier.name,
          price: modifier.price_adjustment
        });
      }
    }

    const totalPrice = unitPrice * quantity;

    // Determinar destino automáticamente si no se especifica
    let itemDestination = destination;
    if (!itemDestination) {
      const category = await dbService.findById('categories', product.category_id);
      const beverageCategories = ['bebidas', 'jugos', 'cervezas', 'licores', 'tragos', 'bar'];
      itemDestination = category && beverageCategories.some(c => category.name.toLowerCase().includes(c))
        ? 'bar' : 'kitchen';
    }

    const item = await dbService.create('order_items', {
      order_id: orderId,
      product_id: productId,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      modifiers: JSON.stringify(modifierDetails),
      notes,
      total_price: totalPrice,
      destination: itemDestination,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // Actualizar totales del pedido
    await this.updateOrderTotals(orderId);

    return item;
  }

  /**
   * Actualizar totales del pedido
   */
  async updateOrderTotals(orderId) {
    const items = await dbService.findMany('order_items', { order_id: orderId });
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

    // Obtener configuración de impuestos
    const taxSetting = await dbService.findOne('settings', { key: 'tax_rate' });
    const taxRate = taxSetting ? parseFloat(taxSetting.value) / 100 : 0.19; // 19% IVA Chile

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    await dbService.update('orders', orderId, { subtotal, tax, total });
  }

  /**
   * Enviar comanda a cocina/barra
   */
  async sendToKitchen(orderId, itemIds = null) {
    let items;
    if (itemIds) {
      items = await dbService.query(`
        SELECT * FROM order_items
        WHERE order_id = ? AND id IN (${itemIds.join(',')}) AND status = 'pending'
      `, [orderId]);
    } else {
      items = await dbService.findMany('order_items', {
        order_id: orderId,
        status: 'pending'
      });
    }

    const now = new Date().toISOString();

    for (const item of items) {
      await dbService.update('order_items', item.id, {
        status: 'sent',
        sent_at: now
      });
    }

    // Actualizar estado del pedido
    await dbService.update('orders', orderId, { status: 'in_progress' });

    // Emitir evento para pantallas de cocina/barra (WebSocket)
    return {
      success: true,
      itemsSent: items.length,
      kitchenItems: items.filter(i => i.destination === 'kitchen'),
      barItems: items.filter(i => i.destination === 'bar')
    };
  }

  // ==================== CAJA ====================

  /**
   * Verificar si hay sesión de caja abierta
   */
  async hasOpenCashSession(userId) {
    const session = await dbService.findOne('cash_sessions', {
      user_id: userId,
      status: 'open'
    });
    return session;
  }

  /**
   * Obtener resumen de caja actual
   */
  async getCashSummary(sessionId) {
    const session = await dbService.findById('cash_sessions', sessionId);
    if (!session) return null;

    const movements = await dbService.findMany('cash_movements', {
      cash_session_id: sessionId
    });

    return {
      session,
      movements,
      summary: {
        sales: parseFloat(session.total_sales) || 0,
        cash: parseFloat(session.total_cash) || 0,
        card: parseFloat(session.total_card) || 0,
        other: parseFloat(session.total_other) || 0,
        income: parseFloat(session.total_in) || 0,
        expenses: parseFloat(session.total_out) || 0
      }
    };
  }

  // ==================== REPORTES ====================

  /**
   * Ventas del día
   */
  async getTodaySales() {
    const today = new Date().toISOString().split('T')[0];

    return await dbService.query(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total) as total_sales,
        SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_sales,
        SUM(CASE WHEN payment_method IN ('card', 'debit', 'credit') THEN total ELSE 0 END) as card_sales,
        AVG(total) as average_ticket
      FROM sales
      WHERE branch_id = ?
      AND DATE(created_at) = ?
      AND status = 'completed'
    `, [this.branchId, today]);
  }

  /**
   * Productos más vendidos
   */
  async getTopProducts(limit = 10, period = 'today') {
    let dateCondition = '';
    if (period === 'today') {
      dateCondition = `AND DATE(s.created_at) = DATE('now')`;
    } else if (period === 'week') {
      dateCondition = `AND s.created_at >= DATE('now', '-7 days')`;
    } else if (period === 'month') {
      dateCondition = `AND s.created_at >= DATE('now', '-30 days')`;
    }

    return await dbService.query(`
      SELECT
        si.product_name,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_sales
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.branch_id = ? AND s.status = 'completed' ${dateCondition}
      GROUP BY si.product_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `, [this.branchId, limit]);
  }

  // ==================== NOTIFICACIONES ====================

  /**
   * Enviar alerta al personal
   */
  async sendStaffAlert(type, message, data = {}) {
    // Registrar en base de datos
    await dbService.create('staff_notifications', {
      branch_id: this.branchId,
      type,
      message,
      data: JSON.stringify(data),
      status: 'pending',
      created_at: new Date().toISOString()
    });

    // En producción, aquí se integraría con WebSocket para notificación en tiempo real
    return { success: true, type, message };
  }
}

export default new SysmeAPIIntegration();
