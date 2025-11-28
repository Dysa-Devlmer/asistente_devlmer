/**
 * Config Manager Unit Tests
 */

const { describe, it, expect, beforeEach } = require('@jest/globals');

describe('ConfigManager', () => {
  let ConfigManager;

  beforeEach(() => {
    // Clear module cache
    jest.resetModules();
    // Reload config manager
    ConfigManager = require('../../core/config-manager');
  });

  describe('Configuration Loading', () => {
    it('should load default configuration', () => {
      const config = ConfigManager.getAll();

      expect(config).toBeDefined();
      expect(config.env).toBeDefined();
      expect(config.server).toBeDefined();
      expect(config.database).toBeDefined();
    });

    it('should have correct default server port', () => {
      const port = ConfigManager.get('server.port');
      expect(port).toBe(7777);
    });

    it('should return null for non-existent config key', () => {
      const value = ConfigManager.get('nonexistent.key');
      expect(value).toBeNull();
    });

    it('should return default value for non-existent key', () => {
      const value = ConfigManager.get('nonexistent.key', 'default');
      expect(value).toBe('default');
    });
  });

  describe('Configuration Export', () => {
    it('should export configuration without secrets', () => {
      const exported = ConfigManager.export(false);

      expect(exported.security.jwtSecret).toBe('***HIDDEN***');

      if (exported.database.password) {
        expect(exported.database.password).toBe('***HIDDEN***');
      }
    });

    it('should export configuration with secrets if requested', () => {
      const exported = ConfigManager.export(true);

      expect(exported.security.jwtSecret).not.toBe('***HIDDEN***');
    });
  });

  describe('Dot Notation Access', () => {
    it('should access nested config with dot notation', () => {
      const dbType = ConfigManager.get('database.type');
      expect(dbType).toBe('sqlite');
    });

    it('should access deeply nested config', () => {
      const corsOrigin = ConfigManager.get('server.cors.origin');
      expect(corsOrigin).toBeDefined();
    });
  });

  describe('Runtime Configuration', () => {
    it('should allow setting config at runtime', () => {
      ConfigManager.set('custom.value', 'test');
      const value = ConfigManager.get('custom.value');
      expect(value).toBe('test');
    });

    it('should allow setting nested config at runtime', () => {
      ConfigManager.set('custom.nested.value', 123);
      const value = ConfigManager.get('custom.nested.value');
      expect(value).toBe(123);
    });
  });
});
