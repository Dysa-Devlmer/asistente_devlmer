/**
 * FASE 1.5 - Cash Registers Migration
 * Migrates: cajas → cash_registers
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyCaja } from '../../types/legacy';
import { convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const cashRegisterIdMap = new IdMap();

export async function migrateCashRegisters(): Promise<void> {
  logger.info('🏦 Migrating Cash Registers (cajas → cash_registers)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo 'activo' no existe en schema real
  // Schema real: id_caja, Nombre (capital), Descripcion (capital)
  const legacyRegisters = await queryLegacy<LegacyCaja>(`
    SELECT
      id_caja,
      Nombre as nombre
    FROM cajas
    ORDER BY id_caja
  `);

  logger.info(`Found ${legacyRegisters.length} active cash registers in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'cash_registers',
    batchSize: BATCH_SIZES.cash_registers,
    data: legacyRegisters,
    getLegacyId: (item) => item.id_caja,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.cashRegister.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Caja ${legacy.id_caja}`;
      // NOTE: Usar id_caja como code garantiza unicidad (PK en legacy)
      const code = String(legacy.id_caja).padStart(4, '0');

      const register = await prisma.cashRegister.create({
        data: {
          code,
          name,
          isActive: true, // Todos considerados activos (campo no existe en legacy)
          legacyId: BigInt(legacy.id_caja),
        },
      });

      // Store mapping
      cashRegisterIdMap.set(legacy.id_caja, register.id);

      return register;
    },
    prisma,
  });

  logger.info(`✅ Cash registers migration complete. Map size: ${cashRegisterIdMap.size()}`);
}
