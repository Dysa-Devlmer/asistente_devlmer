import { Module, Global } from '@nestjs/common';
import { KnexService } from './knex.service';

@Global() // Hace que KnexService esté disponible globalmente
@Module({
  providers: [KnexService],
  exports: [KnexService],
})
export class KnexModule {}
