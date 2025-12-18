/**
 * FASE 2.2 - Product Prices Migration
 * Migrates: comg_tarifa → product_prices
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyComgTarifa } from '../../types/legacy';
import { processBatch } from '../../utils/batch-processor';
import { productIdMap } from './products';
import { priceTierIdMap } from '../phase1/price-tiers';
import { logOrphan } from '../../utils/logger';
import logger from '../../utils/logger';

export async function migrateProductPrices(): Promise<void> {
  logger.info('💵 Migrating Product Prices (comg_tarifa → product_prices)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: NO existe 'id_comg_tarifa', PK compuesto (id_tarifa, id_complementog, id_tipo_comg, id_empresa, id_centro)
  // Campo precio es 'pvptarifa' (no 'precio')
  const legacyPrices = await queryLegacy<LegacyComgTarifa>(`
    SELECT
      id_complementog,
      id_tarifa,
      pvptarifa as precio
    FROM comg_tarifa
    ORDER BY id_complementog, id_tarifa
  `);

  logger.info(`Found ${legacyPrices.length} product-price relationships in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'product_prices',
    batchSize: BATCH_SIZES.product_prices,
    data: legacyPrices,
    getLegacyId: (item) => `${item.id_complementog}-${item.id_tarifa}`, // PK compuesto
    checkExisting: async (tx, legacyId) => {
      // No legacy_id field for this table, check by FK combination
      const [productId, priceTierId] = legacyId.split('-');
      const existing = await tx.productPrice.findFirst({
        where: {
          productId: productIdMap.get(productId),
          priceTierId: priceTierIdMap.get(priceTierId),
        },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      // Resolve FKs
      const productId = productIdMap.get(legacy.id_complementog);
      const priceTierId = priceTierIdMap.get(legacy.id_tarifa);

      if (!productId) {
        logOrphan('product_prices', `${legacy.id_complementog}-${legacy.id_tarifa}`, `Product not found: ${legacy.id_complementog}`);
        return null; // Skip orphan
      }

      if (!priceTierId) {
        logOrphan('product_prices', `${legacy.id_complementog}-${legacy.id_tarifa}`, `Price tier not found: ${legacy.id_tarifa}`);
        return null; // Skip orphan
      }

      const price = await prisma.productPrice.create({
        data: {
          productId,
          priceTierId,
          price: legacy.precio !== null ? Math.round(legacy.precio * 100) / 100 : 0,
        },
      });

      return price;
    },
    prisma,
  });

  logger.info(`✅ Product prices migration complete`);
}
