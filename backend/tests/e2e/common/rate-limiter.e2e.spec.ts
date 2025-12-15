/**
 * E2E Tests - Rate Limiter
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Application, Request, Response } from 'express';
import { rateLimiters } from '../../../src/common/middleware/rate-limiter.middleware';
import { requestIdMiddleware } from '../../../src/common/middleware/request-id.middleware';
import { errorHandlerMiddleware } from '../../../src/common/middleware/error-handler.middleware';

describe('Rate Limiter E2E', () => {
  let app: Application;

  beforeEach(() => {
    // Reset rate limiters antes de cada test
    // Nota: En implementación real, deberías tener un método clear()
  });

  afterEach(() => {
    // Cleanup
  });

  describe('General Rate Limiter (100 requests/60s)', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);
      app.use(rateLimiters.general);
      app.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      app.use(errorHandlerMiddleware);
    });

    it('debe permitir requests dentro del límite', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OK');
    });

    it('debe incluir headers X-RateLimit-*', async () => {
      const response = await request(app).get('/test');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBe(100);
    });

    it('debe decrementar X-RateLimit-Remaining', async () => {
      const response1 = await request(app).get('/test');
      const response2 = await request(app).get('/test');

      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      expect(remaining2).toBe(remaining1 - 1);
    });

    it('debe retornar 429 cuando se excede el límite', async () => {
      // Crear rate limiter con límite bajo para testing
      const testApp = express();
      testApp.use(requestIdMiddleware);
      testApp.use((req, res, next) => {
        // Rate limiter de 3 requests/60s para test
        const { createRateLimiter } = require('../../../src/common/middleware/rate-limiter.middleware');
        const testLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });
        testLimiter(req, res, next);
      });
      testApp.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      testApp.use(errorHandlerMiddleware);

      // Hacer 3 requests (OK)
      await request(testApp).get('/test');
      await request(testApp).get('/test');
      await request(testApp).get('/test');

      // 4to request debe ser rechazado
      const response = await request(testApp).get('/test');

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(response.body).toHaveProperty('statusCode', 429);
      expect(response.body.message).toContain('Rate limit excedido');
    });

    it('debe incluir metadata con limit y windowMs en error 429', async () => {
      const testApp = express();
      testApp.use(requestIdMiddleware);
      testApp.use((req, res, next) => {
        const { createRateLimiter } = require('../../../src/common/middleware/rate-limiter.middleware');
        const testLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
        testLimiter(req, res, next);
      });
      testApp.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      testApp.use(errorHandlerMiddleware);

      // Exceder límite
      await request(testApp).get('/test');
      await request(testApp).get('/test');
      const response = await request(testApp).get('/test');

      expect(response.body.metadata).toHaveProperty('limit', 2);
      expect(response.body.metadata).toHaveProperty('windowMs', 60000);
      expect(response.body.metadata).toHaveProperty('retry_after');
      expect(response.body.metadata.retry_after).toBeGreaterThan(0);
    });

    it('debe incluir header Retry-After en error 429', async () => {
      const testApp = express();
      testApp.use(requestIdMiddleware);
      testApp.use((req, res, next) => {
        const { createRateLimiter } = require('../../../src/common/middleware/rate-limiter.middleware');
        const testLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
        testLimiter(req, res, next);
      });
      testApp.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      testApp.use(errorHandlerMiddleware);

      await request(testApp).get('/test');
      await request(testApp).get('/test');
      const response = await request(testApp).get('/test');

      expect(response.headers).toHaveProperty('retry-after');
      const retryAfter = parseInt(response.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('Bootstrap Rate Limiter (30 requests/60s)', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);
      app.use('/api/bootstrap', rateLimiters.bootstrap);
      app.get('/api/bootstrap/catalogo', (req: Request, res: Response) => {
        res.json({ message: 'Catalogo OK' });
      });
      app.use(errorHandlerMiddleware);
    });

    it('debe aplicar límite de 30 requests', async () => {
      const response = await request(app).get('/api/bootstrap/catalogo');

      expect(response.status).toBe(200);
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBe(30);
    });
  });

  describe('Delta Sync Rate Limiter (10 requests/60s)', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);
      app.use('/api/bootstrap/delta', rateLimiters.deltaSync);
      app.get('/api/bootstrap/delta', (req: Request, res: Response) => {
        res.json({ message: 'Delta OK' });
      });
      app.use(errorHandlerMiddleware);
    });

    it('debe aplicar límite de 10 requests', async () => {
      const response = await request(app).get('/api/bootstrap/delta');

      expect(response.status).toBe(200);
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBe(10);
    });
  });

  describe('IP-based Rate Limiting', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);
      app.use((req, res, next) => {
        const { createRateLimiter } = require('../../../src/common/middleware/rate-limiter.middleware');
        const testLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });
        testLimiter(req, res, next);
      });
      app.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      app.use(errorHandlerMiddleware);
    });

    it('debe trackear requests por IP', async () => {
      const response1 = await request(app).get('/test');
      const response2 = await request(app).get('/test');

      const remaining1 = parseInt(response1.headers['x-ratelimit-remaining']);
      const remaining2 = parseInt(response2.headers['x-ratelimit-remaining']);

      expect(remaining2).toBeLessThan(remaining1);
    });
  });

  describe('Window Reset', () => {
    it('debe resetear contador después de window', async () => {
      const testApp = express();
      testApp.use(requestIdMiddleware);
      testApp.use((req, res, next) => {
        const { createRateLimiter } = require('../../../src/common/middleware/rate-limiter.middleware');
        // Window de 1 segundo para test
        const testLimiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 });
        testLimiter(req, res, next);
      });
      testApp.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      testApp.use(errorHandlerMiddleware);

      // Hacer 2 requests (OK)
      await request(testApp).get('/test');
      await request(testApp).get('/test');

      // 3er request debe fallar
      const response1 = await request(testApp).get('/test');
      expect(response1.status).toBe(429);

      // Esperar 1.1 segundos
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Nuevo request debe estar OK
      const response2 = await request(testApp).get('/test');
      expect(response2.status).toBe(200);
    });
  });

  describe('Request ID en Rate Limit Error', () => {
    it('debe incluir request_id en error 429', async () => {
      const testApp = express();
      testApp.use(requestIdMiddleware);
      testApp.use((req, res, next) => {
        const { createRateLimiter } = require('../../../src/common/middleware/rate-limiter.middleware');
        const testLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
        testLimiter(req, res, next);
      });
      testApp.get('/test', (req: Request, res: Response) => {
        res.json({ message: 'OK' });
      });
      testApp.use(errorHandlerMiddleware);

      await request(testApp).get('/test');
      await request(testApp).get('/test');
      const response = await request(testApp).get('/test');

      expect(response.body).toHaveProperty('request_id');
      expect(response.body.request_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(response.headers).toHaveProperty('x-request-id');
    });
  });
});
