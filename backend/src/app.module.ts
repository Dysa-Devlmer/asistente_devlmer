import { Module } from '@nestjs/common';
import { KnexModule } from './common/database/knex.module';
import { SyncModule } from './modules/sync/sync.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
// TODO: Agregar estos módulos cuando se implementen
// import { FiscalModule } from './modules/fiscal/fiscal.module';
// import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    // Database
    KnexModule,

    // Módulos de negocio
    SyncModule,        // Fase 1 (completado)
    BootstrapModule,   // Iteración 1 (en progreso)
    // FiscalModule,   // Pendiente
    // RealtimeModule, // Pendiente
  ],
})
export class AppModule {}
