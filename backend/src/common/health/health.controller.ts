/**
 * Health Controller
 *
 * Endpoints de health checks:
 * - GET /health (liveness)
 * - GET /ready (readiness)
 */

import { Request, Response } from 'express';
import { HealthChecker, HealthStatus } from './health-checker';
import { logger } from '../logging/structured-logger';

export class HealthController {
  private healthChecker: HealthChecker;
  private db: any;

  constructor(db: any) {
    this.healthChecker = new HealthChecker();
    this.db = db;
  }

  /**
   * GET /health
   * Liveness probe - ¿Está vivo?
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.healthChecker.checkLiveness();

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Liveness check failed', { request_id: req.request_id }, error);

      res.status(500).json({
        status: HealthStatus.UNHEALTHY,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /ready
   * Readiness probe - ¿Puede recibir tráfico?
   */
  async getReady(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.healthChecker.checkReadiness(this.db);

      // Status code según resultado
      const statusCode = result.status === HealthStatus.HEALTHY
        ? 200
        : result.status === HealthStatus.DEGRADED
        ? 200 // Degraded aún puede recibir tráfico
        : 503; // Unhealthy no puede recibir tráfico

      res.status(statusCode).json(result);
    } catch (error: any) {
      logger.error('Readiness check failed', { request_id: req.request_id }, error);

      res.status(503).json({
        status: HealthStatus.UNHEALTHY,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
