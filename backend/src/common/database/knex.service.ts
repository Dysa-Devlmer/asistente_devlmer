import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class KnexService implements OnModuleInit, OnModuleDestroy {
  private _instance: Knex;

  async onModuleInit() {
    this._instance = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'sysme_tpv',
      },
      pool: {
        min: 2,
        max: 10,
      },
      acquireConnectionTimeout: 10000,
    });

    // Test de conexión
    try {
      await this._instance.raw('SELECT 1');
      console.log('✅ Conexión a PostgreSQL exitosa');
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this._instance) {
      await this._instance.destroy();
      console.log('✅ Conexión a PostgreSQL cerrada');
    }
  }

  /**
   * Obtener instancia de Knex
   */
  get instance(): Knex {
    if (!this._instance) {
      throw new Error('Knex no ha sido inicializado');
    }
    return this._instance;
  }

  /**
   * Ejecutar query en transacción
   */
  async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>,
  ): Promise<T> {
    return this._instance.transaction(callback);
  }
}
