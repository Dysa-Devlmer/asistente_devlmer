/**
 * FASE 1.8 - Customers Migration
 * Migrates: cliente → customers
 * ONLY customers with invoices in last 12 months
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES, MIGRATION_WINDOWS } from '../../config/constants';
import { LegacyCliente } from '../../types/legacy';
import { convertToUtf8, normalizePhone, normalizeEmail } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import logger from '../../utils/logger';

export const customerIdMap = new IdMap();

export async function migrateCustomers(): Promise<void> {
  logger.info('🧑‍💼 Migrating Customers (cliente → customers)...');
  logger.info(`   Filtering: Only customers with invoices in last ${MIGRATION_WINDOWS.transactions} months`);

  const prisma = getPrismaClient();

  // Fetch legacy data (only customers with recent invoices)
  // NOTE: Schema real usa 'dni' como PK (no id_cliente), 'email1' (no email), 'tf1' (no telefono)
  // JOIN usa tiquet.dni = cliente.dni, campo fecha es 'fecha_tiquet'
  const legacyCustomers = await queryLegacy<LegacyCliente>(`
    SELECT DISTINCT
      c.dni as id_cliente,
      c.nombre,
      c.dni as ruc,
      c.direccion,
      c.tf1 as telefono,
      c.email1 as email
    FROM cliente c
    INNER JOIN tiquet t ON t.dni = c.dni
    WHERE t.fecha_tiquet >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)
    ORDER BY c.dni
  `);

  logger.info(`Found ${legacyCustomers.length} customers with recent invoices in legacy DB`);

  // Process in batches
  await processBatch({
    tableName: 'customers',
    batchSize: BATCH_SIZES.customers,
    data: legacyCustomers,
    getLegacyId: (item) => item.id_cliente,
    checkExisting: async (tx, legacyId) => {
      // NOTE: legacyId es DNI (string), buscar por documentNumber
      const existing = await tx.customer.findFirst({
        where: { documentNumber: String(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      const name = convertToUtf8(legacy.nombre) || `Cliente ${legacy.id_cliente}`;
      const ruc = convertToUtf8(legacy.ruc);
      const address = convertToUtf8(legacy.direccion) || null;
      const phone = normalizePhone(legacy.telefono);
      const email = normalizeEmail(legacy.email);

      // Determine document type and number
      const documentType = ruc && ruc.length === 11 ? 'ruc' : 'dni';
      const documentNumber = ruc || `${legacy.id_cliente}`;

      const customer = await prisma.customer.create({
        data: {
          name,
          documentType,
          documentNumber,
          address,
          phone,
          email,
          legacyId: null, // DNI es string, no se puede convertir a BigInt
        },
      });

      // Store mapping
      customerIdMap.set(legacy.id_cliente, customer.id);

      return customer;
    },
    prisma,
  });

  logger.info(`✅ Customers migration complete. Map size: ${customerIdMap.size()}`);
}
