/**
 * FASE 3.1 - Cash Register Shifts Migration
 * Migrates: apcajas → cash_register_shifts
 * Historical window: 6 months
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES, MIGRATION_WINDOWS } from '../../config/constants';
import { LegacyApcaja } from '../../types/legacy';
import { parseMySQLDate } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import { cashRegisterIdMap } from '../phase1/cash-registers';
import { employeeIdMap } from '../phase1/employees';
import { logOrphan, logWarning } from '../../utils/logger';
import { isValidDate } from '../../utils/validators';
import logger from '../../utils/logger';

export const shiftIdMap = new IdMap();

const PLACEHOLDER_EMPLOYEE_CODE = 'SYSTEM_CASHIER';

const toStr = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return String(value);
};

async function ensurePlaceholderEmployee(
  prisma: ReturnType<typeof getPrismaClient>
): Promise<bigint> {
  const existing = await prisma.employee.findFirst({
    where: { employeeCode: PLACEHOLDER_EMPLOYEE_CODE },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.employee.create({
    data: {
      employeeCode: PLACEHOLDER_EMPLOYEE_CODE,
      firstName: 'SYSTEM',
      lastName: 'CASHIER',
      email: null,
      phone: null,
      role: 'waiter', // usar rol existente; legacy no tiene tipo
      isActive: true,
      legacyId: null,
    },
  });

  return created.id;
}

async function warmupMaps(prisma: ReturnType<typeof getPrismaClient>): Promise<void> {
  // Cash registers
  const cashRegisterIdToLegacy = new Map<bigint, number>();
  const registers = await prisma.cashRegister.findMany({
    select: { id: true, legacyId: true },
  });
  registers.forEach((r) => {
    if (r.legacyId !== null && r.legacyId !== undefined) {
      cashRegisterIdMap.set(Number(r.legacyId), r.id);
      cashRegisterIdToLegacy.set(r.id, Number(r.legacyId));
    }
  });

  // Employees
  const employees = await prisma.employee.findMany({
    select: { id: true, legacyId: true },
  });
  employees.forEach((e) => {
    if (e.legacyId !== null && e.legacyId !== undefined) {
      employeeIdMap.set(Number(e.legacyId), e.id);
    }
  });

  // Shifts (pre-existentes)
  const shifts = await prisma.cashRegisterShift.findMany({
    select: { id: true, legacyId: true, cashRegisterId: true },
  });
  shifts.forEach((s) => {
    if (s.legacyId !== null && s.legacyId !== undefined) {
      shiftIdMap.set(Number(s.legacyId), s.id);
    }
    const legacyCashId = cashRegisterIdToLegacy.get(s.cashRegisterId);
    if (legacyCashId !== undefined) {
      shiftIdMap.set(legacyCashId, s.id);
    }
  });
}

export async function migrateCashRegisterShifts(): Promise<void> {
  logger.info('💼 Migrating Cash Register Shifts (apcajas → cash_register_shifts)...');
  logger.info(`   Historical window: ${MIGRATION_WINDOWS.cash_shifts} months`);

  const prisma = getPrismaClient();

  // Warmup maps from existing data (idempotencia, evitar orphans falsos)
  await warmupMaps(prisma);

  // Ensure placeholder employee exists
  const placeholderEmployeeId = await ensurePlaceholderEmployee(prisma);
  logger.info(`ℹ️  Placeholder employee ready: code=${PLACEHOLDER_EMPLOYEE_CODE}, id=${placeholderEmployeeId.toString()}`);

  // Fetch legacy data (6 months)
  // NOTE: Schema real usa PK compuesto (id_caja, id_camarero, fecha_apertura, hora_apertura)
  // Campos reales: cambio_inicial (no monto_apertura), cambio_final (no monto_cierre)
  // Campo estado: 'abierta' (char 'S'/'N'), id_apcajas NO es PK (nullable)
  const legacyShifts = await queryLegacy<LegacyApcaja>(`
    SELECT
      id_apcajas,
      id_caja,
      id_camarero,
      CONCAT(fecha_apertura, ' ', hora_apertura) as fecha_apertura,
      CONCAT(fecha_cierre, ' ', hora_cierre) as fecha_cierre,
      cambio_inicial as monto_apertura,
      cambio_final as monto_cierre,
      abierta as estado
    FROM apcajas
    WHERE fecha_apertura >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.cash_shifts} MONTH)
    ORDER BY id_apcajas
  `);

  logger.info(`Found ${legacyShifts.length} shifts in last ${MIGRATION_WINDOWS.cash_shifts} months`);

  // Process in batches
  await processBatch({
    tableName: 'cash_register_shifts',
    batchSize: BATCH_SIZES.cash_register_shifts,
    data: legacyShifts,
    getLegacyId: (item) => item.id_apcajas,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.cashRegisterShift.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      // Resolve FKs
      const cashRegisterId = legacy.id_caja ? cashRegisterIdMap.get(legacy.id_caja) : undefined;
      // NOTE: id_camarero es varchar(20), puede estar vacío '' o '1', '2', etc.
      // Convertir a number para lookup en employeeIdMap si no está vacío
      const employeeId = legacy.id_camarero && legacy.id_camarero.trim() !== ''
        ? employeeIdMap.get(parseInt(legacy.id_camarero, 10)) ?? placeholderEmployeeId
        : placeholderEmployeeId;

      if (!cashRegisterId) {
        logOrphan('cash_register_shifts', legacy.id_apcajas, `Cash register not found: ${legacy.id_caja}`);
        return null;
      }

      // Parse dates
      const openedAt = parseMySQLDate(toStr(legacy.fecha_apertura));
      const closedAt = parseMySQLDate(toStr(legacy.fecha_cierre));

      if (!openedAt) {
        logWarning('cash_register_shifts', legacy.id_apcajas, `Invalid open date: ${legacy.fecha_apertura}`);
        return null;
      }

      // Determine status
      // NOTE: Campo 'abierta' char(1): 'S' = abierta, 'N' = cerrada
      const isClosed = legacy.estado === 'N' || !!closedAt;

      const shift = await prisma.cashRegisterShift.create({
        data: {
          cashRegisterId,
          openedByUserId: employeeId,
          closedByUserId: isClosed ? employeeId : null,
          openedAt,
          closedAt: isClosed ? closedAt : null,
          openingCash: legacy.monto_apertura !== null ? Math.round(legacy.monto_apertura * 100) / 100 : 0,
          closingCash: isClosed && legacy.monto_cierre !== null ? Math.round(legacy.monto_cierre * 100) / 100 : null,
          status: isClosed ? 'closed' : 'open',
          legacyId: BigInt(legacy.id_apcajas),
        },
      });

      // Store mapping (por id_apcajas y por id_caja para resolver desde orders)
      shiftIdMap.set(legacy.id_apcajas, shift.id);
      if (legacy.id_caja !== null && legacy.id_caja !== undefined) {
        const cashKey = Number(legacy.id_caja);
        shiftIdMap.set(cashKey, shift.id);
      }

      return shift;
    },
    prisma,
  });

  logger.info(`✅ Cash register shifts migration complete. Map size: ${shiftIdMap.size()}`);
}
