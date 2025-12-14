import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SyncService } from '../services/sync.service';
import { SyncEventDto, SyncEventsResponseDto } from '../dto/sync-event.dto';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  /**
   * POST /api/sync/events
   *
   * Recibe lote de eventos de sincronización desde dispositivos offline
   *
   * @param events - Array de eventos a procesar
   * @returns Resumen del procesamiento (procesados, errores, detalles)
   */
  @Post('events')
  @HttpCode(HttpStatus.OK)
  async receiveEvents(
    @Body() events: SyncEventDto[],
  ): Promise<SyncEventsResponseDto> {
    this.logger.log(
      `📡 POST /sync/events - Recibiendo ${events.length} eventos`,
    );

    // Validar que sea un array
    if (!Array.isArray(events)) {
      throw new Error('El body debe ser un array de eventos');
    }

    // Validar que no esté vacío
    if (events.length === 0) {
      return {
        processed: 0,
        errors: 0,
        results: [],
      };
    }

    // Procesar eventos
    const result = await this.syncService.processEvents(events);

    this.logger.log(
      `✅ Procesados: ${result.processed}, Errores: ${result.errors}`,
    );

    return result;
  }
}
