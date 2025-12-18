/**
 * TypeScript types for Legacy MySQL Database Schema
 */

// Legacy: salon table
export interface LegacySalon {
  id_salon: number;
  nombre: string | null;
  // NOTE: 'activo' no existe en schema real - removido
}

// Legacy: tipo_comg table (categories)
export interface LegacyTipoComg {
  id_tipo_comg: number;
  nombre: string | null; // Mapped from 'tipo_comg' column
  // NOTE: 'activo' no existe en schema real
}

// Legacy: tarifa table (price tiers)
export interface LegacyTarifa {
  id_tarifa: number | string; // varchar(4) PK
  nombre: string | null;
  // NOTE: 'porcentaje' no existe en schema real
  // Schema real: id_tarifa, nombre, horacomienzo, autoreduce
}

// Legacy: modo_pago table (payment methods)
export interface LegacyModoPago {
  id_modo_pago: string; // char(2) PK
  nombre: string | null; // Mapped from 'modo_pago' column
  activo: string; // char(1) 'Y'/'N'
  defecto: string | null; // char(1) 'Y'/'N'
  // NOTE: Campo real es 'modo_pago' no 'nombre'
}

// Legacy: cajas table (cash registers)
export interface LegacyCaja {
  id_caja: number;
  nombre: string | null; // Mapped from 'Nombre' column (capital N)
  // NOTE: 'activo' no existe en schema real
  // Schema real: id_caja, Nombre, Descripcion
}

// Legacy: camareros table (employees)
export interface LegacyCamarero {
  id_camarero: number;
  nombre: string | null; // Full name (split required)
  activo: string; // char(1) 'S'/'N'
  // NOTE: 'tipo' no existe en schema real
  // Sistema legacy usa permisos granulares (30 campos), no roles simples
}

// Legacy: cliente table (customers)
export interface LegacyCliente {
  id_cliente: string; // Mapped from 'dni' (varchar PK)
  nombre: string | null;
  ruc: string | null; // Mapped from 'dni'
  direccion: string | null;
  telefono: string | null; // Mapped from 'tf1'
  email: string | null; // Mapped from 'email1'
  // NOTE: Schema real usa 'dni' como PK, no 'id_cliente'
}

// Legacy: complementog table (products)
export interface LegacyComplementog {
  id_complementog: string; // varchar(5) PK
  nombre: string | null; // Mapped from 'complementog' column
  id_tipo_comg: string | null; // varchar(4) FK to tipo_comg
  precio: number | null; // float(12,6)
  // NOTE: Campos 'stock' y 'activo' NO existen en schema real
  // Schema real: 66 campos, PK compuesto (id_empresa, id_centro, id_tipo_comg, id_complementog)
}

// Legacy: comg_tarifa table (product prices)
export interface LegacyComgTarifa {
  id_complementog: string; // varchar(5) FK
  id_tarifa: string; // varchar(4) FK
  precio: number | null; // Mapped from 'pvptarifa' (float)
  // NOTE: NO existe 'id_comg_tarifa', PK compuesto (5 campos)
}

// Legacy: mesa table (tables)
export interface LegacyMesa {
  num_mesa: string; // Mapped from 'Num_Mesa' (char(3) PK con mayúsculas)
  estado: string | null; // Mapped from 'Disponible' (char 'S'/'N')
  id_salon: string | null; // char(2) FK to salon
  // NOTE: NO existe 'id_mesa', PK es 'Num_Mesa'
}

// Legacy: apcajas table (cash register shifts)
export interface LegacyApcaja {
  id_apcajas: number; // nullable int(11), NOT PK (PK is composite)
  id_caja: number | null; // FK to cajas (int(3))
  id_camarero: string | null; // FK to camareros (varchar(20))
  fecha_apertura: string | null; // datetime (CONCAT de date + time)
  fecha_cierre: string | null; // datetime (CONCAT de date + time)
  monto_apertura: number | null; // Mapped from 'cambio_inicial' (float)
  monto_cierre: number | null; // Mapped from 'cambio_final' (float)
  estado: string | null; // Mapped from 'abierta' (char 'S'/'N')
  // NOTE: PK real compuesto: (id_caja, id_camarero, fecha_apertura, hora_apertura)
}

// Legacy: ventadirecta table (orders)
export interface LegacyVentadirecta {
  id_venta: number; // PK int(7)
  num_mesa: string | null; // Mapped from 'Num_Mesa' (char(3)) FK to mesa
  id_camarero: number | null; // FK to camareros (int(4))
  id_caja: number | null; // FK to cajas (int(2)) - usado en lugar de id_apcajas
  fecha_venta: string | null; // datetime (CONCAT de date + time)
  total: number | null; // Mapped from 'tv' (float) - Total Venta
  estado: string | null; // Mapped from 'cerrada' (char S/N)
  observaciones: string | null; // varchar(249)
  // NOTE: NO existe id_apcajas, fecha_cierre en schema real
  // PK: id_venta, 28 campos totales en schema real
}

// Legacy: ventadir_comg table (order items)
export interface LegacyVentadirComg {
  id_linea: number;
  id_venta: number; // FK to ventadirecta
  id_complementog: string | null; // FK to complementog (varchar(5) zero-padded)
  cantidad: number | null; // decimal(10,3)
  precio: number | null; // decimal(10,2)
  subtotal: number | null; // decimal(10,2)
}

// Legacy: pagoscobros table (payments)
export interface LegacyPagosCobros {
  id_pagoscobros: number;
  id_venta: number | null; // FK to ventadirecta
  id_modo_pago: number | null; // FK to modo_pago
  id_apcajas: number | null; // FK to apcajas
  id_camarero: number | null; // FK to camareros
  tipo: string | null; // 'E' = cobro, 'S' = pago
  monto: number | null; // decimal(10,2)
  fecha: string | null; // datetime
  referencia: string | null;
}

// Legacy: tiquet table (invoices)
export interface LegacyTiquet {
  id_tiquet: number;
  id_venta: number | null; // FK to ventadirecta
  id_cliente: number | null; // FK to cliente
  serie: string | null; // F001, B001, T001
  numero: string | null;
  fecha: string | null; // datetime
  total: number | null; // decimal(10,2)
}
