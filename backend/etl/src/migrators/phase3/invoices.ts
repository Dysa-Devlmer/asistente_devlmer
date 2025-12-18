/**
 * FASE 3.5 - Invoices Migration
 * Migrates: tiquet → invoices
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyTiquet } from '../../types/legacy';
import { parseMySQLDate, convertToUtf8, detectDocumentType } from '../../utils/transformers';
import { processBatch } from '../../utils/batch-processor';
import { orderIdMap } from './orders';
import { customerIdMap } from '../phase1/customers';
import { logOrphan, logWarning } from '../../utils/logger';
import logger from '../../utils/logger';

export async function migrateInvoices(): Promise<void> {
  logger.info('🧾 Migrating Invoices (tiquet → invoices)...');

  const prisma = getPrismaClient();

  // Fetch legacy data (only for migrated orders)
  const migratedOrderIds = Array.from(orderIdMap['map'].keys());

  if (migratedOrderIds.length === 0) {
    logger.warn('⚠️  No orders migrated, skipping invoices');
    return;
  }

  const legacyInvoices = await queryLegacy<LegacyTiquet>(`
    SELECT
      id_tiquet,
      id_venta,
      id_cliente,
      serie,
      numero,
      fecha,
      total
    FROM tiquet
    WHERE id_venta IN (${migratedOrderIds.join(',')})
    ORDER BY id_tiquet
  `);

  logger.info(`Found ${legacyInvoices.length} invoices for migrated orders`);

  // Process in batches
  await processBatch({
    tableName: 'invoices',
    batchSize: BATCH_SIZES.invoices,
    data: legacyInvoices,
    getLegacyId: (item) => item.id_tiquet,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.invoice.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      // Resolve FKs
      const orderId = legacy.id_venta ? orderIdMap.get(legacy.id_venta) : undefined;
      const customerId = legacy.id_cliente ? customerIdMap.get(legacy.id_cliente) : undefined;

      if (!orderId) {
        logOrphan('invoices', legacy.id_tiquet, `Order not found: ${legacy.id_venta}`);
        return null;
      }

      // Customer is optional
      if (legacy.id_cliente && !customerId) {
        logWarning('invoices', legacy.id_tiquet, `Customer not found: ${legacy.id_cliente} (proceeding without customer)`);
      }

      // Parse date
      const issuedAt = parseMySQLDate(legacy.fecha);

      if (!issuedAt) {
        logWarning('invoices', legacy.id_tiquet, `Invalid invoice date: ${legacy.fecha}`);
        return null;
      }

      const series = convertToUtf8(legacy.serie) || 'T001';
      const number = convertToUtf8(legacy.numero) || String(legacy.id_tiquet);
      const documentType = detectDocumentType(series);

      const totalAmount = legacy.total !== null ? Math.round(legacy.total * 100) / 100 : 0;
      const taxAmount = 0; // Legacy doesn't have separate tax
      const subtotal = totalAmount - taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          orderId,
          customerId: customerId || null,
          documentType,
          series,
          documentNumber: number,
          subtotal,
          taxAmount,
          totalAmount,
          issuedAt,
          legacyId: BigInt(legacy.id_tiquet),
          legacySeries: series,
        },
      });

      return invoice;
    },
    prisma,
  });

  logger.info(`✅ Invoices migration complete`);
}
