/**
 * Delta Repository - Bootstrap API v2.0
 *
 * Especificación: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 * SOLO SELECTs - No writes
 *
 * Reglas de Negocio:
 * - Retorna cambios donde updated_at > since
 * - Soft-deletes: op="delete" + esta_activo=false
 * - Hard-deletes: No se rastrean
 * - Ordenamiento: changed_at ASC (más antiguos primero)
 * - Sin paginación
 * - Si since es futuro, retorna array vacío
 */

import { DeltaChangeDto, DeltaOperation, DeltaEntity } from '../dto/delta.dto';

export interface DeltaData {
  sucursal_id: string;
  since: string;
  until: string;
  total_changes: number;
  changes: DeltaChangeDto[];
}

export class DeltaRepository {
  private db: any; // MySQL connection

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Obtener cambios incrementales desde timestamp
   */
  async getChanges(sucursalId: string, since: Date): Promise<DeltaData> {
    const until = new Date();
    const changes: DeltaChangeDto[] = [];

    // 1. Cambios en PRODUCTOS
    const productChanges = await this.getProductChanges(sucursalId, since);
    changes.push(...productChanges);

    // 2. Cambios en EMPLEADOS
    const empleadoChanges = await this.getEmpleadoChanges(sucursalId, since);
    changes.push(...empleadoChanges);

    // 3. Cambios en CATEGORIAS
    const categoriaChanges = await this.getCategoriaChanges(sucursalId, since);
    changes.push(...categoriaChanges);

    // 4. Cambios en IMPUESTOS
    const impuestoChanges = await this.getImpuestoChanges(since);
    changes.push(...impuestoChanges);

    // 5. Cambios en FORMAS DE PAGO
    const formaPagoChanges = await this.getFormaPagoChanges(since);
    changes.push(...formaPagoChanges);

    // 6. Ordenar por changed_at ASC
    changes.sort((a, b) => {
      return new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime();
    });

    return {
      sucursal_id: sucursalId,
      since: since.toISOString(),
      until: until.toISOString(),
      total_changes: changes.length,
      changes,
    };
  }

  // ============================================================
  // CAMBIOS POR ENTIDAD
  // ============================================================

  /**
   * Detectar cambios en PRODUCTOS
   *
   * Query SQL para INSERTS:
   * SELECT * FROM producto
   * WHERE sucursal_id = ? AND created_at > ? AND created_at = updated_at;
   *
   * Query SQL para UPDATES:
   * SELECT * FROM producto
   * WHERE sucursal_id = ? AND updated_at > ? AND created_at < updated_at AND esta_activo = true;
   *
   * Query SQL para DELETES (soft):
   * SELECT id, codigo, esta_activo, updated_at FROM producto
   * WHERE sucursal_id = ? AND updated_at > ? AND esta_activo = false;
   */
  private async getProductChanges(sucursalId: string, since: Date): Promise<DeltaChangeDto[]> {
    const changes: DeltaChangeDto[] = [];

    // INSERTS (created_at > since AND created_at = updated_at)
    const [inserts] = await this.db.execute(
      `SELECT * FROM producto
       WHERE sucursal_id = ? AND created_at > ? AND created_at = updated_at
       ORDER BY created_at ASC`,
      [sucursalId, since]
    );

    for (const row of inserts) {
      changes.push({
        op: DeltaOperation.INSERT,
        entity: DeltaEntity.PRODUCTO,
        id: row.id,
        changed_at: this.toISOString(row.created_at),
        payload: this.mapProductoPayload(row),
      });
    }

    // UPDATES (updated_at > since AND created_at < updated_at AND esta_activo = true)
    const [updates] = await this.db.execute(
      `SELECT * FROM producto
       WHERE sucursal_id = ? AND updated_at > ? AND created_at < updated_at AND esta_activo = true
       ORDER BY updated_at ASC`,
      [sucursalId, since]
    );

    for (const row of updates) {
      changes.push({
        op: DeltaOperation.UPDATE,
        entity: DeltaEntity.PRODUCTO,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: this.mapProductoPayload(row),
      });
    }

    // DELETES (soft-delete: updated_at > since AND esta_activo = false)
    const [deletes] = await this.db.execute(
      `SELECT id, codigo, esta_activo, updated_at FROM producto
       WHERE sucursal_id = ? AND updated_at > ? AND esta_activo = false
       ORDER BY updated_at ASC`,
      [sucursalId, since]
    );

    for (const row of deletes) {
      changes.push({
        op: DeltaOperation.DELETE,
        entity: DeltaEntity.PRODUCTO,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: {
          id: row.id,
          codigo: row.codigo,
          esta_activo: false,
          updated_at: this.toISOString(row.updated_at),
        },
      });
    }

    return changes;
  }

