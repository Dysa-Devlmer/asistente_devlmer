/**
 * Unit Tests - Typed Errors
 */

import { describe, it, expect } from '@jest/globals';
import {
  TypedError,
  ValidationError,
  InvalidUUIDError,
  SucursalNotFoundError,
  RateLimitExceededError,
  DatabaseTimeoutError,
  ErrorCode,
} from '../../../src/common/errors/typed-errors';

describe('Typed Errors', () => {
  describe('TypedError', () => {
    it('debe crear error con código y metadata', () => {
      const error = new TypedError(
        'Test error',
        ErrorCode.INTERNAL_ERROR,
        500,
        { test_field: 'test_value' }
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.metadata.test_field).toBe('test_value');
      expect(error.metadata.timestamp).toBeDefined();
    });

    it('debe convertir a JSON correctamente', () => {
      const error = new TypedError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { field: 'test' }
      );

      const json = error.toJSON();

      expect(json).toHaveProperty('statusCode', 400);
      expect(json).toHaveProperty('error', 'Bad Request');
      expect(json).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('metadata');
    });
  });

  describe('ValidationError', () => {
    it('debe crear error de validación con status 400', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
    });
  });

  describe('InvalidUUIDError', () => {
    it('debe crear error de UUID inválido con metadata', () => {
      const error = new InvalidUUIDError('sucursal_id', 'invalid-uuid');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.INVALID_UUID);
      expect(error.message).toContain('sucursal_id');
      expect(error.message).toContain('invalid-uuid');
      expect(error.metadata.fieldName).toBe('sucursal_id');
      expect(error.metadata.value).toBe('invalid-uuid');
    });
  });

  describe('SucursalNotFoundError', () => {
    it('debe crear error de sucursal no encontrada', () => {
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';
      const error = new SucursalNotFoundError(sucursalId);

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCode.SUCURSAL_NOT_FOUND);
      expect(error.message).toContain(sucursalId);
      expect(error.metadata.sucursalId).toBe(sucursalId);
    });
  });

  describe('RateLimitExceededError', () => {
    it('debe crear error de rate limit con límites', () => {
      const error = new RateLimitExceededError(100, 60000);

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.message).toContain('100');
      expect(error.message).toContain('60');
      expect(error.metadata.limit).toBe(100);
      expect(error.metadata.windowMs).toBe(60000);
    });
  });

  describe('DatabaseTimeoutError', () => {
    it('debe crear error de timeout con duración', () => {
      const error = new DatabaseTimeoutError(30000);

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.DATABASE_TIMEOUT);
      expect(error.message).toContain('30000');
      expect(error.metadata.timeoutMs).toBe(30000);
    });
  });
});
