/**
 * Repository: Pago
 *
 * Acceso a datos para tabla `pago`
 */

import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface PagoRow extends RowDataPacket {
  id: string;
  numero_pago: string | null;
  venta_id: string;
  sesion_caja_id: string | null;
  forma_pago_id: string;
  monto: string; // DECIMAL
  monto_pagado: string | null;
  estado: string;
  metodo: string;
  monto_recibido: string | null;
  monto_cambio: string | null;
  webpay_token: string | null;
  webpay_buy_order: string | null;
  webpay_session_id: string | null;
  webpay_authorization_code: string | null;
  webpay_card_number: string | null;
  webpay_transaction_date: Date | null;
  webpay_response_code: string | null;
  fecha_inicio: Date;
  fecha_completado: Date | null;
  empleado_id: string;
  terminal_id: string | null;
  ip_address: string | null;
  intentos_procesamiento: number;
  ultimo_error: string | null;
  notas: string | null;
  esta_activo: boolean;
  motivo_anulacion: string | null;
  fecha_anulacion: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class PagoRepository {
  constructor(private db: Pool) {}

  /**
   * Obtener pago por ID
   */
  async obtenerPorId(pagoId: string): Promise<PagoRow | null> {
    const [rows] = await this.db.execute<PagoRow[]>(
      `SELECT * FROM pago WHERE id = ?`,
      [pagoId]
    );
    return rows[0] || null;
  }

  /**
   * Obtener pago por token Webpay
   */
  async obtenerPorWebpayToken(token: string): Promise<PagoRow | null> {
    const [rows] = await this.db.execute<PagoRow[]>(
      `SELECT * FROM pago WHERE webpay_token = ?`,
      [token]
    );
    return rows[0] || null;
  }

  /**
   * Crear nuevo pago
   */
  async crear(datos: {
    id: string;
    numero_pago?: string;
    venta_id: string;
    sesion_caja_id: string | null;
    forma_pago_id: string;
    monto: number;
    estado: string;
    metodo: string;
    monto_recibido?: number;
    monto_cambio?: number;
    fecha_inicio: string;
    empleado_id: string;
    terminal_id?: string;
    ip_address?: string;
    notas?: string;
  }): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO pago (
        id, numero_pago, venta_id, sesion_caja_id, forma_pago_id,
        monto, estado, metodo, monto_recibido, monto_cambio,
        fecha_inicio, empleado_id, terminal_id, ip_address, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.id,
        datos.numero_pago || null,
        datos.venta_id,
        datos.sesion_caja_id,
        datos.forma_pago_id,
        datos.monto,
        datos.estado,
        datos.metodo,
        datos.monto_recibido || null,
        datos.monto_cambio || null,
        datos.fecha_inicio,
        datos.empleado_id,
        datos.terminal_id || null,
        datos.ip_address || null,
        datos.notas || null,
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Actualizar estado y datos de pago
   */
  async actualizar(datos: {
    id: string;
    estado?: string;
    monto_pagado?: number;
    webpay_token?: string;
    webpay_buy_order?: string;
    webpay_authorization_code?: string;
    webpay_card_number?: string;
    webpay_transaction_date?: string;
    webpay_response_code?: string;
    fecha_completado?: string;
    intentos_procesamiento?: number;
    ultimo_error?: string;
  }): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (datos.estado !== undefined) {
      updates.push('estado = ?');
      values.push(datos.estado);
    }
    if (datos.monto_pagado !== undefined) {
      updates.push('monto_pagado = ?');
      values.push(datos.monto_pagado);
    }
    if (datos.webpay_token !== undefined) {
      updates.push('webpay_token = ?');
      values.push(datos.webpay_token);
    }
    if (datos.webpay_buy_order !== undefined) {
      updates.push('webpay_buy_order = ?');
      values.push(datos.webpay_buy_order);
    }
    if (datos.webpay_authorization_code !== undefined) {
      updates.push('webpay_authorization_code = ?');
      values.push(datos.webpay_authorization_code);
    }
    if (datos.webpay_card_number !== undefined) {
      updates.push('webpay_card_number = ?');
      values.push(datos.webpay_card_number);
    }
    if (datos.webpay_transaction_date !== undefined) {
      updates.push('webpay_transaction_date = ?');
      values.push(datos.webpay_transaction_date);
    }
    if (datos.webpay_response_code !== undefined) {
      updates.push('webpay_response_code = ?');
      values.push(datos.webpay_response_code);
    }
    if (datos.fecha_completado !== undefined) {
      updates.push('fecha_completado = ?');
      values.push(datos.fecha_completado);
    }
    if (datos.intentos_procesamiento !== undefined) {
      updates.push('intentos_procesamiento = ?');
      values.push(datos.intentos_procesamiento);
    }
    if (datos.ultimo_error !== undefined) {
      updates.push('ultimo_error = ?');
      values.push(datos.ultimo_error);
    }

    if (updates.length === 0) return false;

    values.push(datos.id);

    const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE pago SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  /**
   * Anular pago (soft-delete)
   */
  async anular(datos: {
    id: string;
    motivo: string;
    fecha_anulacion: string;
  }): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE pago
       SET esta_activo = FALSE,
           motivo_anulacion = ?,
           fecha_anulacion = ?
       WHERE id = ? AND esta_activo = TRUE`,
      [datos.motivo, datos.fecha_anulacion, datos.id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Obtener pagos de una venta
   */
  async obtenerPorVenta(ventaId: string): Promise<PagoRow[]> {
    const [rows] = await this.db.execute<PagoRow[]>(
      `SELECT * FROM pago
       WHERE venta_id = ?
       ORDER BY fecha_inicio DESC`,
      [ventaId]
    );
    return rows;
  }

  /**
   * Obtener pagos activos de una venta
   */
  async obtenerActivosPorVenta(ventaId: string): Promise<PagoRow[]> {
    const [rows] = await this.db.execute<PagoRow[]>(
      `SELECT * FROM pago
       WHERE venta_id = ?
         AND esta_activo = TRUE
       ORDER BY fecha_inicio DESC`,
      [ventaId]
    );
    return rows;
  }

  /**
   * Validar si existe venta
   */
  async existeVenta(ventaId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS existe FROM venta WHERE id = ? AND esta_activo = TRUE`,
      [ventaId]
    );
    return rows[0].existe > 0;
  }

  /**
   * Validar si existe forma de pago
   */
  async existeFormaPago(formaPagoId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS existe FROM forma_pago WHERE id = ? AND esta_activa = TRUE`,
      [formaPagoId]
    );
    return rows[0].existe > 0;
  }

  /**
   * Obtener cambios desde timestamp (delta sync)
   */
  async obtenerCambiosDesde(since: string): Promise<PagoRow[]> {
    const [rows] = await this.db.execute<PagoRow[]>(
      `SELECT * FROM pago
       WHERE updated_at >= ?
       ORDER BY updated_at ASC
       LIMIT 1000`,
      [since]
    );
    return rows;
  }
}