  /**
   * Detectar cambios en EMPLEADOS
   */
  private async getEmpleadoChanges(sucursalId: string, since: Date): Promise<DeltaChangeDto[]> {
    const changes: DeltaChangeDto[] = [];

    // INSERTS
    const [inserts] = await this.db.execute(
      `SELECT e.*, r.nombre as rol_nombre FROM empleado e
       INNER JOIN rol r ON e.rol_id = r.id
       WHERE e.sucursal_id = ? AND e.created_at > ? AND e.created_at = e.updated_at
       ORDER BY e.created_at ASC`,
      [sucursalId, since]
    );

    for (const row of inserts) {
      changes.push({
        op: DeltaOperation.INSERT,
        entity: DeltaEntity.EMPLEADO,
        id: row.id,
        changed_at: this.toISOString(row.created_at),
        payload: await this.mapEmpleadoPayload(row),
      });
    }

    // UPDATES
    const [updates] = await this.db.execute(
      `SELECT e.*, r.nombre as rol_nombre FROM empleado e
       INNER JOIN rol r ON e.rol_id = r.id
       WHERE e.sucursal_id = ? AND e.updated_at > ? AND e.created_at < e.updated_at AND e.esta_activo = true
       ORDER BY e.updated_at ASC`,
      [sucursalId, since]
    );

    for (const row of updates) {
      changes.push({
        op: DeltaOperation.UPDATE,
        entity: DeltaEntity.EMPLEADO,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: await this.mapEmpleadoPayload(row),
      });
    }

    // DELETES
    const [deletes] = await this.db.execute(
      `SELECT id, codigo, esta_activo, updated_at FROM empleado
       WHERE sucursal_id = ? AND updated_at > ? AND esta_activo = false
       ORDER BY updated_at ASC`,
      [sucursalId, since]
    );

    for (const row of deletes) {
      changes.push({
        op: DeltaOperation.DELETE,
        entity: DeltaEntity.EMPLEADO,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: {
          id: row.id,
          codigo: row.codigo,
          esta_activo: false,
          updated_at: this.toISOString(row.updated_at),
        },
      });
    }

    return changes;
  }

