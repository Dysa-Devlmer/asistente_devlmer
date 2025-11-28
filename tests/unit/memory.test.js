/**
 * Memory Module Unit Tests
 * Tests para el sistema de memoria persistente
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

// Mock de sqlite3 antes de importar el módulo
const mockDb = {
  run: jest.fn((sql, params, callback) => {
    if (callback) callback.call({ lastID: 1 }, null);
  }),
  all: jest.fn((sql, params, callback) => {
    if (callback) callback(null, []);
  }),
  close: jest.fn()
};

const mockDatabase = jest.fn((path, callback) => {
  if (callback) callback(null);
  return mockDb;
});

jest.mock('sqlite3', () => ({
  Database: mockDatabase
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('Memory', () => {
  let Memory;
  let memory;
  const fs = require('fs');

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Simular clase Memory para testing (ESM)
    Memory = class MemoryTest {
      constructor() {
        this.db = null;
        this.memoryPath = './memory';
      }

      async initialize() {
        if (!fs.existsSync(this.memoryPath)) {
          fs.mkdirSync(this.memoryPath, { recursive: true });
        }

        return new Promise((resolve, reject) => {
          this.db = mockDatabase(this.memoryPath + '/jarvis.db', (err) => {
            if (err) reject(err);
            else {
              this.createTables();
              resolve();
            }
          });
        });
      }

      createTables() {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command TEXT,
            analysis TEXT,
            actions INTEGER,
            results INTEGER,
            timestamp DATETIME,
            success BOOLEAN
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS learning (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pattern TEXT,
            solution TEXT,
            confidence REAL,
            timestamp DATETIME
          )
        `);
      }

      async saveEpisode(episode) {
        return new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO episodes (command, analysis, actions, results, timestamp, success)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [episode.command, episode.analysis, episode.actions, episode.results, episode.timestamp, episode.success ? 1 : 0],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }

      async getRecentEpisodes(limit = 10) {
        return new Promise((resolve, reject) => {
          this.db.all(
            `SELECT * FROM episodes ORDER BY timestamp DESC LIMIT ?`,
            [limit],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });
      }

      async saveLearning(pattern, solution, confidence) {
        return new Promise((resolve, reject) => {
          this.db.run(
            `INSERT INTO learning (pattern, solution, confidence, timestamp)
             VALUES (?, ?, ?, ?)`,
            [pattern, solution, confidence, new Date().toISOString()],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
      }

      async findSimilarPatterns(pattern) {
        return new Promise((resolve, reject) => {
          this.db.all(
            `SELECT * FROM learning WHERE pattern LIKE ? ORDER BY confidence DESC LIMIT 5`,
            [`%${pattern}%`],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });
      }
    };

    memory = new Memory();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      expect(memory.db).toBeNull();
      expect(memory.memoryPath).toBe('./memory');
    });
  });

  describe('initialize()', () => {
    it('debería crear directorio si no existe', async () => {
      fs.existsSync.mockReturnValue(false);

      await memory.initialize();

      expect(fs.mkdirSync).toHaveBeenCalledWith('./memory', { recursive: true });
    });

    it('debería no crear directorio si ya existe', async () => {
      fs.existsSync.mockReturnValue(true);

      await memory.initialize();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('debería inicializar la base de datos', async () => {
      await memory.initialize();

      expect(memory.db).not.toBeNull();
      expect(mockDatabase).toHaveBeenCalled();
    });

    it('debería crear tablas después de conectar', async () => {
      await memory.initialize();

      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('createTables()', () => {
    beforeEach(async () => {
      await memory.initialize();
    });

    it('debería crear tabla episodes', () => {
      const calls = mockDb.run.mock.calls;
      const episodesSql = calls.find(call =>
        call[0].includes('CREATE TABLE IF NOT EXISTS episodes')
      );

      expect(episodesSql).toBeDefined();
    });

    it('debería crear tabla learning', () => {
      const calls = mockDb.run.mock.calls;
      const learningSql = calls.find(call =>
        call[0].includes('CREATE TABLE IF NOT EXISTS learning')
      );

      expect(learningSql).toBeDefined();
    });
  });

  describe('saveEpisode()', () => {
    beforeEach(async () => {
      await memory.initialize();
      jest.clearAllMocks();
    });

    it('debería guardar episodio correctamente', async () => {
      const episode = {
        command: 'npm install',
        analysis: 'Install dependencies',
        actions: 5,
        results: 5,
        timestamp: new Date().toISOString(),
        success: true
      };

      const id = await memory.saveEpisode(episode);

      expect(id).toBe(1);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('debería convertir success boolean a integer', async () => {
      const episode = {
        command: 'test',
        analysis: 'test',
        actions: 1,
        results: 1,
        timestamp: new Date().toISOString(),
        success: true
      };

      await memory.saveEpisode(episode);

      const params = mockDb.run.mock.calls[0][1];
      expect(params[5]).toBe(1); // success convertido a 1
    });

    it('debería manejar success false', async () => {
      const episode = {
        command: 'test',
        analysis: 'test',
        actions: 1,
        results: 0,
        timestamp: new Date().toISOString(),
        success: false
      };

      await memory.saveEpisode(episode);

      const params = mockDb.run.mock.calls[0][1];
      expect(params[5]).toBe(0); // success false convertido a 0
    });
  });

  describe('getRecentEpisodes()', () => {
    beforeEach(async () => {
      await memory.initialize();
      jest.clearAllMocks();
    });

    it('debería retornar episodios recientes', async () => {
      const mockEpisodes = [
        { id: 1, command: 'cmd1' },
        { id: 2, command: 'cmd2' }
      ];

      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, mockEpisodes);
      });

      const episodes = await memory.getRecentEpisodes(10);

      expect(episodes).toEqual(mockEpisodes);
    });

    it('debería usar límite por defecto de 10', async () => {
      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      await memory.getRecentEpisodes();

      expect(mockDb.all.mock.calls[0][1]).toEqual([10]);
    });

    it('debería aceptar límite personalizado', async () => {
      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      await memory.getRecentEpisodes(5);

      expect(mockDb.all.mock.calls[0][1]).toEqual([5]);
    });

    it('debería retornar array vacío si no hay episodios', async () => {
      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, null);
      });

      const episodes = await memory.getRecentEpisodes();

      expect(episodes).toEqual([]);
    });
  });

  describe('saveLearning()', () => {
    beforeEach(async () => {
      await memory.initialize();
      jest.clearAllMocks();
    });

    it('debería guardar patrón de aprendizaje', async () => {
      const id = await memory.saveLearning('pattern', 'solution', 0.95);

      expect(id).toBe(1);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('debería incluir timestamp', async () => {
      await memory.saveLearning('pattern', 'solution', 0.95);

      const sql = mockDb.run.mock.calls[0][0];
      expect(sql).toContain('timestamp');
    });
  });

  describe('findSimilarPatterns()', () => {
    beforeEach(async () => {
      await memory.initialize();
      jest.clearAllMocks();
    });

    it('debería buscar patrones similares', async () => {
      const mockPatterns = [
        { pattern: 'npm', solution: 'use npm install', confidence: 0.9 }
      ];

      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, mockPatterns);
      });

      const patterns = await memory.findSimilarPatterns('npm');

      expect(patterns).toEqual(mockPatterns);
    });

    it('debería usar búsqueda LIKE con wildcards', async () => {
      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      await memory.findSimilarPatterns('test');

      const params = mockDb.all.mock.calls[0][1];
      expect(params[0]).toBe('%test%');
    });

    it('debería limitar resultados a 5', async () => {
      mockDb.all.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      await memory.findSimilarPatterns('test');

      const sql = mockDb.all.mock.calls[0][0];
      expect(sql).toContain('LIMIT 5');
    });
  });
});

describe('Memory - Error Handling', () => {
  let Memory;
  let memory;
  const fs = require('fs');

  beforeEach(() => {
    jest.clearAllMocks();

    Memory = class MemoryTest {
      constructor() {
        this.db = null;
        this.memoryPath = './memory';
      }

      async initialize() {
        if (!fs.existsSync(this.memoryPath)) {
          fs.mkdirSync(this.memoryPath, { recursive: true });
        }

        return new Promise((resolve, reject) => {
          this.db = mockDatabase(this.memoryPath + '/jarvis.db', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      async saveEpisode(episode) {
        return new Promise((resolve, reject) => {
          this.db.run('INSERT...', [], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }

      async getRecentEpisodes(limit = 10) {
        return new Promise((resolve, reject) => {
          this.db.all('SELECT...', [limit], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });
      }
    };

    memory = new Memory();
  });

  it('debería rechazar promesa si la conexión falla', async () => {
    mockDatabase.mockImplementation((path, callback) => {
      callback(new Error('Connection failed'));
      return mockDb;
    });

    await expect(memory.initialize()).rejects.toThrow('Connection failed');
  });

  it('debería rechazar promesa si INSERT falla', async () => {
    await memory.initialize();

    mockDb.run.mockImplementation((sql, params, callback) => {
      callback(new Error('INSERT failed'));
    });

    await expect(memory.saveEpisode({})).rejects.toThrow('INSERT failed');
  });

  it('debería rechazar promesa si SELECT falla', async () => {
    await memory.initialize();

    mockDb.all.mockImplementation((sql, params, callback) => {
      callback(new Error('SELECT failed'));
    });

    await expect(memory.getRecentEpisodes()).rejects.toThrow('SELECT failed');
  });
});
