/**
 * FASE 1.7 - Employees Migration
 * Migrates: camareros → employees
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES } from '../../config/constants';
import { LegacyCamarero } from '../../types/legacy';
import { convertToUtf8, splitName } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const employeeIdMap = new IdMap();

export async function migrateEmployees(): Promise<void> {
  logger.info('👤 Migrating Employees (camareros → employees)...');

  const prisma = getPrismaClient();

  // Fetch legacy data
  // NOTE: Campo 'tipo' no existe en schema real (sistema legacy usa permisos, no tipos)
  // NOTE: activo es char 'S'/'N' no int
  // Schema real: id_camarero, nombre, foto, ClaveCamarero, activo, + 25 campos permisos
  const legacyEmployees = await queryLegacy<LegacyCamarero>(`
    SELECT
      id_camarero,
      nombre,
      activo
    FROM camareros
    WHERE activo = 'S'
    ORDER BY id_camarero
  `);

  logger.info(`Found ${legacyEmployees.length} active employees in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'employees',
    batchSize: BATCH_SIZES.employees,
    data: legacyEmployees,
    getLegacyId: (item) => item.id_camarero,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.employee.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const fullName = convertToUtf8(legacy.nombre);
      const { firstName, lastName } = splitName(fullName);

      // NOTE: Sistema legacy no tiene campo 'tipo', usar rol por defecto 'waiter'
      // El legacy usa permisos granulares, no roles simples
      const role = 'waiter'; // Default role (legacy no tiene tipo)
      const code = String(legacy.id_camarero).padStart(4, '0');

      const employee = await prisma.employee.create({
        data: {
          employeeCode: code,
          firstName,
          lastName: lastName || '-',
          email: null,
          phone: null,
          role,
          isActive: legacy.activo === 'S',
          legacyId: BigInt(legacy.id_camarero),
        },
      });

      // Store mapping
      employeeIdMap.set(legacy.id_camarero, employee.id);

      return employee;
    },
    prisma,
  });

  logger.info(`✅ Employees migration complete. Map size: ${employeeIdMap.size()}`);
}
