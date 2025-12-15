/**
 * E2E Tests - Error Handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../../../src/common/middleware/request-id.middleware';
import { errorHandlerMiddleware } from '../../../src/common/middleware/error-handler.middleware';
import {
  TypedError,
  ValidationError,
  InvalidUUIDError,
  SucursalNotFoundError,
  RateLimitExceededError,
  DatabaseTimeoutError,
  ErrorCode,
} from '../../../src/common/errors/typed-errors';

describe('Error Handling E2E', () => {
  let app: Application;

  describe('TypedError Handling', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);

      app.get('/error/validation', (req: Request, res: Response, next: NextFunction) => {
        next(new ValidationError('Campo email es inválido'));
      });

      app.get('/error/invalid-uuid', (req: Request, res: Response, next: NextFunction) => {
        next(new InvalidUUIDError('sucursal_id', 'invalid-uuid-123'));
      });

      app.get('/error/not-found', (req: Request, res: Response, next: NextFunction) => {
        next(new SucursalNotFoundError('550e8400-e29b-41d4-a716-446655440000'));
      });

      app.get('/error/rate-limit', (req: Request, res: Response, next: NextFunction) => {
        next(new RateLimitExceededError(100, 60000));
      });

      app.get('/error/db-timeout', (req: Request, res: Response, next: NextFunction) => {
        next(new DatabaseTimeoutError(30000));
      });

      app.use(errorHandlerMiddleware);
    });

    it('debe manejar ValidationError con status 400', async () => {
      const response = await request(app).get('/error/validation');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
      expect(response.body).toHaveProperty('message', 'Campo email es inválido');
      expect(response.body).toHaveProperty('metadata');
    });

    it('debe manejar InvalidUUIDError con status 400', async () => {
      const response = await request(app).get('/error/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe(ErrorCode.INVALID_UUID);
      expect(response.body.message).toContain('sucursal_id');
      expect(response.body.message).toContain('invalid-uuid-123');
      expect(response.body.metadata).toHaveProperty('fieldName', 'sucursal_id');
      expect(response.body.metadata).toHaveProperty('value', 'invalid-uuid-123');
    });

    it('debe manejar SucursalNotFoundError con status 404', async () => {
      const response = await request(app).get('/error/not-found');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(ErrorCode.SUCURSAL_NOT_FOUND);
      expect(response.body.message).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(response.body.metadata).toHaveProperty('sucursalId');
    });

    it('debe manejar RateLimitExceededError con status 429', async () => {
      const response = await request(app).get('/error/rate-limit');

      expect(response.status).toBe(429);
      expect(response.body.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(response.body.message).toContain('100');
      expect(response.body.message).toContain('60');
      expect(response.body.metadata).toHaveProperty('limit', 100);
      expect(response.body.metadata).toHaveProperty('windowMs', 60000);
    });

    it('debe manejar DatabaseTimeoutError con status 500', async () => {
      const response = await request(app).get('/error/db-timeout');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe(ErrorCode.DATABASE_TIMEOUT);
      expect(response.body.message).toContain('30000');
      expect(response.body.metadata).toHaveProperty('timeoutMs', 30000);
    });
  });

  describe('Generic Error Handling', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);

      app.get('/error/generic', (req: Request, res: Response, next: NextFunction) => {
        next(new Error('Something went wrong'));
      });

      app.get('/error/throw', (req: Request, res: Response, next: NextFunction) => {
        throw new Error('Thrown error');
      });

      app.use(errorHandlerMiddleware);
    });

    it('debe manejar Error genérico con status 500', async () => {
      const response = await request(app).get('/error/generic');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('statusCode', 500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message');
    });

    it('debe incluir message en desarrollo', async () => {
      // Simular NODE_ENV=development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app).get('/error/generic');

      expect(response.body.message).toBe('Something went wrong');

      process.env.NODE_ENV = originalEnv;
    });

    it('debe ocultar message en producción', async () => {
      // Simular NODE_ENV=production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app).get('/error/generic');

      expect(response.body.message).toBe('An unexpected error occurred');

      process.env.NODE_ENV = originalEnv;
    });

    it('debe manejar errores thrown (no next)', async () => {
      const response = await request(app).get('/error/throw');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('statusCode', 500);
    });
  });

  describe('Request ID en Errores', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);

      app.get('/error', (req: Request, res: Response, next: NextFunction) => {
        next(new ValidationError('Test error'));
      });

      app.use(errorHandlerMiddleware);
    });

    it('debe incluir request_id en error response', async () => {
      const response = await request(app).get('/error');

      expect(response.body).toHaveProperty('request_id');
      expect(response.body.request_id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('debe incluir mismo request_id en header y body', async () => {
      const response = await request(app).get('/error');

      expect(response.headers['x-request-id']).toBe(response.body.request_id);
    });

    it('debe usar request_id del cliente si existe', async () => {
      const customRequestId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .get('/error')
        .set('X-Request-ID', customRequestId);

      expect(response.body.request_id).toBe(customRequestId);
      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('Error Metadata', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);

      app.get('/error/with-metadata', (req: Request, res: Response, next: NextFunction) => {
        next(
          new TypedError(
            'Custom error with metadata',
            ErrorCode.INTERNAL_ERROR,
            500,
            {
              custom_field: 'custom_value',
              error_context: 'test context',
            }
          )
        );
      });

      app.use(errorHandlerMiddleware);
    });

    it('debe incluir metadata personalizada en response', async () => {
      const response = await request(app).get('/error/with-metadata');

      expect(response.body.metadata).toHaveProperty('custom_field', 'custom_value');
      expect(response.body.metadata).toHaveProperty('error_context', 'test context');
    });

    it('debe incluir timestamp en metadata', async () => {
      const response = await request(app).get('/error/with-metadata');

      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('debe incluir request_id en metadata', async () => {
      const response = await request(app).get('/error/with-metadata');

      expect(response.body).toHaveProperty('request_id');
      expect(response.body.request_id).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('Error Format', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);

      app.get('/error', (req: Request, res: Response, next: NextFunction) => {
        next(new ValidationError('Test validation error'));
      });

      app.use(errorHandlerMiddleware);
    });

    it('debe tener estructura de error estándar', async () => {
      const response = await request(app).get('/error');

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('request_id');
    });

    it('debe retornar Content-Type application/json', async () => {
      const response = await request(app).get('/error');

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('debe serializar correctamente a JSON', async () => {
      const response = await request(app).get('/error');

      // Debe poder parsear sin error
      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
    });
  });

  describe('Multiple Errors', () => {
    beforeEach(() => {
      app = express();
      app.use(requestIdMiddleware);

      app.get('/error/multi', (req: Request, res: Response, next: NextFunction) => {
        // Simular múltiples errores de validación
        const error = new ValidationError('Multiple validation errors');
        error.metadata.errors = [
          { field: 'email', message: 'Email inválido' },
          { field: 'password', message: 'Password muy corto' },
        ];
        next(error);
      });

      app.use(errorHandlerMiddleware);
    });

    it('debe incluir múltiples errores en metadata', async () => {
      const response = await request(app).get('/error/multi');

      expect(response.body.metadata).toHaveProperty('errors');
      expect(Array.isArray(response.body.metadata.errors)).toBe(true);
      expect(response.body.metadata.errors).toHaveLength(2);
    });
  });
});
