/**
 * Repository: Sesión de Caja
 *
 * Responsabilidad: Acceso a datos de sesion_caja
 * - Crear sesión (apertura)
 * - Cerrar sesión (cierre)
 * - Consultar sesión por ID
 * - Consultar sesión activa por sucursal
 * - Generar número de sesión
 *
 * REGLAS DE INMUTABILIDAD:
 * - NO se puede editar una sesión cerrada
 * - NO se puede borrar una sesión
 */

import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface de sesión de caja (row de DB)
 */
export interface SesionCajaRow extends RowDataPacket {
  id: string;
  numero_sesion: number;
  sucursal_id: string;
  empleado_apertura_id: string;
  empleado_cierre_id: string | null;
  fecha_apertura: Date;
  fecha_cierre: Date | null;
  monto_inicial: string; // DECIMAL viene como string
  monto_final_esperado: string | null;
  monto_final_real: string | null;
  diferencia: string | null;
  estado: 'abierta' | 'cerrada';
  notas_apertura: string | null;
  notas_cierre: string | null;
  cierre_inmutable_json: string | null; // JSON como string
  created_at: Date;
  updated_at: Date;
}

export class SesionCajaRepository {
  constructor(private db: Pool) {}

  /**
   * Verificar si existe una sesión abierta en la sucursal
   *
   * Query:
   * SELECT id FROM sesion_caja
   * WHERE sucursal_id = ? AND estado = 'abierta'
   * LIMIT 1
   */
  async existeSesionAbierta(sucursalId: string): Promise<string | null> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT id
       FROM sesion_caja
       WHERE sucursal_id = ? AND estado = 'abierta'
       LIMIT 1`,
      [sucursalId]
    );

    return rows.length > 0 ? (rows[0].id as string) : null;
  }

  /**
   * Generar próximo número de sesión para la sucursal
   *
   * Query:
   * SELECT COALESCE(MAX(numero_sesion), 0) + 1 AS next_numero
   * FROM sesion_caja
   * WHERE sucursal_id = ?
   * FOR UPDATE
   *
   * IMPORTANTE: Debe ejecutarse dentro de una transacción con FOR UPDATE
   */
  async generarProximoNumeroSesion(sucursalId: string): Promise<number> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT COALESCE(MAX(numero_sesion), 0) + 1 AS next_numero
       FROM sesion_caja
       WHERE sucursal_id = ?
       FOR UPDATE`,
      [sucursalId]
    );

    return rows[0].next_numero as number;
  }

  /**
   * Crear sesión de caja (apertura)
   *
   * Query:
   * INSERT INTO sesion_caja (
   *   id, numero_sesion, sucursal_id, empleado_apertura_id,
   *   fecha_apertura, monto_inicial, estado, notas_apertura
   * ) VALUES (?, ?, ?, ?, ?, ?, 'abierta', ?)
   */
  async crearSesion(datos: {
    sesionId: string;
    numeroSesion: number;
    sucursalId: string;
    empleadoAperturaId: string;
    fechaApertura: Date;
    montoInicial: number;
    notasApertura: string | null;
  }): Promise<void> {
    await this.db.execute<ResultSetHeader>(
      `INSERT INTO sesion_caja (
         id, numero_sesion, sucursal_id, empleado_apertura_id,
         fecha_apertura, monto_inicial, estado, notas_apertura
       ) VALUES (?, ?, ?, ?, ?, ?, 'abierta', ?)`,
      [
        datos.sesionId,
        datos.numeroSesion,
        datos.sucursalId,
        datos.empleadoAperturaId,
        datos.fechaApertura,
        datos.montoInicial,
        datos.notasApertura,
      ]
    );
  }

  /**
   * Obtener sesión por ID
   *
   * Query:
   * SELECT * FROM sesion_caja WHERE id = ?
   */
  async obtenerPorId(sesionId: string): Promise<SesionCajaRow | null> {
    const [rows] = await this.db.execute<SesionCajaRow[]>(
      `SELECT * FROM sesion_caja WHERE id = ?`,
      [sesionId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Obtener sesión activa por sucursal
   *
   * Query:
   * SELECT * FROM sesion_caja
   * WHERE sucursal_id = ? AND estado = 'abierta'
   * LIMIT 1
   */
  async obtenerSesionActiva(sucursalId: string): Promise<SesionCajaRow | null> {
    const [rows] = await this.db.execute<SesionCajaRow[]>(
      `SELECT * FROM sesion_caja
       WHERE sucursal_id = ? AND estado = 'abierta'
       LIMIT 1`,
      [sucursalId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Cerrar sesión de caja
   *
   * Query:
   * UPDATE sesion_caja SET
   *   estado = 'cerrada',
   *   empleado_cierre_id = ?,
   *   fecha_cierre = ?,
   *   monto_final_esperado = ?,
   *   monto_final_real = ?,
   *   diferencia = ?,
   *   notas_cierre = ?,
   *   cierre_inmutable_json = ?
   * WHERE id = ? AND estado = 'abierta'
   *
   * IMPORTANTE: WHERE con estado='abierta' evita cerrar dos veces
   */
  async cerrarSesion(datos: {
    sesionId: string;
    empleadoCierreId: string;
    fechaCierre: Date;
    montoFinalEsperado: number;
    montoFinalReal: number;
    diferencia: number;
    notasCierre: string | null;
    cierreInmutableJson: string; // JSON.stringify()
  }): Promise<boolean> {
    const [result] = await this.db.execute<ResultSetHeader>(
      `UPDATE sesion_caja SET
         estado = 'cerrada',
         empleado_cierre_id = ?,
         fecha_cierre = ?,
         monto_final_esperado = ?,
         monto_final_real = ?,
         diferencia = ?,
         notas_cierre = ?,
         cierre_inmutable_json = ?
       WHERE id = ? AND estado = 'abierta'`,
      [
        datos.empleadoCierreId,
        datos.fechaCierre,
        datos.montoFinalEsperado,
        datos.montoFinalReal,
        datos.diferencia,
        datos.notasCierre,
        datos.cierreInmutableJson,
        datos.sesionId,
      ]
    );

    // affectedRows = 0 significa que ya estaba cerrada o no existe
    return result.affectedRows > 0;
  }

  /**
   * Verificar si existe una sesión por ID
   *
   * Query:
   * SELECT EXISTS(SELECT 1 FROM sesion_caja WHERE id = ?) AS existe
   */
  async existeSesion(sesionId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT EXISTS(SELECT 1 FROM sesion_caja WHERE id = ?) AS existe`,
      [sesionId]
    );

    return rows[0].existe === 1;
  }

  /**
   * Verificar si una sesión está cerrada
   *
   * Query:
   * SELECT estado FROM sesion_caja WHERE id = ?
   */
  async estaCerrada(sesionId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT estado FROM sesion_caja WHERE id = ?`,
      [sesionId]
    );

    if (rows.length === 0) {
      return false; // No existe
    }

    return rows[0].estado === 'cerrada';
  }

  /**
   * Obtener monto inicial de la sesión
   *
   * Query:
   * SELECT monto_inicial FROM sesion_caja WHERE id = ?
   */
  async obtenerMontoInicial(sesionId: string): Promise<number | null> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT monto_inicial FROM sesion_caja WHERE id = ?`,
      [sesionId]
    );

    if (rows.length === 0) {
      return null;
    }

    return parseFloat(rows[0].monto_inicial as string);
  }
}
