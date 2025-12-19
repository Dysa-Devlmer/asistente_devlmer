/**
 * FASE 3.3 - Order Items Migration
 * Migrates: ventadir_comg → order_items
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyVentadirComg } from '../../types/legacy';
import { roundQuantity } from '../../utils/transformers';
import { processBatch } from '../../utils/batch-processor';
import { orderIdMap } from './orders';
import { productIdMap } from '../phase2/products';
import { logOrphan } from '../../utils/logger';
import logger from '../../utils/logger';

export async function migrateOrderItems(): Promise<void> {
  logger.info('🍕 Migrating Order Items (ventadir_comg → order_items)...');

  const prisma = getPrismaClient();

  // Ensure FK maps are populated (support isolated phase execution)
  if (productIdMap.size() === 0) {
    logger.info('ℹ️  Loading product map from PostgreSQL (legacy_sku → id)');
    const products = await prisma.product.findMany({
      select: { id: true, legacySku: true },
    });
    products.forEach((p) => {
      if (p.legacySku) {
        productIdMap.set(p.legacySku, p.id);
      }
    });
    logger.info(`ℹ️  Product map loaded: ${productIdMap.size()} entries`);
  }

  logger.info('ℹ️  Loading order map from PostgreSQL (legacy_id → id)');
  orderIdMap.clear();
  const orders = await prisma.order.findMany({
    select: { id: true, legacyId: true },
  });
  orders.forEach((o) => {
    if (o.legacyId !== null && o.legacyId !== undefined) {
      const legacyKey = Number(o.legacyId);
      orderIdMap.set(legacyKey, o.id);
    }
  });
  logger.info(`ℹ️  Order map loaded: ${orderIdMap.size()} entries`);

  // Fetch legacy data (only items from migrated orders)
  const migratedOrderIds = Array.from(orderIdMap['map'].keys());

  if (migratedOrderIds.length === 0) {
    logger.warn('⚠️  No orders migrated, skipping order items');
    return;
  }

  const legacyItems = await queryLegacy<LegacyVentadirComg>(`
    SELECT
      id_linea,
      id_venta,
      id_complementog,
      cantidad,
      precio,
      total
    FROM ventadir_comg
    WHERE id_venta IN (${migratedOrderIds.join(',')})
    ORDER BY id_linea
  `);

  logger.info(`Found ${legacyItems.length} order items for migrated orders`);

  // Process in batches
  await processBatch({
    tableName: 'order_items',
    batchSize: BATCH_SIZES.order_items,
    data: legacyItems,
    getLegacyId: (item) => BigInt(item.id_venta) * 1000n + BigInt(item.id_linea),
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.orderItem.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const legacyItemId = BigInt(legacy.id_venta) * 1000n + BigInt(legacy.id_linea);

      // Resolve FKs
      const orderId = orderIdMap.get(legacy.id_venta);

      // Align with legacy key: varchar(5) zero-padded as stored in products. No numeric conversion.
      const productKey = legacy.id_complementog ? String(legacy.id_complementog).trim() : undefined;
      const safeKey = productKey ? productKey.padStart(5, '0') : undefined;
      const productId = safeKey ? productIdMap.get(safeKey) : undefined;

      if (!orderId) {
        logOrphan('order_items', legacyItemId.toString(), `Order not found: ${legacy.id_venta}`);
        return null;
      }

      if (!productId) {
        logOrphan('order_items', legacyItemId.toString(), `Product not found: ${legacy.id_complementog}`);
        return null;
      }

      const quantity = roundQuantity(legacy.cantidad);
      const unitPrice = legacy.precio !== null ? Math.round(legacy.precio * 100) / 100 : 0;
      const subtotal = legacy.total !== null ? Math.round(legacy.total * 100) / 100 : quantity * unitPrice;
      const totalAmount = subtotal; // No discounts in legacy data

      const item = await prisma.orderItem.create({
        data: {
          orderId,
          productId,
          quantity,
          unitPrice,
          subtotal,
          totalAmount,
          notes: null,
          status: 'delivered', // Historical orders are all delivered
          legacyId: legacyItemId,
        },
      });

      return item;
    },
    prisma,
  });

  logger.info(`✅ Order items migration complete`);
}
