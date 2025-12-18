/**
 * Generic Batch Processor for ETL Migration
 * Handles batch processing with transactions, error handling, and idempotency
 */

import { PrismaClient } from '@prisma/client';
import logger, { logBlockingError, logWarning, logOrphan, logSkip, logProgress } from './logger';
import { getErrorType } from './validators';

export interface BatchStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  orphans: number;
}

export interface BatchProcessorOptions<T, R> {
  tableName: string;
  batchSize: number;
  data: T[];
  transform: (item: T, index: number) => Promise<R | null>;
  getLegacyId: (item: T) => any;
  checkExisting?: (prisma: PrismaClient, legacyId: any) => Promise<boolean>;
  prisma: PrismaClient;
}

/**
 * Process data in batches with error handling and idempotency
 */
export async function processBatch<T, R>(
  options: BatchProcessorOptions<T, R>
): Promise<BatchStats> {
  const { tableName, batchSize, data, transform, getLegacyId, checkExisting, prisma } = options;

  const stats: BatchStats = {
    total: data.length,
    migrated: 0,
    skipped: 0,
    errors: 0,
    orphans: 0,
  };

  logger.info(`\n📦 Starting batch processing: ${tableName} (${data.length} records)`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(data.length / batchSize);

    logger.info(`\n🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} records)`);

    await prisma.$transaction(
      async (tx) => {
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const legacyId = getLegacyId(item);
          const globalIndex = i + j;

          try {
            // Check if already migrated (idempotency)
            if (checkExisting) {
              const exists = await checkExisting(tx as PrismaClient, legacyId);
              if (exists) {
                logSkip(tableName, legacyId, 'Already migrated');
                stats.skipped++;
                continue;
              }
            }

            // Transform data
            const transformed = await transform(item, globalIndex);

            if (transformed === null) {
              // Transformation returned null = skip (e.g., orphan)
              stats.skipped++;
              continue;
            }

            // Success
            stats.migrated++;
          } catch (error: any) {
            const errorType = getErrorType(error);

            if (errorType === 'blocking') {
              // Blocking error: log and count
              logBlockingError(tableName, legacyId, error, item);
              stats.errors++;

              // Re-throw to rollback transaction
              throw error;
            } else if (errorType === 'skip') {
              // Skip error: log as orphan
              logOrphan(tableName, legacyId, error.message, item);
              stats.orphans++;
            } else {
              // Warning: log but continue
              logWarning(tableName, legacyId, error.message, item);
              stats.skipped++;
            }
          }
        }
      },
      {
        timeout: 60000, // 60s per batch
      }
    );

    // Log progress after each batch
    logProgress(tableName, i + batch.length, data.length);
  }

  logger.info(`\n✅ Batch processing complete: ${tableName}`);
  logger.info(`   Total:    ${stats.total}`);
  logger.info(`   Migrated: ${stats.migrated}`);
  logger.info(`   Skipped:  ${stats.skipped}`);
  logger.info(`   Errors:   ${stats.errors}`);
  logger.info(`   Orphans:  ${stats.orphans}`);

  return stats;
}

/**
 * Simple ID map for in-memory FK resolution
 */
export class IdMap {
  private map: Map<any, bigint> = new Map();

  set(legacyId: any, newId: bigint): void {
    this.map.set(legacyId, newId);
  }

  get(legacyId: any): bigint | undefined {
    return this.map.get(legacyId);
  }

  has(legacyId: any): boolean {
    return this.map.has(legacyId);
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
