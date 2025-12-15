/**
 * DTOs para Movimientos de Caja
 *
 * Movimientos de efectivo que NO son ventas (ingresos/egresos)
 */

import { IsUUID, IsNumber, IsString, IsEnum, IsOptional, Min, MinLength, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Tipos de movimiento de caja
 */
export enum TipoMovimientoCaja {
  INGRESO = 'ingreso',
  EGRESO = 'egreso',
}

/**
 * DTO para crear movimiento de caja
 */
export class CrearMovimientoCajaDto {
  @IsUUID('4', { message: 'sesion_id debe ser un UUID válido' })
  sesion_id!: string;

  @IsUUID('4', { message: 'empleado_id debe ser un UUID válido' })
  empleado_id!: string;

  @IsEnum(TipoMovimientoCaja, { message: 'tipo debe ser "ingreso" o "egreso"' })
  tipo!: TipoMovimientoCaja;

  @IsString({ message: 'concepto debe ser un string' })
  @MinLength(3, { message: 'concepto debe tener al menos 3 caracteres' })
  concepto!: string;

  @IsNumber({}, { message: 'monto debe ser un número' })
  @Min(0.01, { message: 'monto debe ser > 0' })
  @Type(() => Number)
  monto!: number;

  @IsOptional()
  @IsString({ message: 'notas debe ser un string' })
  notas?: string;

  // Campos opcionales para offline-first
  @IsOptional()
  @IsUUID('4', { message: 'movimiento_id debe ser un UUID válido' })
  movimiento_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha debe ser ISO 8601' })
  fecha?: string;
}

/**
 * DTO de respuesta para movimiento de caja
 */
export interface MovimientoCajaResponseDto {
  movimiento_id: string;
  sesion_caja_id: string;
  tipo: TipoMovimientoCaja;
  concepto: string;
  monto: number;
  empleado_id: string;
  fecha: string; // ISO 8601
  notas: string | null;
  esta_activo: boolean;
}

/**
 * DTO para anular movimiento (soft-delete)
 */
export class AnularMovimientoCajaDto {
  @IsUUID('4', { message: 'movimiento_id debe ser un UUID válido' })
  movimiento_id!: string;

  @IsUUID('4', { message: 'empleado_id debe ser un UUID válido' })
  empleado_id!: string;

  @IsOptional()
  @IsString({ message: 'motivo debe ser un string' })
  motivo?: string;
}

/**
 * DTO de respuesta para lista de movimientos
 */
export interface ListaMovimientosResponseDto {
  movimientos: MovimientoCajaResponseDto[];
  total: number;
}