  /**
   * Detectar cambios en CATEGORIAS
   */
  private async getCategoriaChanges(sucursalId: string, since: Date): Promise<DeltaChangeDto[]> {
    const changes: DeltaChangeDto[] = [];

    // INSERTS + UPDATES + DELETES (misma lógica que productos)
    const [inserts] = await this.db.execute(
      `SELECT * FROM categoria WHERE sucursal_id = ? AND created_at > ? AND created_at = updated_at ORDER BY created_at ASC`,
      [sucursalId, since]
    );
    inserts.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.INSERT,
        entity: DeltaEntity.CATEGORIA,
        id: row.id,
        changed_at: this.toISOString(row.created_at),
        payload: this.mapCategoriaPayload(row),
      });
    });

    const [updates] = await this.db.execute(
      `SELECT * FROM categoria WHERE sucursal_id = ? AND updated_at > ? AND created_at < updated_at AND esta_activa = true ORDER BY updated_at ASC`,
      [sucursalId, since]
    );
    updates.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.UPDATE,
        entity: DeltaEntity.CATEGORIA,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: this.mapCategoriaPayload(row),
      });
    });

    const [deletes] = await this.db.execute(
      `SELECT id, codigo, esta_activa, updated_at FROM categoria WHERE sucursal_id = ? AND updated_at > ? AND esta_activa = false ORDER BY updated_at ASC`,
      [sucursalId, since]
    );
    deletes.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.DELETE,
        entity: DeltaEntity.CATEGORIA,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: {
          id: row.id,
          codigo: row.codigo,
          esta_activa: false,
          updated_at: this.toISOString(row.updated_at),
        },
      });
    });

    return changes;
  }

  /**
   * Detectar cambios en IMPUESTOS (sin filtro de sucursal)
   */
  private async getImpuestoChanges(since: Date): Promise<DeltaChangeDto[]> {
    const changes: DeltaChangeDto[] = [];

    const [inserts] = await this.db.execute(
      `SELECT * FROM impuesto WHERE created_at > ? AND created_at = updated_at ORDER BY created_at ASC`,
      [since]
    );
    inserts.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.INSERT,
        entity: DeltaEntity.IMPUESTO,
        id: row.id,
        changed_at: this.toISOString(row.created_at),
        payload: this.mapImpuestoPayload(row),
      });
    });

    const [updates] = await this.db.execute(
      `SELECT * FROM impuesto WHERE updated_at > ? AND created_at < updated_at AND esta_activo = true ORDER BY updated_at ASC`,
      [since]
    );
    updates.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.UPDATE,
        entity: DeltaEntity.IMPUESTO,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: this.mapImpuestoPayload(row),
      });
    });

    return changes;
  }

  /**
   * Detectar cambios en FORMAS DE PAGO (sin filtro de sucursal)
   */
  private async getFormaPagoChanges(since: Date): Promise<DeltaChangeDto[]> {
    const changes: DeltaChangeDto[] = [];

    const [inserts] = await this.db.execute(
      `SELECT * FROM forma_pago WHERE created_at > ? AND created_at = updated_at ORDER BY created_at ASC`,
      [since]
    );
    inserts.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.INSERT,
        entity: DeltaEntity.FORMA_PAGO,
        id: row.id,
        changed_at: this.toISOString(row.created_at),
        payload: this.mapFormaPagoPayload(row),
      });
    });

    const [updates] = await this.db.execute(
      `SELECT * FROM forma_pago WHERE updated_at > ? AND created_at < updated_at AND esta_activa = true ORDER BY updated_at ASC`,
      [since]
    );
    updates.forEach((row: any) => {
      changes.push({
        op: DeltaOperation.UPDATE,
        entity: DeltaEntity.FORMA_PAGO,
        id: row.id,
        changed_at: this.toISOString(row.updated_at),
        payload: this.mapFormaPagoPayload(row),
      });
    });

    return changes;
  }

  // ============================================================
  // MAPPERS (DB -> Payload)
  // ============================================================

  private mapProductoPayload(row: any): any {
    return {
      id: row.id,
      codigo: row.codigo,
      codigo_barra: row.codigo_barra,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria_id: row.categoria_id,
      precio_venta: parseFloat(row.precio_venta),
      precio_compra: row.precio_compra ? parseFloat(row.precio_compra) : undefined,
      stock_actual: parseFloat(row.stock_actual),
      stock_minimo: parseFloat(row.stock_minimo),
      unidad_medida: row.unidad_medida,
      impuesto_id: row.impuesto_id,
      imagen_url: row.imagen_url,
      esta_activo: Boolean(row.esta_activo),
      permite_venta_sin_stock: Boolean(row.permite_venta_sin_stock),
      es_servicio: Boolean(row.es_servicio),
      requiere_autorizacion: Boolean(row.requiere_autorizacion),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    };
  }

  private async mapEmpleadoPayload(row: any): Promise<any> {
    const permisos = await this.getPermisosEmpleado(row.rol_id);

    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      apellido: row.apellido,
      nombre_completo: `${row.nombre} ${row.apellido}`,
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

  private mapCategoriaPayload(row: any): any {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria_padre_id: row.categoria_padre_id || null,
      orden: row.orden,
      esta_activa: Boolean(row.esta_activa),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    };
  }

  private mapImpuestoPayload(row: any): any {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      porcentaje: parseFloat(row.porcentaje),
      tipo: row.tipo,
      esta_activo: Boolean(row.esta_activo),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    };
  }

  private mapFormaPagoPayload(row: any): any {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      requiere_autorizacion: Boolean(row.requiere_autorizacion),
      abre_cajon: Boolean(row.abre_cajon),
      esta_activa: Boolean(row.esta_activa),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    };
  }

  private async getPermisosEmpleado(rolId: string): Promise<string[]> {
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

  private toISOString(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
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
}
