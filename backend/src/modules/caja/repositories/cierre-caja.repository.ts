/**
 * Repository: Cierre de Caja (Detalle)
 *
 * Responsabilidad: Acceso a datos de cierre_caja_detalle y ventas
 * - Crear detalles de cierre por forma de pago
 * - Consultar detalles de cierre
 * - Calcular totales de ventas por forma de pago
 *
 * REGLAS DE INMUTABILIDAD:
 * - NO se puede editar un detalle de cierre
 * - NO se puede borrar un detalle de cierre
 */

import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Interface de cierre_caja_detalle (row de DB)
 */
export interface CierreCajaDetalleRow extends RowDataPacket {
  id: string;
  sesion_caja_id: string;
  forma_pago_id: string;
  nombre_forma_pago: string;
  cantidad_transacciones: number;
  monto_total: string; // DECIMAL viene como string
  created_at: Date;
}

/**
 * Interface para totales de ventas por forma de pago
 */
export interface TotalVentasPorFormaPago extends RowDataPacket {
  forma_pago_id: string;
  nombre_forma_pago: string;
  cantidad_transacciones: number;
  monto_total: string; // DECIMAL
}

export class CierreCajaRepository {
  constructor(private db: Pool) {}

  /**
   * Crear detalle de cierre por forma de pago
   *
   * Query:
   * INSERT INTO cierre_caja_detalle (
   *   id, sesion_caja_id, forma_pago_id, nombre_forma_pago,
   *   cantidad_transacciones, monto_total
   * ) VALUES (?, ?, ?, ?, ?, ?)
   */
  async crearDetalle(datos: {
    detalleId: string;
    sesionCajaId: string;
    formaPagoId: string;
    nombreFormaPago: string;
    cantidadTransacciones: number;
    montoTotal: number;
  }): Promise<void> {
    await this.db.execute<ResultSetHeader>(
      `INSERT INTO cierre_caja_detalle (
         id, sesion_caja_id, forma_pago_id, nombre_forma_pago,
         cantidad_transacciones, monto_total
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        datos.detalleId,
        datos.sesionCajaId,
        datos.formaPagoId,
        datos.nombreFormaPago,
        datos.cantidadTransacciones,
        datos.montoTotal,
      ]
    );
  }

  /**
   * Obtener detalles de cierre por sesión
   *
   * Query:
   * SELECT * FROM cierre_caja_detalle
   * WHERE sesion_caja_id = ?
   * ORDER BY nombre_forma_pago ASC
   */
  async obtenerDetallesPorSesion(sesionCajaId: string): Promise<CierreCajaDetalleRow[]> {
    const [rows] = await this.db.execute<CierreCajaDetalleRow[]>(
      `SELECT * FROM cierre_caja_detalle
       WHERE sesion_caja_id = ?
       ORDER BY nombre_forma_pago ASC`,
      [sesionCajaId]
    );

    return rows;
  }

  /**
   * Calcular totales de ventas por forma de pago para una sesión
   *
   * Query:
   * SELECT
   *   v.forma_pago_id,
   *   fp.nombre AS nombre_forma_pago,
   *   COUNT(*) AS cantidad_transacciones,
   *   SUM(v.total) AS monto_total
   * FROM venta v
   * INNER JOIN forma_pago fp ON v.forma_pago_id = fp.id
   * WHERE v.sesion_caja_id = ?
   *   AND v.esta_activo = TRUE
   * GROUP BY v.forma_pago_id, fp.nombre
   * ORDER BY fp.nombre ASC
   *
   * IMPORTANTE: Solo cuenta ventas activas de la sesión
   */
  async calcularTotalesPorFormaPago(sesionCajaId: string): Promise<TotalVentasPorFormaPago[]> {
    const [rows] = await this.db.execute<TotalVentasPorFormaPago[]>(
      `SELECT
         v.forma_pago_id,
         fp.nombre AS nombre_forma_pago,
         COUNT(*) AS cantidad_transacciones,
         SUM(v.total) AS monto_total
       FROM venta v
       INNER JOIN forma_pago fp ON v.forma_pago_id = fp.id
       WHERE v.sesion_caja_id = ?
         AND v.esta_activo = TRUE
       GROUP BY v.forma_pago_id, fp.nombre
       ORDER BY fp.nombre ASC`,
      [sesionCajaId]
    );

    return rows;
  }

  /**
   * Calcular total general de ventas en efectivo para una sesión
   *
   * Query:
   * SELECT COALESCE(SUM(v.total), 0) AS total_efectivo
   * FROM venta v
   * INNER JOIN forma_pago fp ON v.forma_pago_id = fp.id
   * WHERE v.sesion_caja_id = ?
   *   AND v.esta_activo = TRUE
   *   AND fp.tipo = 'efectivo'
   *
   * IMPORTANTE: Solo suma ventas en efectivo activas
   * NOTA: Asume que forma_pago tiene columna 'tipo'
   */
  async calcularTotalEfectivo(sesionCajaId: string): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(v.total), 0) AS total_efectivo
       FROM venta v
       INNER JOIN forma_pago fp ON v.forma_pago_id = fp.id
       WHERE v.sesion_caja_id = ?
         AND v.esta_activo = TRUE
         AND fp.tipo = 'efectivo'`,
      [sesionCajaId]
    );

    return parseFloat(rows[0].total_efectivo as string);
  }

  /**
   * Calcular total general de TODAS las ventas (sin importar forma de pago)
   *
   * Query:
   * SELECT COALESCE(SUM(total), 0) AS total_ventas
   * FROM venta
   * WHERE sesion_caja_id = ?
   *   AND esta_activo = TRUE
   */
  async calcularTotalVentas(sesionCajaId: string): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(total), 0) AS total_ventas
       FROM venta
       WHERE sesion_caja_id = ?
         AND esta_activo = TRUE`,
      [sesionCajaId]
    );

    return parseFloat(rows[0].total_ventas as string);
  }

  /**
   * Contar total de ventas de una sesión
   *
   * Query:
   * SELECT COUNT(*) AS cantidad_ventas
   * FROM venta
   * WHERE sesion_caja_id = ?
   *   AND esta_activo = TRUE
   */
  async contarVentas(sesionCajaId: string): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS cantidad_ventas
       FROM venta
       WHERE sesion_caja_id = ?
         AND esta_activo = TRUE`,
      [sesionCajaId]
    );

    return rows[0].cantidad_ventas as number;
  }

  /**
   * Verificar si ya existen detalles de cierre para una sesión
   *
   * Query:
   * SELECT EXISTS(
   *   SELECT 1 FROM cierre_caja_detalle WHERE sesion_caja_id = ?
   * ) AS existe
   */
  async existenDetalles(sesionCajaId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT EXISTS(
         SELECT 1 FROM cierre_caja_detalle WHERE sesion_caja_id = ?
       ) AS existe`,
      [sesionCajaId]
    );

    return rows[0].existe === 1;
  }
}
