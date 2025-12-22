#!/usr/bin/env node

/**
 * ⚡ J.A.R.V.I.S. REINFORCEMENT LEARNING SYSTEM
 *
 * "I'm constantly evolving, sir. Each decision makes me smarter."
 * - JARVIS
 *
 * Sistema de aprendizaje por refuerzo basado en Q-Learning que permite
 * a JARVIS aprender la mejor estrategia de acción para cada situación.
 *
 * Implementa:
 * - Q-Learning con exploración/explotación
 * - Deep Q-Network (DQN) simplificado
 * - Experience Replay
 * - Reward Shaping
 * - Multi-Armed Bandit
 *
 * @version 4.0.0 Mark VII
 * @author Stark Industries - Reinforcement Learning Division
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// Q-LEARNING AGENT
// ============================================================================

/**
 * Agente de Q-Learning que aprende políticas óptimas
 */
class QLearningAgent extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // Hyperparameters
      learningRate: config.learningRate || 0.1,      // α - tasa de aprendizaje
      discountFactor: config.discountFactor || 0.95, // γ - factor de descuento
      explorationRate: config.explorationRate || 1.0, // ε - tasa de exploración
      explorationDecay: config.explorationDecay || 0.995,
      minExplorationRate: config.minExplorationRate || 0.01,

      // Experience replay
      replayBufferSize: config.replayBufferSize || 10000,
      batchSize: config.batchSize || 32,

      // Training
      targetUpdateFrequency: config.targetUpdateFrequency || 100,

      ...config
    };

    // Q-Table: Map de (state, action) -> Q-value
    this.qTable = new Map();

    // Target Q-Table para estabilidad
    this.targetQTable = new Map();

    // Experience replay buffer
    this.replayBuffer = [];

    // Estadísticas
    this.stats = {
      totalSteps: 0,
      totalEpisodes: 0,
      totalReward: 0,
      averageReward: 0,
      explorationRate: this.config.explorationRate,
      learningRate: this.config.learningRate
    };

    // Acciones disponibles
    this.actions = [
      'quick_response',
      'detailed_analysis',
      'proactive_action',
      'request_clarification',
      'execute_directly',
      'suggest_alternatives',
      'learn_and_adapt',
      'escalate_to_human'
    ];
  }

  /**
   * Selecciona la mejor acción para un estado dado
   * Usa estrategia ε-greedy (exploración vs explotación)
   */
  selectAction(state, training = true) {
    const stateKey = this.encodeState(state);

    // ε-greedy: exploración vs explotación
    if (training && Math.random() < this.config.explorationRate) {
      // Exploración: acción aleatoria
      const randomAction = this.actions[Math.floor(Math.random() * this.actions.length)];

      this.emit('actionSelected', {
        state: stateKey,
        action: randomAction,
        type: 'exploration',
        explorationRate: this.config.explorationRate
      });

      return randomAction;
    }

    // Explotación: mejor acción conocida
    const qValues = this.getQValues(stateKey);
    const bestAction = this.getBestAction(qValues);

    this.emit('actionSelected', {
      state: stateKey,
      action: bestAction,
      type: 'exploitation',
      qValue: qValues.get(bestAction)
    });

    return bestAction;
  }

  /**
   * Actualiza Q-value basado en la experiencia
   */
  learn(state, action, reward, nextState, done = false) {
    this.stats.totalSteps++;
    this.stats.totalReward += reward;

    const stateKey = this.encodeState(state);
    const nextStateKey = this.encodeState(nextState);

    // Obtener Q-values actuales
    const currentQ = this.getQValue(stateKey, action);

    // Calcular valor máximo del siguiente estado
    const nextQValues = this.getQValues(nextStateKey);
    const maxNextQ = done ? 0 : Math.max(...Array.from(nextQValues.values()));

    // Fórmula de Q-Learning:
    // Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
    const tdTarget = reward + this.config.discountFactor * maxNextQ;
    const tdError = tdTarget - currentQ;
    const newQ = currentQ + this.config.learningRate * tdError;

    // Actualizar Q-table
    this.setQValue(stateKey, action, newQ);

    // Agregar a experience replay buffer
    this.addToReplayBuffer({
      state: stateKey,
      action,
      reward,
      nextState: nextStateKey,
      done
    });

    // Entrenar con experience replay
    if (this.replayBuffer.length >= this.config.batchSize) {
      this.trainWithReplay();
    }

    // Actualizar target network periódicamente
    if (this.stats.totalSteps % this.config.targetUpdateFrequency === 0) {
      this.updateTargetNetwork();
    }

    // Decay exploration rate
    this.config.explorationRate = Math.max(
      this.config.minExplorationRate,
      this.config.explorationRate * this.config.explorationDecay
    );

    this.stats.explorationRate = this.config.explorationRate;
    this.stats.averageReward = this.stats.totalReward / this.stats.totalSteps;

    this.emit('learned', {
      state: stateKey,
      action,
      reward,
      tdError,
      newQ,
      explorationRate: this.config.explorationRate
    });

    return {
      tdError,
      newQ,
      averageReward: this.stats.averageReward
    };
  }

  /**
   * Entrena usando experiencias pasadas (Experience Replay)
   */
  trainWithReplay() {
    // Samplear batch aleatorio
    const batch = this.sampleReplayBuffer(this.config.batchSize);

    for (const experience of batch) {
      const { state, action, reward, nextState, done } = experience;

      const currentQ = this.getQValue(state, action);
      const nextQValues = this.getQValues(nextState);
      const maxNextQ = done ? 0 : Math.max(...Array.from(nextQValues.values()));

      const tdTarget = reward + this.config.discountFactor * maxNextQ;
      const tdError = tdTarget - currentQ;
      const newQ = currentQ + this.config.learningRate * tdError;

      this.setQValue(state, action, newQ);
    }
  }

  /**
   * Actualiza target network para estabilidad
   */
  updateTargetNetwork() {
    this.targetQTable = new Map(this.qTable);

    this.emit('targetNetworkUpdated', {
      step: this.stats.totalSteps,
      qTableSize: this.qTable.size
    });
  }

  // ==========================================================================
  // Q-TABLE MANAGEMENT
  // ==========================================================================

  getQValue(state, action) {
    const key = `${state}:${action}`;
    return this.qTable.get(key) || 0;
  }

  setQValue(state, action, value) {
    const key = `${state}:${action}`;
    this.qTable.set(key, value);
  }

  getQValues(state) {
    const qValues = new Map();

    for (const action of this.actions) {
      qValues.set(action, this.getQValue(state, action));
    }

    return qValues;
  }

  getBestAction(qValues) {
    let bestAction = this.actions[0];
    let bestValue = -Infinity;

    for (const [action, value] of qValues) {
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }

    return bestAction;
  }

  // ==========================================================================
  // STATE ENCODING
  // ==========================================================================

  encodeState(state) {
    // Convertir estado a string clave única
    if (typeof state === 'string') return state;

    const features = [
      state.taskComplexity || 'medium',
      state.urgency || 'normal',
      state.userExperience || 'intermediate',
      state.contextClarity || 'clear',
      state.domain || 'general'
    ];

    return features.join(':');
  }

  // ==========================================================================
  // EXPERIENCE REPLAY
  // ==========================================================================

  addToReplayBuffer(experience) {
    this.replayBuffer.push(experience);

    // Mantener tamaño máximo
    if (this.replayBuffer.length > this.config.replayBufferSize) {
      this.replayBuffer.shift();
    }
  }

  sampleReplayBuffer(batchSize) {
    const samples = [];

    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.replayBuffer.length);
      samples.push(this.replayBuffer[randomIndex]);
    }

    return samples;
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  async save() {
    const data = {
      qTable: Array.from(this.qTable.entries()),
      stats: this.stats,
      config: this.config
    };

    const filePath = path.join(__dirname, 'memory', 'q-learning-agent.json');

    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('✓ Q-Learning agent saved');
    } catch (error) {
      console.error('✗ Failed to save Q-Learning agent:', error.message);
    }
  }

  async load() {
    const filePath = path.join(__dirname, 'memory', 'q-learning-agent.json');

    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

      this.qTable = new Map(data.qTable);
      this.stats = data.stats;

      console.log('✓ Q-Learning agent loaded');
      console.log(`  Q-table entries: ${this.qTable.size}`);
      console.log(`  Total steps: ${this.stats.totalSteps}`);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('✗ Failed to load Q-Learning agent:', error.message);
      }
    }
  }

  getStatistics() {
    return {
      ...this.stats,
      qTableSize: this.qTable.size,
      replayBufferSize: this.replayBuffer.length
    };
  }
}

