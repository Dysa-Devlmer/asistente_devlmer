/**
 * JARVIS - Asistente IA para SYSME-POS
 * Sistema de atención al cliente y soporte para restaurantes
 *
 * Canales soportados:
 * - WhatsApp Business API
 * - Web Chat
 * - Comandos de voz (staff)
 */

// Skills
import reservationSkill from './skills/reservations.js';
import menuInfoSkill from './skills/menu-info.js';
import orderTakingSkill from './skills/order-taking.js';

// Core
import conversationEngine from './core/conversation-engine.js';
import conversationMemory from './core/conversation-memory.js';
import nlpEngine from './core/nlp-engine.js';
import personality from './core/personality.js';

// Integrations
import sysmeAPI from './integrations/sysme-api.js';

class JARVIS {
  constructor() {
    this.name = 'JARVIS';
    this.version = '2.0.0';
    this.branchId = 1;

    // Registrar skills
    this.skills = {
      reservations: reservationSkill,
      menuInfo: menuInfoSkill,
      orderTaking: orderTakingSkill
    };

    // Configuración por defecto
    this.config = {
      language: 'es',
      timezone: 'America/Santiago',
      currency: 'CLP',
      personality: 'professional', // professional, friendly, casual
      autoGreet: true
    };

    // Información del restaurante (cargada desde BD)
    this.restaurantInfo = null;
  }

  /**
   * Inicializar JARVIS
   */
  async initialize(branchId = 1) {
    this.branchId = branchId;
    sysmeAPI.setBranch(branchId);

    // Cargar información del restaurante
    await this.loadRestaurantInfo();

    console.log(`🤖 JARVIS v${this.version} inicializado para sucursal ${branchId}`);
    return true;
  }

  /**
   * Cargar información del restaurante desde BD
   */
  async loadRestaurantInfo() {
    try {
      const settings = await this.getSettings([
        'restaurant_name',
        'restaurant_phone',
        'restaurant_address',
        'opening_hours',
        'closing_hours',
        'delivery_available',
        'minimum_order',
        'delivery_areas'
      ]);

      this.restaurantInfo = {
        name: settings.restaurant_name || 'Restaurante',
        phone: settings.restaurant_phone || '',
        address: settings.restaurant_address || '',
        openingHours: settings.opening_hours || '12:00',
        closingHours: settings.closing_hours || '23:00',
        deliveryAvailable: settings.delivery_available === 'true',
        minimumOrder: parseFloat(settings.minimum_order) || 0,
        deliveryAreas: settings.delivery_areas ? JSON.parse(settings.delivery_areas) : []
      };
    } catch (error) {
      console.error('Error loading restaurant info:', error);
      this.restaurantInfo = { name: 'Restaurante', phone: '', address: '' };
    }
  }

  /**
   * Obtener configuraciones desde BD
   */
  async getSettings(keys) {
    const settings = {};
    for (const key of keys) {
      const setting = await sysmeAPI.dbService?.findOne?.('settings', { key }) ||
        { value: null };
      settings[key] = setting.value;
    }
    return settings;
  }

  /**
   * Procesar mensaje entrante
   * @param {string} message - Mensaje del usuario
   * @param {object} context - Contexto de la conversación
   * @returns {object} Respuesta de JARVIS
   */
  async processMessage(message, context = {}) {
    const startTime = Date.now();

    try {
      // Contexto por defecto
      const fullContext = {
        channel: context.channel || 'whatsapp',
        customerPhone: context.customerPhone || null,
        customerName: context.customerName || null,
        sessionId: context.sessionId || `session_${Date.now()}`,
        branchId: this.branchId,
        ...context
      };

      // Detectar intención y enrutar al skill apropiado
      const intent = this.detectIntent(message);

      let response;

      switch (intent.skill) {
        case 'reservations':
          response = await this.skills.reservations.processMessage(message, fullContext);
          break;

        case 'menu':
          response = await this.skills.menuInfo.processMessage(message, fullContext);
          break;

        case 'order':
          response = await this.skills.orderTaking.processMessage(message, fullContext);
          break;

        case 'info':
          response = this.handleInfoQuery(message);
          break;

        case 'greeting':
          response = this.handleGreeting(fullContext);
          break;

        case 'farewell':
          response = this.handleFarewell(fullContext);
          break;

        case 'help':
          response = this.handleHelp();
          break;

        default:
          response = await this.handleUnknown(message, fullContext);
      }

      // Si el skill no manejó el mensaje, intentar con el siguiente más probable
      if (!response) {
        response = await this.handleFallback(message, fullContext);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        response: response.response || response.message || response,
        action: response.action || null,
        data: response.data || null,
        processingTime,
        intent: intent.skill
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        response: 'Disculpe, tuve un problema procesando su mensaje. ¿Podría intentar de nuevo?',
        error: error.message
      };
    }
  }

