import { Module } from '@nestjs/common';
import { KnexModule } from './common/database/knex.module';
import { SyncModule } from './modules/sync/sync.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    // Database
    KnexModule,

    // Módulos de negocio
    SyncModule,
    BootstrapModule,
    FiscalModule,
    RealtimeModule,
  ],
})
export class AppModule {}
