/**
 * DTOs de Empleados - Bootstrap API v2.0
 *
 * Especificación según: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 * Endpoint: GET /api/bootstrap/empleados
 */

import { IsUUID, IsString, IsBoolean, IsNumber, IsArray, IsDateString, IsInt, Min, Max, IsOptional, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationMetaDto } from './pagination.dto';

/**
 * Query parameters para endpoint /empleados
 */
export class EmpleadoQueryDto {
  @IsUUID('4', { message: 'sucursal_id debe ser un UUID válido' })
  sucursal_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser >= 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser >= 1' })
  @Max(100, { message: 'limit max es 100' })
  limit?: number = 50;
}

/**
 * DTO Empleado
 *
 * IMPORTANTE: Campos sensibles EXCLUIDOS según especificación:
 * - password_hash
 * - pin_hash
 * - token_sesion
 */
export class EmpleadoDto {
  @IsUUID()
  id: string;

  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsString()
  nombre_completo: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsUUID()
  rol_id: string;

  @IsString()
  rol_nombre: string;

  @IsUUID()
  sucursal_id: string;

  @IsBoolean()
  esta_activo: boolean;

  @IsBoolean()
  puede_abrir_caja: boolean;

  @IsBoolean()
  puede_hacer_devoluciones: boolean;

  @IsBoolean()
  puede_aplicar_descuentos: boolean;

  @IsNumber()
  descuento_maximo_porcentaje: number;

  @IsBoolean()
  requiere_autorizacion_supervisor: boolean;

  @IsArray()
  @IsString({ each: true })
  permisos: string[];

  @IsDateString()
  created_at: string;

  @IsDateString()
  updated_at: string;
}

/**
 * DTO Data de Response /empleados
 */
export class EmpleadoResponseDataDto {
  @IsUUID()
  sucursal_id: string;

  pagination: PaginationMetaDto;

  empleados: EmpleadoDto[];
}

/**
 * DTO Response completa /empleados
 */
export class EmpleadoResponseDto {
  @IsString()
  bootstrap_version: string;

  @IsDateString()
  generated_at: string;

  data: EmpleadoResponseDataDto;
}