// ============================================================================
// MULTI-ARMED BANDIT
// ============================================================================

/**
 * Implementación de Multi-Armed Bandit para optimización de estrategias
 */
class MultiArmedBandit extends EventEmitter {
  constructor(arms = [], config = {}) {
    super();

    this.arms = arms; // Diferentes estrategias/opciones
    this.config = {
      epsilon: config.epsilon || 0.1, // Para ε-greedy
      temperature: config.temperature || 1.0, // Para softmax
      c: config.c || 2, // Para UCB
      ...config
    };

    // Estadísticas por brazo
    this.armStats = new Map();

    for (const arm of arms) {
      this.armStats.set(arm, {
        pulls: 0,
        totalReward: 0,
        averageReward: 0,
        confidence: 0
      });
    }

    this.totalPulls = 0;
  }

  /**
   * Selecciona un brazo usando ε-greedy
   */
  selectEpsilonGreedy() {
    if (Math.random() < this.config.epsilon) {
      // Exploración
      return this.arms[Math.floor(Math.random() * this.arms.length)];
    }

    // Explotación
    return this.getBestArm();
  }

  /**
   * Selecciona un brazo usando UCB (Upper Confidence Bound)
   */
  selectUCB() {
    if (this.totalPulls === 0) {
      return this.arms[0];
    }

    let bestArm = this.arms[0];
    let bestScore = -Infinity;

    for (const arm of this.arms) {
      const stats = this.armStats.get(arm);

      if (stats.pulls === 0) {
        return arm; // Priorizar brazos no explorados
      }

      // UCB formula: avg + c * sqrt(ln(total) / pulls)
      const ucb = stats.averageReward +
        this.config.c * Math.sqrt(Math.log(this.totalPulls) / stats.pulls);

      if (ucb > bestScore) {
        bestScore = ucb;
        bestArm = arm;
      }
    }

    return bestArm;
  }

