/**
 * FASE 3.2 - Orders Migration
 * Migrates: ventadirecta → orders
 * Historical window: 12 months, only CLOSED orders
 */

import { queryLegacy } from '../../config/legacy-db';
import { getPrismaClient } from '../../config/new-db';
import { BATCH_SIZES, MIGRATION_WINDOWS } from '../../config/constants';
import { LegacyVentadirecta } from '../../types/legacy';
import { parseMySQLDate, generateOrderNumber, convertToUtf8 } from '../../utils/transformers';
import { processBatch, IdMap } from '../../utils/batch-processor';
import { tableNumberMap } from '../phase2/tables';
import { employeeIdMap } from '../phase1/employees';
import { shiftIdMap } from './cash-register-shifts';
import { logOrphan, logWarning } from '../../utils/logger';
import logger from '../../utils/logger';

export const orderIdMap = new IdMap();
const PLACEHOLDER_TABLE_NUMBER = '00';
const PLACEHOLDER_TABLE_NAME = 'MESA_SISTEMA';

async function ensurePlaceholderTable(prisma: ReturnType<typeof getPrismaClient>): Promise<bigint> {
  const existing = await prisma.table.findFirst({
    where: { legacyTableNumber: PLACEHOLDER_TABLE_NUMBER },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const room = await prisma.room.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  if (!room) {
    throw new Error('No rooms available to create placeholder table for Num_Mesa=00');
  }

  const created = await prisma.table.create({
    data: {
      tableNumber: PLACEHOLDER_TABLE_NAME,
      legacyTableNumber: PLACEHOLDER_TABLE_NUMBER,
      roomId: room.id,
      capacity: 4,
      status: 'available',
      isActive: true,
      displayOrder: 0,
      notes: 'Placeholder for legacy Num_Mesa=00',
    },
  });

  logger.info(
    `ℹ️  Created placeholder table for Num_Mesa='${PLACEHOLDER_TABLE_NUMBER}': id=${created.id.toString()}`
  );

  return created.id;
}

async function warmupMaps(prisma: ReturnType<typeof getPrismaClient>): Promise<void> {
  // Cash registers (para mapear shifts por id_caja)
  const cashRegisterIdToLegacy = new Map<bigint, number>();
  const registers = await prisma.cashRegister.findMany({
    select: { id: true, legacyId: true },
  });
  registers.forEach((r) => {
    if (r.legacyId !== null && r.legacyId !== undefined) {
      cashRegisterIdToLegacy.set(r.id, Number(r.legacyId));
    }
  });

  // Tables
  const tables = await prisma.table.findMany({
    select: { id: true, legacyTableNumber: true },
  });
  tables.forEach((t) => {
    if (t.legacyTableNumber) {
      tableNumberMap.set(t.legacyTableNumber, t.id);
    }
  });

  // Placeholder table for Num_Mesa = '00'
  const placeholderTableId = await ensurePlaceholderTable(prisma);
  tableNumberMap.set(PLACEHOLDER_TABLE_NUMBER, placeholderTableId);

  // Employees
  const employees = await prisma.employee.findMany({
    select: { id: true, legacyId: true },
  });
  employees.forEach((e) => {
    if (e.legacyId !== null && e.legacyId !== undefined) {
      employeeIdMap.set(Number(e.legacyId), e.id);
    }
  });

  // Shifts
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

// Track sequence numbers per date
const orderSequences = new Map<string, number>();

async function warmupOrderSequences(prisma: ReturnType<typeof getPrismaClient>): Promise<void> {
  const existingOrders = await prisma.order.findMany({
    select: { orderNumber: true },
  });

  existingOrders.forEach((o) => {
    if (!o.orderNumber) return;
    const match = o.orderNumber.match(/^#(\d{4})(\d{2})(\d{2})-(\d{4})$/);
    if (!match) return;
    const [, year, month, day, seqStr] = match;
    const dateKey = `${year}-${month}-${day}`;
    const seq = parseInt(seqStr, 10);
    const current = orderSequences.get(dateKey) || 0;
    if (seq > current) {
      orderSequences.set(dateKey, seq);
    }
  });
}

export async function migrateOrders(): Promise<void> {
  logger.info('🛒 Migrating Orders (ventadirecta → orders)...');
  logger.info(`   Historical window: ${MIGRATION_WINDOWS.transactions} months`);
  logger.info(`   Filter: Only CLOSED orders`);

  const prisma = getPrismaClient();

  // Warmup maps from existing data (idempotencia, evita orphans por skips previos)
  await warmupMaps(prisma);
  await warmupOrderSequences(prisma);

  // Fetch legacy data (12 months, closed only)
  // NOTE: Schema real NO tiene id_apcajas, fecha_cierre, total, estado
  // Campos reales: Num_Mesa (mayúscula), tv (total venta), cerrada (char S/N)
  // Fecha/hora separados: fecha_venta (date) + hora (time)
  const legacyOrders = await queryLegacy<LegacyVentadirecta>(`
    SELECT
      id_venta,
      Num_Mesa as num_mesa,
      id_camarero,
      id_caja,
      CONCAT(fecha_venta, ' ', COALESCE(hora, '00:00:00')) as fecha_venta,
      tv as total,
      cerrada as estado,
      observaciones
    FROM ventadirecta
    WHERE fecha_venta >= DATE_SUB(NOW(), INTERVAL ${MIGRATION_WINDOWS.transactions} MONTH)
      AND cerrada = 'S'
    ORDER BY id_venta
  `);

  logger.info(`Found ${legacyOrders.length} closed orders in last ${MIGRATION_WINDOWS.transactions} months`);

  // Process in batches
  await processBatch({
    tableName: 'orders',
    batchSize: BATCH_SIZES.orders,
    data: legacyOrders,
    getLegacyId: (item) => item.id_venta,
    checkExisting: async (tx, legacyId) => {
      const existing = await tx.order.findFirst({
        where: { legacyId: BigInt(legacyId) },
      });
      return !!existing;
    },
    transform: async (legacy, index) => {
      // Parse dates
      // NOTE: NO existe fecha_cierre, solo fecha_venta + hora concatenados
      const fechaRaw = legacy.fecha_venta;
      const fechaStr =
        typeof fechaRaw === 'string'
          ? fechaRaw
          : Buffer.isBuffer(fechaRaw)
            ? fechaRaw.toString('utf8')
            : fechaRaw !== null && fechaRaw !== undefined
              ? String(fechaRaw)
              : null;
      const createdAt = parseMySQLDate(fechaStr);

      if (!createdAt) {
        logWarning('orders', legacy.id_venta, `Invalid creation date: ${legacy.fecha_venta}`);
        return null;
      }

      // Resolve FKs
      const mesaKey = legacy.num_mesa ? legacy.num_mesa.trim() : null;
      const tableId =
        mesaKey === PLACEHOLDER_TABLE_NUMBER
          ? tableNumberMap.get(PLACEHOLDER_TABLE_NUMBER)
          : mesaKey
            ? tableNumberMap.get(mesaKey)
            : undefined;
      const employeeId = legacy.id_camarero ? employeeIdMap.get(legacy.id_camarero) : undefined;

      // NOTE: id_apcajas NO existe en ventadirecta, intentar derivar de id_caja
      // Buscar shift que coincida con caja en el mapa de shifts
      const shiftKey = legacy.id_caja !== null && legacy.id_caja !== undefined ? Number(legacy.id_caja) : undefined;
      const shiftId = shiftKey !== undefined ? shiftIdMap.get(shiftKey) : undefined;

      // Validate required FKs (table, employee y shift son TODOS obligatorios por schema)
      if (!tableId) {
        logOrphan('orders', legacy.id_venta, `Table not found: ${legacy.num_mesa}`);
        return null;
      }

      if (!employeeId) {
        logOrphan('orders', legacy.id_venta, `Employee not found: ${legacy.id_camarero}`);
        return null;
      }

      // shiftId es REQUERIDO por schema (NOT NULL)
      if (!shiftId) {
        logOrphan('orders', legacy.id_venta, `Shift not found for cash register: ${legacy.id_caja} (schema requires shift)`);
        return null;
      }

      // Generate order number
      const dateKey = createdAt.toISOString().split('T')[0];
      const sequence = (orderSequences.get(dateKey) || 0) + 1;
      orderSequences.set(dateKey, sequence);
      const orderNumber = generateOrderNumber(createdAt, sequence);

      // NOTE: estado mapeado desde 'cerrada' (char S/N)
      // 'S' = cerrada (closed), cualquier otro valor = open
      const status = legacy.estado === 'S' ? 'closed' : 'open';
      const notes = convertToUtf8(legacy.observaciones);

      // Idempotencia adicional: si ya existe por orderNumber, reutilizar
      const existingByNumber = await prisma.order.findFirst({
        where: { orderNumber },
      });
      if (existingByNumber) {
        orderIdMap.set(legacy.id_venta, existingByNumber.id);
        return existingByNumber;
      }

      const order = await prisma.order.create({
        data: {
          orderNumber,
          tableId,
          waiterId: employeeId,
          shiftId, // REQUIRED (validado arriba)
          status,
          subtotal: 0, // Will be calculated from items
          taxAmount: 0,
          totalAmount: legacy.total !== null ? Math.round(legacy.total * 100) / 100 : 0,
          notes,
          openedAt: createdAt,
          closedAt: status === 'closed' ? createdAt : null, // NO existe fecha_cierre, usar fecha_venta
          legacyId: BigInt(legacy.id_venta),
        },
      });

      // Store mapping
      orderIdMap.set(legacy.id_venta, order.id);

      return order;
    },
    prisma,
  });

  logger.info(`✅ Orders migration complete. Map size: ${orderIdMap.size()}`);
}
