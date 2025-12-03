/**
 * JARVIS Skill: Toma de Pedidos (Delivery/Para Llevar)
 * Permite a clientes hacer pedidos via WhatsApp
 */

import { dbService } from '../../backend/src/config/database.js';

class OrderTakingSkill {
  constructor() {
    this.name = 'order-taking';
    this.intents = [
      'quiero pedir', 'ordenar', 'pedido', 'delivery',
      'para llevar', 'domicilio', 'enviar a',
      'agregar', 'añadir', 'quitar', 'cambiar'
    ];

    // Carrito temporal por conversación
    this.carts = new Map();
  }

  /**
   * Iniciar nuevo pedido
   */
  async startOrder(customerId, customerPhone, branchId = 1) {
    const cartId = `${customerPhone}_${Date.now()}`;

    this.carts.set(customerPhone, {
      cartId,
      customerId,
      customerPhone,
      branchId,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      deliveryAddress: null,
      notes: '',
      createdAt: new Date()
    });

    return {
      cartId,
      message: '¡Perfecto! ¿Qué le gustaría ordenar? Puede decirme los productos y la cantidad.'
    };
  }

  /**
   * Agregar producto al carrito
   */
  async addToCart(customerPhone, productName, quantity = 1, modifiers = [], notes = '') {
    let cart = this.carts.get(customerPhone);
    if (!cart) {
      // Auto-iniciar carrito
      const result = await this.startOrder(null, customerPhone);
      cart = this.carts.get(customerPhone);
    }

    try {
      // Buscar producto
      const products = await dbService.query(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        AND (p.name LIKE ? OR p.sku = ?)
        LIMIT 1
      `, [`%${productName}%`, productName]);

      if (products.length === 0) {
        return {
          success: false,
          message: `No encontré "${productName}" en el menú. ¿Podría verificar el nombre?`
        };
      }

      const product = products[0];

      // Calcular precio con modificadores
      let itemPrice = product.price;
      const modifierDetails = [];

      for (const mod of modifiers) {
        const modifier = await dbService.findOne('modifiers', { name: mod });
        if (modifier) {
          itemPrice += modifier.price_adjustment || 0;
          modifierDetails.push({
            name: modifier.name,
            price: modifier.price_adjustment
          });
        }
      }

      // Agregar al carrito
      const cartItem = {
        productId: product.id,
        name: product.name,
        quantity: quantity,
        unitPrice: product.price,
        modifiers: modifierDetails,
        notes: notes,
        totalPrice: itemPrice * quantity
      };

      cart.items.push(cartItem);
      this.updateCartTotals(cart);

      return {
        success: true,
        item: cartItem,
        cart: this.getCartSummary(cart),
        message: `Agregado: ${quantity}x ${product.name}${modifierDetails.length > 0 ? ` (${modifierDetails.map(m => m.name).join(', ')})` : ''} - $${cartItem.totalPrice.toLocaleString('es-CL')}\n\n${this.formatCartSummary(cart)}\n\n¿Desea agregar algo más?`
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, message: 'Hubo un error al agregar el producto.' };
    }
  }

  /**
   * Quitar producto del carrito
   */
  removeFromCart(customerPhone, productName) {
    const cart = this.carts.get(customerPhone);
    if (!cart) {
      return { success: false, message: 'No tiene un pedido activo.' };
    }

    const index = cart.items.findIndex(item =>
      item.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (index === -1) {
      return { success: false, message: `No encontré "${productName}" en su pedido.` };
    }

    const removed = cart.items.splice(index, 1)[0];
    this.updateCartTotals(cart);

    return {
      success: true,
      message: `Eliminado: ${removed.name}\n\n${this.formatCartSummary(cart)}`
    };
  }

  /**
   * Ver carrito actual
   */
  getCart(customerPhone) {
    const cart = this.carts.get(customerPhone);
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: 'Su carrito está vacío. ¿Qué le gustaría ordenar?'
      };
    }

    return {
      success: true,
      cart: this.getCartSummary(cart),
      message: this.formatCartSummary(cart)
    };
  }

  /**
   * Establecer dirección de entrega
   */
  setDeliveryAddress(customerPhone, address) {
    const cart = this.carts.get(customerPhone);
    if (!cart) {
      return { success: false, message: 'No tiene un pedido activo.' };
    }

    cart.deliveryAddress = address;
    cart.deliveryFee = this.calculateDeliveryFee(address);
    this.updateCartTotals(cart);

    return {
      success: true,
      message: `Dirección de entrega: ${address}\nCosto de envío: $${cart.deliveryFee.toLocaleString('es-CL')}\nTotal: $${cart.total.toLocaleString('es-CL')}\n\n¿Confirmar pedido?`
    };
  }

  /**
   * Confirmar y crear el pedido
   */
  async confirmOrder(customerPhone, paymentMethod = 'cash') {
    const cart = this.carts.get(customerPhone);
    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Su carrito está vacío.' };
    }

    try {
      // Generar número de pedido
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await dbService.count('orders', {});
      const orderNumber = `DEL-${today}-${String(count + 1).padStart(4, '0')}`;

      // Crear orden
      const order = await dbService.create('orders', {
        order_number: orderNumber,
        branch_id: cart.branchId,
        customer_phone: cart.customerPhone,
        order_type: cart.deliveryAddress ? 'delivery' : 'takeaway',
        delivery_address: cart.deliveryAddress,
        subtotal: cart.subtotal,
        delivery_fee: cart.deliveryFee,
        total: cart.total,
        payment_method: paymentMethod,
        status: 'pending',
        source: 'whatsapp',
        notes: cart.notes,
        created_at: new Date().toISOString()
      });

      // Crear items del pedido
      for (const item of cart.items) {
        await dbService.create('order_items', {
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          modifiers: JSON.stringify(item.modifiers),
          notes: item.notes,
          total_price: item.totalPrice,
          status: 'pending',
          destination: await this.getProductDestination(item.productId)
        });
      }

      // Limpiar carrito
      this.carts.delete(customerPhone);

      // Calcular tiempo estimado
      const estimatedTime = this.calculateEstimatedTime(cart);

      return {
        success: true,
        order: {
          orderNumber,
          total: cart.total,
          estimatedTime
        },
        message: `¡Pedido confirmado!\n\n📋 Número: ${orderNumber}\n💰 Total: $${cart.total.toLocaleString('es-CL')}\n⏱️ Tiempo estimado: ${estimatedTime} minutos\n${cart.deliveryAddress ? `📍 Entrega en: ${cart.deliveryAddress}` : '🏪 Para retirar en local'}\n\nLe enviaremos un mensaje cuando su pedido esté listo. ¡Gracias por su preferencia!`
      };
    } catch (error) {
      console.error('Error confirming order:', error);
      return { success: false, message: 'Hubo un error al procesar su pedido. Por favor intente nuevamente.' };
    }
  }

  /**
   * Cancelar pedido en progreso
   */
  cancelOrder(customerPhone) {
    if (this.carts.has(customerPhone)) {
      this.carts.delete(customerPhone);
      return { success: true, message: 'Pedido cancelado. ¿Puedo ayudarle en algo más?' };
    }
    return { success: false, message: 'No tiene un pedido activo.' };
  }

  /**
   * Procesar mensaje de usuario
   */
  async processMessage(message, context = {}) {
    const lowerMessage = message.toLowerCase();
    const customerPhone = context.customerPhone || 'unknown';

    // Quiere iniciar pedido
    if (lowerMessage.includes('quiero pedir') || lowerMessage.includes('hacer pedido') ||
      lowerMessage.includes('delivery') || lowerMessage.includes('para llevar')) {
      const result = await this.startOrder(null, customerPhone);
      return {
        action: 'start_order',
        ...result
      };
    }

    // Ver carrito
    if (lowerMessage.includes('mi pedido') || lowerMessage.includes('ver carrito') ||
      lowerMessage.includes('que llevo')) {
      return {
        action: 'show_cart',
        ...this.getCart(customerPhone)
      };
    }

    // Agregar producto
    if (lowerMessage.includes('agregar') || lowerMessage.includes('añadir') ||
      lowerMessage.includes('quiero')) {
      const parsed = this.parseOrderRequest(message);
      if (parsed.product) {
        return {
          action: 'add_to_cart',
          ...(await this.addToCart(customerPhone, parsed.product, parsed.quantity, parsed.modifiers, parsed.notes))
        };
      }
    }

    // Quitar producto
    if (lowerMessage.includes('quitar') || lowerMessage.includes('eliminar') ||
      lowerMessage.includes('sacar')) {
      const productName = this.extractProductFromRemoveRequest(message);
      return {
        action: 'remove_from_cart',
        ...this.removeFromCart(customerPhone, productName)
      };
    }

    // Dirección de entrega
    if (lowerMessage.includes('mi dirección') || lowerMessage.includes('enviar a') ||
      lowerMessage.includes('entregar en')) {
      const address = this.extractAddress(message);
      if (address) {
        return {
          action: 'set_address',
          ...this.setDeliveryAddress(customerPhone, address)
        };
      }
    }

    // Confirmar pedido
    if (lowerMessage.includes('confirmar') || lowerMessage.includes('listo') ||
      lowerMessage.includes('eso es todo') || lowerMessage.includes('nada más')) {
      // Verificar si tiene dirección
      const cart = this.carts.get(customerPhone);
      if (cart && cart.items.length > 0 && !cart.deliveryAddress && lowerMessage.includes('delivery')) {
        return {
          action: 'request_address',
          message: '¿A qué dirección le enviamos su pedido?'
        };
      }
      return {
        action: 'confirm_order',
        ...(await this.confirmOrder(customerPhone))
      };
    }

    // Cancelar
    if (lowerMessage.includes('cancelar pedido') || lowerMessage.includes('ya no quiero')) {
      return {
        action: 'cancel_order',
        ...this.cancelOrder(customerPhone)
      };
    }

    return null; // No es una intención de pedido
  }

  // Helpers
  parseOrderRequest(message) {
    // Extraer cantidad
    let quantity = 1;
    const quantityMatch = message.match(/(\d+)\s*(x|unidades?|porciones?)?/i);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1]);
    }

    // Palabras a ignorar
    const stopWords = ['quiero', 'agregar', 'añadir', 'un', 'una', 'por favor', 'porfavor'];
    let cleanMessage = message.toLowerCase();
    stopWords.forEach(word => {
      cleanMessage = cleanMessage.replace(new RegExp(word, 'gi'), '');
    });

    // Extraer modificadores (entre paréntesis o después de "con"/"sin")
    const modifiers = [];
    const modMatch = cleanMessage.match(/(?:con|sin)\s+([^,]+)/gi);
    if (modMatch) {
      modifiers.push(...modMatch.map(m => m.trim()));
    }

    // Extraer notas (después de "nota:" o entre comillas)
    let notes = '';
    const notesMatch = message.match(/(?:nota:|observación:)\s*(.+)/i);
    if (notesMatch) notes = notesMatch[1].trim();

    // El resto es el nombre del producto
    const product = cleanMessage
      .replace(/\d+\s*(x|unidades?|porciones?)?/gi, '')
      .replace(/(?:con|sin)\s+[^,]+/gi, '')
      .trim();

    return { product, quantity, modifiers, notes };
  }

  extractProductFromRemoveRequest(message) {
    const stopWords = ['quitar', 'eliminar', 'sacar', 'el', 'la', 'un', 'una'];
    let cleanMessage = message.toLowerCase();
    stopWords.forEach(word => {
      cleanMessage = cleanMessage.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    });
    return cleanMessage.trim();
  }

  extractAddress(message) {
    // Remover palabras clave
    const stopWords = ['mi dirección es', 'enviar a', 'entregar en', 'dirección:'];
    let address = message;
    stopWords.forEach(phrase => {
      address = address.replace(new RegExp(phrase, 'gi'), '');
    });
    return address.trim();
  }

  updateCartTotals(cart) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.total = cart.subtotal + cart.deliveryFee;
  }

  getCartSummary(cart) {
    return {
      items: cart.items.length,
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: cart.total
    };
  }

  formatCartSummary(cart) {
    if (cart.items.length === 0) return 'Carrito vacío';

    let summary = '🛒 *Su pedido:*\n';
    cart.items.forEach(item => {
      summary += `• ${item.quantity}x ${item.name} - $${item.totalPrice.toLocaleString('es-CL')}\n`;
      if (item.modifiers.length > 0) {
        summary += `  (${item.modifiers.map(m => m.name).join(', ')})\n`;
      }
    });
    summary += `\n💰 Subtotal: $${cart.subtotal.toLocaleString('es-CL')}`;
    if (cart.deliveryFee > 0) {
      summary += `\n🚚 Envío: $${cart.deliveryFee.toLocaleString('es-CL')}`;
    }
    summary += `\n*Total: $${cart.total.toLocaleString('es-CL')}*`;
    return summary;
  }

  calculateDeliveryFee(address) {
    // Tarifa base - en producción se calcularía por distancia
    return 2500; // $2.500 CLP fijo por ahora
  }

  calculateEstimatedTime(cart) {
    // Tiempo base + tiempo por cantidad de items
    const baseTime = cart.deliveryAddress ? 30 : 15; // Delivery vs pickup
    const itemTime = cart.items.length * 5;
    return Math.min(baseTime + itemTime, 60);
  }

  async getProductDestination(productId) {
    const product = await dbService.findById('products', productId);
    const category = product ? await dbService.findById('categories', product.category_id) : null;

    // Determinar destino basado en categoría
    if (category) {
      const beverageCategories = ['bebidas', 'jugos', 'cervezas', 'licores', 'tragos', 'bar'];
      if (beverageCategories.some(c => category.name.toLowerCase().includes(c))) {
        return 'bar';
      }
    }
    return 'kitchen';
  }
}

export default new OrderTakingSkill();
