/**
 * DTOs de Paginación - Bootstrap API v2.0
 *
 * Especificación según: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 *
 * MAX_LIMIT = 100
 * DEFAULT_LIMIT = 50
 * MIN_PAGE = 1
 */

import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters para paginación
 */
export class PaginationQueryDto {
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
 * Metadata de paginación en response
 */
export class PaginationMetaDto {
  page: number;           // Página actual
  limit: number;          // Límite aplicado
  total_items: number;    // Total registros disponibles
  total_pages: number;    // Total páginas (ceil(total_items / limit))
  has_next: boolean;      // Hay página siguiente
  has_prev: boolean;      // Hay página anterior
}

/**
 * Constantes de paginación
 */
export const PAGINATION_CONSTANTS = {
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 50,
  MIN_PAGE: 1,
} as const;
