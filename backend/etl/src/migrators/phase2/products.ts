/**
 * FASE 2.1 - Products Migration
 * Migrates: complementog → products
 * CRITICAL: Handle negative stocks (sales counters)
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyComplementog } from '../../types/legacy';
import { convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import { categoryIdMap } from '../phase1/categories';
import { defaultKitchenStationId } from '../phase1/kitchen-stations';
import { logWarning, logOrphan } from '../../utils/logger';
import logger from '../../utils/logger';

export const productIdMap = new IdMap();

export async function migrateProducts(): Promise<void> {
  logger.info('📦 Migrating Products (complementog → products)...');
  logger.info('⚠️  CRITICAL: Processing negative stocks as sales counters');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo real es 'complementog' (no nombre), NO existe 'stock' ni 'activo'
  // Schema real: 66 campos, PK compuesto (id_empresa, id_centro, id_tipo_comg, id_complementog)
  const legacyProducts = await queryLegacy<LegacyComplementog>(`
    SELECT
      id_complementog,
      complementog as nombre,
      id_tipo_comg,
      precio
    FROM complementog
    ORDER BY id_complementog
  `);

  logger.info(`Found ${legacyProducts.length} products in legacy DB (no activo filter - field does not exist)`);

  // Process in batches
  await processBatch({
    tableName: 'products',
    batchSize: BATCH_SIZES.products,
    data: legacyProducts,
    getLegacyId: (item) => item.id_complementog,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.product.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Producto ${legacy.id_complementog}`;
      const sku = `PROD-${String(legacy.id_complementog).padStart(6, '0')}`;

      // Resolve category FK (required by schema)
      const categoryId = legacy.id_tipo_comg
        ? categoryIdMap.get(legacy.id_tipo_comg)
        : undefined;

      if (!categoryId) {
        logOrphan('products', legacy.id_complementog, `Category not found or missing: ${legacy.id_tipo_comg}`);
        return null; // Skip orphan - category is required by schema
      }

      // NOTE: Campo 'stock' NO existe en schema legacy real
      // Derivar valores por defecto: sin tracking de inventario
      const currentStock = 0;
      const tracksInventory = false;

      const product = await prisma.product.create({
        data: {
          sku,
          name,
          description: null,
          categoryId,
          basePrice: legacy.precio !== null ? Math.round(legacy.precio * 100) / 100 : 0,
          currentStock, // Default 0 (campo no existe en legacy)
          tracksInventory, // Default false (campo no existe en legacy)
          isActive: true, // Default true (campo activo no existe)
          legacyId: BigInt(legacy.id_complementog),
          legacySku: String(legacy.id_complementog),
        },
      });

      // Store mapping
      productIdMap.set(legacy.id_complementog, product.id);

      return product;
    },
    prisma,
  });

  logger.info(`✅ Products migration complete. Map size: ${productIdMap.size()}`);
  logger.info(`⚠️  Stock field does not exist in legacy - all products set to 0 with inventory disabled`);
}
