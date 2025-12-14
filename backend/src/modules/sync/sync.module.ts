import { Module } from '@nestjs/common';
import { SyncController } from './controllers/sync.controller';
import { SyncService } from './services/sync.service';
import { IdempotencyService } from './services/idempotency.service';
import { SyncEventRepository } from './repositories/sync-event.repository';

@Module({
  controllers: [SyncController],
  providers: [SyncService, IdempotencyService, SyncEventRepository],
  exports: [SyncService], // Exportar para uso en otros módulos
})
export class SyncModule {}
