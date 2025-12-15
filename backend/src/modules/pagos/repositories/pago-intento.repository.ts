/**
 * Repository: Pago Intento
 *
 * Acceso a datos para tabla `pago_intento`
 */

import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface PagoIntentoRow extends RowDataPacket {
  id: string;
  pago_id: string;
  numero_intento: number;
  estado_resultante: string;
  request_payload: any | null;
  response_payload: any | null;
  error_message: string | null;
  error_code: string | null;
  fecha_inicio: Date;
  fecha_fin: Date | null;
  duracion_ms: number | null;
  created_at: Date;
}

export class PagoIntentoRepository {
  constructor(private db: Pool) {}

  /**
   * Crear registro de intento
   */
  async crear(datos: {
    id: string;
    pago_id: string;
    numero_intento: number;
    estado_resultante: string;
    request_payload?: any;
    response_payload?: any;
    error_message?: string;
    error_code?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    duracion_ms?: number;
  }): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `INSERT INTO pago_intento (
        id, pago_id, numero_intento, estado_resultante,
        request_payload, response_payload,
        error_message, error_code,
        fecha_inicio, fecha_fin, duracion_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.id,
        datos.pago_id,
        datos.numero_intento,
        datos.estado_resultante,
        datos.request_payload ? JSON.stringify(datos.request_payload) : null,
        datos.response_payload ? JSON.stringify(datos.response_payload) : null,
        datos.error_message || null,
        datos.error_code || null,
        datos.fecha_inicio,
        datos.fecha_fin || null,
        datos.duracion_ms || null,
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Obtener intentos de un pago
   */
  async obtenerPorPago(pagoId: string): Promise<PagoIntentoRow[]> {
    const [rows] = await this.db.execute<PagoIntentoRow[]>(
      `SELECT * FROM pago_intento
       WHERE pago_id = ?
       ORDER BY numero_intento ASC`,
      [pagoId]
    );
    return rows;
  }

  /**
   * Obtener último intento de un pago
   */
  async obtenerUltimoIntento(pagoId: string): Promise<PagoIntentoRow | null> {
    const [rows] = await this.db.execute<PagoIntentoRow[]>(
      `SELECT * FROM pago_intento
       WHERE pago_id = ?
       ORDER BY numero_intento DESC
       LIMIT 1`,
      [pagoId]
    );
    return rows[0] || null;
  }
}
