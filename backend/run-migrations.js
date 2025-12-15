/**
 * Migration Runner Script
 * Ejecutar: node run-migrations.js
 *
 * Este script agrega las tablas faltantes a la base de datos existente
 * Es seguro ejecutarlo múltiples veces - no duplicará tablas
 */

import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || './data/sysme.db';

console.log('🔧 SYSME-POS Migration Runner\n');
console.log('📁 Base de datos:', dbPath);

const db = knex({
  client: 'sqlite3',
  connection: { filename: dbPath },
  useNullAsDefault: true
});

async function tableExists(tableName) {
  const result = await db.raw(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return result.length > 0;
}

async function runMigrations() {
  try {
    // Verify database exists
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Base de datos no encontrada. Ejecuta primero el backend para crearla.');
      process.exit(1);
    }

    // 1. Create cash_sessions if not exists
    if (!(await tableExists('cash_sessions'))) {
      console.log('📋 Creando tabla cash_sessions...');
      await db.schema.createTable('cash_sessions', (table) => {
        table.increments('id').primary();
        table.string('session_number', 50).unique().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.enum('status', ['open', 'closed', 'suspended']).defaultTo('open');
        table.decimal('opening_balance', 10, 2).notNullable().defaultTo(0);
        table.decimal('closing_balance', 10, 2);
        table.decimal('expected_balance', 10, 2);
        table.decimal('difference', 10, 2);
        table.decimal('total_sales', 10, 2).defaultTo(0);
        table.decimal('total_cash', 10, 2).defaultTo(0);
        table.decimal('total_card', 10, 2).defaultTo(0);
        table.decimal('total_other', 10, 2).defaultTo(0);
        table.decimal('total_in', 10, 2).defaultTo(0);
        table.decimal('total_out', 10, 2).defaultTo(0);
        table.integer('sales_count').defaultTo(0);
        table.timestamp('opened_at').defaultTo(db.fn.now());
        table.timestamp('closed_at');
        table.text('notes');
        table.timestamps(true, true);
      });
      console.log('  ✅ cash_sessions creada');
    } else {
      console.log('  ✓ cash_sessions ya existe');
    }

    // 2. Create cash_movements if not exists
    if (!(await tableExists('cash_movements'))) {
      console.log('📋 Creando tabla cash_movements...');
      await db.schema.createTable('cash_movements', (table) => {
        table.increments('id').primary();
        table.integer('cash_session_id').unsigned().notNullable();
        table.enum('type', ['in', 'out', 'sale', 'opening', 'closing']).notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('payment_method', 50);
        table.integer('reference_id').unsigned();
        table.string('reference_type', 50);
        table.string('reason', 255);
        table.text('notes');
        table.integer('user_id').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('  ✅ cash_movements creada');
    } else {
      console.log('  ✓ cash_movements ya existe');
    }

    // 3. Create z_reports if not exists
    if (!(await tableExists('z_reports'))) {
      console.log('📋 Creando tabla z_reports...');
      await db.schema.createTable('z_reports', (table) => {
        table.increments('id').primary();
        table.string('report_number', 50).unique().notNullable();
        table.integer('cash_session_id').unsigned().notNullable();
        table.date('report_date').notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.decimal('total_sales', 10, 2).notNullable();
        table.decimal('total_tax', 10, 2).notNullable();
        table.decimal('total_discount', 10, 2).defaultTo(0);
        table.decimal('total_cash', 10, 2).defaultTo(0);
        table.decimal('total_card', 10, 2).defaultTo(0);
        table.decimal('total_other', 10, 2).defaultTo(0);
        table.integer('sales_count').notNullable();
        table.integer('cancelled_count').defaultTo(0);
        table.integer('refunded_count').defaultTo(0);
        table.decimal('opening_balance', 10, 2).notNullable();
        table.decimal('closing_balance', 10, 2).notNullable();
        table.decimal('difference', 10, 2).defaultTo(0);
        table.text('report_data');
        table.boolean('printed').defaultTo(false);
        table.timestamp('printed_at');
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('  ✅ z_reports creada');
    } else {
      console.log('  ✓ z_reports ya existe');
    }

    // 4. Verify all critical tables
    console.log('\n📊 Verificando todas las tablas críticas:');
    const criticalTables = [
      'users', 'categories', 'products', 'sales', 'sale_items',
      'tables', 'salons', 'tarifas', 'settings',
      'cash_sessions', 'cash_movements', 'z_reports'
    ];

    for (const tableName of criticalTables) {
      const exists = await tableExists(tableName);
      if (exists) {
        const count = await db(tableName).count('* as count').first();
        console.log(`  ✅ ${tableName}: ${count.count} registros`);
      } else {
        console.log(`  ❌ ${tableName}: NO EXISTE`);
      }
    }

    console.log('\n✅ Migraciones completadas exitosamente');
    console.log('\n🔄 Reinicia el backend para aplicar los cambios.');

  } catch (error) {
    console.error('\n❌ Error en migraciones:', error.message);
    throw error;
  } finally {
    await db.destroy();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
