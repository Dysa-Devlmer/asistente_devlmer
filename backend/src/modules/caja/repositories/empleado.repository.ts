/**
 * Repository: Empleado (para Caja)
 *
 * Responsabilidad: Verificar existencia y obtener datos básicos de empleados
 * - Verificar si existe empleado
 * - Obtener datos básicos (nombre, apellido)
 * - Verificar permisos (futuro)
 */

import { Pool, RowDataPacket } from 'mysql2/promise';

/**
 * Interface de empleado (row de DB - solo campos necesarios)
 */
export interface EmpleadoRow extends RowDataPacket {
  id: string;
  nombre: string;
  apellido: string | null;
  esta_activo: number; // BOOLEAN viene como 0 o 1
}

export class EmpleadoRepository {
  constructor(private db: Pool) {}

  /**
   * Verificar si existe un empleado por ID
   *
   * Query:
   * SELECT EXISTS(
   *   SELECT 1 FROM empleado WHERE id = ? AND esta_activo = TRUE
   * ) AS existe
   */
  async existeEmpleado(empleadoId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT EXISTS(
         SELECT 1 FROM empleado WHERE id = ? AND esta_activo = TRUE
       ) AS existe`,
      [empleadoId]
    );

    return rows[0].existe === 1;
  }

  /**
   * Obtener datos básicos de un empleado
   *
   * Query:
   * SELECT id, nombre, apellido, esta_activo
   * FROM empleado
   * WHERE id = ?
   */
  async obtenerPorId(empleadoId: string): Promise<EmpleadoRow | null> {
    const [rows] = await this.db.execute<EmpleadoRow[]>(
      `SELECT id, nombre, apellido, esta_activo
       FROM empleado
       WHERE id = ?`,
      [empleadoId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Verificar si un empleado tiene un permiso específico
   *
   * Query:
   * SELECT EXISTS(
   *   SELECT 1
   *   FROM empleado_rol er
   *   INNER JOIN rol_permiso rp ON er.rol_id = rp.rol_id
   *   INNER JOIN permiso p ON rp.permiso_id = p.id
   *   WHERE er.empleado_id = ?
   *     AND p.codigo = ?
   *     AND er.esta_activo = TRUE
   * ) AS tiene_permiso
   *
   * IMPORTANTE: Asume que existe la tabla rol_permiso y permiso.codigo
   */
  async tienePermiso(empleadoId: string, codigoPermiso: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT EXISTS(
         SELECT 1
         FROM empleado_rol er
         INNER JOIN rol_permiso rp ON er.rol_id = rp.rol_id
         INNER JOIN permiso p ON rp.permiso_id = p.id
         WHERE er.empleado_id = ?
           AND p.codigo = ?
           AND er.esta_activo = TRUE
       ) AS tiene_permiso`,
      [empleadoId, codigoPermiso]
    );

    return rows[0].tiene_permiso === 1;
  }

  /**
   * Verificar si existe sucursal (para validación)
   *
   * Query:
   * SELECT EXISTS(
   *   SELECT 1 FROM sucursal WHERE id = ? AND esta_activo = TRUE
   * ) AS existe
   */
  async existeSucursal(sucursalId: string): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `SELECT EXISTS(
         SELECT 1 FROM sucursal WHERE id = ? AND esta_activo = TRUE
       ) AS existe`,
      [sucursalId]
    );

    return rows[0].existe === 1;
  }
}
