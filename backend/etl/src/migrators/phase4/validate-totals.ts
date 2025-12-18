/**
 * FASE 4.1 - Validate Order Totals
 * Verify: order.total = SUM(order_items.subtotal)
 */

import { getPrismaClient } from '../../config/new-db';
import { validateOrderTotal } from '../../utils/validators';
import logger from '../../utils/logger';
import fs from 'fs';
import path from 'path';

interface TotalValidation {
  orderId: bigint;
  orderNumber: string;
  orderTotal: number;
  itemsTotal: number;
  diff: number;
  diffPercent: number;
  status: 'OK' | 'WARNING' | 'ERROR';
}

export async function validateTotals(): Promise<void> {
  logger.info('🔍 Validating order totals (order.total vs SUM(items.subtotal))...');

  const prisma = getPrismaClient();

  // Fetch all orders with their items
  const orders = await prisma.order.findMany({
    where: {
      status: 'closed',
    },
    include: {
      orderItems: true,
    },
  });

  logger.info(`Validating ${orders.length} orders...`);

  const results: TotalValidation[] = [];
  let okCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const order of orders) {
    const orderTotal = Number(order.totalAmount);
    const itemsTotal = order.orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    const validation = validateOrderTotal(orderTotal, itemsTotal);

    const result: TotalValidation = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderTotal,
      itemsTotal,
      diff: Math.abs(orderTotal - itemsTotal),
      diffPercent: validation.diffPercent,
      status: validation.blocking ? 'ERROR' : validation.valid ? 'OK' : 'WARNING',
    };

    results.push(result);

    if (result.status === 'OK') {
      okCount++;
    } else if (result.status === 'WARNING') {
      warningCount++;
      logger.warn(
        `⚠️  Order ${result.orderNumber}: diff=${result.diff.toFixed(2)} (${result.diffPercent.toFixed(2)}%)`
      );
    } else {
      errorCount++;
      logger.error(
        `❌ Order ${result.orderNumber}: diff=${result.diff.toFixed(2)} (${result.diffPercent.toFixed(2)}%)`
      );
    }
  }

  // Save report
  const reportPath = path.join(__dirname, '../../../logs/validation-totals.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  logger.info(`\n📊 Validation Summary:`);
  logger.info(`   Total orders: ${orders.length}`);
  logger.info(`   ✅ OK:        ${okCount} (${((okCount / orders.length) * 100).toFixed(1)}%)`);
  logger.info(`   ⚠️  Warnings:  ${warningCount} (${((warningCount / orders.length) * 100).toFixed(1)}%)`);
  logger.info(`   ❌ Errors:    ${errorCount} (${((errorCount / orders.length) * 100).toFixed(1)}%)`);
  logger.info(`\n📄 Full report: ${reportPath}`);
}
