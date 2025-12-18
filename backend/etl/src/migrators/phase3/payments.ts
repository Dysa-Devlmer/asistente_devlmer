/**
 * FASE 3.4 - Payments Migration
 * Migrates: pagoscobros → payments
 * Filter: Only tipo='E' (cobros/receipts, not 'S' payouts)
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyPagosCobros } from '../../types/legacy';
import { parseMySQLDate, convertToUtf8 } from '../../utils/transformers';
import { processBatch } from '../../utils/batch-processor';
import { orderIdMap } from './orders';
import { paymentMethodIdMap } from '../phase1/payment-methods';
import { shiftIdMap } from './cash-register-shifts';
import { employeeIdMap } from '../phase1/employees';
import { logOrphan, logWarning } from '../../utils/logger';
import logger from '../../utils/logger';

export async function migratePayments(): Promise<void> {
  logger.info('💵 Migrating Payments (pagoscobros → payments)...');
  logger.info(`   Filter: Only tipo='E' (receipts)`);

  const prisma = getPrismaClient();

  // Fetch legacy data (only receipts, from migrated orders)
  const migratedOrderIds = Array.from(orderIdMap['map'].keys());

  if (migratedOrderIds.length === 0) {
    logger.warn('⚠️  No orders migrated, skipping payments');
    return;
  }

  const legacyPayments = await queryLegacy<LegacyPagosCobros>(`
    SELECT
      id_pagoscobros,
      id_venta,
      id_modo_pago,
      id_apcajas,
      id_camarero,
      tipo,
      monto,
      fecha,
      referencia
    FROM pagoscobros
    WHERE tipo = 'E'
      AND id_venta IN (${migratedOrderIds.join(',')})
    ORDER BY id_pagoscobros
  `);

  logger.info(`Found ${legacyPayments.length} receipts for migrated orders`);

  // Process in batches
  await processBatch({
    tableName: 'payments',
    batchSize: BATCH_SIZES.payments,
    data: legacyPayments,
    getLegacyId: (item) => item.id_pagoscobros,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.payment.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy) => {
      // Resolve FKs
      const orderId = legacy.id_venta ? orderIdMap.get(legacy.id_venta) : undefined;
      const methodId = legacy.id_modo_pago ? paymentMethodIdMap.get(legacy.id_modo_pago) : undefined;
      const shiftId = legacy.id_apcajas ? shiftIdMap.get(legacy.id_apcajas) : undefined;
      const employeeId = legacy.id_camarero ? employeeIdMap.get(legacy.id_camarero) : undefined;

      if (!orderId) {
        logOrphan('payments', legacy.id_pagoscobros, `Order not found: ${legacy.id_venta}`);
        return null;
      }

      if (!methodId) {
        logOrphan('payments', legacy.id_pagoscobros, `Payment method not found: ${legacy.id_modo_pago}`);
        return null;
      }

      if (!shiftId) {
        logOrphan('payments', legacy.id_pagoscobros, `Shift not found: ${legacy.id_apcajas}`);
        return null;
      }

      if (!employeeId) {
        logOrphan('payments', legacy.id_pagoscobros, `Employee not found: ${legacy.id_camarero}`);
        return null;
      }

      // Parse date
      const paidAt = parseMySQLDate(legacy.fecha);

      if (!paidAt) {
        logWarning('payments', legacy.id_pagoscobros, `Invalid payment date: ${legacy.fecha}`);
        return null;
      }

      const reference = convertToUtf8(legacy.referencia);

      const payment = await prisma.payment.create({
        data: {
          orderId,
          paymentMethodId: methodId,
          shiftId,
          processedByUserId: employeeId,
          amount: legacy.monto !== null ? Math.round(legacy.monto * 100) / 100 : 0,
          referenceNumber: reference,
          paidAt,
          legacyId: BigInt(legacy.id_pagoscobros),
        },
      });

      return payment;
    },
    prisma,
  });

  logger.info(`✅ Payments migration complete`);
}
