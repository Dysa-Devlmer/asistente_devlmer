/**
 * Catálogo Repository - Bootstrap API v2.0
 *
 * Especificación: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 * SOLO SELECTs - No writes
 *
 * Reglas de Negocio:
 * - Paginación SOLO en productos
 * - Categorías, impuestos, formas_pago vienen completos siempre
 * - Solo productos activos (esta_activo = true)
 * - Ordenamiento productos: codigo ASC, nombre ASC
 */

import { ProductoDto, CategoriaDto, ImpuestoDto, FormaPagoDto } from '../dto/catalogo.dto';
import { PaginationMetaDto } from '../dto/pagination.dto';

export interface CatalogoData {
  productos: ProductoDto[];
  categorias: CategoriaDto[];
  impuestos: ImpuestoDto[];
  formas_pago: FormaPagoDto[];
  pagination: PaginationMetaDto;
}

export class CatalogoRepository {
  private db: any; // MySQL connection

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Obtener catálogo completo con paginación
   * Query SQL documentada según especificación
   */
  async getCatalogo(sucursalId: string, page: number, limit: number): Promise<CatalogoData> {
    // 1. Contar total de productos activos
    const [countResult] = await this.db.execute(
      `SELECT COUNT(*) as total
       FROM producto
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

    // 3. Obtener productos paginados (SOLO ACTIVOS)
    // Query SQL exacta:
    // SELECT id, codigo, codigo_barra, nombre, descripcion, categoria_id,
    //        precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida,
    //        impuesto_id, imagen_url, esta_activo, permite_venta_sin_stock,
    //        es_servicio, requiere_autorizacion, created_at, updated_at
    // FROM producto
    // WHERE sucursal_id = ? AND esta_activo = true
    // ORDER BY codigo ASC, nombre ASC
    // LIMIT ? OFFSET ?;
    const [productos] = await this.db.execute(
      `SELECT
        id, codigo, codigo_barra, nombre, descripcion, categoria_id,
        precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida,
        impuesto_id, imagen_url, esta_activo, permite_venta_sin_stock,
        es_servicio, requiere_autorizacion, created_at, updated_at
       FROM producto
       WHERE sucursal_id = ? AND esta_activo = true
       ORDER BY codigo ASC, nombre ASC
       LIMIT ? OFFSET ?`,
      [sucursalId, limit, offset]
    );

    // 4. Obtener categorías (TODAS las activas, sin paginación)
    // Query SQL exacta:
    // SELECT id, codigo, nombre, descripcion, categoria_padre_id, orden, esta_activa, created_at, updated_at
    // FROM categoria
    // WHERE sucursal_id = ? AND esta_activa = true
    // ORDER BY orden ASC, nombre ASC;
    const [categorias] = await this.db.execute(
      `SELECT
        id, codigo, nombre, descripcion, categoria_padre_id, orden, esta_activa,
        created_at, updated_at
       FROM categoria
       WHERE sucursal_id = ? AND esta_activa = true
       ORDER BY orden ASC, nombre ASC`,
      [sucursalId]
    );

    // 5. Obtener impuestos (TODOS los activos, sin paginación)
    // Query SQL exacta:
    // SELECT id, codigo, nombre, porcentaje, tipo, esta_activo, created_at, updated_at
    // FROM impuesto
    // WHERE esta_activo = true
    // ORDER BY codigo ASC;
    const [impuestos] = await this.db.execute(
      `SELECT
        id, codigo, nombre, porcentaje, tipo, esta_activo, created_at, updated_at
       FROM impuesto
       WHERE esta_activo = true
       ORDER BY codigo ASC`
    );

    // 6. Obtener formas de pago (TODAS las activas, sin paginación)
    // Query SQL exacta:
    // SELECT id, codigo, nombre, tipo, requiere_autorizacion, abre_cajon, esta_activa, created_at, updated_at
    // FROM forma_pago
    // WHERE esta_activa = true
    // ORDER BY codigo ASC;
    const [formasPago] = await this.db.execute(
      `SELECT
        id, codigo, nombre, tipo, requiere_autorizacion, abre_cajon, esta_activa,
        created_at, updated_at
       FROM forma_pago
       WHERE esta_activa = true
       ORDER BY codigo ASC`
    );

    return {
      productos: this.mapProductos(productos),
      categorias: this.mapCategorias(categorias),
      impuestos: this.mapImpuestos(impuestos),
      formas_pago: this.mapFormasPago(formasPago),
      pagination,
    };
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
  // MAPPERS (DB -> DTO)
  // ============================================================

  private mapProductos(rows: any[]): ProductoDto[] {
    return rows.map(row => ({
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
    }));
  }

  private mapCategorias(rows: any[]): CategoriaDto[] {
    return rows.map(row => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      categoria_padre_id: row.categoria_padre_id || null,
      orden: row.orden,
      esta_activa: Boolean(row.esta_activa),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    }));
  }

  private mapImpuestos(rows: any[]): ImpuestoDto[] {
    return rows.map(row => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      porcentaje: parseFloat(row.porcentaje),
      tipo: row.tipo,
      esta_activo: Boolean(row.esta_activo),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    }));
  }

  private mapFormasPago(rows: any[]): FormaPagoDto[] {
    return rows.map(row => ({
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo,
      requiere_autorizacion: Boolean(row.requiere_autorizacion),
      abre_cajon: Boolean(row.abre_cajon),
      esta_activa: Boolean(row.esta_activa),
      created_at: this.toISOString(row.created_at),
      updated_at: this.toISOString(row.updated_at),
    }));
  }

  private toISOString(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
  }
}