  /**
   * Detectar intención del mensaje
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Saludos
    const greetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi'];
    if (greetings.some(g => lowerMessage.includes(g))) {
      return { skill: 'greeting', confidence: 0.9 };
    }

    // Despedidas
    const farewells = ['adiós', 'chao', 'gracias', 'bye', 'hasta luego'];
    if (farewells.some(f => lowerMessage.includes(f))) {
      return { skill: 'farewell', confidence: 0.9 };
    }

    // Ayuda
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help') || lowerMessage === '?') {
      return { skill: 'help', confidence: 0.95 };
    }

    // Reservaciones
    const reservationKeywords = ['reservar', 'reserva', 'mesa para', 'disponibilidad'];
    if (reservationKeywords.some(k => lowerMessage.includes(k))) {
      return { skill: 'reservations', confidence: 0.85 };
    }

    // Pedidos/Delivery
    const orderKeywords = ['pedir', 'pedido', 'delivery', 'para llevar', 'ordenar', 'agregar', 'carrito'];
    if (orderKeywords.some(k => lowerMessage.includes(k))) {
      return { skill: 'order', confidence: 0.85 };
    }

    // Menú/Información
    const menuKeywords = ['menu', 'carta', 'precio', 'vegetariano', 'ingredientes', 'platos', 'tienen'];
    if (menuKeywords.some(k => lowerMessage.includes(k))) {
      return { skill: 'menu', confidence: 0.8 };
    }

    // Información general
    const infoKeywords = ['horario', 'dirección', 'ubicación', 'teléfono', 'donde están', 'a qué hora'];
    if (infoKeywords.some(k => lowerMessage.includes(k))) {
      return { skill: 'info', confidence: 0.85 };
    }

    return { skill: 'unknown', confidence: 0.3 };
  }

  /**
   * Manejar saludo
   */
  handleGreeting(context) {
    const greetings = [
      `¡Hola! Bienvenido a ${this.restaurantInfo?.name || 'nuestro restaurante'}. Soy JARVIS, su asistente virtual.`,
      `¡Buenos días! Soy JARVIS, ¿en qué puedo ayudarle hoy?`,
      `¡Hola! Es un placer atenderle. ¿Desea hacer una reserva, consultar el menú o realizar un pedido?`
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    return {
      action: 'greeting',
      response: `${greeting}\n\nPuedo ayudarle con:\n📅 Reservaciones\n📋 Información del menú\n🛵 Pedidos para delivery\n❓ Información general`
    };
  }

  /**
   * Manejar despedida
   */
  handleFarewell(context) {
    const farewells = [
      `¡Gracias por contactarnos! Esperamos verle pronto en ${this.restaurantInfo?.name || 'nuestro restaurante'}.`,
      `Ha sido un placer atenderle. ¡Que tenga un excelente día!`,
      `¡Hasta pronto! Si necesita algo más, no dude en escribirnos.`
    ];

    return {
      action: 'farewell',
      response: farewells[Math.floor(Math.random() * farewells.length)]
    };
  }

  /**
   * Manejar consultas de información
   */
  handleInfoQuery(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('horario')) {
      return {
        action: 'show_hours',
        response: `🕐 Nuestro horario de atención:\nAbrimos: ${this.restaurantInfo?.openingHours || '12:00'}\nCerramos: ${this.restaurantInfo?.closingHours || '23:00'}\n\nEstamos abiertos todos los días.`
      };
    }

    if (lowerMessage.includes('dirección') || lowerMessage.includes('ubicación') || lowerMessage.includes('donde')) {
      return {
        action: 'show_location',
        response: `📍 Estamos ubicados en:\n${this.restaurantInfo?.address || 'Consulte nuestra dirección'}\n\n📞 Teléfono: ${this.restaurantInfo?.phone || 'No disponible'}`
      };
    }

    if (lowerMessage.includes('teléfono') || lowerMessage.includes('llamar')) {
      return {
        action: 'show_phone',
        response: `📞 Puede llamarnos al: ${this.restaurantInfo?.phone || 'No disponible'}`
      };
    }

    if (lowerMessage.includes('delivery') || lowerMessage.includes('reparto')) {
      if (this.restaurantInfo?.deliveryAvailable) {
        return {
          action: 'show_delivery_info',
          response: `🛵 ¡Sí, hacemos delivery!\n\nPedido mínimo: $${(this.restaurantInfo?.minimumOrder || 0).toLocaleString('es-CL')}\n\n¿Desea hacer un pedido?`
        };
      }
      return {
        action: 'no_delivery',
        response: `Lo sentimos, actualmente no ofrecemos servicio de delivery. Pero puede hacer su pedido para retirar en local.`
      };
    }

    return {
      action: 'general_info',
      response: `ℹ️ ${this.restaurantInfo?.name || 'Restaurante'}\n\n📍 ${this.restaurantInfo?.address || 'Dirección no disponible'}\n📞 ${this.restaurantInfo?.phone || 'Teléfono no disponible'}\n🕐 ${this.restaurantInfo?.openingHours || '12:00'} - ${this.restaurantInfo?.closingHours || '23:00'}`
    };
  }

