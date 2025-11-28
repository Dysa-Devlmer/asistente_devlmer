/**
 * Task Scheduler Unit Tests
 * Tests para el sistema de tareas programadas
 */

const { describe, it, expect, beforeEach, afterEach, jest: jestGlobals } = require('@jest/globals');
const EventEmitter = require('events');

// Mock de node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    stop: jest.fn()
  }),
  validate: jest.fn().mockReturnValue(true)
}));

const cron = require('node-cron');

describe('TaskScheduler', () => {
  let TaskScheduler;
  let scheduler;
  let mockMetricsPersistence;
  let mockDb;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock de base de datos
    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([]),
        get: jest.fn().mockReturnValue(null),
        run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
      })
    };

    mockMetricsPersistence = {
      db: mockDb,
      initialize: jest.fn()
    };

    TaskScheduler = require('../../core/scheduler/task-scheduler.cjs');

    scheduler = new TaskScheduler({
      projectRoot: '/tmp/test',
      metricsPersistence: mockMetricsPersistence,
      maxRetries: 3,
      retryDelay: 1000
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      const defaultScheduler = new TaskScheduler();

      expect(defaultScheduler.maxRetries).toBe(3);
      expect(defaultScheduler.retryDelay).toBe(5000);
      expect(defaultScheduler.tasks).toBeInstanceOf(Map);
    });

    it('debería aceptar configuración personalizada', () => {
      expect(scheduler.maxRetries).toBe(3);
      expect(scheduler.retryDelay).toBe(1000);
    });

    it('debería extender EventEmitter', () => {
      expect(scheduler).toBeInstanceOf(EventEmitter);
    });
  });

  describe('initialize()', () => {
    it('debería inicializar base de datos si está disponible', async () => {
      await scheduler.initialize();

      expect(mockDb.exec).toHaveBeenCalled();
    });

    it('no debería inicializar dos veces', async () => {
      await scheduler.initialize();
      await scheduler.initialize();

      // Las llamadas a exec solo de la primera inicialización
      const callCount = mockDb.exec.mock.calls.length;
      await scheduler.initialize();
      expect(mockDb.exec.mock.calls.length).toBe(callCount);
    });

    it('debería emitir evento initialized', async () => {
      const handler = jest.fn();
      scheduler.on('initialized', handler);

      await scheduler.initialize();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('scheduleTask()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería programar tarea cron', async () => {
      const task = await scheduler.scheduleTask({
        name: 'Test Cron Task',
        type: 'cron',
        schedule: '*/5 * * * *',
        action: 'command',
        parameters: { command: 'echo test' }
      });

      expect(task.id).toBeDefined();
      expect(task.name).toBe('Test Cron Task');
      expect(cron.schedule).toHaveBeenCalled();
    });

    it('debería programar tarea de intervalo', async () => {
      const task = await scheduler.scheduleTask({
        name: 'Test Interval Task',
        type: 'interval',
        schedule: '60000', // 1 minuto
        action: 'command',
        parameters: { command: 'echo test' }
      });

      expect(task.id).toBeDefined();
      expect(task.type).toBe('interval');
    });

    it('debería rechazar expresión cron inválida', async () => {
      cron.validate.mockReturnValue(false);

      await expect(scheduler.scheduleTask({
        name: 'Invalid Task',
        type: 'cron',
        schedule: 'invalid',
        action: 'command'
      })).rejects.toThrow('Expresión cron inválida');
    });

    it('debería rechazar parámetros faltantes', async () => {
      await expect(scheduler.scheduleTask({
        name: 'Incomplete Task'
      })).rejects.toThrow('Faltan parámetros requeridos');
    });

    it('debería emitir evento task:scheduled', async () => {
      const handler = jest.fn();
      scheduler.on('task:scheduled', handler);

      await scheduler.scheduleTask({
        name: 'Event Test',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      expect(handler).toHaveBeenCalled();
    });

    it('debería rechazar intervalo menor a 1 segundo', async () => {
      await expect(scheduler.scheduleTask({
        name: 'Fast Interval',
        type: 'interval',
        schedule: '500', // 500ms
        action: 'command'
      })).rejects.toThrow('El intervalo debe ser al menos 1 segundo');
    });

    it('debería rechazar tarea "once" con tiempo pasado', async () => {
      await expect(scheduler.scheduleTask({
        name: 'Past Task',
        type: 'once',
        schedule: String(Date.now() - 1000), // 1 segundo en el pasado
        action: 'command'
      })).rejects.toThrow('El tiempo de ejecución ya pasó');
    });
  });

  describe('getTask()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería retornar tarea por ID', async () => {
      const created = await scheduler.scheduleTask({
        name: 'Test Task',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      const task = scheduler.getTask(created.id);

      expect(task).toBeDefined();
      expect(task.name).toBe('Test Task');
    });

    it('debería retornar undefined para ID inexistente', () => {
      const task = scheduler.getTask(999999);

      expect(task).toBeUndefined();
    });
  });

  describe('getAllTasks()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería retornar array de todas las tareas', async () => {
      await scheduler.scheduleTask({
        name: 'Task 1',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.scheduleTask({
        name: 'Task 2',
        type: 'interval',
        schedule: '60000',
        action: 'command'
      });

      const tasks = scheduler.getAllTasks();

      expect(tasks.length).toBe(2);
    });
  });

  describe('getTasks()', () => {
    beforeEach(async () => {
      await scheduler.initialize();

      await scheduler.scheduleTask({
        name: 'Cron Task',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.scheduleTask({
        name: 'Interval Task',
        type: 'interval',
        schedule: '60000',
        action: 'workflow'
      });
    });

    it('debería filtrar por tipo', () => {
      const cronTasks = scheduler.getTasks({ type: 'cron' });

      expect(cronTasks.length).toBe(1);
      expect(cronTasks[0].type).toBe('cron');
    });

    it('debería filtrar por acción', () => {
      const workflowTasks = scheduler.getTasks({ action: 'workflow' });

      expect(workflowTasks.length).toBe(1);
    });
  });

  describe('disableTask()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería deshabilitar tarea', async () => {
      const task = await scheduler.scheduleTask({
        name: 'To Disable',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.disableTask(task.id);

      expect(scheduler.getTask(task.id).enabled).toBe(false);
    });

    it('debería emitir evento task:disabled', async () => {
      const handler = jest.fn();
      scheduler.on('task:disabled', handler);

      const task = await scheduler.scheduleTask({
        name: 'To Disable',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.disableTask(task.id);

      expect(handler).toHaveBeenCalled();
    });

    it('debería fallar con tarea inexistente', async () => {
      await expect(scheduler.disableTask(999999))
        .rejects.toThrow('Tarea no encontrada');
    });
  });

  describe('enableTask()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería habilitar tarea deshabilitada', async () => {
      const task = await scheduler.scheduleTask({
        name: 'To Enable',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.disableTask(task.id);
      await scheduler.enableTask(task.id);

      expect(scheduler.getTask(task.id).enabled).toBe(true);
    });
  });

  describe('deleteTask()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería eliminar tarea', async () => {
      const task = await scheduler.scheduleTask({
        name: 'To Delete',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.deleteTask(task.id);

      expect(scheduler.getTask(task.id)).toBeUndefined();
    });

    it('debería emitir evento task:deleted', async () => {
      const handler = jest.fn();
      scheduler.on('task:deleted', handler);

      const task = await scheduler.scheduleTask({
        name: 'To Delete',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.deleteTask(task.id);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('executeAction()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería ejecutar acción command', async () => {
      const result = await scheduler.executeAction('command', {
        command: 'echo',
        args: ['test']
      });

      expect(result.type).toBe('command');
      expect(result.executed).toBe(true);
    });

    it('debería ejecutar workflow', async () => {
      const result = await scheduler.executeAction('workflow', {
        steps: [
          { action: 'command', parameters: { command: 'echo' } }
        ]
      });

      expect(result.type).toBe('workflow');
      expect(result.results.length).toBe(1);
    });

    it('debería fallar con workflow vacío', async () => {
      await expect(scheduler.executeAction('workflow', { steps: [] }))
        .rejects.toThrow('Workflow debe tener al menos un paso');
    });

    it('debería fallar con acción no soportada', async () => {
      await expect(scheduler.executeAction('unknown', {}))
        .rejects.toThrow('Acción no soportada');
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería retornar estadísticas correctas', async () => {
      await scheduler.scheduleTask({
        name: 'Task 1',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      const stats = scheduler.getStats();

      expect(stats.totalTasks).toBe(1);
      expect(stats.enabledTasks).toBe(1);
      expect(stats.byType.cron).toBe(1);
    });

    it('debería incluir estadísticas de ejecución si hay DB', async () => {
      mockDb.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue([]),
        get: jest.fn().mockReturnValue({
          total: 10,
          successful: 8,
          failed: 2,
          avgDuration: 1500
        }),
        run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
      });

      const stats = scheduler.getStats();

      expect(stats.totalExecutions).toBe(10);
      expect(stats.successfulExecutions).toBe(8);
    });
  });

  describe('shutdown()', () => {
    beforeEach(async () => {
      await scheduler.initialize();
    });

    it('debería detener todas las tareas', async () => {
      await scheduler.scheduleTask({
        name: 'Task 1',
        type: 'cron',
        schedule: '0 * * * *',
        action: 'command'
      });

      await scheduler.shutdown();

      expect(scheduler.tasks.size).toBe(0);
    });
  });
});
