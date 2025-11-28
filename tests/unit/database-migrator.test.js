/**
 * Database Migrator Unit Tests
 * Tests para el sistema de migraciones de base de datos
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const path = require('path');

// Mocks
jest.mock('fs');
jest.mock('../../core/logger', () => ({
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    success: jest.fn()
  })
}));

const fs = require('fs');

describe('DatabaseMigrator', () => {
  let DatabaseMigrator;
  let migrator;
  let mockDb;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock de fs
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.mkdirSync = jest.fn();
    fs.readdirSync = jest.fn().mockReturnValue([]);
    fs.writeFileSync = jest.fn();

    // Mock de mejor-sqlite3
    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([]),
        run: jest.fn()
      }),
      close: jest.fn()
    };

    jest.mock('better-sqlite3', () => jest.fn().mockReturnValue(mockDb));

    DatabaseMigrator = require('../../core/database-migrator');

    migrator = new DatabaseMigrator({
      migrationsPath: '/tmp/test-migrations',
      dbType: 'sqlite',
      connection: { path: '/tmp/test.db' }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      const defaultMigrator = new DatabaseMigrator();

      expect(defaultMigrator.config.dbType).toBe('sqlite');
      expect(defaultMigrator.db).toBeNull();
    });

    it('debería aceptar configuración personalizada', () => {
      expect(migrator.config.migrationsPath).toBe('/tmp/test-migrations');
      expect(migrator.config.dbType).toBe('sqlite');
    });

    it('debería crear directorio de migraciones si no existe', () => {
      fs.existsSync.mockReturnValue(false);

      new DatabaseMigrator({
        migrationsPath: '/new/path'
      });

      expect(fs.mkdirSync).toHaveBeenCalledWith('/new/path', { recursive: true });
    });
  });

  describe('connect()', () => {
    it('debería conectar a SQLite', async () => {
      // Simular conexión
      migrator.db = mockDb;
      await migrator.connect();

      // Ya conectado, no debería reconectar
      expect(migrator.db).toBe(mockDb);
    });

    it('no debería reconectar si ya está conectado', async () => {
      migrator.db = mockDb;

      await migrator.connect();

      expect(migrator.db).toBe(mockDb);
    });
  });

  describe('createMigrationsTable()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
    });

    it('debería crear tabla de migraciones en SQLite', async () => {
      await migrator.createMigrationsTable();

      expect(mockDb.exec).toHaveBeenCalled();
      const sql = mockDb.exec.mock.calls[0][0];
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS migrations');
    });
  });

  describe('getExecutedMigrations()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
    });

    it('debería retornar lista de migraciones ejecutadas', async () => {
      const mockMigrations = [
        { name: '001_initial.js' },
        { name: '002_add_users.js' }
      ];

      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockMigrations)
      });

      const result = await migrator.getExecutedMigrations();

      expect(result).toEqual(mockMigrations);
    });
  });

  describe('getPendingMigrations()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
    });

    it('debería retornar migraciones pendientes', async () => {
      // Migraciones ejecutadas
      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([{ name: '001_initial.js' }])
      });

      // Archivos disponibles
      fs.readdirSync.mockReturnValue([
        '001_initial.js',
        '002_add_users.js',
        '003_add_roles.js'
      ]);

      const pending = await migrator.getPendingMigrations();

      expect(pending).toContain('002_add_users.js');
      expect(pending).toContain('003_add_roles.js');
      expect(pending).not.toContain('001_initial.js');
    });

    it('debería filtrar solo archivos .js', async () => {
      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([])
      });

      fs.readdirSync.mockReturnValue([
        '001_initial.js',
        'README.md',
        '.gitkeep'
      ]);

      const pending = await migrator.getPendingMigrations();

      expect(pending).toHaveLength(1);
      expect(pending[0]).toBe('001_initial.js');
    });
  });

  describe('migrate()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
      migrator.connect = jest.fn().mockResolvedValue();
    });

    it('debería retornar 0 si no hay migraciones pendientes', async () => {
      migrator.getPendingMigrations = jest.fn().mockResolvedValue([]);

      const result = await migrator.migrate();

      expect(result.migrated).toBe(0);
      expect(result.migrations).toEqual([]);
    });

    it('debería ejecutar migraciones pendientes', async () => {
      migrator.getPendingMigrations = jest.fn().mockResolvedValue(['002_test.js']);
      migrator.runMigration = jest.fn().mockResolvedValue();

      const result = await migrator.migrate();

      expect(migrator.runMigration).toHaveBeenCalledWith('002_test.js', 'up');
      expect(result.migrated).toBe(1);
    });
  });

  describe('rollback()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
      migrator.connect = jest.fn().mockResolvedValue();
    });

    it('debería retornar 0 si no hay migraciones para rollback', async () => {
      migrator.getExecutedMigrations = jest.fn().mockResolvedValue([]);

      const result = await migrator.rollback();

      expect(result.rolledback).toBe(0);
    });

    it('debería hacer rollback de las últimas N migraciones', async () => {
      migrator.getExecutedMigrations = jest.fn().mockResolvedValue([
        { name: '001_initial.js' },
        { name: '002_users.js' },
        { name: '003_roles.js' }
      ]);
      migrator.runMigration = jest.fn().mockResolvedValue();

      const result = await migrator.rollback(2);

      expect(migrator.runMigration).toHaveBeenCalledTimes(2);
      expect(result.rolledback).toBe(2);
    });
  });

  describe('createMigration()', () => {
    it('debería crear archivo de migración con template', () => {
      const filepath = migrator.createMigration('add users table');

      expect(fs.writeFileSync).toHaveBeenCalled();
      const args = fs.writeFileSync.mock.calls[0];

      expect(args[0]).toContain('add_users_table.js');
      expect(args[1]).toContain('module.exports');
      expect(args[1]).toContain('async up');
      expect(args[1]).toContain('async down');
    });

    it('debería usar timestamp en el nombre del archivo', () => {
      const before = Date.now();
      migrator.createMigration('test migration');
      const after = Date.now();

      const filepath = fs.writeFileSync.mock.calls[0][0];
      const timestamp = parseInt(filepath.split('/').pop().split('_')[0]);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('status()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
      migrator.connect = jest.fn().mockResolvedValue();
    });

    it('debería retornar estado de migraciones', async () => {
      migrator.getExecutedMigrations = jest.fn().mockResolvedValue([
        { name: '001_initial.js' }
      ]);
      migrator.getPendingMigrations = jest.fn().mockResolvedValue([
        '002_users.js'
      ]);

      const status = await migrator.status();

      expect(status.executed).toBe(1);
      expect(status.pending).toBe(1);
      expect(status.executedMigrations).toContain('001_initial.js');
      expect(status.pendingMigrations).toContain('002_users.js');
    });
  });

  describe('close()', () => {
    it('debería cerrar conexión SQLite', async () => {
      migrator.db = mockDb;

      await migrator.close();

      expect(mockDb.close).toHaveBeenCalled();
      expect(migrator.db).toBeNull();
    });

    it('no debería fallar si no hay conexión', async () => {
      migrator.db = null;

      await expect(migrator.close()).resolves.toBeUndefined();
    });
  });

  describe('recordMigration()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
    });

    it('debería registrar migración en SQLite', async () => {
      await migrator.recordMigration('001_test.js');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'INSERT INTO migrations (name) VALUES (?)'
      );
    });
  });

  describe('removeMigration()', () => {
    beforeEach(() => {
      migrator.db = mockDb;
    });

    it('debería eliminar registro de migración en SQLite', async () => {
      await migrator.removeMigration('001_test.js');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'DELETE FROM migrations WHERE name = ?'
      );
    });
  });
});
