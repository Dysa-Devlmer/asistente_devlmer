/**
 * FASE 1.3 - Price Tiers Migration
 * Migrates: tarifa → price_tiers
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyTarifa } from '../../types/legacy';
import { convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const priceTierIdMap = new IdMap();

export async function migratePriceTiers(): Promise<void> {
  logger.info('💰 Migrating Price Tiers (tarifa → price_tiers)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo 'porcentaje' no existe en schema real
  // Schema real: id_tarifa, nombre, horacomienzo, autoreduce
  const legacyTiers = await queryLegacy<LegacyTarifa>(`
    SELECT
      id_tarifa,
      nombre
    FROM tarifa
    ORDER BY id_tarifa
  `);

  logger.info(`Found ${legacyTiers.length} price tiers in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'price_tiers',
    batchSize: BATCH_SIZES.price_tiers,
    data: legacyTiers,
    getLegacyId: (item) => item.id_tarifa,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.priceTier.findFirst({
        where: { legacyCode: String(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Tarifa ${legacy.id_tarifa}`;
      // NOTE: Usar id_tarifa como code garantiza unicidad (PK en legacy)
      const code = String(legacy.id_tarifa).padStart(4, '0');

      // First tier (id_tarifa = 1) is usually the default
      const isDefault = legacy.id_tarifa === '0001' || legacy.id_tarifa === 1;

      const tier = await prisma.priceTier.create({
        data: {
          code,
          name,
          description: `Tarifa migrada desde legacy`,
          isDefault,
          isActive: true,
          legacyCode: String(legacy.id_tarifa),
        },
      });

      // Store mapping
      priceTierIdMap.set(legacy.id_tarifa, tier.id);

      return tier;
    },
    prisma,
  });

  logger.info(`✅ Price tiers migration complete. Map size: ${priceTierIdMap.size()}`);
}
