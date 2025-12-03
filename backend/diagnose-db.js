/**
 * Script de diagnóstico de base de datos
 * Ejecutar: node diagnose-db.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'sysme.db');

console.log('🔍 DIAGNÓSTICO DE BASE DE DATOS SYSME-POS\n');
console.log('📁 Ruta BD:', dbPath);

try {
  const db = new Database(dbPath);

  // 1. Verificar tablas críticas
  console.log('\n📋 TABLAS CRÍTICAS:');
  const criticalTables = [
    'users',
    'cash_sessions',
    'cash_movements',
    'sales',
    'sale_items',
    'products',
    'categories',
    'tables',
    'orders'
  ];

  for (const table of criticalTables) {
    const exists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name=?
    `).get(table);

    if (exists) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ✅ ${table}: ${count.count} registros`);
    } else {
      console.log(`  ❌ ${table}: NO EXISTE`);
    }
  }

  // 2. Verificar estructura de cash_sessions
  console.log('\n📊 ESTRUCTURA DE cash_sessions:');
  const cashColumns = db.prepare("PRAGMA table_info(cash_sessions)").all();
  if (cashColumns.length > 0) {
    cashColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`);
    });
  } else {
    console.log('  ❌ Tabla no existe - CREANDO...');

    // Crear tabla cash_sessions
    db.exec(`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_number TEXT UNIQUE,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'open',
        opening_balance REAL DEFAULT 0,
        closing_balance REAL DEFAULT 0,
        total_sales REAL DEFAULT 0,
        total_cash REAL DEFAULT 0,
        total_card REAL DEFAULT 0,
        total_other REAL DEFAULT 0,
        total_in REAL DEFAULT 0,
        total_out REAL DEFAULT 0,
        sales_count INTEGER DEFAULT 0,
        notes TEXT,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('  ✅ Tabla cash_sessions creada');
  }

  // 3. Verificar estructura de cash_movements
  console.log('\n📊 ESTRUCTURA DE cash_movements:');
  const movColumns = db.prepare("PRAGMA table_info(cash_movements)").all();
  if (movColumns.length > 0) {
    movColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`);
    });
  } else {
    console.log('  ❌ Tabla no existe - CREANDO...');

    db.exec(`
      CREATE TABLE IF NOT EXISTS cash_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cash_session_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        reason TEXT,
        reference_id INTEGER,
        reference_type TEXT,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('  ✅ Tabla cash_movements creada');
  }

  // 4. Verificar sales y sale_items
  console.log('\n📊 ESTRUCTURA DE sales:');
  const salesColumns = db.prepare("PRAGMA table_info(sales)").all();
  if (salesColumns.length > 0) {
    console.log(`  ✅ Tabla existe con ${salesColumns.length} columnas`);
  } else {
    console.log('  ❌ Tabla no existe - CREANDO...');

    db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_number TEXT UNIQUE,
        cash_session_id INTEGER,
        user_id INTEGER NOT NULL,
        customer_id INTEGER,
        table_id INTEGER,
        subtotal REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tip_amount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'cash',
        payment_status TEXT DEFAULT 'pending',
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);
    console.log('  ✅ Tabla sales creada');
  }

  // 5. Verificar sale_items
  const saleItemsColumns = db.prepare("PRAGMA table_info(sale_items)").all();
  if (saleItemsColumns.length === 0) {
    console.log('\n  ❌ Tabla sale_items no existe - CREANDO...');

    db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        total REAL NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    console.log('  ✅ Tabla sale_items creada');
  }

  db.close();

  console.log('\n✅ DIAGNÓSTICO COMPLETADO');
  console.log('\n🔄 Reinicia el backend (npm run dev) y prueba nuevamente.');

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}
