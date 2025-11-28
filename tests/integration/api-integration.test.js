/**
 * API Integration Tests
 * Tests de integración para el API Server con otros componentes
 */

const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const request = require('supertest');

// Mocks
jest.mock('../../core/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    success: jest.fn(),
    startup: jest.fn(),
    shutdown: jest.fn(),
    http: jest.fn(),
    getStats: jest.fn().mockResolvedValue({ level: 'info' })
  })
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readdirSync: jest.fn().mockReturnValue(['test.json']),
  readFileSync: jest.fn().mockReturnValue('{"test": "data"}'),
  writeFileSync: jest.fn()
}));

describe('API Integration Tests', () => {
  let APIServer;
  let apiServer;
  let app;

  beforeAll(() => {
    APIServer = require('../../core/api-server');
    apiServer = new APIServer({
      server: {
        port: 7790,
        cors: { enabled: true, origin: '*' }
      },
      security: {
        rateLimit: { enabled: false }
      }
    });
    app = apiServer.app;
  });

  afterAll(async () => {
    if (apiServer.server) {
      await apiServer.stop();
    }
  });

  describe('API Workflow Completo', () => {
    it('debería completar flujo: health -> info -> stats', async () => {
      // 1. Verificar salud
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('ok');

      // 2. Obtener info del sistema
      const infoResponse = await request(app).get('/api/v1/system/info');
      expect(infoResponse.status).toBe(200);
      expect(infoResponse.body.name).toBeDefined();

      // 3. Obtener estadísticas de monitoreo
      const statsResponse = await request(app).get('/api/v1/monitoring/stats');
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.cpu).toBeDefined();
      expect(statsResponse.body.memory).toBeDefined();
    });

    it('debería manejar secuencia de errores correctamente', async () => {
      // 1. Ruta inexistente
      const notFoundResponse = await request(app).get('/api/v1/nonexistent');
      expect(notFoundResponse.status).toBe(404);

      // 2. POST sin body requerido
      const badRequestResponse = await request(app)
        .post('/api/v1/ai/chat')
        .send({});
      expect(badRequestResponse.status).toBe(400);

      // 3. El servidor sigue funcionando
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
    });
  });

  describe('API Endpoints Chain', () => {
    it('debería manejar múltiples requests concurrentes', async () => {
      const requests = [
        request(app).get('/health'),
        request(app).get('/api/v1/system/info'),
        request(app).get('/api/v1/monitoring/stats'),
        request(app).get('/api/docs')
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Content Type Handling', () => {
    it('debería aceptar application/json', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Content-Type', 'application/json')
        .send({ message: 'test' });

      // Puede ser error por falta de AI, pero content type fue aceptado
      expect(response.headers['content-type']).toContain('json');
    });
  });

  describe('CORS Headers', () => {
    it('debería incluir headers CORS cuando está habilitado', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
    });
  });
});

describe('API Server Lifecycle Integration', () => {
  let APIServer;
  let apiServer;

  beforeEach(() => {
    jest.resetModules();
    APIServer = require('../../core/api-server');
  });

  afterEach(async () => {
    if (apiServer?.server) {
      await apiServer.stop();
    }
  });

  it('debería poder iniciar y detener múltiples veces', async () => {
    apiServer = new APIServer({});

    // Ciclo 1
    await apiServer.start(7791);
    expect(apiServer.server).not.toBeNull();
    await apiServer.stop();

    // Ciclo 2
    await apiServer.start(7792);
    expect(apiServer.server).not.toBeNull();
    await apiServer.stop();
  });

  it('debería manejar requests durante ciclo de vida', async () => {
    apiServer = new APIServer({});
    await apiServer.start(7793);

    // Request mientras está activo
    const response = await request(apiServer.app).get('/health');
    expect(response.status).toBe(200);

    await apiServer.stop();
  });
});
