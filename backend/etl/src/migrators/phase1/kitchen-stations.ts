/**
 * FASE 1.6 - Kitchen Stations Migration
 * NOTE: NO legacy equivalent - creating default station
 */

import { getPrismaClient } from '../../config/new-db';
import { DEFAULTS } from '../../config/constants';
import logger from '../../utils/logger';

export let defaultKitchenStationId: bigint | null = null;

export async function migrateKitchenStations(): Promise<void> {
  logger.info('🍳 Creating default Kitchen Station (no legacy equivalent)...');

  const prisma = getPrismaClient();

  // Check if default station already exists
  const existing = await prisma.kitchenStation.findFirst({
    where: { code: DEFAULTS.kitchen_station_code },
  });

  if (existing) {
    logger.info(`⊘ Default kitchen station already exists: ${existing.code}`);
    defaultKitchenStationId = existing.id;
    return;
  }

  // Create default station
  const station = await prisma.kitchenStation.create({
    data: {
      code: DEFAULTS.kitchen_station_code,
      name: DEFAULTS.kitchen_station_name,
      description: 'Estación de cocina principal creada durante migración ETL',
      isActive: true,
    },
  });

  defaultKitchenStationId = station.id;

  logger.info(`✅ Created default kitchen station: ${station.code} (id: ${station.id})`);
}
