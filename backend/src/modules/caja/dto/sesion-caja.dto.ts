/**
 * DTOs para Sesión de Caja
 *
 * Sistema auditable e inmutable
 */

import { IsUUID, IsNumber, IsString, IsOptional, Min, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Estados posibles de una sesión de caja
 */
export enum EstadoSesionCaja {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

/**
 * DTO para abrir caja
 */
export class AbrirCajaDto {
  @IsUUID('4', { message: 'sucursal_id debe ser un UUID válido' })
  sucursal_id!: string;

  @IsUUID('4', { message: 'empleado_id debe ser un UUID válido' })
  empleado_id!: string;

  @IsNumber({}, { message: 'monto_inicial debe ser un número' })
  @Min(0, { message: 'monto_inicial debe ser >= 0' })
  @Type(() => Number)
  monto_inicial!: number;

  @IsOptional()
  @IsString({ message: 'notas debe ser un string' })
  notas?: string;

  // Campos opcionales para offline-first (cliente genera UUID y fecha)
  @IsOptional()
  @IsUUID('4', { message: 'sesion_id debe ser un UUID válido' })
  sesion_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_apertura debe ser ISO 8601' })
  fecha_apertura?: string;
}

/**
 * DTO para cerrar caja
 */
export class CerrarCajaDto {
  @IsUUID('4', { message: 'sesion_id debe ser un UUID válido' })
  sesion_id!: string;

  @IsUUID('4', { message: 'empleado_id debe ser un UUID válido' })
  empleado_id!: string;

  @IsNumber({}, { message: 'monto_final_real debe ser un número' })
  @Min(0, { message: 'monto_final_real debe ser >= 0' })
  @Type(() => Number)
  monto_final_real!: number;

  @IsOptional()
  @IsString({ message: 'notas debe ser un string' })
  notas?: string;

  // Campo opcional para offline-first (cliente envía fecha de cierre)
  @IsOptional()
  @IsDateString({}, { message: 'fecha_cierre debe ser ISO 8601' })
  fecha_cierre?: string;
}

/**
 * DTO de respuesta para sesión de caja
 */
export interface SesionCajaResponseDto {
  sesion_id: string;
  numero_sesion: number;
  sucursal_id: string;
  empleado_apertura_id: string;
  empleado_cierre_id: string | null;
  fecha_apertura: string; // ISO 8601
  fecha_cierre: string | null; // ISO 8601
  monto_inicial: number;
  monto_final_esperado: number | null;
  monto_final_real: number | null;
  diferencia: number | null;
  estado: EstadoSesionCaja;
  notas_apertura: string | null;
  notas_cierre: string | null;
}

/**
 * DTO de respuesta para apertura de caja
 */
export interface AperturaCajaResponseDto {
  sesion_id: string;
  numero_sesion: number;
  sucursal_id: string;
  empleado_apertura_id: string;
  fecha_apertura: string; // ISO 8601
  monto_inicial: number;
  estado: EstadoSesionCaja.ABIERTA;
  notas: string | null;
}

/**
 * DTO con datos de empleado (snapshot)
 */
export interface EmpleadoSnapshotDto {
  id: string;
  nombre: string;
  apellido?: string;
}

/**
 * DTO de respuesta para cierre de caja
 */
export interface CierreCajaResponseDto {
  sesion_id: string;
  numero_sesion: number;
  fecha_apertura: string; // ISO 8601
  fecha_cierre: string; // ISO 8601
  empleado_apertura: EmpleadoSnapshotDto;
  empleado_cierre: EmpleadoSnapshotDto;
  monto_inicial: number;
  monto_final_esperado: number;
  monto_final_real: number;
  diferencia: number;
  estado: EstadoSesionCaja.CERRADA;
  totales_por_forma_pago: CierreDetallePorFormaPagoDto[];
  movimientos: MovimientoCajaSimpleDto[];
  notas_apertura: string | null;
  notas_cierre: string | null;
}

/**
 * DTO para detalle de cierre por forma de pago
 */
export interface CierreDetallePorFormaPagoDto {
  forma_pago_id: string;
  nombre: string;
  cantidad_transacciones: number;
  monto_total: number;
}

/**
 * DTO simplificado de movimiento para respuesta de cierre
 */
export interface MovimientoCajaSimpleDto {
  id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  fecha: string; // ISO 8601
  empleado_id: string;
  notas: string | null;
}

/**
 * DTO para consultar sesión activa
 */
export interface SesionActivaResponseDto {
  sesion_id: string;
  numero_sesion: number;
  estado: EstadoSesionCaja.ABIERTA;
  fecha_apertura: string;
  monto_inicial: number;
  empleado_apertura_id: string;
}

/**
 * Snapshot inmutable del cierre (se guarda en JSON)
 */
export interface CierreInmutableSnapshot {
  sesion_id: string;
  numero_sesion: number;
  sucursal_id: string;
  fecha_apertura: string;
  fecha_cierre: string;
  empleado_apertura: EmpleadoSnapshotDto;
  empleado_cierre: EmpleadoSnapshotDto;
  monto_inicial: number;
  monto_final_esperado: number;
  monto_final_real: number;
  diferencia: number;
  totales_por_forma_pago: CierreDetallePorFormaPagoDto[];
  movimientos: MovimientoCajaSimpleDto[];
  ventas_resumen: {
    cantidad_total: number;
    monto_total: number;
  };
  timestamp_snapshot: string; // ISO 8601
}
