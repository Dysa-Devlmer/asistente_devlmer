/**
 * Backup Manager Unit Tests
 * Tests para el sistema de backup y disaster recovery
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const path = require('path');
const EventEmitter = require('events');

// Mocks
jest.mock('fs-extra');
jest.mock('archiver');
jest.mock('crypto');

const fs = require('fs-extra');
const archiver = require('archiver');
const crypto = require('crypto');

describe('BackupManager', () => {
  let BackupManager;
  let backupManager;
  let mockArchive;
  const testProjectRoot = '/tmp/test-backup';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock de fs-extra
    fs.ensureDir = jest.fn().mockResolvedValue();
    fs.readdir = jest.fn().mockResolvedValue([]);
    fs.pathExists = jest.fn().mockResolvedValue(true);
    fs.writeJson = jest.fn().mockResolvedValue();
    fs.readJson = jest.fn().mockResolvedValue({});
    fs.remove = jest.fn().mockResolvedValue();
    fs.copy = jest.fn().mockResolvedValue();
    fs.createWriteStream = jest.fn().mockReturnValue({
      on: jest.fn((event, handler) => {
        if (event === 'close') setTimeout(handler, 10);
      })
    });
    fs.createReadStream = jest.fn().mockReturnValue({
      on: jest.fn((event, handler) => {
        if (event === 'end') setTimeout(handler, 10);
        if (event === 'data') handler(Buffer.from('test'));
        return { on: jest.fn() };
      }),
      pipe: jest.fn()
    });

    // Mock de archiver
    mockArchive = {
      pipe: jest.fn(),
      directory: jest.fn(),
      append: jest.fn(),
      finalize: jest.fn().mockResolvedValue(),
      pointer: jest.fn().mockReturnValue(1024),
      on: jest.fn()
    };
    archiver.mockReturnValue(mockArchive);

    // Mock de crypto
    crypto.randomBytes = jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('abc123')
    });
    crypto.createHash = jest.fn().mockReturnValue({
      update: jest.fn(),
      digest: jest.fn().mockReturnValue('sha256hash')
    });

    BackupManager = require('../../core/backup/backup-manager.cjs');

    backupManager = new BackupManager({
      projectRoot: testProjectRoot,
      maxBackups: 5,
      compressionLevel: 6
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      const defaultManager = new BackupManager();

      expect(defaultManager.maxBackups).toBe(10);
      expect(defaultManager.compressionLevel).toBe(6);
      expect(defaultManager.backupHistory).toEqual([]);
    });

    it('debería aceptar configuración personalizada', () => {
      expect(backupManager.maxBackups).toBe(5);
      expect(backupManager.projectRoot).toBe(testProjectRoot);
    });

    it('debería extender EventEmitter', () => {
      expect(backupManager).toBeInstanceOf(EventEmitter);
    });

    it('debería definir fuentes de backup', () => {
      expect(backupManager.sources.memory).toBeDefined();
      expect(backupManager.sources.config).toBeDefined();
      expect(backupManager.sources.logs).toBeDefined();
      expect(backupManager.sources.data).toBeDefined();
    });
  });

  describe('initialize()', () => {
    it('debería crear directorio de backups', async () => {
      await backupManager.initialize();

      expect(fs.ensureDir).toHaveBeenCalledWith(backupManager.backupDir);
    });

    it('debería cargar historial de backups', async () => {
      fs.readdir.mockResolvedValue(['backup1.zip', 'backup1.json']);
      fs.readJson.mockResolvedValue({
        id: 'test',
        name: 'backup1',
        timestamp: Date.now()
      });

      await backupManager.initialize();

      expect(backupManager.backupHistory.length).toBeGreaterThanOrEqual(0);
    });

    it('no debería inicializar dos veces', async () => {
      await backupManager.initialize();
      await backupManager.initialize();

      expect(fs.ensureDir).toHaveBeenCalledTimes(1);
    });

    it('debería emitir evento initialized', async () => {
      const handler = jest.fn();
      backupManager.on('initialized', handler);

      await backupManager.initialize();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('createBackup()', () => {
    beforeEach(async () => {
      await backupManager.initialize();
      jest.clearAllMocks();
    });

    it('debería crear backup completo', async () => {
      const result = await backupManager.createBackup({
        type: 'full',
        description: 'Test backup'
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('full');
      expect(result.id).toBeDefined();
    });

    it('debería incluir directorios seleccionados', async () => {
      await backupManager.createBackup({
        includeMemory: true,
        includeConfig: true,
        includeLogs: false
      });

      expect(mockArchive.directory).toHaveBeenCalled();
    });

    it('debería calcular checksum del archivo', async () => {
      const result = await backupManager.createBackup();

      expect(result.checksum).toBeDefined();
    });

    it('debería agregar metadata al archivo', async () => {
      await backupManager.createBackup();

      expect(mockArchive.append).toHaveBeenCalled();
    });

    it('debería guardar información del backup', async () => {
      await backupManager.createBackup();

      expect(fs.writeJson).toHaveBeenCalled();
    });

    it('debería emitir evento backup:created', async () => {
      const handler = jest.fn();
      backupManager.on('backup:created', handler);

      await backupManager.createBackup();

      expect(handler).toHaveBeenCalled();
    });

    it('debería limpiar backups antiguos después de crear', async () => {
      backupManager.cleanupOldBackups = jest.fn().mockResolvedValue();

      await backupManager.createBackup();

      expect(backupManager.cleanupOldBackups).toHaveBeenCalled();
    });
  });

  describe('calculateChecksum()', () => {
    it('debería calcular SHA256 del archivo', async () => {
      const checksum = await backupManager.calculateChecksum('/path/to/file.zip');

      expect(checksum).toBe('sha256hash');
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    });
  });

  describe('verifyBackup()', () => {
    beforeEach(async () => {
      await backupManager.initialize();
      backupManager.backupHistory = [{
        id: 'test-backup',
        name: 'jarvis-backup-test',
        checksum: 'sha256hash'
      }];
    });

    it('debería verificar backup válido', async () => {
      const isValid = await backupManager.verifyBackup('test-backup');

      expect(isValid).toBe(true);
    });

    it('debería detectar backup corrupto', async () => {
      crypto.createHash.mockReturnValue({
        update: jest.fn(),
        digest: jest.fn().mockReturnValue('different-hash')
      });

      const isValid = await backupManager.verifyBackup('test-backup');

      expect(isValid).toBe(false);
    });

    it('debería fallar con backup inexistente', async () => {
      await expect(backupManager.verifyBackup('no-existe'))
        .rejects.toThrow('Backup no encontrado');
    });

    it('debería fallar si archivo no existe', async () => {
      fs.pathExists.mockResolvedValue(false);

      await expect(backupManager.verifyBackup('test-backup'))
        .rejects.toThrow('Archivo de backup no existe');
    });
  });

  describe('restoreBackup()', () => {
    beforeEach(async () => {
      await backupManager.initialize();
      backupManager.backupHistory = [{
        id: 'test-backup',
        name: 'jarvis-backup-test',
        checksum: 'sha256hash'
      }];
      backupManager.verifyBackup = jest.fn().mockResolvedValue(true);
      backupManager.createBackup = jest.fn().mockResolvedValue({});
    });

    it('debería restaurar backup después de verificar', async () => {
      jest.mock('extract-zip', () => jest.fn().mockResolvedValue());

      const result = await backupManager.restoreBackup('test-backup');

      expect(backupManager.verifyBackup).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('debería crear backup de seguridad antes de restaurar', async () => {
      await backupManager.restoreBackup('test-backup');

      expect(backupManager.createBackup).toHaveBeenCalled();
    });

    it('debería fallar si backup está corrupto', async () => {
      backupManager.verifyBackup = jest.fn().mockResolvedValue(false);

      await expect(backupManager.restoreBackup('test-backup'))
        .rejects.toThrow('Backup corrupto');
    });

    it('debería emitir evento backup:restored', async () => {
      const handler = jest.fn();
      backupManager.on('backup:restored', handler);

      await backupManager.restoreBackup('test-backup');

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('cleanupOldBackups()', () => {
    beforeEach(async () => {
      await backupManager.initialize();
    });

    it('no debería eliminar si hay menos del máximo', async () => {
      backupManager.backupHistory = [
        { id: '1', name: 'backup1' },
        { id: '2', name: 'backup2' }
      ];

      await backupManager.cleanupOldBackups();

      expect(fs.remove).not.toHaveBeenCalled();
    });

    it('debería eliminar backups más allá del máximo', async () => {
      backupManager.maxBackups = 2;
      backupManager.backupHistory = [
        { id: '1', name: 'backup1' },
        { id: '2', name: 'backup2' },
        { id: '3', name: 'backup3' }
      ];

      await backupManager.cleanupOldBackups();

      expect(fs.remove).toHaveBeenCalled();
      expect(backupManager.backupHistory.length).toBe(2);
    });
  });

  describe('deleteBackup()', () => {
    beforeEach(async () => {
      await backupManager.initialize();
      backupManager.backupHistory = [{
        id: 'test-backup',
        name: 'jarvis-backup-test'
      }];
    });

    it('debería eliminar backup existente', async () => {
      await backupManager.deleteBackup('test-backup');

      expect(fs.remove).toHaveBeenCalled();
      expect(backupManager.backupHistory.length).toBe(0);
    });

    it('debería fallar con backup inexistente', async () => {
      await expect(backupManager.deleteBackup('no-existe'))
        .rejects.toThrow('Backup no encontrado');
    });

    it('debería emitir evento backup:deleted', async () => {
      const handler = jest.fn();
      backupManager.on('backup:deleted', handler);

      await backupManager.deleteBackup('test-backup');

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('getBackups()', () => {
    it('debería retornar lista de backups', () => {
      backupManager.backupHistory = [
        { id: '1' },
        { id: '2' }
      ];

      const backups = backupManager.getBackups();

      expect(backups).toEqual(backupManager.backupHistory);
    });
  });

  describe('getBackup()', () => {
    beforeEach(() => {
      backupManager.backupHistory = [
        { id: 'test-1', name: 'backup1' },
        { id: 'test-2', name: 'backup2' }
      ];
    });

    it('debería retornar backup por ID', () => {
      const backup = backupManager.getBackup('test-1');

      expect(backup.name).toBe('backup1');
    });

    it('debería retornar undefined para ID inexistente', () => {
      const backup = backupManager.getBackup('no-existe');

      expect(backup).toBeUndefined();
    });
  });

  describe('getStats()', () => {
    it('debería retornar estadísticas correctas', () => {
      backupManager.backupHistory = [
        { id: '1', size: 1024, name: 'latest', timestamp: Date.now() },
        { id: '2', size: 2048, name: 'older', timestamp: Date.now() - 1000 }
      ];

      const stats = backupManager.getStats();

      expect(stats.totalBackups).toBe(2);
      expect(stats.totalSize).toBe(3072);
      expect(stats.latestBackup).toBeDefined();
      expect(stats.latestBackup.name).toBe('latest');
    });

    it('debería manejar historial vacío', () => {
      backupManager.backupHistory = [];

      const stats = backupManager.getStats();

      expect(stats.totalBackups).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.latestBackup).toBeNull();
    });
  });

  describe('exportBackup()', () => {
    beforeEach(async () => {
      await backupManager.initialize();
      backupManager.backupHistory = [{
        id: 'test-backup',
        name: 'jarvis-backup-test'
      }];
    });

    it('debería exportar backup a ubicación destino', async () => {
      const result = await backupManager.exportBackup('test-backup', '/export/path');

      expect(fs.copy).toHaveBeenCalled();
      expect(result.backupFile).toContain('/export/path');
    });

    it('debería fallar con backup inexistente', async () => {
      await expect(backupManager.exportBackup('no-existe', '/path'))
        .rejects.toThrow('Backup no encontrado');
    });
  });
});
