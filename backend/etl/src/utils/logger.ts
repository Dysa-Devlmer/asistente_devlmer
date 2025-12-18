/**
 * Structured Logger for ETL Migration
 * Uses Winston for console and file logging
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'etl-migration' },
  transports: [
    // Console output (colorized)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0 && meta.service !== 'etl-migration') {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      ),
    }),
    // Main log file
    new winston.transports.File({
      filename: path.join(logsDir, 'migration.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

// Structured error logger
interface ErrorLog {
  table: string;
  legacyId: any;
  error: string;
  stack?: string;
  data?: any;
}

const errorLogs: ErrorLog[] = [];
const warningLogs: ErrorLog[] = [];
const orphanLogs: ErrorLog[] = [];

export function logBlockingError(table: string, legacyId: any, error: Error, data?: any): void {
  const errorLog: ErrorLog = {
    table,
    legacyId,
    error: error.message,
    stack: error.stack,
    data,
  };
  errorLogs.push(errorLog);
  logger.error(`❌ BLOCKING ERROR [${table}] legacy_id=${legacyId}: ${error.message}`, { data });
}

export function logWarning(table: string, legacyId: any, message: string, data?: any): void {
  const warningLog: ErrorLog = {
    table,
    legacyId,
    error: message,
    data,
  };
  warningLogs.push(warningLog);
  logger.warn(`⚠️  WARNING [${table}] legacy_id=${legacyId}: ${message}`, { data });
}

export function logOrphan(table: string, legacyId: any, reason: string, data?: any): void {
  const orphanLog: ErrorLog = {
    table,
    legacyId,
    error: reason,
    data,
  };
  orphanLogs.push(orphanLog);
  logger.warn(`🔗 ORPHAN [${table}] legacy_id=${legacyId}: ${reason}`, { data });
}

export function logSkip(table: string, legacyId: any, reason: string): void {
  logger.info(`⊘ SKIP [${table}] legacy_id=${legacyId}: ${reason}`);
}

export function logProgress(table: string, processed: number, total: number): void {
  const percent = ((processed / total) * 100).toFixed(1);
  logger.info(`📊 PROGRESS [${table}]: ${processed}/${total} (${percent}%)`);
}

export function logPhaseStart(phase: string, description: string): void {
  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`🚀 PHASE START: ${phase} - ${description}`);
  logger.info(`${'='.repeat(60)}\n`);
}

export function logPhaseEnd(phase: string, stats: { migrated: number; skipped: number; errors: number }): void {
  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`✅ PHASE COMPLETE: ${phase}`);
  logger.info(`   Migrated: ${stats.migrated}`);
  logger.info(`   Skipped:  ${stats.skipped}`);
  logger.info(`   Errors:   ${stats.errors}`);
  logger.info(`${'='.repeat(60)}\n`);
}

export function saveErrorLogs(): void {
  if (errorLogs.length > 0) {
    const file = path.join(logsDir, 'errors-blocking.json');
    fs.writeFileSync(file, JSON.stringify(errorLogs, null, 2));
    logger.info(`💾 Saved ${errorLogs.length} blocking errors to: ${file}`);
  }

  if (warningLogs.length > 0) {
    const file = path.join(logsDir, 'warnings.json');
    fs.writeFileSync(file, JSON.stringify(warningLogs, null, 2));
    logger.info(`💾 Saved ${warningLogs.length} warnings to: ${file}`);
  }

  if (orphanLogs.length > 0) {
    const file = path.join(logsDir, 'orphans.json');
    fs.writeFileSync(file, JSON.stringify(orphanLogs, null, 2));
    logger.info(`💾 Saved ${orphanLogs.length} orphans to: ${file}`);
  }
}

export default logger;
