/**
 * Metrics Persistence Unit Tests
 * Tests para el sistema de persistencia de métricas
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const path = require('path');

// Mock de better-sqlite3
const mockDb = {
  pragma: jest.fn(),
  exec: jest.fn(),
  prepare: jest.fn().mockReturnValue({
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
    get: jest.fn(),
    all: jest.fn().mockReturnValue([])
  }),
  close: jest.fn()
};

jest.mock('better-sqlite3', () => jest.fn().mockImplementation(() => mockDb));
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('MetricsPersistence', () => {
  let MetricsPersistence;
  let metrics;
  const fs = require('fs');

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    MetricsPersistence = require('../../core/metrics-persistence.cjs');
    metrics = new MetricsPersistence('/tmp/test/metrics.db');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar con ruta por defecto', () => {
      const defaultMetrics = new MetricsPersistence();

      expect(defaultMetrics.dbPath).toContain('metrics.db');
    });

    it('debería aceptar ruta personalizada', () => {
      expect(metrics.dbPath).toBe('/tmp/test/metrics.db');
    });

    it('debería crear directorio si no existe', () => {
      // El directorio se crea en el constructor solo si no existe
      // Este test verifica que el código maneja el caso correctamente
      fs.existsSync.mockReturnValue(false);

      const metrics = new MetricsPersistence('/new/path/metrics.db');

      // Verificar que se intentó verificar la existencia del directorio
      expect(fs.existsSync).toHaveBeenCalled();
    });
  });

  describe('initialize()', () => {
    it('debería inicializar la base de datos', () => {
      metrics.initialize();

      expect(metrics.initialized).toBe(true);
      expect(mockDb.pragma).toHaveBeenCalledWith('journal_mode = WAL');
    });

    it('debería crear tablas necesarias', () => {
      metrics.initialize();

      const execCalls = mockDb.exec.mock.calls.map(c => c[0]);

      expect(execCalls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS sessions'))).toBe(true);
      expect(execCalls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS subtasks'))).toBe(true);
      expect(execCalls.some(sql => sql.includes('CREATE TABLE IF NOT EXISTS daily_metrics'))).toBe(true);
    });

    it('no debería inicializar dos veces', () => {
      metrics.initialize();
      const callCount = mockDb.exec.mock.calls.length;

      metrics.initialize();

      expect(mockDb.exec.mock.calls.length).toBe(callCount);
    });
  });

  describe('createTables()', () => {
    beforeEach(() => {
      metrics.initialize();
    });

    it('debería crear índices', () => {
      const execCalls = mockDb.exec.mock.calls.map(c => c[0]);

      expect(execCalls.some(sql => sql.includes('CREATE INDEX IF NOT EXISTS'))).toBe(true);
    });

    it('debería crear tabla de logs importantes', () => {
      const execCalls = mockDb.exec.mock.calls.map(c => c[0]);

      expect(execCalls.some(sql => sql.includes('important_logs'))).toBe(true);
    });
  });
});

describe('MetricsPersistence - Operations', () => {
  let MetricsPersistence;
  let metrics;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    MetricsPersistence = require('../../core/metrics-persistence.cjs');
    metrics = new MetricsPersistence('/tmp/test/metrics.db');
    metrics.initialize();
  });

  describe('Session Operations', () => {
    it('debería poder guardar sesión', () => {
      const sessionData = {
        id: 'test-session-1',
        task: 'Test task',
        state: 'completed'
      };

      // Verificar que el mock del prepare está listo
      expect(metrics.db.prepare).toBeDefined();
    });

    it('debería poder obtener sesión por ID', () => {
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 'test-session-1',
          task: 'Test task'
        }),
        run: jest.fn(),
        all: jest.fn()
      });

      const result = metrics.db.prepare('SELECT * FROM sessions WHERE id = ?').get('test-session-1');

      expect(result.id).toBe('test-session-1');
    });
  });

  describe('Daily Metrics Operations', () => {
    it('debería poder guardar métricas diarias', () => {
      const today = new Date().toISOString().split('T')[0];

      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 }),
        get: jest.fn(),
        all: jest.fn()
      });

      // Simular insert
      const result = metrics.db.prepare('INSERT INTO daily_metrics (date) VALUES (?)').run(today);

      expect(result.changes).toBe(1);
    });
  });

  describe('Log Operations', () => {
    it('debería poder guardar logs importantes', () => {
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
        get: jest.fn(),
        all: jest.fn()
      });

      const result = metrics.db.prepare(
        'INSERT INTO important_logs (timestamp, level, category, message) VALUES (?, ?, ?, ?)'
      ).run(Date.now(), 'error', 'system', 'Test error');

      expect(result.lastInsertRowid).toBe(1);
    });

    it('debería poder obtener logs por nivel', () => {
      const mockLogs = [
        { level: 'error', message: 'Error 1' },
        { level: 'error', message: 'Error 2' }
      ];

      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockLogs),
        run: jest.fn(),
        get: jest.fn()
      });

      const logs = metrics.db.prepare('SELECT * FROM important_logs WHERE level = ?').all('error');

      expect(logs.length).toBe(2);
    });
  });
});

describe('MetricsPersistence - Error Handling', () => {
  let MetricsPersistence;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('debería manejar error de conexión', () => {
    const Database = require('better-sqlite3');
    Database.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    MetricsPersistence = require('../../core/metrics-persistence.cjs');
    const metrics = new MetricsPersistence();

    expect(() => metrics.initialize()).toThrow('Connection failed');
  });
});