  /**
   * Selecciona un brazo usando Softmax (Boltzmann)
   */
  selectSoftmax() {
    const scores = [];
    let sumExp = 0;

    for (const arm of this.arms) {
      const stats = this.armStats.get(arm);
      const exp = Math.exp(stats.averageReward / this.config.temperature);
      scores.push({ arm, exp });
      sumExp += exp;
    }

    // Probabilidad proporcional a exp(reward/temp)
    const random = Math.random() * sumExp;
    let cumulative = 0;

    for (const { arm, exp } of scores) {
      cumulative += exp;
      if (random <= cumulative) {
        return arm;
      }
    }

    return this.arms[this.arms.length - 1];
  }

  /**
   * Actualiza estadísticas después de recibir reward
   */
  update(arm, reward) {
    const stats = this.armStats.get(arm);

    stats.pulls++;
    stats.totalReward += reward;
    stats.averageReward = stats.totalReward / stats.pulls;

    // Calcular intervalo de confianza
    if (stats.pulls > 1) {
      stats.confidence = 1.96 * Math.sqrt(
        stats.averageReward * (1 - stats.averageReward) / stats.pulls
      );
    }

    this.totalPulls++;

    this.emit('updated', {
      arm,
      reward,
      stats: { ...stats }
    });
  }

