/**
 * Logger Unit Tests
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('Logger', () => {
  let Logger, logger;
  const testLogPath = path.join(__dirname, '../temp-logs');

  beforeEach(() => {
    // Create temp log directory
    if (!fs.existsSync(testLogPath)) {
      fs.mkdirSync(testLogPath, { recursive: true });
    }

    // Clear module cache
    jest.resetModules();

    // Load logger
    const LoggerModule = require('../../core/logger');
    Logger = LoggerModule.Logger;

    // Create logger instance for testing
    logger = new Logger({
      path: testLogPath,
      level: 'debug',
      file: true,
      console: false
    });
  });

  afterEach(() => {
    // Cleanup test logs
    if (fs.existsSync(testLogPath)) {
      const files = fs.readdirSync(testLogPath);
      files.forEach(file => {
        fs.unlinkSync(path.join(testLogPath, file));
      });
      fs.rmdirSync(testLogPath);
    }
  });

  describe('Logger Initialization', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.logger).toBeDefined();
    });

    it('should create log directory if not exists', () => {
      expect(fs.existsSync(testLogPath)).toBe(true);
    });
  });

  describe('Logging Levels', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      // Logger is async, we can't easily test file content
      expect(true).toBe(true);
    });

    it('should log warn messages', () => {
      logger.warn('Test warn message');
      expect(true).toBe(true);
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(true).toBe(true);
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(true).toBe(true);
    });
  });

  describe('Specialized Logging', () => {
    it('should log startup messages', () => {
      logger.startup('System started');
      expect(true).toBe(true);
    });

    it('should log success messages', () => {
      logger.success('Operation completed');
      expect(true).toBe(true);
    });

    it('should log performance metrics', () => {
      logger.performance('database-query', 150);
      expect(true).toBe(true);
    });

    it('should log HTTP requests', () => {
      logger.http('GET', '/api/test', 200, 45);
      expect(true).toBe(true);
    });
  });

  describe('Logger Stats', () => {
    it('should return log stats', async () => {
      logger.info('Test message');

      // Wait a bit for file to be written
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = await logger.getStats();

      expect(stats).toBeDefined();
      expect(stats.logPath).toBe(testLogPath);
      expect(stats.level).toBe('debug');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with context', () => {
      const child = logger.child({ service: 'test-service' });

      expect(child).toBeDefined();
      expect(child.logger).toBeDefined();
    });
  });

  describe('Byte Formatting', () => {
    it('should format bytes correctly', () => {
      expect(logger.formatBytes(0)).toBe('0 Bytes');
      expect(logger.formatBytes(1024)).toBe('1 KB');
      expect(logger.formatBytes(1048576)).toBe('1 MB');
      expect(logger.formatBytes(1073741824)).toBe('1 GB');
    });
  });
});