  /**
   * Mostrar ayuda
   */
  handleHelp() {
    return {
      action: 'show_help',
      response: `🤖 *JARVIS - Asistente Virtual*\n\nPuedo ayudarle con:\n\n📅 *Reservaciones*\nEjemplo: "Quiero reservar mesa para 4 personas mañana a las 8pm"\n\n📋 *Menú*\nEjemplo: "¿Qué platos tienen?" o "¿Tienen opciones vegetarianas?"\n\n🛵 *Pedidos Delivery*\nEjemplo: "Quiero pedir para delivery"\n\n📍 *Información*\nEjemplo: "¿Cuál es su horario?" o "¿Dónde están ubicados?"\n\n¿En qué puedo ayudarle?`
    };
  }

  /**
   * Manejar mensaje no reconocido
   */
  async handleUnknown(message, context) {
    // Intentar buscar en menú por si mencionó un producto
    const menuResult = await this.skills.menuInfo.searchProducts(message);
    if (menuResult.length > 0) {
      return {
        action: 'found_products',
        data: menuResult,
        response: `Encontré esto en nuestro menú:\n${menuResult.slice(0, 3).map(p => `• ${p.name} - $${p.price.toLocaleString('es-CL')}`).join('\n')}\n\n¿Le interesa alguno?`
      };
    }

    return null;
  }

  /**
   * Fallback cuando no se entiende el mensaje
   */
  async handleFallback(message, context) {
    return {
      action: 'fallback',
      response: `No estoy seguro de entender su solicitud. ¿Podría ser más específico?\n\nPuedo ayudarle con:\n• Reservaciones\n• Información del menú\n• Pedidos para delivery\n• Información del restaurante\n\nO escriba "ayuda" para ver ejemplos.`
    };
  }

  /**
   * Obtener estado del sistema
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      branchId: this.branchId,
      skills: Object.keys(this.skills),
      restaurantInfo: this.restaurantInfo,
      config: this.config
    };
  }
}

// Exportar instancia singleton
const jarvis = new JARVIS();
export default jarvis;
export { JARVIS };
