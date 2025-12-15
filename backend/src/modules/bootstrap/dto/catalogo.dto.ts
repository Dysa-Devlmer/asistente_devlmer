/**
 * DTOs de Catálogo - Bootstrap API v2.0
 *
 * Especificación según: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 * Endpoint: GET /api/bootstrap/catalogo
 */

import { IsUUID, IsString, IsNumber, IsBoolean, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationMetaDto } from './pagination.dto';

/**
 * Query parameters para endpoint /catalogo
 */
export class CatalogoQueryDto {
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
 * DTO Producto
 */
export class ProductoDto {
  @IsUUID()
  id: string;

  @IsString()
  codigo: string;

  @IsOptional()
  @IsString()
  codigo_barra?: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @IsNumber()
  precio_venta: number;

  @IsOptional()
  @IsNumber()
  precio_compra?: number;

  @IsNumber()
  stock_actual: number;

  @IsNumber()
  stock_minimo: number;

  @IsString()
  unidad_medida: string;

  @IsOptional()
  @IsUUID()
  impuesto_id?: string;

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsBoolean()
  esta_activo: boolean;

  @IsBoolean()
  permite_venta_sin_stock: boolean;

  @IsBoolean()
  es_servicio: boolean;

  @IsBoolean()
  requiere_autorizacion: boolean;

  @IsDateString()
  created_at: string;

  @IsDateString()
  updated_at: string;
}

/**
 * DTO Categoría
 */
export class CategoriaDto {
  @IsUUID()
  id: string;

  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoria_padre_id?: string | null;

  @IsInt()
  orden: number;

  @IsBoolean()
  esta_activa: boolean;

  @IsDateString()
  created_at: string;

  @IsDateString()
  updated_at: string;
}

/**
 * DTO Impuesto
 */
export class ImpuestoDto {
  @IsUUID()
  id: string;

  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsNumber()
  porcentaje: number;

  @IsString()
  tipo: string;

  @IsBoolean()
  esta_activo: boolean;

  @IsDateString()
  created_at: string;

  @IsDateString()
  updated_at: string;
}

/**
 * DTO Forma de Pago
 */
export class FormaPagoDto {
  @IsUUID()
  id: string;

  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  tipo: string;

  @IsBoolean()
  requiere_autorizacion: boolean;

  @IsBoolean()
  abre_cajon: boolean;

  @IsBoolean()
  esta_activa: boolean;

  @IsDateString()
  created_at: string;

  @IsDateString()
  updated_at: string;
}

/**
 * DTO Catálogo (estructura anidada)
 */
export class CatalogoDataDto {
  productos: ProductoDto[];
  categorias: CategoriaDto[];
  impuestos: ImpuestoDto[];
  formas_pago: FormaPagoDto[];
}

/**
 * DTO Data de Response /catalogo
 */
export class CatalogoResponseDataDto {
  @IsUUID()
  sucursal_id: string;

  pagination: PaginationMetaDto;

  catalogo: CatalogoDataDto;
}

/**
 * DTO Response completa /catalogo
 */
export class CatalogoResponseDto {
  @IsString()
  bootstrap_version: string;

  @IsDateString()
  generated_at: string;

  data: CatalogoResponseDataDto;
}
