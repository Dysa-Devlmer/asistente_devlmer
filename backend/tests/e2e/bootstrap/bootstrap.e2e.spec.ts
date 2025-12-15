/**
 * E2E Tests - Bootstrap API
 *
 * Test Cases según: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 *
 * NOTA: Estos tests requieren una base de datos con datos de prueba
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import mysql from 'mysql2/promise';
import { createBootstrapRouter } from '../../../src/modules/bootstrap/bootstrap.module';

describe('Bootstrap API E2E Tests', () => {
  let app: Express;
  let db: any;
  const validSucursalId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    // Configurar Express app
    app = express();
    app.use(express.json());

    // Conectar a base de datos de prueba
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME_TEST || 'pos_venta_test',
    });

    // Registrar rutas
    app.use('/api/bootstrap', createBootstrapRouter(db));
  });

  afterAll(async () => {
    if (db) {
      await db.end();
    }
  });

  describe('GET /api/bootstrap/catalogo', () => {
    it('TC-HEAD-001: debe incluir headers obligatorios', async () => {
      const response = await request(app)
        .get('/api/bootstrap/catalogo')
        .query({ sucursal_id: validSucursalId });

      expect(response.headers['x-bootstrap-version']).toBe('2.0.0');
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    });

    it('TC-HEAD-002: debe retornar estructura de response consistente', async () => {
      const response = await request(app)
        .get('/api/bootstrap/catalogo')
        .query({ sucursal_id: validSucursalId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bootstrap_version', '2.0.0');
      expect(response.body).toHaveProperty('generated_at');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('sucursal_id');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('catalogo');
    });

    it('debe retornar error 400 si falta sucursal_id', async () => {
      const response = await request(app).get('/api/bootstrap/catalogo');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('sucursal_id es requerido');
    });

    it('debe retornar error 400 si sucursal_id no es UUID', async () => {
      const response = await request(app)
        .get('/api/bootstrap/catalogo')
        .query({ sucursal_id: 'invalid-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('UUID válido');
    });

    it('debe retornar error 400 si limit > 100', async () => {
      const response = await request(app)
        .get('/api/bootstrap/catalogo')
        .query({ sucursal_id: validSucursalId, limit: 200 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('limit max es 100');
    });
  });

  describe('GET /api/bootstrap/empleados', () => {
    it('TC-EMP-003: debe excluir campos sensibles', async () => {
      const response = await request(app)
        .get('/api/bootstrap/empleados')
        .query({ sucursal_id: validSucursalId });

      expect(response.status).toBe(200);

      if (response.body.data.empleados.length > 0) {
        const empleado = response.body.data.empleados[0];
        expect(empleado).not.toHaveProperty('password_hash');
        expect(empleado).not.toHaveProperty('pin_hash');
        expect(empleado).not.toHaveProperty('token_sesion');
      }
    });

    it('debe incluir headers obligatorios', async () => {
      const response = await request(app)
        .get('/api/bootstrap/empleados')
        .query({ sucursal_id: validSucursalId });

      expect(response.headers['x-bootstrap-version']).toBe('2.0.0');
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    });
  });

  describe('GET /api/bootstrap/delta', () => {
    it('TC-DELTA-007: debe retornar array vacío si since es futuro', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const since = futureDate.toISOString();

      const response = await request(app)
        .get('/api/bootstrap/delta')
        .query({ sucursal_id: validSucursalId, since });

      expect(response.status).toBe(200);
      expect(response.body.data.total_changes).toBe(0);
      expect(response.body.data.changes).toHaveLength(0);
    });

    it('debe retornar error 400 si falta since', async () => {
      const response = await request(app)
        .get('/api/bootstrap/delta')
        .query({ sucursal_id: validSucursalId });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('since es requerido');
    });

    it('debe retornar error 400 si since no es ISO 8601', async () => {
      const response = await request(app)
        .get('/api/bootstrap/delta')
        .query({ sucursal_id: validSucursalId, since: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ISO 8601');
    });

    it('debe incluir headers obligatorios', async () => {
      const since = new Date('2025-01-01T00:00:00.000Z').toISOString();

      const response = await request(app)
        .get('/api/bootstrap/delta')
        .query({ sucursal_id: validSucursalId, since });

      expect(response.headers['x-bootstrap-version']).toBe('2.0.0');
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    });
  });
});
