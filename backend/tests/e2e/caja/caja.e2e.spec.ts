/**
 * E2E Tests - Sistema de Caja
 *
 * Tests end-to-end completos para el sistema de caja
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { Pool } from 'mysql2/promise';
import { requestIdMiddleware } from '../../../src/common/middleware/request-id.middleware';
import { errorHandlerMiddleware } from '../../../src/common/middleware/error-handler.middleware';
import { createCajaRouter } from '../../../src/modules/caja/caja.module';

describe('Sistema de Caja E2E', () => {
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
    app.use('/api/caja', createCajaRouter(db));
    app.use(errorHandlerMiddleware);
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/caja/abrir', () => {
    it('debe abrir caja exitosamente', async () => {
      const requestBody = {
        sucursal_id: '550e8400-e29b-41d4-a716-446655440000',
        empleado_id: '660e8400-e29b-41d4-a716-446655440001',
        monto_inicial: 1000,
        notas: 'Apertura turno mañana',
      };

      // Mocks
      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // sesión no existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // sucursal existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // empleado existe
        .mockResolvedValueOnce([[]]); // no hay sesión abierta

      const connection = await db.getConnection();
      (connection.execute as jest.Mock)
        .mockResolvedValueOnce([[{ next_numero: 123 }]]) // número sesión
        .mockResolvedValueOnce([{ insertId: 1 }]); // insert sesión

      const response = await request(app)
        .post('/api/caja/abrir')
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sesion_id');
      expect(response.body.data).toHaveProperty('numero_sesion');
      expect(response.body.data).toHaveProperty('estado', 'abierta');
      expect(response.body.data.monto_inicial).toBe(1000);
    });

    it('debe retornar 400 si falta sucursal_id', async () => {
      const response = await request(app)
        .post('/api/caja/abrir')
        .send({
          empleado_id: '660e8400-e29b-41d4-a716-446655440001',
          monto_inicial: 1000,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('debe retornar 400 si UUID inválido', async () => {
      const response = await request(app)
        .post('/api/caja/abrir')
        .send({
          sucursal_id: 'invalid-uuid',
          empleado_id: '660e8400-e29b-41d4-a716-446655440001',
          monto_inicial: 1000,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('debe retornar 409 si ya hay caja abierta', async () => {
      const requestBody = {
        sucursal_id: '550e8400-e29b-41d4-a716-446655440000',
        empleado_id: '660e8400-e29b-41d4-a716-446655440001',
        monto_inicial: 1000,
      };

      // Mocks
      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // sesión no existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // sucursal existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // empleado existe
        .mockResolvedValueOnce([[{ id: '770e8400-e29b-41d4-a716-446655440002' }]]); // SÍ hay sesión abierta

      const response = await request(app)
        .post('/api/caja/abrir')
        .send(requestBody);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('code', 'CAJA_ALREADY_OPEN');
    });
  });

  describe('POST /api/caja/cerrar', () => {
    it('debe cerrar caja exitosamente', async () => {
      const requestBody = {
        sesion_id: '770e8400-e29b-41d4-a716-446655440002',
        empleado_id: '660e8400-e29b-41d4-a716-446655440001',
        monto_final_real: 5250,
        notas: 'Cierre turno mañana',
      };

      const sesionAbierta = {
        id: requestBody.sesion_id,
        numero_sesion: 123,
        sucursal_id: '550e8400-e29b-41d4-a716-446655440000',
        empleado_apertura_id: '660e8400-e29b-41d4-a716-446655440001',
        fecha_apertura: new Date(),
        monto_inicial: '1000.00',
        estado: 'abierta',
      };

      // Mocks
      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[sesionAbierta]]) // sesión existe
        .mockResolvedValueOnce([[{ existe: 1 }]]) // empleado existe
        .mockResolvedValueOnce([[{ total: '500.00' }]]) // ingresos
        .mockResolvedValueOnce([[{ total: '200.00' }]]) // egresos
        .mockResolvedValueOnce([[{ total_efectivo: '4000.00' }]]) // efectivo
        .mockResolvedValueOnce([[]]) // totales por forma pago
        .mockResolvedValueOnce([[]]) // movimientos
        .mockResolvedValueOnce([[{ id: sesionAbierta.empleado_apertura_id, nombre: 'Juan', apellido: 'Pérez' }]])
        .mockResolvedValueOnce([[{ id: requestBody.empleado_id, nombre: 'María', apellido: 'González' }]])
        .mockResolvedValueOnce([[{ cantidad_ventas: 10 }]])
        .mockResolvedValueOnce([[{ total_ventas: '4000.00' }]]);

      const connection = await db.getConnection();
      (connection.execute as jest.Mock)
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // update sesión

      const response = await request(app)
        .post('/api/caja/cerrar')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sesion_id');
      expect(response.body.data).toHaveProperty('estado', 'cerrada');
      expect(response.body.data).toHaveProperty('monto_final_esperado');
      expect(response.body.data).toHaveProperty('monto_final_real', 5250);
      expect(response.body.data).toHaveProperty('diferencia');
    });

    it('debe retornar 404 si sesión no existe', async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce([[]]); // sesión NO existe

      const response = await request(app)
        .post('/api/caja/cerrar')
        .send({
          sesion_id: '770e8400-e29b-41d4-a716-446655440002',
          empleado_id: '660e8400-e29b-41d4-a716-446655440001',
          monto_final_real: 5250,
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'SESION_CAJA_NOT_FOUND');
    });
  });

  describe('POST /api/caja/movimiento', () => {
    it('debe crear ingreso exitosamente', async () => {
      const requestBody = {
        sesion_id: '770e8400-e29b-41d4-a716-446655440002',
        empleado_id: '660e8400-e29b-41d4-a716-446655440001',
        tipo: 'ingreso',
        concepto: 'Préstamo de caja principal',
        monto: 500,
      };

      const sesionAbierta = {
        id: requestBody.sesion_id,
        estado: 'abierta',
      };

      // Mocks
      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // movimiento no existe
        .mockResolvedValueOnce([[sesionAbierta]]) // sesión existe y abierta
        .mockResolvedValueOnce([[{ existe: 1 }]]) // empleado existe
        .mockResolvedValueOnce([{ insertId: 1 }]); // insert movimiento

      const response = await request(app)
        .post('/api/caja/movimiento')
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('movimiento_id');
      expect(response.body.data).toHaveProperty('tipo', 'ingreso');
      expect(response.body.data).toHaveProperty('monto', 500);
    });

    it('debe crear egreso exitosamente', async () => {
      const requestBody = {
        sesion_id: '770e8400-e29b-41d4-a716-446655440002',
        empleado_id: '660e8400-e29b-41d4-a716-446655440001',
        tipo: 'egreso',
        concepto: 'Pago a proveedor',
        monto: 300,
      };

      const sesionAbierta = {
        id: requestBody.sesion_id,
        estado: 'abierta',
      };

      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // movimiento no existe
        .mockResolvedValueOnce([[sesionAbierta]])
        .mockResolvedValueOnce([[{ existe: 1 }]])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/caja/movimiento')
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('tipo', 'egreso');
    });

    it('debe retornar 409 si caja está cerrada', async () => {
      const sesionCerrada = {
        id: '770e8400-e29b-41d4-a716-446655440002',
        estado: 'cerrada',
      };

      (db.execute as jest.Mock)
        .mockResolvedValueOnce([[]]) // movimiento no existe
        .mockResolvedValueOnce([[sesionCerrada]]); // sesión cerrada

      const response = await request(app)
        .post('/api/caja/movimiento')
        .send({
          sesion_id: sesionCerrada.id,
          empleado_id: '660e8400-e29b-41d4-a716-446655440001',
          tipo: 'ingreso',
          concepto: 'Test',
          monto: 100,
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('code', 'CAJA_ALREADY_CLOSED');
    });
  });

  describe('GET /api/caja/activa', () => {
    it('debe retornar sesión activa si existe', async () => {
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';
      const sesionActiva = {
        id: '770e8400-e29b-41d4-a716-446655440002',
        numero_sesion: 123,
        estado: 'abierta',
        fecha_apertura: new Date(),
        monto_inicial: '1000.00',
        empleado_apertura_id: '660e8400-e29b-41d4-a716-446655440001',
      };

      (db.execute as jest.Mock).mockResolvedValueOnce([[sesionActiva]]);

      const response = await request(app)
        .get(`/api/caja/activa?sucursal_id=${sucursalId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).not.toBeNull();
      expect(response.body.data).toHaveProperty('sesion_id');
      expect(response.body.data).toHaveProperty('estado', 'abierta');
    });

    it('debe retornar null si no hay sesión activa', async () => {
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';

      (db.execute as jest.Mock).mockResolvedValueOnce([[]]); // no hay sesión

      const response = await request(app)
        .get(`/api/caja/activa?sucursal_id=${sucursalId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });

    it('debe retornar 400 si falta sucursal_id', async () => {
      const response = await request(app).get('/api/caja/activa');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'MISSING_REQUIRED_PARAM');
    });
  });

  describe('Request ID Tracking', () => {
    it('debe incluir request_id en response', async () => {
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';
      (db.execute as jest.Mock).mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get(`/api/caja/activa?sucursal_id=${sucursalId}`);

      expect(response.headers).toHaveProperty('x-request-id');
    });

    it('debe usar request_id del cliente si existe', async () => {
      const customRequestId = '550e8400-e29b-41d4-a716-446655440000';
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';
      (db.execute as jest.Mock).mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get(`/api/caja/activa?sucursal_id=${sucursalId}`)
        .set('X-Request-ID', customRequestId);

      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });
});
