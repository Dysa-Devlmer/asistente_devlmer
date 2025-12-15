import { IsUUID, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para metadata de bootstrap
 * Endpoint: GET /api/bootstrap/meta
 *
 * Propósito: Proveer información sobre versión del catálogo y si requiere sync completo
 * Nota: En Iteración 1, catalog_version es simple (timestamp o constante)
 *       requires_full_sync es solo informativo, NO dispara sync automático
 */
export class BootstrapMetaDto {
  @ApiProperty({
    description: 'ID de la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sucursal_id: string;

  @ApiProperty({
    description: 'Versión del catálogo (simple: timestamp o constante BOOTSTRAP_V1)',
    example: 'BOOTSTRAP_V1',
  })
  @IsString()
  catalog_version: string;

  @ApiProperty({
    description: 'Timestamp del servidor (ISO 8601)',
    example: '2025-01-15T12:00:00Z',
  })
  @IsDateString()
  server_timestamp: string;

  @ApiProperty({
    description: 'Indica si se requiere sync completo (solo informativo, NO automático)',
    example: false,
  })
  @IsBoolean()
  requires_full_sync: boolean;
}

/**
 * Respuesta envuelta con metadata de bootstrap
 */
export class BootstrapMetaResponseDto {
  @ApiProperty({
    description: 'Versión del sistema de bootstrap',
    example: '1.0.0',
  })
  @IsString()
  bootstrap_version: string;

  @ApiProperty({
    description: 'Timestamp de generación de la respuesta',
    example: '2025-01-15T12:00:00Z',
  })
  @IsDateString()
  generated_at: string;

  @ApiProperty({
    description: 'Datos de metadata',
    type: BootstrapMetaDto,
  })
  data: BootstrapMetaDto;
}
