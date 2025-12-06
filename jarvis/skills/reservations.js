/**
 * JARVIS Skill: Reservaciones
 * Permite a JARVIS gestionar reservas via WhatsApp/Chat
 */

import { dbService } from '../../backend/src/config/database.js';

class ReservationSkill {
  constructor() {
    this.name = 'reservations';
    this.intents = [
      'reservar mesa',
      'hacer reserva',
      'quiero reservar',
      'tienen disponibilidad',
      'mesa para',
      'reservación'
    ];
  }

  /**
   * Verificar disponibilidad
   */
  async checkAvailability(date, time, partySize, branchId = 1) {
    try {
      const dateStr = this.formatDate(date);

      // Obtener reservas existentes para esa fecha/hora
      const existingReservations = await dbService.query(`
        SELECT r.*, t.max_capacity
        FROM reservations r
        JOIN tables t ON r.table_id = t.id
        WHERE r.branch_id = ?
        AND r.reservation_date = ?
        AND r.reservation_time BETWEEN ? AND ?
        AND r.status NOT IN ('cancelled', 'no_show')
      `, [branchId, dateStr, this.addHours(time, -2), this.addHours(time, 2)]);

      // Obtener mesas disponibles
      const availableTables = await dbService.query(`
        SELECT t.* FROM tables t
        WHERE t.branch_id = ?
        AND t.max_capacity >= ?
        AND t.is_active = 1
        AND t.id NOT IN (
          SELECT table_id FROM reservations
          WHERE branch_id = ?
          AND reservation_date = ?
          AND status NOT IN ('cancelled', 'no_show')
        )
        ORDER BY t.max_capacity ASC
      `, [branchId, partySize, branchId, dateStr]);

      return {
        available: availableTables.length > 0,
        tables: availableTables,
        existingCount: existingReservations.length
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Crear reservación
   */
  async createReservation(data) {
    const {
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      date,
      time,
      tableId,
      notes,
      branchId = 1,
      source = 'whatsapp' // whatsapp, web, phone, walk-in
    } = data;

    try {
      // Generar número de reserva
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await dbService.count('reservations', {});
      const reservationNumber = `RES-${today}-${String(count + 1).padStart(4, '0')}`;

      const reservation = await dbService.create('reservations', {
        reservation_number: reservationNumber,
        branch_id: branchId,
        table_id: tableId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        party_size: partySize,
        reservation_date: this.formatDate(date),
        reservation_time: time,
        status: 'confirmed',
        source: source,
        notes: notes,
        created_at: new Date().toISOString()
      });

      return {
        success: true,
        reservation,
        message: `Reserva ${reservationNumber} confirmada para ${partySize} personas el ${date} a las ${time}`
      };
    } catch (error) {
      console.error('Error creating reservation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar reservación
   */
  async cancelReservation(reservationNumber, reason = '') {
    try {
      const reservation = await dbService.findOne('reservations', {
        reservation_number: reservationNumber
      });

      if (!reservation) {
        return { success: false, message: 'Reserva no encontrada' };
      }

      await dbService.update('reservations', reservation.id, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      });

      return {
        success: true,
        message: `Reserva ${reservationNumber} cancelada exitosamente`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Modificar reservación
   */
  async modifyReservation(reservationNumber, updates) {
    try {
      const reservation = await dbService.findOne('reservations', {
        reservation_number: reservationNumber
      });

      if (!reservation) {
        return { success: false, message: 'Reserva no encontrada' };
      }

      const allowedUpdates = ['party_size', 'reservation_date', 'reservation_time', 'notes'];
      const filteredUpdates = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      await dbService.update('reservations', reservation.id, filteredUpdates);

      return {
        success: true,
        message: `Reserva ${reservationNumber} actualizada`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Procesar mensaje de usuario
   */
  async processMessage(message, context = {}) {
    const lowerMessage = message.toLowerCase();

    // Detectar intención de reserva
    if (this.intents.some(intent => lowerMessage.includes(intent))) {
      // Extraer información del mensaje
      const partySize = this.extractPartySize(message);
      const date = this.extractDate(message);
      const time = this.extractTime(message);

      if (partySize && date && time) {
        // Verificar disponibilidad
        const availability = await this.checkAvailability(date, time, partySize);

        if (availability.available) {
          return {
            action: 'confirm_reservation',
            data: { partySize, date, time, tables: availability.tables },
            response: `Tenemos disponibilidad para ${partySize} personas el ${date} a las ${time}. ¿Desea confirmar la reserva? Por favor proporcione su nombre y teléfono.`
          };
        } else {
          return {
            action: 'suggest_alternatives',
            response: `Lo siento, no tenemos disponibilidad para ${partySize} personas el ${date} a las ${time}. ¿Le gustaría que busque otros horarios disponibles?`
          };
        }
      }

      // Falta información
      const missing = [];
      if (!partySize) missing.push('número de personas');
      if (!date) missing.push('fecha');
      if (!time) missing.push('hora');

      return {
        action: 'request_info',
        missing: missing,
        response: `Para hacer su reserva, necesito saber: ${missing.join(', ')}. ¿Me puede proporcionar esa información?`
      };
    }

    return null; // No es una intención de reserva
  }

  // Helpers
  extractPartySize(message) {
    const match = message.match(/(\d+)\s*(personas?|pax|comensales?)/i);
    if (match) return parseInt(match[1]);

    const wordNumbers = {
      'una': 1, 'un': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
    };

    for (const [word, num] of Object.entries(wordNumbers)) {
      if (message.toLowerCase().includes(`${word} persona`)) return num;
    }

    return null;
  }

  extractDate(message) {
    const today = new Date();
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hoy')) {
      return today.toISOString().split('T')[0];
    }
    if (lowerMessage.includes('mañana')) {
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    }

    // Buscar fecha en formato DD/MM o DD-MM
    const dateMatch = message.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = today.getFullYear();
      return new Date(year, month, day).toISOString().split('T')[0];
    }

    return null;
  }

  extractTime(message) {
    const timeMatch = message.match(/(\d{1,2})(?::(\d{2}))?\s*(pm|am|hrs?)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return null;
  }

  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  addHours(time, hours) {
    const [h, m] = time.split(':').map(Number);
    const newHours = (h + hours + 24) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

export default new ReservationSkill();
