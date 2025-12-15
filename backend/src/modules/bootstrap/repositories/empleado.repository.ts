/**
 * Empleado Repository - Bootstrap API v2.0
 *
 * Especificación: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 * SOLO SELECTs - No writes
 *
 * Reglas de Negocio:
 * - Solo empleados activos (esta_activo = true)
 * - Solo empleados de la sucursal especificada
 * - Ordenamiento: apellido ASC, nombre ASC
 * - EXCLUIR campos sensibles: password_hash, pin_hash, token_sesion
 */

import { EmpleadoDto } from '../dto/empleado.dto';
import { PaginationMetaDto } from '../dto/pagination.dto';

export interface EmpleadoData {
  empleados: EmpleadoDto[];
  pagination: PaginationMetaDto;
}

export class EmpleadoRepository {
  private db: any; // MySQL connection

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Obtener empleados con paginación
   * Query SQL documentada según especificación
   */
  async getEmpleados(sucursalId: string, page: number, limit: number): Promise<EmpleadoData> {
    // 1. Contar total de empleados activos de la sucursal
    const [countResult] = await this.db.execute(
      `SELECT COUNT(*) as total
       FROM empleado
       WHERE sucursal_id = ? AND esta_activo = true`,
      [sucursalId]
    );
    const totalItems = countResult[0].total;

    // 2. Calcular metadata de paginación
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const pagination: PaginationMetaDto = {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    // 3. Obtener empleados paginados
    // Query SQL exacta (SIN campos sensibles):
    // SELECT
    //   e.id, e.codigo, e.nombre, e.apellido,
    //   CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
    //   e.email, e.telefono, e.rol_id, r.nombre as rol_nombre,
    //   e.sucursal_id, e.esta_activo,
    //   e.puede_abrir_caja, e.puede_hacer_devoluciones,
    //   e.puede_aplicar_descuentos, e.descuento_maximo_porcentaje,
    //   e.requiere_autorizacion_supervisor,
    //   e.created_at, e.updated_at
    // FROM empleado e
    // INNER JOIN rol r ON e.rol_id = r.id
    // WHERE e.sucursal_id = ? AND e.esta_activo = true
    // ORDER BY e.apellido ASC, e.nombre ASC
    // LIMIT ? OFFSET ?;
    const [empleados] = await this.db.execute(
      `SELECT
        e.id, e.codigo, e.nombre, e.apellido,
        CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
        e.email, e.telefono, e.rol_id, r.nombre as rol_nombre,
        e.sucursal_id, e.esta_activo,
        e.puede_abrir_caja, e.puede_hacer_devoluciones,
        e.puede_aplicar_descuentos, e.descuento_maximo_porcentaje,
        e.requiere_autorizacion_supervisor,
        e.created_at, e.updated_at
       FROM empleado e
       INNER JOIN rol r ON e.rol_id = r.id
       WHERE e.sucursal_id = ? AND e.esta_activo = true
       ORDER BY e.apellido ASC, e.nombre ASC
       LIMIT ? OFFSET ?`,
      [sucursalId, limit, offset]
    );

    // 4. Para cada empleado, obtener sus permisos
    const empleadosConPermisos = await Promise.all(
      empleados.map(async (empleado: any) => {
        const permisos = await this.getPermisosEmpleado(empleado.id);
        return this.mapEmpleado(empleado, permisos);
      })
    );

    return {
      empleados: empleadosConPermisos,
      pagination,
    };
  }

  /**
   * Obtener permisos de un empleado
   * Query SQL exacta:
   * SELECT p.codigo
   * FROM permiso p
   * INNER JOIN rol_permiso rp ON p.id = rp.permiso_id
   * WHERE rp.rol_id = ?
   * ORDER BY p.codigo ASC;
   */
  private async getPermisosEmpleado(empleadoId: string): Promise<string[]> {
    // Primero obtenemos el rol_id del empleado
    const [empleado] = await this.db.execute(
      `SELECT rol_id FROM empleado WHERE id = ?`,
      [empleadoId]
    );

    if (empleado.length === 0) {
      return [];
    }

    const rolId = empleado[0].rol_id;

    // Luego obtenemos los permisos del rol
    const [permisos] = await this.db.execute(
      `SELECT p.codigo
       FROM permiso p
       INNER JOIN rol_permiso rp ON p.id = rp.permiso_id
       WHERE rp.rol_id = ?
       ORDER BY p.codigo ASC`,
      [rolId]
    );

    return permisos.map((p: any) => p.codigo);
  }

  /**
   * Verificar que sucursal existe y está activa
   */
  async sucursalExists(sucursalId: string): Promise<boolean> {
    const [result] = await this.db.execute(
      `SELECT id FROM sucursal WHERE id = ? AND esta_activa = true LIMIT 1`,
      [sucursalId]
    );
    return result.length > 0;
  }

  // ============================================================
  // MAPPER (DB -> DTO)
  // ============================================================

  private mapEmpleado(row: any, permisos: string[]): EmpleadoDto {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      apellido: row.apellido,
      nombre_completo: row.nombre_completo,
      email: row.email,
      telefono: row.telefono,
      rol_id: row.rol_id,
      rol_nombre: row.rol_nombre,
      sucursal_id: row.sucursal_id,
      esta_activo: Boolean(row.esta_activo),
      puede_abrir_caja: Boolean(row.puede_abrir_caja),
      puede_hacer_devoluciones: Boolean(row.puede_hacer_devoluciones),
      puede_aplicar_descuentos: Boolean(row.puede_aplicar_descuentos),
      descuento_maximo_porcentaje: parseFloat(row.descuento_maximo_porcentaje),
      requiere_autorizacion_supervisor: Boolean(row.requiere_autorizacion_supervisor),
      permisos,
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    };
  }

  private toISOString(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
  }
}
