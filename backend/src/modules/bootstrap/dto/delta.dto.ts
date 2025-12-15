/**
 * DTOs de Delta Sync - Bootstrap API v2.0
 *
 * Especificación según: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 * Endpoint: GET /api/bootstrap/delta
 */

import { IsUUID, IsString, IsDateString, IsEnum, IsInt, Min, IsObject } from 'class-validator';

/**
 * Tipos de operaciones en Delta
 */
export enum DeltaOperation {
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Tipos de entidades soportadas en Delta
 */
export enum DeltaEntity {
  PRODUCTO = 'producto',
  EMPLEADO = 'empleado',
  CATEGORIA = 'categoria',
  IMPUESTO = 'impuesto',
  FORMA_PAGO = 'forma_pago',
}

/**
 * Query parameters para endpoint /delta
 */
export class DeltaQueryDto {
  @IsUUID('4', { message: 'sucursal_id debe ser un UUID válido' })
  sucursal_id: string;

  @IsDateString({}, { message: 'since debe ser ISO 8601 válido' })
  since: string;
}

/**
 * DTO Change individual
 */
export class DeltaChangeDto {
  @IsEnum(DeltaOperation)
  op: DeltaOperation;

  @IsEnum(DeltaEntity)
  entity: DeltaEntity;

  @IsUUID()
  id: string;

  @IsDateString()
  changed_at: string;

  @IsObject()
  payload: any; // Datos completos de la entidad (tipo depende de entity)
}

/**
 * DTO Data de Response /delta
 */
export class DeltaResponseDataDto {
  @IsUUID()
  sucursal_id: string;

  @IsDateString()
  since: string;

  @IsDateString()
  until: string;

  @IsInt()
  @Min(0)
  total_changes: number;

  changes: DeltaChangeDto[];
}

/**
 * DTO Response completa /delta
 */
export class DeltaResponseDto {
  @IsString()
  bootstrap_version: string;

  @IsDateString()
  generated_at: string;

  data: DeltaResponseDataDto;
}
