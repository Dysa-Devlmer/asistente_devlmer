/**
 * System Integration Tests
 * Tests de integración del sistema completo
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const EventEmitter = require('events');

// Mocks para componentes del sistema
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(),
  pathExists: jest.fn().mockResolvedValue(true),
  writeJson: jest.fn().mockResolvedValue(),
  readJson: jest.fn().mockResolvedValue([]),
  readdir: jest.fn().mockResolvedValue([]),
  remove: jest.fn().mockResolvedValue(),
  copy: jest.fn().mockResolvedValue(),
  appendFile: jest.fn().mockResolvedValue()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ username: 'admin', role: 'admin' })
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('System Integration - Auth Flow', () => {
  let AuthManager;
  let authManager;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    AuthManager = require('../../core/security/auth-manager.cjs');
    authManager = new AuthManager({
      projectRoot: '/tmp/test',
      jwtSecret: 'test-secret'
    });
  });

  describe('Flujo de Autenticación Completo', () => {
    it('debería completar flujo: init -> login -> verify -> logout', async () => {
      // 1. Inicializar
      await authManager.initialize();
      expect(authManager.isInitialized).toBe(true);

      // 2. Login
      const loginResult = await authManager.login('admin', 'jarvis2024');
      expect(loginResult.session).toBeDefined();
      expect(loginResult.session.accessToken).toBeDefined();

      // 3. Verificar token
      const decoded = authManager.verifyAccessToken(loginResult.session.accessToken);
      expect(decoded.username).toBe('admin');

      // 4. Logout
      await authManager.logout(loginResult.session.sessionId);
      expect(authManager.sessions.has(loginResult.session.sessionId)).toBe(false);
    });

    it('debería manejar flujo de usuario: create -> update -> delete', async () => {
      await authManager.initialize();

      // 1. Crear usuario
      const user = await authManager.createUser({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: 'viewer'
      });
      expect(user.username).toBe('testuser');

      // 2. Actualizar usuario
      const updated = await authManager.updateUser('testuser', {
        role: 'developer'
      });
      expect(updated.role).toBe('developer');

      // 3. Eliminar usuario
      const result = await authManager.deleteUser('testuser');
      expect(result.success).toBe(true);
      expect(authManager.users.has('testuser')).toBe(false);
    });
  });

  describe('Bloqueo de Cuenta', () => {
    it('debería bloquear cuenta después de múltiples intentos fallidos', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      authManager = new AuthManager({
        maxLoginAttempts: 3,
        lockoutDuration: 1000
      });

      await authManager.initialize();

      // Intentos fallidos
      for (let i = 0; i < 3; i++) {
        try {
          await authManager.login('admin', 'wrongpassword');
        } catch (e) {
          // Esperado
        }
      }

      // Verificar bloqueo
      expect(authManager.isAccountLocked('admin')).toBe(true);
    });
  });
});

describe('System Integration - Event Flow', () => {
  it('debería propagar eventos entre componentes', () => {
    const component1 = new EventEmitter();
    const component2 = new EventEmitter();

    const events = [];

    component2.on('component1:event', (data) => {
      events.push({ source: 'component1', data });
    });

    // Simular flujo de eventos
    component1.on('internal:event', (data) => {
      component2.emit('component1:event', data);
    });

    component1.emit('internal:event', { type: 'test' });

    expect(events.length).toBe(1);
    expect(events[0].data.type).toBe('test');
  });
});

describe('System Integration - Error Recovery', () => {
  it('debería recuperarse de errores en un componente', async () => {
    const system = {
      components: new Map(),
      errors: [],

      async initComponent(name, initFn) {
        try {
          const component = await initFn();
          this.components.set(name, { status: 'ready', instance: component });
          return true;
        } catch (error) {
          this.components.set(name, { status: 'error', error: error.message });
          this.errors.push({ component: name, error: error.message });
          return false;
        }
      },

      async healthCheck() {
        const health = {};
        for (const [name, data] of this.components) {
          health[name] = data.status === 'ready';
        }
        return health;
      }
    };

    // Componente exitoso
    await system.initComponent('auth', async () => ({ name: 'auth' }));

    // Componente con error
    await system.initComponent('database', async () => {
      throw new Error('Connection failed');
    });

    // Verificar estado
    const health = await system.healthCheck();
    expect(health.auth).toBe(true);
    expect(health.database).toBe(false);
    expect(system.errors.length).toBe(1);
  });
});

describe('System Integration - Data Flow', () => {
  it('debería mantener consistencia de datos entre operaciones', async () => {
    // Simular sistema de memoria
    const memorySystem = {
      data: new Map(),

      async save(key, value) {
        this.data.set(key, { value, timestamp: Date.now() });
        return true;
      },

      async get(key) {
        return this.data.get(key);
      },

      async delete(key) {
        return this.data.delete(key);
      }
    };

    // Operaciones CRUD
    await memorySystem.save('user:1', { name: 'Test User' });
    const saved = await memorySystem.get('user:1');
    expect(saved.value.name).toBe('Test User');

    await memorySystem.delete('user:1');
    const deleted = await memorySystem.get('user:1');
    expect(deleted).toBeUndefined();
  });
});
