/**
 * FASE 4.3 - Generate Comparison Report
 * Compare: Legacy DB vs New DB record counts
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { MIGRATION_WINDOWS } from '../../config/constants';
import logger from '../../utils/logger';
import fs from 'fs';
import path from 'path';

interface ComparisonRow {
  table: string;
  legacyCount: number;
  newCount: number;
  diff: number;
  diffPercent: number;
  status: 'OK' | 'WARNING' | 'ERROR';
}

export async function generateComparison(): Promise<void> {
  logger.info('🔍 Generating comparison report (Legacy vs New)...');

  const prisma = getPrismaClient();
  const results: ComparisonRow[] = [];

  // Helper function
  async function compare(
    table: string,
    legacyQuery: string,
    newCountFn: () => Promise<number>
  ): Promise<void> {
    const legacyResult = await queryLegacy<{ count: number }>(legacyQuery);
    const legacyCount = legacyResult[0]?.count || 0;
    const newCount = await newCountFn();

    const diff = newCount - legacyCount;
    const diffPercent = legacyCount === 0 ? 0 : (diff / legacyCount) * 100;

    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
    if (Math.abs(diffPercent) > 10) {
      status = 'ERROR';
    } else if (Math.abs(diffPercent) > 5) {
      status = 'WARNING';
    }

    results.push({
      table,
      legacyCount,
      newCount,
      diff,
      diffPercent,
      status,
    });

    const icon = status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
    logger.info(
      `${icon} ${table}: Legacy=${legacyCount}, New=${newCount}, Diff=${diff} (${diffPercent.toFixed(1)}%)`
    );
  }

  // 1. Rooms (active only)
  await compare(
    'rooms',
    'SELECT COUNT(*) as count FROM salon WHERE activo = 1',
    () => prisma.room.count()
  );

  // 2. Categories (active only)
  await compare(
    'categories',
    'SELECT COUNT(*) as count FROM tipo_comg WHERE activo = 1',
    () => prisma.category.count()
  );

  // 3. Price Tiers
  await compare(
    'price_tiers',
    'SELECT COUNT(*) as count FROM tarifa',
    () => prisma.priceTier.count()
  );

  // 4. Payment Methods (active only)
  await compare(
    'payment_methods',
    'SELECT COUNT(*) as count FROM modo_pago WHERE activo = 1',
    () => prisma.paymentMethod.count()
  );

  // 5. Cash Registers (active only)
  await compare(
    'cash_registers',
    'SELECT COUNT(*) as count FROM cajas WHERE activo = 1',
    () => prisma.cashRegister.count()
  );

  // 6. Employees (active only)
  await compare(
    'employees',
    'SELECT COUNT(*) as count FROM camareros WHERE activo = 1',
    () => prisma.employee.count()
  );

  // 7. Customers (with recent invoices)
  await compare(
    'customers',
    `SELECT COUNT(DISTINCT c.id_cliente) as count FROM cliente c
     INNER JOIN tiquet t ON t.id_cliente = c.id_cliente
     WHERE t.fecha >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)`,
    () => prisma.customer.count()
  );

  // 8. Products (active only)
  await compare(
    'products',
    'SELECT COUNT(*) as count FROM complementog WHERE activo = 1',
    () => prisma.product.count()
  );

  // 9. Tables
  await compare(
    'tables',
    'SELECT COUNT(*) as count FROM mesa',
    () => prisma.table.count()
  );

  // 10. Cash Register Shifts (6 months)
  await compare(
    'cash_register_shifts',
    `SELECT COUNT(*) as count FROM apcajas
     WHERE fecha_apertura >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.cash_shifts} MONTH)`,
    () => prisma.cashRegisterShift.count()
  );

  // 11. Orders (closed, 12 months)
  await compare(
    'orders',
    `SELECT COUNT(*) as count FROM ventadirecta
     WHERE fecha_venta >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)
       AND estado = 'cerrada'`,
    () => prisma.order.count()
  );

  // 12. Order Items (from migrated orders)
  await compare(
    'order_items',
    `SELECT COUNT(*) as count FROM ventadir_comg vc
     INNER JOIN ventadirecta vd ON vd.id_venta = vc.id_venta
     WHERE vd.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)
       AND vd.estado = 'cerrada'`,
    () => prisma.orderItem.count()
  );

  // 13. Payments (receipts only, from migrated orders)
  await compare(
    'payments',
    `SELECT COUNT(*) as count FROM pagoscobros pc
     INNER JOIN ventadirecta vd ON vd.id_venta = pc.id_venta
     WHERE pc.tipo = 'E'
       AND vd.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)
       AND vd.estado = 'cerrada'`,
    () => prisma.payment.count()
  );

  // 14. Invoices (from migrated orders)
  await compare(
    'invoices',
    `SELECT COUNT(*) as count FROM tiquet t
     INNER JOIN ventadirecta vd ON vd.id_venta = t.id_venta
     WHERE vd.fecha_venta >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)
       AND vd.estado = 'cerrada'`,
    () => prisma.invoice.count()
  );

  // Save report
  const reportPath = path.join(__dirname, '../../../logs/validation-comparison.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Summary
  const okCount = results.filter((r) => r.status === 'OK').length;
  const warningCount = results.filter((r) => r.status === 'WARNING').length;
  const errorCount = results.filter((r) => r.status === 'ERROR').length;

  logger.info(`\n📊 Comparison Summary:`);
  logger.info(`   Total tables: ${results.length}`);
  logger.info(`   ✅ OK:       ${okCount}`);
  logger.info(`   ⚠️  Warnings: ${warningCount}`);
  logger.info(`   ❌ Errors:   ${errorCount}`);
  logger.info(`\n📄 Full report: ${reportPath}`);
}
