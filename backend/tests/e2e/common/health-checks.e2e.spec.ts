/**
 * E2E Tests - Health Checks
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { HealthController } from '../../../src/common/health/health.controller';
import mysql from 'mysql2/promise';

describe('Health Checks E2E', () => {
  let app: Application;
  let db: mysql.Pool;
  let healthController: HealthController;

  beforeAll(async () => {
    // Mock DB connection
    db = {
      execute: jest.fn().mockResolvedValue([[], []]),
    } as any;

    healthController = new HealthController(db);

    // Setup Express app
    app = express();
    app.get('/health', (req, res) => healthController.getHealth(req, res));
    app.get('/ready', (req, res) => healthController.getReady(req, res));
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('GET /health (Liveness)', () => {
    it('debe retornar 200 con status healthy', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('process');
      expect(response.body.checks.process.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime_seconds');
    });

    it('debe incluir uptime_seconds válido', async () => {
      const response = await request(app).get('/health');

      expect(response.body.uptime_seconds).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.uptime_seconds).toBe('number');
    });

    it('debe retornar en menos de 100ms', async () => {
      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /ready (Readiness)', () => {
    it('debe retornar 200 con status healthy cuando DB está OK', async () => {
      // Mock DB response
      (db.execute as jest.Mock).mockResolvedValueOnce([[], []]);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks.database.status).toBe('healthy');
      expect(response.body.checks.memory.status).toBe('healthy');
    });

    it('debe incluir duration_ms en check de database', async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce([[], []]);

      const response = await request(app).get('/ready');

      expect(response.body.checks.database).toHaveProperty('duration_ms');
      expect(typeof response.body.checks.database.duration_ms).toBe('number');
      expect(response.body.checks.database.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('debe incluir heap usage en check de memory', async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce([[], []]);

      const response = await request(app).get('/ready');

      expect(response.body.checks.memory).toHaveProperty('heap_used_mb');
      expect(response.body.checks.memory).toHaveProperty('heap_total_mb');
      expect(response.body.checks.memory).toHaveProperty('heap_usage_percent');
      expect(response.body.checks.memory.heap_usage_percent).toBeGreaterThan(0);
      expect(response.body.checks.memory.heap_usage_percent).toBeLessThanOrEqual(100);
    });

    it('debe retornar 200 con status degraded cuando DB responde lento', async () => {
      // Mock DB slow response (> 1000ms)
      (db.execute as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve([[], []]), 1100))
      );

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.database.status).toBe('degraded');
      expect(response.body.checks.database.message).toContain('slowly');
    });

    it('debe retornar 503 cuando DB no responde', async () => {
      // Mock DB failure
      (db.execute as jest.Mock).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.checks.database.status).toBe('unhealthy');
      expect(response.body.checks.database).toHaveProperty('error');
    });

    it('debe timeout después de 5 segundos', async () => {
      // Mock DB hanging
      (db.execute as jest.Mock).mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve([[], []]), 10000))
      );

      const start = Date.now();
      const response = await request(app).get('/ready');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(6000);
      expect(response.status).toBe(503);
      expect(response.body.checks.database.status).toBe('unhealthy');
    });
  });

  describe('Kubernetes Integration', () => {
    it('debe tener formato compatible con K8s liveness probe', async () => {
      const response = await request(app).get('/health');

      // K8s solo mira status code
      expect(response.status).toBe(200);
    });

    it('debe tener formato compatible con K8s readiness probe', async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce([[], []]);

      const response = await request(app).get('/ready');

      // K8s mira status code: 200 = ready, 503 = not ready
      expect([200, 503]).toContain(response.status);
    });

    it('debe ser idempotente (múltiples llamadas)', async () => {
      (db.execute as jest.Mock).mockResolvedValue([[], []]);

      const responses = await Promise.all([
        request(app).get('/health'),
        request(app).get('/health'),
        request(app).get('/health'),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });
  });
});
