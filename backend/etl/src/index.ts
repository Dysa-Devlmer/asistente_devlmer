#!/usr/bin/env node
/**
 * ETL Migration - Main Entry Point
 * Orchestrates the complete migration from legacy MySQL to new PostgreSQL
 *
 * Usage: npm run migrate
 */

import dotenv from 'dotenv';
import { getLegacyConnection, closeLegacyConnection } from './config/legacy-db';
import { getPrismaClient, disconnectPrisma } from './config/new-db';
import logger, { logPhaseStart, logPhaseEnd, saveErrorLogs } from './utils/logger';

// Phase 1 migrators
import { migrateRooms } from './migrators/phase1/rooms';
import { migrateCategories } from './migrators/phase1/categories';
import { migratePriceTiers } from './migrators/phase1/price-tiers';
import { migratePaymentMethods } from './migrators/phase1/payment-methods';
import { migrateCashRegisters } from './migrators/phase1/cash-registers';
import { migrateKitchenStations } from './migrators/phase1/kitchen-stations';
import { migrateEmployees } from './migrators/phase1/employees';
import { migrateCustomers } from './migrators/phase1/customers';

// Phase 2 migrators
import { migrateProducts } from './migrators/phase2/products';
import { migrateProductPrices } from './migrators/phase2/product-prices';
import { migrateTables } from './migrators/phase2/tables';

// Phase 3 migrators
import { migrateCashRegisterShifts } from './migrators/phase3/cash-register-shifts';
import { migrateOrders } from './migrators/phase3/orders';
import { migrateOrderItems } from './migrators/phase3/order-items';
import { migratePayments } from './migrators/phase3/payments';
import { migrateInvoices } from './migrators/phase3/invoices';

// Phase 4 validators
import { validateTotals } from './migrators/phase4/validate-totals';
import { validateRelationships } from './migrators/phase4/validate-relationships';
import { generateComparison } from './migrators/phase4/generate-comparison';

dotenv.config();

interface MigrationStats {
  phase: string;
  migrated: number;
  skipped: number;
  errors: number;
  duration: number;
}

const allStats: MigrationStats[] = [];

async function runPhase(
  phaseName: string,
  description: string,
  migrator: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();

  logPhaseStart(phaseName, description);

  try {
    await migrator();

    const duration = Date.now() - startTime;
    const stats = {
      phase: phaseName,
      migrated: 0, // TODO: get from migrator
      skipped: 0,
      errors: 0,
      duration,
    };

    allStats.push(stats);
    logPhaseEnd(phaseName, stats);
  } catch (error: any) {
    logger.error(`❌ PHASE FAILED: ${phaseName} - ${error.message}`);
    throw error;
  }
}

async function main(): Promise<void> {
  const globalStartTime = Date.now();

  logger.info('\n');
  logger.info('═'.repeat(70));
  logger.info('🚀 ETL MIGRATION - Legacy MySQL → New PostgreSQL');
  logger.info('═'.repeat(70));
  logger.info('\n');

  try {
    // Connect to databases
    logger.info('📡 Connecting to databases...');
    await getLegacyConnection();
    getPrismaClient();
    logger.info('✅ Connected to both databases\n');

    // ========== PHASE 1: Master Data (No Dependencies) ==========
    await runPhase('PHASE 1.1', 'Rooms', migrateRooms);
    await runPhase('PHASE 1.2', 'Categories', migrateCategories);
    await runPhase('PHASE 1.3', 'Price Tiers', migratePriceTiers);
    await runPhase('PHASE 1.4', 'Payment Methods', migratePaymentMethods);
    await runPhase('PHASE 1.5', 'Cash Registers', migrateCashRegisters);
    await runPhase('PHASE 1.6', 'Kitchen Stations', migrateKitchenStations);
    await runPhase('PHASE 1.7', 'Employees', migrateEmployees);
    await runPhase('PHASE 1.8', 'Customers', migrateCustomers);

    // ========== PHASE 2: Master Data (With Relationships) ==========
    await runPhase('PHASE 2.1', 'Products', migrateProducts);
    await runPhase('PHASE 2.2', 'Product Prices', migrateProductPrices);
    await runPhase('PHASE 2.3', 'Tables', migrateTables);

    // ========== PHASE 3: Transactional Data ==========
    await runPhase('PHASE 3.1', 'Cash Register Shifts', migrateCashRegisterShifts);
    await runPhase('PHASE 3.2', 'Orders', migrateOrders);
    await runPhase('PHASE 3.3', 'Order Items', migrateOrderItems);
    await runPhase('PHASE 3.4', 'Payments', migratePayments);
    await runPhase('PHASE 3.5', 'Invoices', migrateInvoices);

    // ========== PHASE 4: Validation ==========
    await runPhase('PHASE 4.1', 'Validate Order Totals', validateTotals);
    await runPhase('PHASE 4.2', 'Validate FK Relationships', validateRelationships);
    await runPhase('PHASE 4.3', 'Generate Comparison Report', generateComparison);

    // ========== FINAL SUMMARY ==========
    const totalDuration = Date.now() - globalStartTime;
    const totalMinutes = Math.floor(totalDuration / 60000);
    const totalSeconds = Math.floor((totalDuration % 60000) / 1000);

    logger.info('\n');
    logger.info('═'.repeat(70));
    logger.info('✅ MIGRATION COMPLETED SUCCESSFULLY');
    logger.info('═'.repeat(70));
    logger.info(`\n📊 Total Duration: ${totalMinutes}m ${totalSeconds}s\n`);

    logger.info('Phase Summary:');
    allStats.forEach((stat) => {
      const mins = Math.floor(stat.duration / 60000);
      const secs = Math.floor((stat.duration % 60000) / 1000);
      logger.info(`   ${stat.phase}: ${mins}m ${secs}s`);
    });

    logger.info('\n✅ All data migrated and validated');
    logger.info('✅ System ready for production\n');

    // Save error logs
    saveErrorLogs();

  } catch (error: any) {
    logger.error('\n');
    logger.error('═'.repeat(70));
    logger.error('❌ MIGRATION FAILED');
    logger.error('═'.repeat(70));
    logger.error(`\nError: ${error.message}`);
    if (error.stack) {
      logger.error(`\nStack trace:\n${error.stack}`);
    }

    saveErrorLogs();

    process.exit(1);
  } finally {
    // Cleanup
    logger.info('\n🔒 Closing database connections...');
    await closeLegacyConnection();
    await disconnectPrisma();
    logger.info('✅ Connections closed\n');
  }
}

// Run migration
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
