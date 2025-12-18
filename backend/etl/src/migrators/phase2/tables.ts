/**
 * FASE 2.3 - Tables Migration
 * Migrates: mesa → tables
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyMesa } from '../../types/legacy';
import { convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import { roomIdMap } from '../phase1/rooms';
import { logOrphan } from '../../utils/logger';
import logger from '../../utils/logger';

export const tableIdMap = new IdMap();
export const tableNumberMap = new Map<string, bigint>(); // num_mesa → table.id

export async function migrateTables(): Promise<void> {
  logger.info('🍽️  Migrating Tables (mesa → tables)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: NO existe 'id_mesa', PK es 'Num_Mesa' (char(3) con mayúsculas)
  // Campo 'Disponible' (char 'S'/'N') para estado, NO existe campo 'estado'
  const legacyTables = await queryLegacy<LegacyMesa>(`
    SELECT
      Num_Mesa as num_mesa,
      Disponible as estado,
      id_salon
    FROM mesa
    ORDER BY Num_Mesa
  `);

  logger.info(`Found ${legacyTables.length} tables in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'tables',
    batchSize: BATCH_SIZES.tables,
    data: legacyTables,
    getLegacyId: (item) => item.num_mesa, // PK es Num_Mesa (string)
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.table.findFirst({
        where: { legacyTableNumber: String(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const tableNumber = convertToUtf8(legacy.num_mesa) || 'MESA-X';
      // NOTE: Campo 'Disponible' char 'S'/'N', derivar a available/occupied
      const status = legacy.estado === 'S' ? 'available' : 'occupied';

      // Resolve room FK (required by schema)
      const roomId = legacy.id_salon ? roomIdMap.get(legacy.id_salon) : undefined;

      if (!roomId) {
        logOrphan('tables', legacy.num_mesa, `Room not found or missing: ${legacy.id_salon}`);
        return null; // Skip orphan - room is required by schema
      }

      const table = await prisma.table.create({
        data: {
          tableNumber,
          roomId,
          capacity: 4, // Default capacity (no legacy data)
          status,
          legacyTableNumber: tableNumber,
        },
      });

      // Store mappings
      tableIdMap.set(legacy.num_mesa, table.id);
      tableNumberMap.set(tableNumber, table.id); // Important for orders FK

      return table;
    },
    prisma,
  });

  logger.info(`✅ Tables migration complete. Map size: ${tableIdMap.size()}`);
  logger.info(`   Table number map size: ${tableNumberMap.size}`);
}
