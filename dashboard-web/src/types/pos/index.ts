/**
 * POS Domain Types
 * Based on SYSME_MISTURA legacy system
 * Aligned with PostgreSQL schema
 */

// ============================================
// EMPLOYEE / CAMARERO
// ============================================

export interface Employee {
  id_camarero: string;
  nombre: string;
  password?: string;
  activo: boolean;
  imagen?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EmployeeSession {
  id_camarero: string;
  nombre: string;
  id_caja: number;
  id_almacen: string;
  almacen: string;
  tpv: string;
  idioma: string;
  moneda: string;
}

// ============================================
// TABLE / MESA
// ============================================

export interface Table {
  id_mesa?: number;
  Num_Mesa: string;
  descripcion: string;
  id_salon: string;
  id_tarifa?: number;
  estado: 'libre' | 'ocupada' | 'reservada';

  // Positioning for visual map
  top: number;
  izq: number;  // left
  width: number;
  height: number;

  // Relations
  tarifa?: Rate;
  venta_activa?: Sale;
}

export interface TableMapConfig {
  anchotpv: number;  // Base width for scaling
  altotpv: number;   // Base height for scaling
}

// ============================================
// RATE / TARIFA
// ============================================

export interface Rate {
  id_tarifa: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface ProductRate {
  id_complementog: string;
  id_tarifa: number;
  pvptarifa: number;
}

// ============================================
// CATEGORY / CATEGORIA
// ============================================

export interface Category {
  id_categoria: number;
  des_categoria: string;
  imagen?: string;
  orden?: number;
  activo: boolean;
  subcategorias?: SubCategory[];
}

export interface SubCategory {
  id_subcategoria: number;
  id_categoria: number;
  des_subcategoria: string;
  imagen?: string;
  orden?: number;
  activo: boolean;
}

// ============================================
// PRODUCT / COMPLEMENTOG
// ============================================

export interface Product {
  id_complementog: string;
  des_complementog: string;
  pvp: number;
  avgiva: number;
  id_categoria?: number;
  id_subcategoria?: number;
  imagen?: string;
  activo: boolean;
  stock?: number;
  es_combo?: boolean;

  // For display
  categoria?: string;
  subcategoria?: string;
  precio_con_iva?: number;
}

// ============================================
// SALE / VENTADIRECTA
// ============================================

export interface Sale {
  id_venta: number;
  Num_Mesa: string;
  id_camarero: string;
  id_caja: number;
  cerrada: 'S' | 'N';
  tarifa: string;
  fecha_venta: Date;
  fecha_cierre?: Date;
  total?: number;
  forma_pago?: 'efectivo' | 'tarjeta' | 'mixto';
  importe_pagado?: number;
  observaciones?: string;

  // Relations
  mesa?: Table;
  camarero?: Employee;
  lineas?: SaleLine[];

  // Computed
  subtotal?: number;
  total_iva?: number;
  num_items?: number;
}

export interface SaleLine {
  id_linea: number;
  id_venta: number;
  id_complementog: string;
  cantidad: number;
  precio: number;      // Sin IVA
  total: number;       // Con IVA
  avgiva: number;
  servido: 'S' | 'N';
  observaciones?: string;
  fecha_hora?: Date;

  // Relations
  producto?: Product;

  // Computed
  iva_calculado?: number;
}

// ============================================
// SALE OPERATIONS
// ============================================

export interface CreateSaleRequest {
  Num_Mesa: string;
  id_camarero: string;
  id_caja: number;
  observaciones?: string;
}

export interface CreateSaleResponse {
  id_venta: number;
  tarifa: string;
  mesa: Table;
}

export interface AddSaleLineRequest {
  id_complementog: string;
  cantidad: number;
  observaciones?: string;
}

export interface AddSaleLineResponse {
  id_linea: number;
  precio: number;
  total: number;
  venta: Sale;  // Venta actualizada con totales
}

export interface UpdateSaleLineRequest {
  cantidad?: number;
  observaciones?: string;
  servido?: 'S' | 'N';
}

export interface FinalizeSaleRequest {
  forma_pago: 'efectivo' | 'tarjeta' | 'mixto';
  importe_pagado: number;
  importe_efectivo?: number;  // Para pago mixto
  importe_tarjeta?: number;   // Para pago mixto
}

export interface FinalizeSaleResponse {
  id_venta: number;
  total: number;
  cambio: number;
  ticket_url?: string;
}

export interface ChangeSaleTableRequest {
  nueva_mesa: string;
}

export interface ChangeSaleRateRequest {
  id_tarifa: number | 'default';
}

// ============================================
// KITCHEN PANEL
// ============================================

export interface KitchenOrder {
  id_venta: number;
  Num_Mesa: string;
  id_camarero: string;
  nombre_camarero: string;
  fecha_venta: Date;
  lineas_pendientes: KitchenOrderLine[];
  total_pendiente: number;
}

export interface KitchenOrderLine {
  id_linea: number;
  id_venta: number;
  id_complementog: string;
  des_producto: string;
  cantidad: number;
  observaciones?: string;
  fecha_hora: Date;
  tiempo_espera_minutos: number;
}

// ============================================
// WEBSOCKET EVENTS
// ============================================

export interface WSTableUpdate {
  type: 'table_update';
  payload: {
    Num_Mesa: string;
    estado: 'libre' | 'ocupada' | 'reservada';
    id_venta?: number;
  };
}

export interface WSKitchenUpdate {
  type: 'kitchen_update';
  payload: {
    id_venta: number;
    action: 'new_order' | 'item_served' | 'order_closed';
    linea?: KitchenOrderLine;
  };
}

export interface WSSaleUpdate {
  type: 'sale_update';
  payload: {
    id_venta: number;
    action: 'line_added' | 'line_updated' | 'line_deleted' | 'sale_finalized';
    venta: Sale;
  };
}

export type WSEvent = WSTableUpdate | WSKitchenUpdate | WSSaleUpdate;

// ============================================
// UI STATE
// ============================================

export interface POSNavigationState {
  current_view: 'tables' | 'sale' | 'kitchen' | 'menu';
  current_sale?: number;
  current_table?: string;
  current_category?: number;
  current_subcategory?: number;
}

export interface CartItem extends SaleLine {
  temp_id?: string;  // Para items no guardados aún
  is_new?: boolean;
  is_modified?: boolean;
}

// ============================================
// API RESPONSES
// ============================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// FILTERS & QUERIES
// ============================================

export interface TableFilters {
  id_salon?: string;
  estado?: 'libre' | 'ocupada' | 'reservada';
}

export interface SaleFilters {
  cerrada?: 'S' | 'N';
  id_camarero?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  Num_Mesa?: string;
}

export interface ProductFilters {
  id_categoria?: number;
  id_subcategoria?: number;
  activo?: boolean;
  search?: string;
}
