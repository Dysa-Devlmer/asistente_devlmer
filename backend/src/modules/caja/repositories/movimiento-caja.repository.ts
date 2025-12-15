/**
 * Repository: Movimiento de Caja
 *
 * Responsabilidad: Acceso a datos de movimiento_caja
 * - Crear movimiento (ingreso/egreso)
 * - Consultar movimientos de una sesión
 * - Anular movimiento (soft-delete)
 * - Calcular totales de movimientos
 *
 * REGLAS:
 * - NO se pueden borrar físicamente
 * - Soft-delete con esta_activo = false
 */

import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

/**
 * Interface de movimiento de caja (row de DB)
 */
export interface MovimientoCajaRow extends RowDataPacket {
  id: string;
  sesion_caja_id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: string; // DECIMAL viene como string
  empleado_id: string;
  fecha: Date;
  notas: string | null;
  esta_activo: number; // BOOLEAN viene como 0 o 1
  created_at: Date;
  updated_at: Date;
}

export class MovimientoCajaRepository {
  constructor(private db: Pool) {}

  /**
   * Crear movimiento de caja
   *
   * Query:
   * INSERT INTO movimiento_caja (
   *   id, sesion_caja_id, tipo, concepto, monto,
   *   empleado_id, fecha, notas, esta_activo
   * ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
   */
  async crearMovimiento(datos: {
    movimientoId: string;
    sesionCajaId: string;
    tipo: 'ingreso' | 'egreso';
    concepto: string;
    monto: number;
    empleadoId: string;
    fecha: Date;
    notas: string | null;
  }): Promise<void> {
    await this.db.execute<ResultSetHeader>(
      `INSERT INTO movimiento_caja (
         id, sesion_caja_id, tipo, concepto, monto,
         empleado_id, fecha, notas, esta_activo
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        datos.movimientoId,
        datos.sesionCajaId,
        datos.tipo,
        datos.concepto,
        datos.monto,
        datos.empleadoId,
        datos.fecha,
        datos.notas,
      ]
    );
  }

  /**
   * Obtener movimiento por ID
   *
   * Query:
   * SELECT * FROM movimiento_caja WHERE id = ?
   */
  async obtenerPorId(movimientoId: string): Promise<MovimientoCajaRow | null> {
    const [rows] = await this.db.execute<MovimientoCajaRow[]>(
      `SELECT * FROM movimiento_caja WHERE id = ?`,
      [movimientoId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Obtener movimientos activos de una sesión
   *
   * Query:
   * SELECT * FROM movimiento_caja
   * WHERE sesion_caja_id = ? AND esta_activo = TRUE
   * ORDER BY fecha ASC
   */
  async obtenerMovimientosPorSesion(sesionCajaId: string): Promise<MovimientoCajaRow[]> {
    const [rows] = await this.db.execute<MovimientoCajaRow[]>(
      `SELECT * FROM movimiento_caja
       WHERE sesion_caja_id = ? AND esta_activo = TRUE
       ORDER BY fecha ASC`,
      [sesionCajaId]
    );

    return rows;
  }

  /**
   * Obtener TODOS los movimientos de una sesión (incluso anulados)
   *
   * Query:
   * SELECT * FROM movimiento_caja
   * WHERE sesion_caja_id = ?
   * ORDER BY fecha ASC, esta_activo DESC
   */
  async obtenerTodosMovimientosPorSesion(sesionCajaId: string): Promise<MovimientoCajaRow[]> {
    const [rows] = await this.db.execute<MovimientoCajaRow[]>(
      `SELECT * FROM movimiento_caja
       WHERE sesion_caja_id = ?
       ORDER BY fecha ASC, esta_activo DESC`,
      [sesionCajaId]
    );

    return rows;
  }

  /**
   * Anular movimiento (soft-delete)
   *
   * Query:
   * UPDATE movimiento_caja
   * SET esta_activo = FALSE
   * WHERE id = ? AND esta_activo = TRUE
   *
   * IMPORTANTE: WHERE con esta_activo=TRUE evita anular dos veces
   */
  async anularMovimiento(movimientoId: string): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE movimiento_caja
       SET esta_activo = FALSE
       WHERE id = ? AND esta_activo = TRUE`,
      [movimientoId]
    );

    // affectedRows = 0 significa que ya estaba anulado o no existe
    return result.affectedRows > 0;
  }

  /**
   * Calcular total de ingresos activos de una sesión
   *
   * Query:
   * SELECT COALESCE(SUM(monto), 0) AS total
   * FROM movimiento_caja
   * WHERE sesion_caja_id = ?
   *   AND tipo = 'ingreso'
   *   AND esta_activo = TRUE
   */
  async calcularTotalIngresos(sesionCajaId: string): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(monto), 0) AS total
       FROM movimiento_caja
       WHERE sesion_caja_id = ?
         AND tipo = 'ingreso'
         AND esta_activo = TRUE`,
      [sesionCajaId]
    );

    return parseFloat(rows[0].total as string);
  }

  /**
   * Calcular total de egresos activos de una sesión
   *
   * Query:
   * SELECT COALESCE(SUM(monto), 0) AS total
   * FROM movimiento_caja
   * WHERE sesion_caja_id = ?
   *   AND tipo = 'egreso'
   *   AND esta_activo = TRUE
   */
  async calcularTotalEgresos(sesionCajaId: string): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(monto), 0) AS total
       FROM movimiento_caja
       WHERE sesion_caja_id = ?
         AND tipo = 'egreso'
         AND esta_activo = TRUE`,
      [sesionCajaId]
    );

    return parseFloat(rows[0].total as string);
  }

  /**
   * Verificar si existe un movimiento por ID
   *
   * Query:
   * SELECT EXISTS(SELECT 1 FROM movimiento_caja WHERE id = ?) AS existe
   */
  async existeMovimiento(movimientoId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT EXISTS(SELECT 1 FROM movimiento_caja WHERE id = ?) AS existe`,
      [movimientoId]
    );

    return rows[0].existe === 1;
  }

  /**
   * Verificar si un movimiento está activo
   *
   * Query:
   * SELECT esta_activo FROM movimiento_caja WHERE id = ?
   */
  async estaActivo(movimientoId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT esta_activo FROM movimiento_caja WHERE id = ?`,
      [movimientoId]
    );

    if (rows.length === 0) {
      return false; // No existe
    }

    return rows[0].esta_activo === 1;
  }
}
