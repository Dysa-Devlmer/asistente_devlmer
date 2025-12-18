/**
 * FASE 1.1 - Rooms Migration
 * Migrates: salon → rooms
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacySalon } from '../../types/legacy';
import { generateCode, convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const roomIdMap = new IdMap();

export async function migrateRooms(): Promise<void> {
  logger.info('🏛️  Migrating Rooms (salon → rooms)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo 'activo' no existe en schema real - todos se consideran activos
  const legacyRooms = await queryLegacy<LegacySalon>(`
    SELECT
      id_salon,
      nombre
    FROM salon
    ORDER BY id_salon
  `);

  logger.info(`Found ${legacyRooms.length} active rooms in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'rooms',
    batchSize: BATCH_SIZES.rooms,
    data: legacyRooms,
    getLegacyId: (item) => item.id_salon,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.room.findFirst({
        where: { legacyCode: String(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Salón ${legacy.id_salon}`;
      const code = generateCode(name);

      const room = await prisma.room.create({
        data: {
          code,
          name,
          description: null,
          isActive: true,
          legacyCode: String(legacy.id_salon),
        },
      });

      // Store mapping
      roomIdMap.set(legacy.id_salon, room.id);

      return room;
    },
    prisma,
  });

  logger.info(`✅ Rooms migration complete. Map size: ${roomIdMap.size()}`);
}
