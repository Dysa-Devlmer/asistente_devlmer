/**
 * Health Checker
 *
 * Verificaciones de salud del sistema:
 * - /health: Liveness probe (¿está vivo?)
 * - /ready: Readiness probe (¿puede recibir tráfico?)
 */

import { logger } from '../logging/structured-logger';

export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

export interface HealthCheckResult {
  status: HealthStatus;
  checks: {
    [key: string]: {
      status: HealthStatus;
      message?: string;
      duration_ms?: number;
      error?: string;
    };
  };
  timestamp: string;
  uptime_seconds: number;
}

/**
 * Health Checker
 */
export class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Liveness check - ¿Está vivo el servicio?
   * Retorna 200 si el proceso está corriendo
   */
  async checkLiveness(): Promise<HealthCheckResult> {
    return {
      status: HealthStatus.HEALTHY,
      checks: {
        process: {
          status: HealthStatus.HEALTHY,
          message: 'Process is running',
        },
      },
      timestamp: new Date().toISOString(),
      uptime_seconds: this.getUptimeSeconds(),
    };
  }

  /**
   * Readiness check - ¿Puede recibir tráfico?
   * Verifica dependencias críticas (DB, etc.)
   */
  async checkReadiness(db: any): Promise<HealthCheckResult> {
    const checks: any = {};
    let overallStatus = HealthStatus.HEALTHY;

    // 1. Check Database
    const dbCheck = await this.checkDatabase(db);
    checks.database = dbCheck;
    if (dbCheck.status === HealthStatus.UNHEALTHY) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (dbCheck.status === HealthStatus.DEGRADED && overallStatus === HealthStatus.HEALTHY) {
      overallStatus = HealthStatus.DEGRADED;
    }

    // 2. Check Memory
    const memoryCheck = this.checkMemory();
    checks.memory = memoryCheck;
    if (memoryCheck.status === HealthStatus.DEGRADED && overallStatus === HealthStatus.HEALTHY) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      uptime_seconds: this.getUptimeSeconds(),
    };
  }

  /**
   * Check Database connectivity
   */
  private async checkDatabase(db: any): Promise<any> {
    const start = Date.now();

    try {
      // Timeout de 5 segundos para health check
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database health check timeout')), 5000)
      );

      const checkPromise = db.execute('SELECT 1 AS health_check');

      await Promise.race([checkPromise, timeoutPromise]);

      const duration = Date.now() - start;

      // Degraded si toma más de 1 segundo
      if (duration > 1000) {
        return {
          status: HealthStatus.DEGRADED,
          message: 'Database responding slowly',
          duration_ms: duration,
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: 'Database is reachable',
        duration_ms: duration,
      };
    } catch (error: any) {
      logger.error('Database health check failed', {}, error);

      return {
        status: HealthStatus.UNHEALTHY,
        message: 'Database is unreachable',
        duration_ms: Date.now() - start,
        error: error.message,
      };
    }
  }

  /**
   * Check Memory usage
   */
  private checkMemory(): any {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapUsagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    // Degraded si uso de memoria > 85%
    if (heapUsagePercent > 85) {
      return {
        status: HealthStatus.DEGRADED,
        message: `High memory usage: ${heapUsagePercent}%`,
        heap_used_mb: heapUsedMB,
        heap_total_mb: heapTotalMB,
        heap_usage_percent: heapUsagePercent,
      };
    }

    return {
      status: HealthStatus.HEALTHY,
      message: `Memory usage: ${heapUsagePercent}%`,
      heap_used_mb: heapUsedMB,
      heap_total_mb: heapTotalMB,
      heap_usage_percent: heapUsagePercent,
    };
  }

  /**
   * Get uptime in seconds
   */
  private getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