  getBestArm() {
    let bestArm = this.arms[0];
    let bestReward = -Infinity;

    for (const arm of this.arms) {
      const stats = this.armStats.get(arm);
      if (stats.averageReward > bestReward) {
        bestReward = stats.averageReward;
        bestArm = arm;
      }
    }

    return bestArm;
  }

  getStatistics() {
    const stats = {};

    for (const arm of this.arms) {
      stats[arm] = { ...this.armStats.get(arm) };
    }

    return {
      arms: stats,
      totalPulls: this.totalPulls,
      bestArm: this.getBestArm()
    };
  }
}

// ============================================================================
// REWARD SHAPING ENGINE
// ============================================================================

/**
 * Motor de diseño de recompensas para guiar el aprendizaje
 */
class RewardShaper extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      baseReward: config.baseReward || 1.0,
      penaltyMultiplier: config.penaltyMultiplier || -0.5,
      bonusMultiplier: config.bonusMultiplier || 1.5,
      ...config
    };

    // Definir estructura de recompensas
    this.rewardStructure = {
      // Recompensas por éxito
      task_completed: 10,
      task_partially_completed: 5,
      user_satisfied: 15,
      efficiency_high: 8,
      accuracy_high: 12,

      // Penalizaciones
      task_failed: -10,
      user_unsatisfied: -15,
      timeout: -5,
      error: -8,
      resource_waste: -3,

      // Bonos especiales
      proactive_help: 5,
      learning_demonstrated: 7,
      innovation: 10,
      cost_saving: 6
    };
  }

  /**
   * Calcula recompensa basada en múltiples factores
   */
  calculateReward(outcome, metrics = {}) {
    let totalReward = 0;

    // Recompensa base por tipo de outcome
    if (outcome.success) {
      totalReward += this.rewardStructure.task_completed;

      // Bonos por calidad
      if (metrics.accuracy >= 0.9) {
        totalReward += this.rewardStructure.accuracy_high;
      }

      if (metrics.efficiency >= 0.8) {
        totalReward += this.rewardStructure.efficiency_high;
      }

      if (metrics.userSatisfaction >= 0.9) {
        totalReward += this.rewardStructure.user_satisfied;
      }

    } else {
      totalReward += this.rewardStructure.task_failed;

      // Penalizaciones adicionales
      if (metrics.timeout) {
        totalReward += this.rewardStructure.timeout;
      }

      if (metrics.error) {
        totalReward += this.rewardStructure.error;
      }
    }

    // Bonos especiales
    if (metrics.proactive) {
      totalReward += this.rewardStructure.proactive_help;
    }

    if (metrics.learned) {
      totalReward += this.rewardStructure.learning_demonstrated;
    }

    if (metrics.innovative) {
      totalReward += this.rewardStructure.innovation;
    }

    // Normalizar reward
    const normalizedReward = this.normalizeReward(totalReward);

    this.emit('rewardCalculated', {
      outcome,
      metrics,
      rawReward: totalReward,
      normalizedReward
    });

    return normalizedReward;
  }

  normalizeReward(reward) {
    // Normalizar a rango [-1, 1]
    const maxReward = 50;
    return Math.max(-1, Math.min(1, reward / maxReward));
  }

  /**
   * Reward shaping: agregar recompensas intermedias
   */
  shapeReward(state, action, nextState) {
    let shapingReward = 0;

    // Recompensa por progreso
    if (this.isProgressMade(state, nextState)) {
      shapingReward += 0.1;
    }

    // Recompensa por acercarse al objetivo
    const currentDistance = this.distanceToGoal(state);
    const nextDistance = this.distanceToGoal(nextState);

    if (nextDistance < currentDistance) {
      shapingReward += 0.2 * (currentDistance - nextDistance);
    }

    return shapingReward;
  }

  isProgressMade(state, nextState) {
    // Lógica para determinar si hubo progreso
    return nextState.completionPercentage > state.completionPercentage;
  }

  distanceToGoal(state) {
    // Calcular distancia al objetivo
    return 1 - (state.completionPercentage || 0);
  }
}

