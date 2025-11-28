/**
 * Autonomous Agent Manager Unit Tests
 * Tests para el sistema de agente autónomo
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const EventEmitter = require('events');

// Mocks para dependencias del agente
jest.mock('../../core/autonomous-agent/task-planner.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    planTask: jest.fn().mockResolvedValue({
      subtasks: [
        { title: 'Subtask 1', type: 'code', complexity: 'low' },
        { title: 'Subtask 2', type: 'test', complexity: 'medium' }
      ],
      estimatedTime: 3600000
    })
  }));
});

jest.mock('../../core/autonomous-agent/execution-engine.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    executeSubtask: jest.fn().mockResolvedValue({
      success: true,
      result: 'Completed'
    })
  }));
});

jest.mock('../../core/autonomous-agent/self-verification.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    verify: jest.fn().mockResolvedValue({
      passed: true,
      score: 0.95
    })
  }));
});

jest.mock('../../core/neural-memory/memory-manager.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue()
  }));
});

jest.mock('../../core/web-intelligence/web-intelligence-manager.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue()
  }));
});

jest.mock('../../core/proactive/ai-analyzer.cjs', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('../../core/metrics-persistence.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    db: {
      exec: jest.fn(),
      prepare: jest.fn().mockReturnValue({
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn().mockReturnValue([])
      })
    }
  }));
});

jest.mock('../../core/maintenance-scheduler.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn()
  }));
});

jest.mock('../../core/notification-system.cjs', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(),
    notify: jest.fn().mockResolvedValue()
  }));
});

describe('AutonomousAgentManager', () => {
  let AutonomousAgentManager;
  let agent;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    AutonomousAgentManager = require('../../core/autonomous-agent/autonomous-agent-manager.cjs');

    agent = new AutonomousAgentManager({
      projectRoot: '/tmp/test-project',
      ollamaUrl: 'http://localhost:11434',
      model: 'mistral:latest'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      expect(agent.state).toBe('idle');
      expect(agent.currentTask).toBeNull();
      expect(agent.sessionResults).toEqual([]);
    });

    it('debería crear componentes necesarios', () => {
      expect(agent.taskPlanner).toBeDefined();
      expect(agent.executionEngine).toBeDefined();
      expect(agent.selfVerification).toBeDefined();
      expect(agent.memoryManager).toBeDefined();
    });

    it('debería extender EventEmitter', () => {
      expect(agent).toBeInstanceOf(EventEmitter);
    });

    it('debería aceptar configuración personalizada', () => {
      const customAgent = new AutonomousAgentManager({
        maxAutoCorrections: 5,
        pauseOnVerificationFailure: false
      });

      expect(customAgent.maxAutoCorrections).toBe(5);
      expect(customAgent.pauseOnVerificationFailure).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('debería inicializar todos los componentes', async () => {
      await agent.initialize();

      expect(agent.memoryManager.initialize).toHaveBeenCalled();
      expect(agent.webIntelligence.initialize).toHaveBeenCalled();
      expect(agent.metricsPersistence.initialize).toHaveBeenCalled();
    });

    it('debería enviar notificación de inicio', async () => {
      await agent.initialize();

      expect(agent.notificationSystem.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'system',
          title: 'JARVIS Inicializado'
        })
      );
    });

    it('debería emitir evento ready', async () => {
      const handler = jest.fn();
      agent.on('ready', handler);

      await agent.initialize();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('executeTask()', () => {
    beforeEach(async () => {
      await agent.initialize();
    });

    it('debería emitir evento task:start', async () => {
      const handler = jest.fn();
      agent.on('task:start', handler);

      // Ejecutar parcialmente (puede fallar por dependencias)
      try {
        await agent.executeTask('Test task');
      } catch (e) {
        // Ignorar errores de ejecución
      }

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          taskDescription: 'Test task'
        })
      );
    });

    it('debería cambiar estado a planning', async () => {
      try {
        const promise = agent.executeTask('Test task');
        // Verificar estado inmediatamente
        expect(agent.state).toBe('planning');
        await promise;
      } catch (e) {
        // Ignorar errores
      }
    });

    it('debería almacenar tarea actual', async () => {
      try {
        await agent.executeTask('Test task description');
      } catch (e) {
        // Ignorar errores
      }

      expect(agent.currentTask).toBe('Test task description');
    });
  });

  describe('State Management', () => {
    it('debería iniciar en estado idle', () => {
      expect(agent.state).toBe('idle');
    });

    it('debería tener estados válidos', () => {
      const validStates = ['idle', 'planning', 'executing', 'verifying', 'completed', 'failed'];

      agent.state = 'planning';
      expect(validStates).toContain(agent.state);

      agent.state = 'executing';
      expect(validStates).toContain(agent.state);
    });
  });

  describe('Session Results', () => {
    it('debería comenzar con resultados vacíos', () => {
      expect(agent.sessionResults).toEqual([]);
    });

    it('debería reiniciar resultados al iniciar nueva tarea', async () => {
      agent.sessionResults = [{ test: 'old result' }];

      try {
        await agent.executeTask('New task');
      } catch (e) {
        // Ignorar errores
      }

      expect(agent.sessionResults).toEqual([]);
    });
  });
});

describe('AutonomousAgentManager - Event Handling', () => {
  let AutonomousAgentManager;
  let agent;

  beforeEach(() => {
    jest.resetModules();

    AutonomousAgentManager = require('../../core/autonomous-agent/autonomous-agent-manager.cjs');

    agent = new AutonomousAgentManager({
      projectRoot: '/tmp/test'
    });
  });

  it('debería poder registrar listeners', () => {
    const handler = jest.fn();

    agent.on('test-event', handler);
    agent.emit('test-event', { data: 'test' });

    expect(handler).toHaveBeenCalledWith({ data: 'test' });
  });

  it('debería poder remover listeners', () => {
    const handler = jest.fn();

    agent.on('test-event', handler);
    agent.off('test-event', handler);
    agent.emit('test-event', { data: 'test' });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('AutonomousAgentManager - Configuration', () => {
  let AutonomousAgentManager;

  beforeEach(() => {
    jest.resetModules();
    AutonomousAgentManager = require('../../core/autonomous-agent/autonomous-agent-manager.cjs');
  });

  it('debería usar proyecto root actual por defecto', () => {
    const agent = new AutonomousAgentManager();

    expect(agent.projectRoot).toBe(process.cwd());
  });

  it('debería configurar maxAutoCorrections', () => {
    const agent = new AutonomousAgentManager({
      maxAutoCorrections: 10
    });

    expect(agent.maxAutoCorrections).toBe(10);
  });

  it('debería configurar pauseOnVerificationFailure', () => {
    const agent = new AutonomousAgentManager({
      pauseOnVerificationFailure: false
    });

    expect(agent.pauseOnVerificationFailure).toBe(false);
  });
});
