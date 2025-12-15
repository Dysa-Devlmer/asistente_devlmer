/**
 * E2E Tests - Sistema de Pagos
 *
 * Tests end-to-end completos para el sistema de pagos
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { Pool } from 'mysql2/promise';
import { requestIdMiddleware } from '../../../src/common/middleware/request-id.middleware';
import { errorHandlerMiddleware } from '../../../src/common/middleware/error-handler.middleware';
import { createPagosRouter } from '../../../src/modules/pagos/pagos.module';

describe('Sistema de Pagos E2E', () => {
  let app: Application;
  let db: Pool;

  beforeAll(async () => {
    // Mock DB pool
    db = {
      execute: jest.fn(),
      getConnection: jest.fn(() => ({
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        execute: jest.fn(),
      })),
    } as any;

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use(requestIdMiddleware);
    app.use('/api/pagos', createPagosRouter(db));
    app.use(errorHandlerMiddleware);
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/pagos/crear', () => {
    it('debe crear pago en efectivo exitosamente', async () => {
      const requestBody = {
        venta_id: '660e8400-e29b-41d4-a716-446655440001',
        sesion_caja_id: '770e8400-e29b-41d4-a716-446655440002',
        forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
        empleado_id: '990e8400-e29b-41d4-a716-446655440004',
        monto: 15000,
        metodo: 'efectivo',
        monto_recibido: 20000,
      };

      // Mocks
      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // pago no existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // venta existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // forma pago existe
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // crear pago
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // actualizar pago

      const response = await request(app)
        .post('/api/pagos/crear')
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('pago_id');
      expect(response.body.data).toHaveProperty('estado', 'approved');
      expect(response.body.data).toHaveProperty('monto', 15000);
      expect(response.body.data).toHaveProperty('monto_cambio', 5000);
    });

    it('debe iniciar pago Webpay exitosamente', async () => {
      const requestBody = {
        venta_id: '660e8400-e29b-41d4-a716-446655440001',
        forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
        empleado_id: '990e8400-e29b-41d4-a716-446655440004',
        monto: 15000,
        metodo: 'webpay',
      };

      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // pago no existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // venta existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // forma pago existe
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // crear pago
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // actualizar pago
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // crear intento

      const response = await request(app)
        .post('/api/pagos/crear')
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('estado', 'processing');
      expect(response.body.data).toHaveProperty('webpay_token');
      expect(response.body.data).toHaveProperty('webpay_url');
    });

    it('debe retornar 400 si falta venta_id', async () => {
      const response = await request(app)
        .post('/api/pagos/crear')
        .send({
          forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
          empleado_id: '990e8400-e29b-41d4-a716-446655440004',
          monto: 15000,
          metodo: 'efectivo',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('debe retornar 404 si venta no existe', async () => {
      const requestBody = {
        venta_id: '660e8400-e29b-41d4-a716-446655440001',
        forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
        empleado_id: '990e8400-e29b-41d4-a716-446655440004',
        monto: 15000,
        metodo: 'efectivo',
        monto_recibido: 20000,
      };

      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // pago no existe
        .mockResolvedValueOnce([[{ existe: 0 }]]); // venta NO existe

      const response = await request(app)
        .post('/api/pagos/crear')
        .send(requestBody);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'VENTA_NOT_FOUND');
    });
  });

  describe('GET /api/pagos/:id', () => {
    it('debe retornar pago por ID', async () => {
      const pagoId = '550e8400-e29b-41d4-a716-446655440000';
      const pago = {
        id: pagoId,
        numero_pago: 'PAG-001',
        venta_id: '660e8400-e29b-41d4-a716-446655440001',
        forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
        estado: 'approved',
        metodo: 'efectivo',
        monto: '15000.00',
        monto_pagado: '15000.00',
        fecha_inicio: new Date(),
        fecha_completado: new Date(),
        empleado_id: '990e8400-e29b-41d4-a716-446655440004',
        esta_activo: true,
        intentos_procesamiento: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.execute as jest.Mock).mockResolvedValueOnce([[pago]]);

      const response = await request(app)
        .get(`/api/pagos/${pagoId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pago_id', pagoId);
      expect(response.body.data).toHaveProperty('estado', 'approved');
    });

    it('debe retornar 404 si pago no existe', async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/pagos/550e8400-e29b-41d4-a716-446655440000');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'PAGO_NOT_FOUND');
    });
  });

  describe('Request ID Tracking', () => {
    it('debe incluir request_id en response', async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/pagos/550e8400-e29b-41d4-a716-446655440000');

      expect(response.headers).toHaveProperty('x-request-id');
    });
  });
});
