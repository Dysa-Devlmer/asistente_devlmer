#!/usr/bin/env node
/**
 * Standalone Validation Script
 * Run validations without running the full migration
 *
 * Usage: npm run validate
 */

import dotenv from 'dotenv';
import { getLegacyConnection, closeLegacyConnection } from './config/legacy-db';
import { getPrismaClient, disconnectPrisma } from './config/new-db';
import logger from './utils/logger';
import { validateTotals } from './migrators/phase4/validate-totals';
import { validateRelationships } from './migrators/phase4/validate-relationships';
import { generateComparison } from './migrators/phase4/generate-comparison';

dotenv.config();

async function main(): Promise<void> {
  logger.info('\n');
  logger.info('═'.repeat(70));
  logger.info('🔍 VALIDATION ONLY - Legacy vs New Databases');
  logger.info('═'.repeat(70));
  logger.info('\n');

  try {
    // Connect to databases
    logger.info('📡 Connecting to databases...');
    await getLegacyConnection();
    getPrismaClient();
    logger.info('✅ Connected to both databases\n');

    // Run validations
    await validateTotals();
    await validateRelationships();
    await generateComparison();

    logger.info('\n');
    logger.info('═'.repeat(70));
    logger.info('✅ VALIDATION COMPLETED');
    logger.info('═'.repeat(70));
    logger.info('\n');

  } catch (error: any) {
    logger.error('\n');
    logger.error('═'.repeat(70));
    logger.error('❌ VALIDATION FAILED');
    logger.error('═'.repeat(70));
    logger.error(`\nError: ${error.message}`);
    if (error.stack) {
      logger.error(`\nStack trace:\n${error.stack}`);
    }

    process.exit(1);
  } finally {
    // Cleanup
    logger.info('🔒 Closing database connections...');
    await closeLegacyConnection();
    await disconnectPrisma();
    logger.info('✅ Connections closed\n');
  }
}

// Run validation
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
