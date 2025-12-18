/**
 * FASE 1.2 - Categories Migration
 * Migrates: tipo_comg → categories
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyTipoComg } from '../../types/legacy';
import { convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const categoryIdMap = new IdMap();

export async function migrateCategories(): Promise<void> {
  logger.info('📂 Migrating Categories (tipo_comg → categories)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo real es 'tipo_comg' no 'nombre', y 'activo' no existe
  const legacyCategories = await queryLegacy<LegacyTipoComg>(`
    SELECT
      id_tipo_comg,
      tipo_comg as nombre
    FROM tipo_comg
    ORDER BY id_tipo_comg
  `);

  logger.info(`Found ${legacyCategories.length} active categories in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'categories',
    batchSize: BATCH_SIZES.categories,
    data: legacyCategories,
    getLegacyId: (item) => item.id_tipo_comg,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.category.findFirst({
        where: { legacyCode: String(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Categoría ${legacy.id_tipo_comg}`;
      // NOTE: Usar id_tipo_comg como code garantiza unicidad (PK en legacy)
      const code = String(legacy.id_tipo_comg).padStart(4, '0');

      const category = await prisma.category.create({
        data: {
          code,
          name,
          description: null,
          displayOrder: index,
          isActive: true,
          legacyCode: String(legacy.id_tipo_comg),
        },
      });

      // Store mapping
      categoryIdMap.set(legacy.id_tipo_comg, category.id);

      return category;
    },
    prisma,
  });

  logger.info(`✅ Categories migration complete. Map size: ${categoryIdMap.size()}`);
}
