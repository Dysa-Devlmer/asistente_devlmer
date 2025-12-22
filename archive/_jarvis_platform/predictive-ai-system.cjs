#!/usr/bin/env node

/**
 * ⚡ J.A.R.V.I.S. PREDICTIVE AI SYSTEM
 *
 * "I anticipate your needs before you know them yourself, sir."
 * - JARVIS
 *
 * Sistema de IA predictiva que anticipa necesidades del usuario:
 * - Predicción de tareas futuras
 * - Preparación proactiva de recursos
 * - Sugerencias contextuales inteligentes
 * - Detección temprana de problemas
 * - Auto-configuración predictiva
 *
 * @version 4.0.0 Mark VII
 * @author Stark Industries - Predictive Intelligence Division
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// TEMPORAL PREDICTOR
// ============================================================================

/**
 * Predice eventos futuros basándose en series temporales
 */
class TemporalPredictor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      windowSize: config.windowSize || 10,
      horizonSize: config.horizonSize || 5,
      smoothingFactor: config.smoothingFactor || 0.3,
      ...config
    };

    // Time series data
    this.timeSeries = new Map();

    // Predictions cache
    this.predictions = new Map();
  }

  /**
   * Registra un punto de datos temporal
   */
  recordDataPoint(series, value, timestamp = Date.now()) {
    if (!this.timeSeries.has(series)) {
      this.timeSeries.set(series, []);
    }

    this.timeSeries.get(series).push({
      value,
      timestamp
    });

    // Mantener solo últimos N puntos
    const data = this.timeSeries.get(series);
    if (data.length > 1000) {
      this.timeSeries.set(series, data.slice(-1000));
    }

    this.emit('dataPointRecorded', { series, value, timestamp });
  }

  /**
   * Predice próximos valores usando Moving Average
   */
  predictMovingAverage(series, steps = this.config.horizonSize) {
    const data = this.timeSeries.get(series);

    if (!data || data.length < this.config.windowSize) {
      return {
        predictions: [],
        confidence: 0,
        method: 'moving_average',
        reason: 'insufficient_data'
      };
    }

    const recentData = data.slice(-this.config.windowSize);
    const average = recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length;

    // Calcular tendencia
    const trend = this.calculateTrend(recentData);

    const predictions = [];

    for (let i = 1; i <= steps; i++) {
      predictions.push({
        step: i,
        value: average + (trend * i),
        timestamp: Date.now() + (i * this.estimateInterval(data))
      });
    }

    // Calcular confianza basada en estabilidad
    const confidence = this.calculateConfidence(recentData);

    return {
      predictions,
      confidence,
      method: 'moving_average',
      trend,
      currentAverage: average
    };
  }

  /**
   * Predice usando Exponential Smoothing
   */
  predictExponentialSmoothing(series, steps = this.config.horizonSize) {
    const data = this.timeSeries.get(series);

    if (!data || data.length < 3) {
      return {
        predictions: [],
        confidence: 0,
        method: 'exponential_smoothing',
        reason: 'insufficient_data'
      };
    }

    const alpha = this.config.smoothingFactor;

    // Calcular smoothed values
    let smoothed = data[0].value;

    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i].value + (1 - alpha) * smoothed;
    }

    // Calcular trend con double exponential smoothing
    const trend = this.calculateExponentialTrend(data, alpha);

    const predictions = [];
    const interval = this.estimateInterval(data);

    for (let i = 1; i <= steps; i++) {
      predictions.push({
        step: i,
        value: smoothed + (trend * i),
        timestamp: Date.now() + (i * interval)
      });
    }

    const confidence = this.calculateConfidence(data.slice(-this.config.windowSize));

    return {
      predictions,
      confidence,
      method: 'exponential_smoothing',
      smoothed,
      trend
    };
  }

  /**
   * Detecta ciclos y estacionalidad
   */
  detectSeasonality(series) {
    const data = this.timeSeries.get(series);

    if (!data || data.length < 24) {
      return null;
    }

    // Detectar ciclo diario (24 puntos)
    const dailyCycle = this.detectCycle(data, 24);

    // Detectar ciclo semanal (si hay suficientes datos)
    const weeklyCycle = data.length >= 168 ? this.detectCycle(data, 168) : null;

    return {
      daily: dailyCycle,
      weekly: weeklyCycle
    };
  }

  detectCycle(data, period) {
    if (data.length < period * 2) return null;

    const cycles = [];
    let cycleStart = 0;

    while (cycleStart + period <= data.length) {
      const cycle = data.slice(cycleStart, cycleStart + period);
      cycles.push(cycle);
      cycleStart += period;
    }

    // Promediar ciclos
    const avgCycle = [];

    for (let i = 0; i < period; i++) {
      const values = cycles.map(cycle => cycle[i]?.value || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      avgCycle.push(avg);
    }

    // Calcular fuerza del ciclo
    const strength = this.calculateCycleStrength(cycles, avgCycle);

    return {
      period,
      pattern: avgCycle,
      strength,
      detected: strength > 0.5
    };
  }

  calculateCycleStrength(cycles, avgCycle) {
    if (cycles.length === 0) return 0;

    let totalVariance = 0;
    let patternVariance = 0;

    for (const cycle of cycles) {
      for (let i = 0; i < cycle.length; i++) {
        const value = cycle[i]?.value || 0;
        const avgValue = avgCycle[i];

        patternVariance += Math.pow(value - avgValue, 2);
      }
    }

    // Calcular varianza total
    const allValues = cycles.flat().map(p => p?.value || 0);
    const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    for (const value of allValues) {
      totalVariance += Math.pow(value - overallMean, 2);
    }

    return totalVariance > 0 ? 1 - (patternVariance / totalVariance) : 0;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;

    // Linear regression para calcular tendencia
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i].value;
      sumXY += i * data[i].value;
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }

  calculateExponentialTrend(data, alpha) {
    if (data.length < 2) return 0;

    let trend = data[1].value - data[0].value;

    for (let i = 2; i < data.length; i++) {
      const newTrend = data[i].value - data[i - 1].value;
      trend = alpha * newTrend + (1 - alpha) * trend;
    }

    return trend;
  }

  calculateConfidence(data) {
    if (data.length < 2) return 0;

    // Confianza basada en estabilidad (baja varianza = alta confianza)
    const values = data.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Normalizar confianza (alta stdDev = baja confianza)
    const cv = mean !== 0 ? stdDev / Math.abs(mean) : 1;

    return Math.max(0, Math.min(1, 1 - cv));
  }

  estimateInterval(data) {
    if (data.length < 2) return 60000; // Default 1 minuto

    const intervals = [];

    for (let i = 1; i < Math.min(10, data.length); i++) {
      intervals.push(data[i].timestamp - data[i - 1].timestamp);
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  getData(series) {
    return this.timeSeries.get(series) || [];
  }
}

// ============================================================================
// CONTEXTUAL NEEDS PREDICTOR
// ============================================================================

/**
 * Predice necesidades basándose en contexto actual
 */
class ContextualNeedsPredictor extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      confidenceThreshold: config.confidenceThreshold || 0.6,
      maxPredictions: config.maxPredictions || 10,
      ...config
    };

    // Context history
    this.contextHistory = [];

    // Need patterns
    this.needPatterns = new Map();

    // Context-need associations
    this.associations = new Map();
  }

  /**
   * Registra contexto y necesidad satisfecha
   */
  recordNeed(context, need, satisfied = true) {
    const contextKey = this.encodeContext(context);

    // Registrar en historial
    this.contextHistory.push({
      context: contextKey,
      need,
      satisfied,
      timestamp: Date.now()
    });

    // Actualizar asociaciones
    if (!this.associations.has(contextKey)) {
      this.associations.set(contextKey, new Map());
    }

    const contextNeeds = this.associations.get(contextKey);
    const needData = contextNeeds.get(need) || {
      occurrences: 0,
      satisfied: 0,
      avgTimestamp: Date.now()
    };

    needData.occurrences++;
    if (satisfied) needData.satisfied++;
    needData.avgTimestamp = (needData.avgTimestamp * (needData.occurrences - 1) + Date.now()) / needData.occurrences;

    contextNeeds.set(need, needData);

    this.emit('needRecorded', { context: contextKey, need, satisfied });
  }

  /**
   * Predice necesidades para el contexto actual
   */
  predictNeeds(currentContext) {
    const contextKey = this.encodeContext(currentContext);

    // Obtener necesidades asociadas a este contexto
    const contextNeeds = this.associations.get(contextKey);

    if (!contextNeeds) {
      return {
        predictions: [],
        confidence: 0,
        reason: 'no_historical_data'
      };
    }

    const predictions = [];

    for (const [need, data] of contextNeeds) {
      const successRate = data.satisfied / data.occurrences;
      const frequency = data.occurrences / this.contextHistory.length;

      const confidence = (successRate * 0.7 + frequency * 0.3);

      if (confidence >= this.config.confidenceThreshold) {
        predictions.push({
          need,
          confidence,
          successRate,
          frequency,
          occurrences: data.occurrences,
          priority: this.calculatePriority(data, currentContext)
        });
      }
    }

    // Ordenar por confianza y prioridad
    predictions.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + a.priority * 0.4;
      const scoreB = b.confidence * 0.6 + b.priority * 0.4;
      return scoreB - scoreA;
    });

    // Buscar necesidades en contextos similares
    const similarContexts = this.findSimilarContexts(currentContext);
    const similarNeeds = this.getNeedsFromSimilarContexts(similarContexts);

    // Combinar predicciones
    const combinedPredictions = this.combinepredictions(predictions, similarNeeds);

    return {
      predictions: combinedPredictions.slice(0, this.config.maxPredictions),
      totalCandidates: combinedPredictions.length,
      method: 'contextual_association'
    };
  }

  findSimilarContexts(currentContext) {
    const similar = [];
    const currentKey = this.encodeContext(currentContext);

    for (const [contextKey, needs] of this.associations) {
      if (contextKey === currentKey) continue;

      const similarity = this.calculateContextSimilarity(currentContext, this.decodeContext(contextKey));

      if (similarity > 0.5) {
        similar.push({
          contextKey,
          similarity,
          needs
        });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  getNeedsFromSimilarContexts(similarContexts) {
    const needs = new Map();

    for (const { contextKey, similarity, needs: contextNeeds } of similarContexts) {
      for (const [need, data] of contextNeeds) {
        if (!needs.has(need)) {
          needs.set(need, {
            confidence: 0,
            sources: []
          });
        }

        const needData = needs.get(need);
        const successRate = data.satisfied / data.occurrences;
        needData.confidence += (successRate * similarity);
        needData.sources.push(contextKey);
      }
    }

    return Array.from(needs.entries()).map(([need, data]) => ({
      need,
      confidence: data.confidence / similarContexts.length,
      sources: data.sources,
      fromSimilarContext: true
    }));
  }

  combinePredictions(directPredictions, similarPredictions) {
    const combined = new Map();

    // Agregar predicciones directas
    for (const pred of directPredictions) {
      combined.set(pred.need, {
        ...pred,
        combinedConfidence: pred.confidence * 0.8 // Mayor peso a contexto exacto
      });
    }

    // Agregar predicciones de contextos similares
    for (const pred of similarPredictions) {
      if (combined.has(pred.need)) {
        const existing = combined.get(pred.need);
        existing.combinedConfidence = Math.max(existing.combinedConfidence, pred.confidence * 0.5);
        existing.fromSimilarContext = true;
      } else {
        combined.set(pred.need, {
          ...pred,
          combinedConfidence: pred.confidence * 0.5
        });
      }
    }

    return Array.from(combined.values())
      .sort((a, b) => b.combinedConfidence - a.combinedConfidence);
  }

  calculatePriority(needData, currentContext) {
    // Prioridad basada en urgencia del contexto y frecuencia de la necesidad
    const recency = this.calculateRecency(needData.avgTimestamp);
    const frequency = Math.min(1, needData.occurrences / 10);
    const urgency = currentContext.urgency || 0.5;

    return (recency * 0.3 + frequency * 0.4 + urgency * 0.3);
  }

  calculateRecency(timestamp) {
    const age = Date.now() - timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días

    return Math.max(0, 1 - (age / maxAge));
  }

  encodeContext(context) {
    // Convertir contexto a clave única
    const features = [
      context.taskType || 'general',
      context.domain || 'general',
      context.timeOfDay || 'any',
      context.userState || 'active'
    ];

    return features.join(':');
  }

  decodeContext(contextKey) {
    const [taskType, domain, timeOfDay, userState] = contextKey.split(':');

    return {
      taskType,
      domain,
      timeOfDay,
      userState
    };
  }

  calculateContextSimilarity(context1, context2) {
    const keys = ['taskType', 'domain', 'timeOfDay', 'userState'];
    let matches = 0;

    for (const key of keys) {
      if (context1[key] === context2[key]) matches++;
    }

    return matches / keys.length;
  }

  getStatistics() {
    return {
      totalContexts: this.associations.size,
      totalRecords: this.contextHistory.length,
      uniqueNeeds: this.getUniqueNeeds(),
      mostCommonNeeds: this.getMostCommonNeeds(5)
    };
  }

  getUniqueNeeds() {
    const needs = new Set();

    for (const [context, contextNeeds] of this.associations) {
      for (const need of contextNeeds.keys()) {
        needs.add(need);
      }
    }

    return needs.size;
  }

  getMostCommonNeeds(count = 5) {
    const needCounts = new Map();

    for (const [context, contextNeeds] of this.associations) {
      for (const [need, data] of contextNeeds) {
        needCounts.set(need, (needCounts.get(need) || 0) + data.occurrences);
      }
    }

    return Array.from(needCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([need, count]) => ({ need, count }));
  }
}

// ============================================================================
// PROACTIVE RESOURCE MANAGER
// ============================================================================

/**
 * Gestiona recursos de manera proactiva basándose en predicciones
 */
class ProactiveResourceManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      preparationThreshold: config.preparationThreshold || 0.7,
      maxConcurrentPreparations: config.maxConcurrentPreparations || 5,
      ...config
    };

    // Resources registry
    this.resources = new Map();

    // Prepared resources
    this.preparedResources = new Map();

    // Resource usage history
    this.usageHistory = [];
  }

  /**
   * Registra un tipo de recurso
   */
  registerResource(resourceType, preparationFn, cleanupFn) {
    this.resources.set(resourceType, {
      type: resourceType,
      preparationFn,
      cleanupFn,
      avgPreparationTime: 0,
      usageCount: 0,
      hitRate: 0
    });

    this.emit('resourceRegistered', resourceType);
  }

  /**
   * Prepara recursos basándose en predicciones
   */
  async prepareResources(predictions) {
    const preparations = [];

    for (const prediction of predictions) {
      if (prediction.confidence >= this.config.preparationThreshold) {
        // Verificar si ya está preparado
        if (!this.preparedResources.has(prediction.need)) {
          if (preparations.length < this.config.maxConcurrentPreparations) {
            preparations.push(this.prepareResource(prediction));
          }
        }
      }
    }

    const results = await Promise.allSettled(preparations);

    const successful = results.filter(r => r.status === 'fulfilled').length;

    this.emit('resourcesPrepared', {
      total: preparations.length,
      successful,
      failed: preparations.length - successful
    });

    return results;
  }

  async prepareResource(prediction) {
    const resourceType = prediction.need;
    const resource = this.resources.get(resourceType);

    if (!resource) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    const startTime = Date.now();

    try {
      // Ejecutar preparación
      const preparedData = await resource.preparationFn(prediction);

      const preparationTime = Date.now() - startTime;

      // Actualizar estadísticas
      resource.avgPreparationTime = (resource.avgPreparationTime * resource.usageCount + preparationTime) / (resource.usageCount + 1);

      // Guardar recurso preparado
      this.preparedResources.set(resourceType, {
        data: preparedData,
        preparedAt: Date.now(),
        prediction,
        used: false
      });

      this.emit('resourcePrepared', {
        type: resourceType,
        preparationTime,
        confidence: prediction.confidence
      });

      return {
        type: resourceType,
        success: true,
        preparationTime
      };

    } catch (error) {
      this.emit('resourcePreparationFailed', {
        type: resourceType,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Obtiene recurso preparado
   */
  getResource(resourceType) {
    const prepared = this.preparedResources.get(resourceType);

    if (prepared) {
      prepared.used = true;

      // Registrar uso
      this.usageHistory.push({
        type: resourceType,
        preparedAt: prepared.preparedAt,
        usedAt: Date.now(),
        waitTime: Date.now() - prepared.preparedAt,
        prediction: prepared.prediction
      });

      // Actualizar hit rate
      const resource = this.resources.get(resourceType);
      if (resource) {
        resource.usageCount++;
        resource.hitRate = this.calculateHitRate(resourceType);
      }

      this.emit('resourceUsed', {
        type: resourceType,
        waitTime: Date.now() - prepared.preparedAt
      });

      return prepared.data;
    }

    return null;
  }

  calculateHitRate(resourceType) {
    const usages = this.usageHistory.filter(u => u.type === resourceType);
    const preparations = Array.from(this.preparedResources.values())
      .filter(p => p.prediction.need === resourceType);

    const hits = usages.length;
    const total = preparations.length;

    return total > 0 ? hits / total : 0;
  }

  /**
   * Limpia recursos no utilizados
   */
  async cleanupUnusedResources(maxAge = 5 * 60 * 1000) {
    const now = Date.now();
    const toCleanup = [];

    for (const [type, prepared] of this.preparedResources) {
      const age = now - prepared.preparedAt;

      if (!prepared.used && age > maxAge) {
        toCleanup.push(type);
      }
    }

    for (const type of toCleanup) {
      const resource = this.resources.get(type);
      const prepared = this.preparedResources.get(type);

      if (resource?.cleanupFn && prepared) {
        try {
          await resource.cleanupFn(prepared.data);
        } catch (error) {
          console.error(`Cleanup failed for ${type}:`, error.message);
        }
      }

      this.preparedResources.delete(type);
    }

    if (toCleanup.length > 0) {
      this.emit('resourcesCleaned', {
        count: toCleanup.length,
        types: toCleanup
      });
    }

    return toCleanup;
  }

  getStatistics() {
    return {
      registeredResources: this.resources.size,
      preparedResources: this.preparedResources.size,
      totalUsages: this.usageHistory.length,
      hitRates: this.getHitRates(),
      avgWaitTime: this.calculateAvgWaitTime()
    };
  }

  getHitRates() {
    const hitRates = {};

    for (const [type, resource] of this.resources) {
      hitRates[type] = resource.hitRate;
    }

    return hitRates;
  }

  calculateAvgWaitTime() {
    if (this.usageHistory.length === 0) return 0;

    const totalWait = this.usageHistory.reduce((sum, usage) => sum + usage.waitTime, 0);

    return totalWait / this.usageHistory.length;
  }
}

// ============================================================================
// PREDICTIVE AI COORDINATOR
// ============================================================================

/**
 * Coordina todos los sistemas predictivos
 */
class PredictiveAICoordinator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.temporalPredictor = new TemporalPredictor(config.temporal);
    this.needsPredictor = new ContextualNeedsPredictor(config.needs);
    this.resourceManager = new ProactiveResourceManager(config.resources);

    this.predictionInterval = null;
    this.cleanupInterval = null;

    this.config = {
      predictionInterval: config.predictionInterval || 60000, // 1 minuto
      cleanupInterval: config.cleanupInterval || 5 * 60000, // 5 minutos
      ...config
    };
  }

  async initialize() {
    console.log('\n⚡ PREDICTIVE AI SYSTEM INITIALIZING...\n');

    // Registrar recursos comunes
    this.registerCommonResources();

    // Iniciar predicción periódica
    this.startPeriodicPrediction();

    // Iniciar limpieza periódica
    this.startPeriodicCleanup();

    console.log('✓ Predictive AI System ready\n');
    console.log('"I\'m anticipating your needs, sir."\n');
  }

  registerCommonResources() {
    // Ejemplo: Pre-cargar datos de proyecto
    this.resourceManager.registerResource(
      'project_data',
      async (prediction) => {
        // Simulación de carga de datos
        return { loaded: true, timestamp: Date.now() };
      },
      async (data) => {
        // Limpieza
      }
    );

    // Ejemplo: Pre-compilar código
    this.resourceManager.registerResource(
      'compiled_code',
      async (prediction) => {
        return { compiled: true, timestamp: Date.now() };
      },
      async (data) => {}
    );
  }

  /**
   * Predicción periódica completa
   */
  startPeriodicPrediction() {
    this.predictionInterval = setInterval(async () => {
      await this.runPredictionCycle();
    }, this.config.predictionInterval);

    console.log(`🔮 Periodic prediction active (every ${this.config.predictionInterval / 1000}s)`);
  }

  async runPredictionCycle() {
    try {
      // Obtener contexto actual (esto debería venir de sistema de contexto)
      const currentContext = this.getCurrentContext();

      // Predecir necesidades
      const needsPrediction = this.needsPredictor.predictNeeds(currentContext);

      // Preparar recursos proactivamente
      if (needsPrediction.predictions.length > 0) {
        await this.resourceManager.prepareResources(needsPrediction.predictions);
      }

      this.emit('predictionCycleCompleted', {
        context: currentContext,
        predictions: needsPrediction.predictions.length,
        prepared: this.resourceManager.preparedResources.size
      });

    } catch (error) {
      console.error('Prediction cycle error:', error.message);
    }
  }

  startPeriodicCleanup() {
    this.cleanupInterval = setInterval(async () => {
      await this.resourceManager.cleanupUnusedResources();
    }, this.config.cleanupInterval);
  }

  getCurrentContext() {
    const now = new Date();

    return {
      taskType: 'development',
      domain: 'code',
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      userState: 'active',
      urgency: 0.5
    };
  }

  /**
   * API pública para registro de necesidades
   */
  recordNeed(context, need, satisfied = true) {
    this.needsPredictor.recordNeed(context, need, satisfied);

    // También registrar en temporal si es numérico
    if (typeof need.value === 'number') {
      this.temporalPredictor.recordDataPoint(need.type, need.value);
    }
  }

  /**
   * API pública para obtener predicciones
   */
  async predict(context) {
    const needs = this.needsPredictor.predictNeeds(context);

    return needs;
  }

  async shutdown() {
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    await this.resourceManager.cleanupUnusedResources(0);

    console.log('\n✓ Predictive AI System shutdown complete');
  }

  getStatistics() {
    return {
      temporal: {
        series: this.temporalPredictor.timeSeries.size
      },
      needs: this.needsPredictor.getStatistics(),
      resources: this.resourceManager.getStatistics()
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  PredictiveAICoordinator,
  TemporalPredictor,
  ContextualNeedsPredictor,
  ProactiveResourceManager
};

// CLI Test
if (require.main === module) {
  (async () => {
    const coordinator = new PredictiveAICoordinator({
      predictionInterval: 5000,
      cleanupInterval: 10000
    });

    await coordinator.initialize();

    console.log('\n🧪 Simulating user needs...\n');

    // Simular registro de necesidades
    const contexts = [
      { taskType: 'development', domain: 'code', timeOfDay: 14, userState: 'active' },
      { taskType: 'development', domain: 'code', timeOfDay: 14, userState: 'active' },
      { taskType: 'testing', domain: 'code', timeOfDay: 15, userState: 'active' }
    ];

    const needs = ['project_data', 'compiled_code', 'test_results'];

    for (let i = 0; i < 10; i++) {
      const context = contexts[i % contexts.length];
      const need = needs[i % needs.length];

      coordinator.recordNeed(context, need, true);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🔮 Getting predictions...\n');

    const prediction = await coordinator.predict({
      taskType: 'development',
      domain: 'code',
      timeOfDay: 14,
      userState: 'active'
    });

    console.log('Predictions:', prediction.predictions.slice(0, 3));

    console.log('\n📊 Statistics:');
    const stats = coordinator.getStatistics();
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n"All needs anticipated and prepared, sir."\n');

    setTimeout(async () => {
      await coordinator.shutdown();
      process.exit(0);
    }, 15000);
  })();
}
