/**
 * DTOs para Pagos
 *
 * Contratos de datos para operaciones de pago (efectivo y Webpay)
 */

import {
  IsUUID,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsIP,
  IsPositive,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Estados posibles de un pago
 */
export enum EstadoPago {
  PENDING = 'pending',       // Creado pero no procesado
  PROCESSING = 'processing', // En proceso (esperando Webpay)
  APPROVED = 'approved',     // Aprobado
  REJECTED = 'rejected',     // Rechazado (por banco)
  FAILED = 'failed',         // Falló técnicamente
  CANCELLED = 'cancelled',   // Cancelado
}

/**
 * Métodos de pago soportados
 */
export enum MetodoPago {
  EFECTIVO = 'efectivo',
  WEBPAY = 'webpay',
  WEBPAY_PLUS = 'webpay_plus',
}

/**
 * DTO para crear un pago
 */
export class CrearPagoDto {
  // Offline-first: Cliente puede generar UUID
  @IsOptional()
  @IsUUID('4')
  pago_id?: string;

  // Relaciones
  @IsUUID('4')
  venta_id!: string;

  @IsOptional()
  @IsUUID('4')
  sesion_caja_id?: string;

  @IsUUID('4')
  forma_pago_id!: string;

  @IsUUID('4')
  empleado_id!: string;

  // Monto
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  monto!: number;

  // Método de pago
  @IsEnum(MetodoPago)
  metodo!: MetodoPago;

  // Campos específicos para efectivo
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  monto_recibido?: number;

  // Campos opcionales
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  terminal_id?: string;

  @IsOptional()
  @IsIP()
  ip_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notas?: string;

  // Offline-first: Cliente puede proporcionar fecha
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  // Campos específicos para Webpay
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  webpay_session_id?: string;
}

/**
 * DTO para confirmar pago Webpay
 */
export class ConfirmarPagoWebpayDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  token_ws!: string;
}

/**
 * DTO para anular pago
 */
export class AnularPagoDto {
  @IsUUID('4')
  empleado_id!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo!: string;
}

/**
 * DTO de respuesta para pago creado (efectivo)
 */
export interface PagoEfectivoResponseDto {
  pago_id: string;
  numero_pago: string | null;
  venta_id: string;
  sesion_caja_id: string | null;
  estado: EstadoPago;
  metodo: MetodoPago;
  monto: number;
  monto_pagado: number;
  monto_recibido: number;
  monto_cambio: number;
  fecha_inicio: string;
  fecha_completado: string;
  empleado_id: string;
}

/**
 * DTO de respuesta para pago Webpay iniciado
 */
export interface PagoWebpayIniciadoResponseDto {
  pago_id: string;
  numero_pago: string | null;
  venta_id: string;
  sesion_caja_id: string | null;
  estado: EstadoPago;
  metodo: MetodoPago;
  monto: number;
  webpay_token: string;
  webpay_url: string;
  webpay_buy_order: string;
  fecha_inicio: string;
  empleado_id: string;
}

/**
 * DTO de respuesta para pago Webpay confirmado
 */
export interface PagoWebpayConfirmadoResponseDto {
  pago_id: string;
  numero_pago: string | null;
  estado: EstadoPago;
  monto: number;
  monto_pagado: number;
  webpay_authorization_code: string | null;
  webpay_card_number: string | null;
  webpay_transaction_date: string | null;
  webpay_response_code: string | null;
  motivo_rechazo?: string;
  fecha_completado: string;
}

/**
 * DTO de respuesta para pago detallado
 */
export interface PagoDetalladoResponseDto {
  pago_id: string;
  numero_pago: string | null;
  venta_id: string;
  sesion_caja_id: string | null;
  forma_pago_id: string;
  forma_pago_nombre: string;
  estado: EstadoPago;
  metodo: MetodoPago;
  monto: number;
  monto_pagado: number | null;

  // Efectivo (si aplica)
  monto_recibido: number | null;
  monto_cambio: number | null;

  // Webpay (si aplica)
  webpay_authorization_code: string | null;
  webpay_card_number: string | null;
  webpay_transaction_date: string | null;
  webpay_response_code: string | null;

  // Timestamps
  fecha_inicio: string;
  fecha_completado: string | null;

  // Auditoría
  empleado_id: string;
  empleado_nombre: string;
  terminal_id: string | null;
  intentos_procesamiento: number;

  // Estado
  esta_activo: boolean;
  motivo_anulacion: string | null;
  fecha_anulacion: string | null;

  // Notas
  notas: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * DTO de respuesta para listado de pagos de una venta
 */
export interface PagosVentaResponseDto {
  venta_id: string;
  total_pagos: number;
  monto_total_pagado: number;
  pagos: PagoSimpleDto[];
}

/**
 * DTO simplificado de pago para listados
 */
export interface PagoSimpleDto {
  pago_id: string;
  numero_pago: string | null;
  estado: EstadoPago;
  metodo: MetodoPago;
  monto: number;
  monto_pagado: number | null;
  fecha_inicio: string;
  fecha_completado: string | null;
  esta_activo: boolean;
}

/**
 * DTO para respuesta de anulación
 */
export interface AnularPagoResponseDto {
  pago_id: string;
  esta_activo: boolean;
  motivo_anulacion: string;
  fecha_anulacion: string;
  empleado_anulacion_id: string;
}

/**
 * DTO para delta sync de pagos
 */
export interface PagosDeltaResponseDto {
  since: string;
  until: string;
  total_changes: number;
  pagos: PagoSimpleDto[];
}
