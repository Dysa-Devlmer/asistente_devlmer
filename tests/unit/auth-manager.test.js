/**
 * Auth Manager Unit Tests
 * Tests para el sistema de autenticación y autorización
 */

const { describe, it, expect, beforeEach, afterEach, jest: jestGlobal } = require('@jest/globals');
const path = require('path');

// Mock de módulos externos
jest.mock('fs-extra');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('AuthManager', () => {
  let AuthManager;
  let authManager;
  const testProjectRoot = '/tmp/test-auth';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock de fs-extra
    fs.ensureDir = jest.fn().mockResolvedValue();
    fs.pathExists = jest.fn().mockResolvedValue(false);
    fs.writeJson = jest.fn().mockResolvedValue();
    fs.readJson = jest.fn().mockResolvedValue([]);
    fs.appendFile = jest.fn().mockResolvedValue();

    // Mock de bcrypt
    bcrypt.hash = jest.fn().mockResolvedValue('$2b$10$hashedpassword');
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    // Mock de jwt
    jwt.sign = jest.fn().mockReturnValue('mock.jwt.token');
    jwt.verify = jest.fn().mockReturnValue({ id: 'admin', username: 'admin', role: 'admin' });

    // Cargar AuthManager
    AuthManager = require('../../core/security/auth-manager.cjs');

    authManager = new AuthManager({
      projectRoot: testProjectRoot,
      jwtSecret: 'test-secret-key',
      jwtExpiration: '1h',
      maxLoginAttempts: 3,
      lockoutDuration: 5000 // 5 segundos para tests
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Limpiar timers si existen
    jest.clearAllTimers();
  });

  describe('Constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      const defaultManager = new AuthManager();

      expect(defaultManager.maxLoginAttempts).toBe(5);
      expect(defaultManager.jwtExpiration).toBe('24h');
      expect(defaultManager.users).toBeInstanceOf(Map);
      expect(defaultManager.sessions).toBeInstanceOf(Map);
    });

    it('debería aceptar configuración personalizada', () => {
      expect(authManager.maxLoginAttempts).toBe(3);
      expect(authManager.jwtExpiration).toBe('1h');
      expect(authManager.projectRoot).toBe(testProjectRoot);
    });

    it('debería tener roles predefinidos', () => {
      expect(authManager.roles.admin).toBeDefined();
      expect(authManager.roles.developer).toBeDefined();
      expect(authManager.roles.viewer).toBeDefined();
      expect(authManager.roles.guest).toBeDefined();
    });
  });

  describe('generateSecret()', () => {
    it('debería generar un secret de 128 caracteres hex', () => {
      const secret = authManager.generateSecret();

      expect(typeof secret).toBe('string');
      expect(secret.length).toBe(128); // 64 bytes = 128 hex chars
      expect(/^[a-f0-9]+$/i.test(secret)).toBe(true);
    });

    it('debería generar secrets únicos', () => {
      const secret1 = authManager.generateSecret();
      const secret2 = authManager.generateSecret();

      expect(secret1).not.toBe(secret2);
    });
  });

  describe('initialize()', () => {
    it('debería crear directorios necesarios', async () => {
      await authManager.initialize();

      expect(fs.ensureDir).toHaveBeenCalledTimes(3);
    });

    it('debería crear usuario admin por defecto si no hay usuarios', async () => {
      await authManager.initialize();

      expect(authManager.users.size).toBe(1);
      expect(authManager.users.has('admin')).toBe(true);
    });

    it('debería cargar usuarios existentes', async () => {
      const existingUsers = [
        { username: 'user1', role: 'viewer' },
        { username: 'user2', role: 'developer' }
      ];

      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(existingUsers);

      await authManager.initialize();

      expect(authManager.users.size).toBe(2);
    });

    it('no debería inicializar dos veces', async () => {
      await authManager.initialize();
      await authManager.initialize();

      // ensureDir solo debería llamarse en la primera inicialización
      expect(fs.ensureDir).toHaveBeenCalledTimes(3);
    });
  });

  describe('login()', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería hacer login exitoso con credenciales válidas', async () => {
      const result = await authManager.login('admin', 'jarvis2024');

      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('admin');
      expect(result.session).toBeDefined();
      expect(result.session.accessToken).toBe('mock.jwt.token');
    });

    it('debería fallar con usuario inexistente', async () => {
      await expect(authManager.login('noexiste', 'password'))
        .rejects.toThrow('Usuario o contraseña incorrectos');
    });

    it('debería fallar con contraseña incorrecta', async () => {
      bcrypt.compare.mockResolvedValue(false);

      await expect(authManager.login('admin', 'wrongpassword'))
        .rejects.toThrow('Usuario o contraseña incorrectos');
    });

    it('debería bloquear cuenta después de máximos intentos', async () => {
      bcrypt.compare.mockResolvedValue(false);

      // Intentar login 3 veces (maxLoginAttempts)
      for (let i = 0; i < 3; i++) {
        try {
          await authManager.login('admin', 'wrong');
        } catch (e) {
          // Esperado
        }
      }

      // El siguiente intento debería indicar cuenta bloqueada
      await expect(authManager.login('admin', 'jarvis2024'))
        .rejects.toThrow(/Cuenta bloqueada/);
    });

    it('debería registrar intento de login en audit log', async () => {
      await authManager.login('admin', 'jarvis2024');

      expect(fs.appendFile).toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    let sessionId;

    beforeEach(async () => {
      await authManager.initialize();
      const loginResult = await authManager.login('admin', 'jarvis2024');
      sessionId = loginResult.session.sessionId;
    });

    it('debería cerrar sesión exitosamente', async () => {
      const result = await authManager.logout(sessionId);

      expect(result.success).toBe(true);
      expect(authManager.sessions.has(sessionId)).toBe(false);
    });

    it('debería fallar con sesión inexistente', async () => {
      await expect(authManager.logout('invalid-session'))
        .rejects.toThrow('Sesión no encontrada');
    });
  });

  describe('verifyAccessToken()', () => {
    it('debería verificar token válido', () => {
      const decoded = authManager.verifyAccessToken('valid.token');

      expect(decoded.username).toBe('admin');
    });

    it('debería rechazar token inválido', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authManager.verifyAccessToken('invalid'))
        .toThrow('Token inválido o expirado');
    });
  });

  describe('refreshAccessToken()', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería refrescar token válido', async () => {
      const result = await authManager.refreshAccessToken('valid.refresh.token');

      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('debería fallar con refresh token inválido', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authManager.refreshAccessToken('invalid'))
        .rejects.toThrow('Refresh token inválido o expirado');
    });
  });

  describe('hasPermission()', () => {
    it('admin debería tener todos los permisos', () => {
      const user = { role: 'admin' };

      expect(authManager.hasPermission(user, 'any:permission')).toBe(true);
      expect(authManager.hasPermission(user, 'another:permission')).toBe(true);
    });

    it('developer debería tener permisos específicos', () => {
      const user = { role: 'developer' };

      expect(authManager.hasPermission(user, 'code:read')).toBe(true);
      expect(authManager.hasPermission(user, 'tasks:create')).toBe(true);
    });

    it('viewer no debería poder ejecutar tareas', () => {
      const user = { role: 'viewer' };

      expect(authManager.hasPermission(user, 'tasks:execute')).toBe(false);
      expect(authManager.hasPermission(user, 'code:read')).toBe(true);
    });

    it('guest debería tener permisos mínimos', () => {
      const user = { role: 'guest' };

      expect(authManager.hasPermission(user, 'code:read')).toBe(true);
      expect(authManager.hasPermission(user, 'tasks:create')).toBe(false);
    });

    it('rol desconocido no debería tener permisos', () => {
      const user = { role: 'unknown' };

      expect(authManager.hasPermission(user, 'any:permission')).toBe(false);
    });
  });

  describe('isSessionValid()', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería validar sesión activa', async () => {
      const loginResult = await authManager.login('admin', 'jarvis2024');

      expect(authManager.isSessionValid(loginResult.session.sessionId)).toBe(true);
    });

    it('debería invalidar sesión inexistente', () => {
      expect(authManager.isSessionValid('invalid-session')).toBe(false);
    });

    it('debería invalidar sesión expirada', async () => {
      const loginResult = await authManager.login('admin', 'jarvis2024');
      const session = authManager.sessions.get(loginResult.session.sessionId);

      // Forzar expiración
      session.expiresAt = Date.now() - 1000;

      expect(authManager.isSessionValid(loginResult.session.sessionId)).toBe(false);
    });
  });

  describe('createUser()', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería crear usuario nuevo', async () => {
      const user = await authManager.createUser({
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123',
        role: 'viewer'
      });

      expect(user.username).toBe('newuser');
      expect(user.email).toBe('new@test.com');
      expect(user.role).toBe('viewer');
      expect(user.password).toBeUndefined(); // Sanitizado
    });

    it('debería rechazar usuario duplicado', async () => {
      await expect(authManager.createUser({
        username: 'admin',
        email: 'admin@test.com',
        password: 'password'
      })).rejects.toThrow('Usuario ya existe');
    });

    it('debería rechazar rol inválido', async () => {
      await expect(authManager.createUser({
        username: 'test',
        email: 'test@test.com',
        password: 'password',
        role: 'superadmin'
      })).rejects.toThrow('Rol inválido');
    });
  });

  describe('updateUser()', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería actualizar email', async () => {
      const updated = await authManager.updateUser('admin', {
        email: 'newemail@test.com'
      });

      expect(updated.email).toBe('newemail@test.com');
    });

    it('debería actualizar rol', async () => {
      await authManager.createUser({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password',
        role: 'viewer'
      });

      const updated = await authManager.updateUser('testuser', {
        role: 'developer'
      });

      expect(updated.role).toBe('developer');
    });

    it('debería fallar con usuario inexistente', async () => {
      await expect(authManager.updateUser('noexiste', {}))
        .rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('deleteUser()', () => {
    beforeEach(async () => {
      await authManager.initialize();
      await authManager.createUser({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password'
      });
    });

    it('debería eliminar usuario', async () => {
      const result = await authManager.deleteUser('testuser');

      expect(result.success).toBe(true);
      expect(authManager.users.has('testuser')).toBe(false);
    });

    it('no debería eliminar usuario admin', async () => {
      await expect(authManager.deleteUser('admin'))
        .rejects.toThrow('No se puede eliminar el usuario admin');
    });

    it('debería fallar con usuario inexistente', async () => {
      await expect(authManager.deleteUser('noexiste'))
        .rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('isAccountLocked()', () => {
    it('debería retornar false si cuenta no está bloqueada', () => {
      expect(authManager.isAccountLocked('admin')).toBe(false);
    });

    it('debería retornar true si cuenta está bloqueada', () => {
      authManager.lockedAccounts.set('testuser', {
        until: Date.now() + 60000, // 1 minuto en el futuro
        attempts: 5
      });

      expect(authManager.isAccountLocked('testuser')).toBe(true);
    });

    it('debería desbloquear cuenta expirada', () => {
      authManager.lockedAccounts.set('testuser', {
        until: Date.now() - 1000, // Ya expiró
        attempts: 5
      });

      expect(authManager.isAccountLocked('testuser')).toBe(false);
      expect(authManager.lockedAccounts.has('testuser')).toBe(false);
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería retornar estadísticas correctas', () => {
      const stats = authManager.getStats();

      expect(stats.totalUsers).toBe(1);
      expect(stats.activeSessions).toBe(0);
      expect(stats.lockedAccounts).toBe(0);
      expect(stats.roleDistribution).toBeDefined();
    });
  });

  describe('sanitizeUser()', () => {
    it('debería remover password del objeto usuario', () => {
      const user = {
        username: 'test',
        email: 'test@test.com',
        password: 'secretpassword',
        role: 'viewer'
      };

      const sanitized = authManager.sanitizeUser(user);

      expect(sanitized.username).toBe('test');
      expect(sanitized.email).toBe('test@test.com');
      expect(sanitized.password).toBeUndefined();
    });
  });

  describe('Events', () => {
    beforeEach(async () => {
      await authManager.initialize();
    });

    it('debería emitir evento en login', async () => {
      const loginHandler = jest.fn();
      authManager.on('login', loginHandler);

      await authManager.login('admin', 'jarvis2024');

      expect(loginHandler).toHaveBeenCalledTimes(1);
    });

    it('debería emitir evento en logout', async () => {
      const logoutHandler = jest.fn();
      authManager.on('logout', logoutHandler);

      const loginResult = await authManager.login('admin', 'jarvis2024');
      await authManager.logout(loginResult.session.sessionId);

      expect(logoutHandler).toHaveBeenCalledTimes(1);
    });

    it('debería emitir evento en creación de usuario', async () => {
      const handler = jest.fn();
      authManager.on('user_created', handler);

      await authManager.createUser({
        username: 'newuser',
        email: 'new@test.com',
        password: 'password'
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
