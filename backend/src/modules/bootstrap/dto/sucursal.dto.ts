import { IsUUID, IsString, IsBoolean, IsOptional, IsEmail, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para datos de sucursal
 * Endpoint: GET /api/bootstrap/sucursal/:id
 *
 * Propósito: Proveer información completa de la sucursal
 * Nota: NO incluye campos sensibles
 */
export class SucursalDto {
  @ApiProperty({
    description: 'ID único de la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Código único de sucursal',
    example: 'SUC001',
  })
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Sucursal Centro',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'RUT de la sucursal (Chile)',
    example: '76.123.456-7',
  })
  @IsString()
  rut: string;

  @ApiPropertyOptional({
    description: 'Dirección física',
    example: 'Av. Principal 123, Santiago',
  })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+56912345678',
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'centro@sysme.cl',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Zona horaria',
    example: 'America/Santiago',
    default: 'America/Santiago',
  })
  @IsString()
  timezone: string;

  @ApiProperty({
    description: 'Indica si la sucursal está activa',
    example: true,
  })
  @IsBoolean()
  esta_activa: boolean;

  @ApiPropertyOptional({
    description: 'Configuración específica de la sucursal (JSON)',
    example: { impuestos: { iva: 19 } },
  })
  @IsObject()
  @IsOptional()
  configuracion?: Record<string, any>;
}

/**
 * Respuesta envuelta con metadata de bootstrap
 */
export class SucursalResponseDto {
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
    description: 'Datos de la sucursal',
    type: SucursalDto,
  })
  data: SucursalDto;
}
