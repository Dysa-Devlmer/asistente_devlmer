import { IsUUID, IsString, IsBoolean, IsOptional, IsEnum, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Tipos de dispositivo permitidos
 */
export enum TipoDispositivo {
  CAJA = 'CAJA',           // Punto de venta fijo
  COMANDERO = 'COMANDERO', // Móvil para meseros
  COCINA = 'COCINA',       // KDS (Kitchen Display System)
  BARRA = 'BARRA',         // Display para bar
}

/**
 * DTO para datos de dispositivo
 * Endpoint: GET /api/bootstrap/dispositivo
 *
 * Propósito: Proveer información del dispositivo y su configuración
 * Nota: NO incluye campos sensibles
 */
export class DispositivoDto {
  @ApiProperty({
    description: 'ID único del dispositivo',
    example: '987fcdeb-51a2-43e7-9876-543210fedcba',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'ID de la sucursal a la que pertenece',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sucursal_id: string;

  @ApiProperty({
    description: 'Código único del dispositivo',
    example: 'POS-01',
  })
  @IsString()
  codigo: string;

  @ApiProperty({
    description: 'Nombre descriptivo del dispositivo',
    example: 'Caja Principal',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Tipo de dispositivo',
    enum: TipoDispositivo,
    example: TipoDispositivo.CAJA,
  })
  @IsEnum(TipoDispositivo)
  tipo: TipoDispositivo;

  @ApiPropertyOptional({
    description: 'Información del dispositivo (user-agent, IP, MAC, etc.)',
    example: {
      ip: '192.168.1.100',
      mac: 'AA:BB:CC:DD:EE:FF',
      user_agent: 'SYSME-POS/1.0.0'
    },
  })
  @IsObject()
  @IsOptional()
  dispositivo_info?: Record<string, any>;

  @ApiProperty({
    description: 'Indica si el dispositivo está activo',
    example: true,
  })
  @IsBoolean()
  esta_activo: boolean;

  @ApiPropertyOptional({
    description: 'Última sincronización exitosa',
    example: '2025-01-15T11:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  ultima_sincronizacion?: string;

  @ApiPropertyOptional({
    description: 'Versión de la aplicación instalada',
    example: '1.0.0',
  })
  @IsString()
  @IsOptional()
  version_app?: string;
}

/**
 * Respuesta envuelta con metadata de bootstrap
 */
export class DispositivoResponseDto {
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
    description: 'Datos del dispositivo',
    type: DispositivoDto,
  })
  data: DispositivoDto;
}
