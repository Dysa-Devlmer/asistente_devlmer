import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Header,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BootstrapService } from '../services/bootstrap.service';
import {
  BootstrapMetaResponseDto,
} from '../dto/bootstrap-meta.dto';
import {
  SucursalResponseDto,
} from '../dto/sucursal.dto';
import {
  DispositivoResponseDto,
} from '../dto/dispositivo.dto';

/**
 * Controller para endpoints de Bootstrap
 * Iteración 1: Meta, Sucursal, Dispositivo
 *
 * Headers obligatorios en todas las respuestas:
 * - x-bootstrap-version: Versión del sistema bootstrap
 * - cache-control: Política de cache
 *
 * Estructura de respuesta:
 * {
 *   bootstrap_version: string,
 *   generated_at: string (ISO 8601),
 *   data: { ... }
 * }
 */
@ApiTags('Bootstrap')
@Controller('api/bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  /**
   * GET /api/bootstrap/meta
   *
   * Obtener metadata de bootstrap (versión catálogo, timestamp servidor)
   * Permite al cliente decidir si necesita sync completo o delta
   *
   * Nota Iteración 1:
   * - catalog_version es simple (constante BOOTSTRAP_V1)
   * - requires_full_sync es solo informativo, NO dispara sync automático
   */
  @Get('meta')
  @HttpCode(HttpStatus.OK)
  @Header('x-bootstrap-version', '1.0.0')
  @Header('cache-control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Obtener metadata de bootstrap',
    description:
      'Retorna versión del catálogo y timestamp del servidor. ' +
      'Permite al dispositivo decidir si necesita descarga completa o delta. ' +
      'Iteración 1: catalog_version es constante, requires_full_sync es solo informativo.',
  })
  @ApiQuery({
    name: 'sucursal_id',
    required: true,
    description: 'UUID de la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Metadata obtenida exitosamente',
    type: BootstrapMetaResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sucursal no encontrada o inactiva',
  })
  async getMeta(
    @Query('sucursal_id', ParseUUIDPipe) sucursalId: string,
  ): Promise<BootstrapMetaResponseDto> {
    return this.bootstrapService.getMeta(sucursalId);
  }

  /**
   * GET /api/bootstrap/sucursal/:id
   *
   * Obtener datos completos de la sucursal
   * Query SQL: SELECT id, codigo, nombre, rut, direccion, telefono, email, timezone, esta_activa, configuracion
   *            FROM sucursal WHERE id = ? AND esta_activa = true LIMIT 1;
   */
  @Get('sucursal/:id')
  @HttpCode(HttpStatus.OK)
  @Header('x-bootstrap-version', '1.0.0')
  @Header('cache-control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Obtener datos de sucursal',
    description: 'Retorna información completa de la sucursal (sin campos sensibles)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID de la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Sucursal obtenida exitosamente',
    type: SucursalResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sucursal no encontrada o inactiva',
  })
  async getSucursal(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SucursalResponseDto> {
    return this.bootstrapService.getSucursal(id);
  }

  /**
   * GET /api/bootstrap/dispositivo
   *
   * Obtener datos del dispositivo y su configuración
   * Query SQL: SELECT id, sucursal_id, codigo, nombre, tipo, dispositivo_info, esta_activo, ultima_sincronizacion, version_app
   *            FROM dispositivo WHERE sucursal_id = ? AND id = ? AND esta_activo = true LIMIT 1;
   */
  @Get('dispositivo')
  @HttpCode(HttpStatus.OK)
  @Header('x-bootstrap-version', '1.0.0')
  @Header('cache-control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Obtener datos de dispositivo',
    description: 'Retorna información del dispositivo y su configuración (sin campos sensibles)',
  })
  @ApiQuery({
    name: 'sucursal_id',
    required: true,
    description: 'UUID de la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'dispositivo_id',
    required: true,
    description: 'UUID del dispositivo',
    example: '987fcdeb-51a2-43e7-9876-543210fedcba',
  })
  @ApiResponse({
    status: 200,
    description: 'Dispositivo obtenido exitosamente',
    type: DispositivoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Dispositivo no encontrado o inactivo',
  })
  async getDispositivo(
    @Query('sucursal_id', ParseUUIDPipe) sucursalId: string,
    @Query('dispositivo_id', ParseUUIDPipe) dispositivoId: string,
  ): Promise<DispositivoResponseDto> {
    return this.bootstrapService.getDispositivo(sucursalId, dispositivoId);
  }
}
