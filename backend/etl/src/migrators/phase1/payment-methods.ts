/**
 * FASE 1.4 - Payment Methods Migration
 * Migrates: modo_pago → payment_methods
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyModoPago } from '../../types/legacy';
import { convertToUtf8, requiresReference } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const paymentMethodIdMap = new IdMap();

export async function migratePaymentMethods(): Promise<void> {
  logger.info('💳 Migrating Payment Methods (modo_pago → payment_methods)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo real es 'modo_pago' no 'nombre', activo es char 'Y'/'N'
  // Schema real: id_modo_pago, modo_pago, ctacontable, activo, defecto
  const legacyMethods = await queryLegacy<LegacyModoPago>(`
    SELECT
      id_modo_pago,
      modo_pago as nombre,
      activo,
      defecto
    FROM modo_pago
    WHERE activo = 'Y'
    ORDER BY id_modo_pago
  `);

  logger.info(`Found ${legacyMethods.length} active payment methods in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'payment_methods',
    batchSize: BATCH_SIZES.payment_methods,
    data: legacyMethods,
    getLegacyId: (item) => item.id_modo_pago,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.paymentMethod.findFirst({
        where: { legacyCode: String(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Método ${legacy.id_modo_pago}`;
      // NOTE: Usar id_modo_pago como code garantiza unicidad (PK en legacy)
      const code = String(legacy.id_modo_pago).padStart(4, '0');

      const method = await prisma.paymentMethod.create({
        data: {
          code,
          name,
          requiresReference: requiresReference(name),
          isActive: legacy.activo === 'Y',
          legacyCode: String(legacy.id_modo_pago),
        },
      });

      // Store mapping
      paymentMethodIdMap.set(legacy.id_modo_pago, method.id);

      return method;
    },
    prisma,
  });

  logger.info(`✅ Payment methods migration complete. Map size: ${paymentMethodIdMap.size()}`);
}
