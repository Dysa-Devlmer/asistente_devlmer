import { Module } from '@nestjs/common';
import { BootstrapController } from './controllers/bootstrap.controller';
import { BootstrapService } from './services/bootstrap.service';
import { SucursalRepository } from './repositories/sucursal.repository';
import { DispositivoRepository } from './repositories/dispositivo.repository';
import { KnexModule } from '../../common/database/knex.module';

/**
 * Módulo Bootstrap - Iteración 1
 *
 * Propósito: Proveer endpoints para descarga inicial de datos
 * por parte de dispositivos nuevos o que requieren re-sincronización completa
 *
 * Endpoints Iteración 1:
 * - GET /api/bootstrap/meta - Metadata (versión catálogo)
 * - GET /api/bootstrap/sucursal/:id - Datos de sucursal
 * - GET /api/bootstrap/dispositivo - Datos de dispositivo
 *
 * Restricciones:
 * - Solo operaciones de lectura (SELECTs)
 * - Sin campos sensibles
 * - Todas las respuestas incluyen headers x-bootstrap-version y cache-control
 */
@Module({
  imports: [KnexModule],
  controllers: [BootstrapController],
  providers: [
    BootstrapService,
    SucursalRepository,
    DispositivoRepository,
  ],
  exports: [BootstrapService],
})
export class BootstrapModule {}
