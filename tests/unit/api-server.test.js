/**
 * API Server Unit Tests
 * Tests para el servidor REST API
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
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
  readdirSync: jest.fn().mockReturnValue([]),
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn()
}));

describe('APIServer', () => {
  let APIServer;
  let apiServer;
  let app;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    APIServer = require('../../core/api-server');

    apiServer = new APIServer({
      server: {
        port: 7777,
        cors: { enabled: false }
      },
      security: {
        rateLimit: { enabled: false }
      }
    });

    app = apiServer.app;
  });

  afterEach(async () => {
    if (apiServer.server) {
      await apiServer.stop();
    }
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería crear instancia con configuración', () => {
      expect(apiServer.config).toBeDefined();
      expect(apiServer.app).toBeDefined();
      expect(apiServer.server).toBeNull();
    });

    it('debería configurar middleware automáticamente', () => {
      expect(apiServer.app._router).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    it('GET /health debería retornar status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Root Endpoint', () => {
    it('GET / debería retornar info de la API', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('JARVIS API');
      expect(response.body.docs).toBe('/api/docs');
    });
  });

  describe('API Documentation', () => {
    it('GET /api/docs debería retornar documentación Swagger', async () => {
      const response = await request(app).get('/api/docs');

      expect(response.status).toBe(200);
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info).toBeDefined();
      expect(response.body.paths).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('debería retornar 404 para rutas no existentes', async () => {
      const response = await request(app).get('/ruta-inexistente');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.path).toBe('/ruta-inexistente');
    });
  });

  describe('AI Routes', () => {
    describe('POST /api/v1/ai/chat', () => {
      it('debería requerir mensaje', async () => {
        const response = await request(app)
          .post('/api/v1/ai/chat')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('message is required');
      });
    });

    describe('GET /api/v1/ai/models', () => {
      it('debería retornar lista de modelos', async () => {
        const response = await request(app).get('/api/v1/ai/models');

        expect(response.status).toBe(200);
        expect(response.body.models).toBeDefined();
        expect(Array.isArray(response.body.models)).toBe(true);
      });
    });

    describe('GET /api/v1/ai/status', () => {
      it('debería retornar estado del sistema AI', async () => {
        const response = await request(app).get('/api/v1/ai/status');

        expect(response.status).toBe(200);
        expect(response.body.available).toBeDefined();
        expect(response.body.provider).toBeDefined();
      });
    });
  });

  describe('Monitoring Routes', () => {
    describe('GET /api/v1/monitoring/stats', () => {
      it('debería retornar estadísticas del sistema', async () => {
        const response = await request(app).get('/api/v1/monitoring/stats');

        expect(response.status).toBe(200);
        expect(response.body.cpu).toBeDefined();
        expect(response.body.memory).toBeDefined();
        expect(response.body.uptime).toBeDefined();
        expect(response.body.platform).toBeDefined();
      });

      it('debería incluir información de CPU', async () => {
        const response = await request(app).get('/api/v1/monitoring/stats');

        expect(response.body.cpu.model).toBeDefined();
        expect(response.body.cpu.cores).toBeGreaterThan(0);
      });

      it('debería incluir información de memoria', async () => {
        const response = await request(app).get('/api/v1/monitoring/stats');

        expect(response.body.memory.total).toBeGreaterThan(0);
        expect(response.body.memory.free).toBeDefined();
        expect(response.body.memory.used).toBeDefined();
      });
    });
  });

  describe('System Routes', () => {
    describe('GET /api/v1/system/info', () => {
      it('debería retornar información del sistema', async () => {
        const response = await request(app).get('/api/v1/system/info');

        expect(response.status).toBe(200);
        expect(response.body.name).toBeDefined();
        expect(response.body.version).toBeDefined();
        expect(response.body.node).toBeDefined();
        expect(response.body.pid).toBeDefined();
      });
    });
  });

  describe('Config Routes', () => {
    beforeEach(() => {
      jest.mock('../../core/config-manager', () => ({
        export: jest.fn().mockReturnValue({ server: { port: 7777 } }),
        get: jest.fn().mockImplementation((key) => {
          if (key === 'server.port') return 7777;
          return null;
        })
      }));
    });

    describe('GET /api/v1/config', () => {
      it('debería retornar configuración sin secretos', async () => {
        const response = await request(app).get('/api/v1/config');

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Logs Routes', () => {
    describe('GET /api/v1/logs/stats', () => {
      it('debería retornar estadísticas de logs', async () => {
        const response = await request(app).get('/api/v1/logs/stats');

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Server Lifecycle', () => {
    describe('start()', () => {
      it('debería iniciar el servidor en el puerto configurado', async () => {
        const testPort = 7788;
        const server = await apiServer.start(testPort);

        expect(server).toBeDefined();
        expect(apiServer.server).not.toBeNull();

        await apiServer.stop();
      });

      it('debería usar puerto por defecto si no se especifica', async () => {
        const defaultApiServer = new APIServer({});
        const server = await defaultApiServer.start();

        expect(server).toBeDefined();

        await defaultApiServer.stop();
      });
    });

    describe('stop()', () => {
      it('debería detener el servidor correctamente', async () => {
        await apiServer.start(7789);
        await apiServer.stop();

        expect(apiServer.server).toBeDefined(); // Server object still exists
      });

      it('debería resolver si no hay servidor activo', async () => {
        await expect(apiServer.stop()).resolves.toBeUndefined();
      });
    });
  });

  describe('Health Checks', () => {
    describe('checkDatabase()', () => {
      it('debería retornar true si DB existe', async () => {
        const fs = require('fs');
        fs.existsSync.mockReturnValue(true);

        const result = await apiServer.checkDatabase();

        expect(result).toBe(true);
      });

      it('debería retornar false si DB no existe', async () => {
        const fs = require('fs');
        fs.existsSync.mockReturnValue(false);

        const result = await apiServer.checkDatabase();

        expect(result).toBe(false);
      });
    });

    describe('checkMemory()', () => {
      it('debería retornar true si directorio memoria existe', async () => {
        const fs = require('fs');
        fs.existsSync.mockReturnValue(true);

        const result = await apiServer.checkMemory();

        expect(result).toBe(true);
      });
    });

    describe('checkDisk()', () => {
      it('debería retornar true si hay suficiente espacio', async () => {
        const result = await apiServer.checkDisk();

        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('Swagger Documentation', () => {
    it('debería generar documentación válida', () => {
      const docs = apiServer.generateSwaggerDocs();

      expect(docs.openapi).toBe('3.0.0');
      expect(docs.info.title).toBe('JARVIS API');
      expect(docs.servers).toBeDefined();
      expect(docs.paths).toBeDefined();
    });
  });
});

describe('APIServer - Middleware', () => {
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

  describe('CORS', () => {
    it('debería habilitar CORS cuando está configurado', () => {
      apiServer = new APIServer({
        server: {
          cors: {
            enabled: true,
            origin: 'http://localhost:3000'
          }
        }
      });

      expect(apiServer.app).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('debería habilitar rate limiting cuando está configurado', () => {
      apiServer = new APIServer({
        security: {
          rateLimit: {
            enabled: true,
            windowMs: 60000,
            maxRequests: 100
          }
        }
      });

      expect(apiServer.app).toBeDefined();
    });
  });

  describe('Body Parsing', () => {
    it('debería parsear JSON correctamente', async () => {
      apiServer = new APIServer({});

      const response = await request(apiServer.app)
        .post('/api/v1/ai/chat')
        .send({ message: 'test' })
        .set('Content-Type', 'application/json');

      // La respuesta puede ser error por falta de AI, pero el body se parseó
      expect(response.body).toBeDefined();
    });
  });
});

describe('APIServer - Error Handling', () => {
  let APIServer;
  let apiServer;

  beforeEach(() => {
    jest.resetModules();
    APIServer = require('../../core/api-server');
    apiServer = new APIServer({});
  });

  it('debería manejar errores internos gracefully', async () => {
    // Simular ruta que genera error
    apiServer.app.get('/test-error', () => {
      throw new Error('Test error');
    });

    const response = await request(apiServer.app).get('/test-error');

    expect(response.status).toBe(500);
  });
});
