import { Module } from '@nestjs/common';
import { KnexModule } from './common/database/knex.module';
import { SyncModule } from './modules/sync/sync.module';
// TODO: Agregar estos módulos cuando se implementen
// import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
// import { FiscalModule } from './modules/fiscal/fiscal.module';
// import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    // Database
    KnexModule,

    // Módulos de negocio - Fase 1
    SyncModule,
    // BootstrapModule, // Pendiente Fase 1
    // FiscalModule,     // Pendiente Fase 1
    // RealtimeModule,   // Pendiente Fase 1
  ],
})
export class AppModule {}