// ============================================================================
// REINFORCEMENT LEARNING COORDINATOR
// ============================================================================

/**
 * Coordina todos los componentes de RL
 */
class ReinforcementLearningCoordinator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.qLearning = new QLearningAgent(config.qLearning);
    this.rewardShaper = new RewardShaper(config.rewards);

    // Multi-Armed Bandit para estrategias
    this.strategyBandit = new MultiArmedBandit([
      'aggressive',
      'conservative',
      'balanced',
      'adaptive'
    ], config.bandit);

    this.currentEpisode = {
      state: null,
      action: null,
      stepCount: 0
    };

    this.episodes = [];
  }

  async initialize() {
    console.log('\n⚡ REINFORCEMENT LEARNING SYSTEM INITIALIZING...\n');

    await this.qLearning.load();

    console.log('\n✓ Reinforcement Learning ready\n');
    console.log('"Every action teaches me the optimal path, sir."\n');
  }

  /**
   * Ejecuta un paso de RL
   */
  async step(state, context = {}) {
    // Seleccionar acción usando Q-Learning
    const action = this.qLearning.selectAction(state, context.training);

    // Ejecutar acción y obtener resultado
    const result = await this.executeAction(action, state, context);

    // Calcular recompensa
    const reward = this.rewardShaper.calculateReward(result.outcome, result.metrics);

    // Aprender de la experiencia
    if (context.training) {
      this.qLearning.learn(state, action, reward, result.nextState, result.done);
    }

    this.currentEpisode.stepCount++;

    return {
      action,
      result,
      reward,
      nextState: result.nextState
    };
  }

  async executeAction(action, state, context) {
    // Esta función debería ser implementada según las acciones específicas
    // Por ahora, retorna un resultado simulado

    return {
      outcome: { success: true },
      metrics: {
        accuracy: 0.9,
        efficiency: 0.85,
        userSatisfaction: 0.9
      },
      nextState: { ...state, completionPercentage: (state.completionPercentage || 0) + 0.1 },
      done: (state.completionPercentage || 0) >= 0.9
    };
  }

  async save() {
    await this.qLearning.save();
  }

  getStatistics() {
    return {
      qLearning: this.qLearning.getStatistics(),
      strategyBandit: this.strategyBandit.getStatistics(),
      episodes: this.episodes.length
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  QLearningAgent,
  MultiArmedBandit,
  RewardShaper,
  ReinforcementLearningCoordinator
};

// CLI Test
if (require.main === module) {
  (async () => {
    const coordinator = new ReinforcementLearningCoordinator({
      qLearning: {
        learningRate: 0.1,
        discountFactor: 0.95,
        explorationRate: 1.0
      }
    });

    await coordinator.initialize();

    console.log('\n🧪 Running RL training episodes...\n');

    // Entrenar por 100 episodios
    for (let episode = 0; episode < 100; episode++) {
      let state = {
        taskComplexity: 'medium',
        urgency: 'normal',
        userExperience: 'intermediate',
        contextClarity: 'clear',
        domain: 'code',
        completionPercentage: 0
      };

      let episodeReward = 0;
      let steps = 0;

      while (steps < 10) {
        const { action, result, reward, nextState } = await coordinator.step(state, { training: true });

        episodeReward += reward;
        state = nextState;
        steps++;

        if (result.done) break;
      }

      if (episode % 10 === 0) {
        console.log(`Episode ${episode}: Total Reward = ${episodeReward.toFixed(2)}`);
      }
    }

    console.log('\n📊 Final Statistics:');
    const stats = coordinator.getStatistics();
    console.log(JSON.stringify(stats, null, 2));

    await coordinator.save();

    console.log('\n"I\'ve learned the optimal strategy, sir."\n');

    process.exit(0);
  })();
}
