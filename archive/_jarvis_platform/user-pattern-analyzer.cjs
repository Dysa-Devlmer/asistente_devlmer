#!/usr/bin/env node

/**
 * ⚡ J.A.R.V.I.S. USER PATTERN ANALYZER
 *
 * "I know you better than you know yourself, sir."
 * - JARVIS
 *
 * Sistema avanzado de análisis de patrones de usuario que:
 * - Detecta rutinas y hábitos
 * - Predice próximas acciones
 * - Identifica preferencias
 * - Reconoce anomalías en comportamiento
 * - Adapta la interfaz al estilo del usuario
 *
 * @version 4.0.0 Mark VII
 * @author Stark Industries - User Intelligence Division
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// USER BEHAVIOR TRACKER
// ============================================================================

/**
 * Rastrea y analiza comportamiento del usuario en tiempo real
 */
class UserBehaviorTracker extends EventEmitter {
  constructor(userId, config = {}) {
    super();

    this.userId = userId;
    this.config = {
      sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 min
      maxEventsInMemory: config.maxEventsInMemory || 10000,
      analysisInterval: config.analysisInterval || 5 * 60 * 1000, // 5 min
      ...config
    };

    // Event stream
    this.events = [];
    this.sessions = [];
    this.currentSession = null;

    // Análisis en tiempo real
    this.realtimeStats = {
      totalEvents: 0,
      eventsPerMinute: 0,
      averageResponseTime: 0,
      mostUsedFeatures: new Map(),
      activeTime: 0,
      idleTime: 0
    };

    // Último evento
    this.lastEventTime = null;

    this.startSession();
  }

  /**
   * Registra un nuevo evento de usuario
   */
  trackEvent(event) {
    const timestamp = Date.now();

    const trackedEvent = {
      id: this.generateId(),
      userId: this.userId,
      type: event.type,
      action: event.action,
      target: event.target,
      data: event.data || {},
      timestamp,
      sessionId: this.currentSession?.id,
      duration: event.duration || 0
    };

    this.events.push(trackedEvent);
    this.realtimeStats.totalEvents++;

    // Gestión de sesión
    if (this.lastEventTime && (timestamp - this.lastEventTime) > this.config.sessionTimeout) {
      this.endSession();
      this.startSession();
    }

    this.lastEventTime = timestamp;

    // Actualizar estadísticas en tiempo real
    this.updateRealtimeStats(trackedEvent);

    // Mantener límite de eventos en memoria
    if (this.events.length > this.config.maxEventsInMemory) {
      this.events = this.events.slice(-this.config.maxEventsInMemory);
    }

    this.emit('eventTracked', trackedEvent);

    return trackedEvent;
  }

  startSession() {
    this.currentSession = {
      id: this.generateId(),
      userId: this.userId,
      startTime: Date.now(),
      endTime: null,
      events: [],
      duration: 0,
      features: new Set(),
      goals: []
    };

    this.emit('sessionStarted', this.currentSession);
  }

  endSession() {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    this.sessions.push(this.currentSession);

    this.emit('sessionEnded', this.currentSession);

    this.currentSession = null;
  }

  updateRealtimeStats(event) {
    // Características más usadas
    const feature = event.target || event.action;
    this.realtimeStats.mostUsedFeatures.set(
      feature,
      (this.realtimeStats.mostUsedFeatures.get(feature) || 0) + 1
    );

    // Tiempo de respuesta promedio
    if (event.duration) {
      const currentAvg = this.realtimeStats.averageResponseTime;
      const count = this.realtimeStats.totalEvents;
      this.realtimeStats.averageResponseTime = (currentAvg * (count - 1) + event.duration) / count;
    }
  }

  getRecentEvents(count = 100) {
    return this.events.slice(-count);
  }

  getEventsByType(type) {
    return this.events.filter(e => e.type === type);
  }

  getEventsByTimeRange(startTime, endTime) {
    return this.events.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// PATTERN DETECTOR
// ============================================================================

/**
 * Detecta patrones complejos en el comportamiento del usuario
 */
class PatternDetector extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      minPatternOccurrences: config.minPatternOccurrences || 3,
      minPatternConfidence: config.minPatternConfidence || 0.7,
      temporalWindowSize: config.temporalWindowSize || 60 * 60 * 1000, // 1 hour
      ...config
    };

    this.detectedPatterns = new Map();
    this.sequences = new Map();
    this.temporalPatterns = new Map();
    this.correlations = new Map();
  }

  /**
   * Analiza eventos y detecta patrones
   */
  analyzeEvents(events) {
    if (events.length === 0) return;

    // 1. Detectar patrones de secuencia
    this.detectSequencePatterns(events);

    // 2. Detectar patrones temporales
    this.detectTemporalPatterns(events);

    // 3. Detectar patrones de frecuencia
    this.detectFrequencyPatterns(events);

    // 4. Detectar correlaciones
    this.detectCorrelationPatterns(events);

    // 5. Detectar rutinas
    this.detectRoutines(events);

    this.emit('patternsAnalyzed', {
      totalPatterns: this.detectedPatterns.size,
      sequences: this.sequences.size,
      temporalPatterns: this.temporalPatterns.size
    });

    return this.getSummary();
  }

  /**
   * Detecta patrones de secuencia (A → B → C)
   */
  detectSequencePatterns(events) {
    const windowSize = 5; // Tamaño de ventana para secuencias

    for (let i = 0; i <= events.length - windowSize; i++) {
      const window = events.slice(i, i + windowSize);
      const sequence = window.map(e => e.action).join(' → ');

      if (!this.sequences.has(sequence)) {
        this.sequences.set(sequence, {
          pattern: sequence,
          occurrences: 0,
          events: [],
          avgDuration: 0,
          confidence: 0
        });
      }

      const pattern = this.sequences.get(sequence);
      pattern.occurrences++;
      pattern.events.push(window);

      // Calcular duración promedio
      const duration = window[window.length - 1].timestamp - window[0].timestamp;
      pattern.avgDuration = (pattern.avgDuration * (pattern.occurrences - 1) + duration) / pattern.occurrences;

      // Calcular confianza
      pattern.confidence = Math.min(1, pattern.occurrences / this.config.minPatternOccurrences);

      // Si el patrón es significativo, agregarlo a patrones detectados
      if (pattern.occurrences >= this.config.minPatternOccurrences &&
          pattern.confidence >= this.config.minPatternConfidence) {
        this.detectedPatterns.set(sequence, {
          type: 'sequence',
          ...pattern
        });

        this.emit('patternDetected', {
          type: 'sequence',
          pattern: sequence,
          confidence: pattern.confidence
        });
      }
    }
  }

  /**
   * Detecta patrones temporales (día de semana, hora del día)
   */
  detectTemporalPatterns(events) {
    for (const event of events) {
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const timeKey = `${dayOfWeek}:${hour}`;

      if (!this.temporalPatterns.has(timeKey)) {
        this.temporalPatterns.set(timeKey, {
          dayOfWeek,
          hour,
          actions: new Map(),
          totalEvents: 0
        });
      }

      const pattern = this.temporalPatterns.get(timeKey);
      pattern.totalEvents++;

      const action = event.action;
      pattern.actions.set(action, (pattern.actions.get(action) || 0) + 1);

      // Identificar acción más común en este tiempo
      let mostCommonAction = null;
      let maxCount = 0;

      for (const [act, count] of pattern.actions) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonAction = act;
        }
      }

      if (maxCount >= this.config.minPatternOccurrences) {
        this.detectedPatterns.set(`temporal:${timeKey}:${mostCommonAction}`, {
          type: 'temporal',
          dayOfWeek,
          hour,
          action: mostCommonAction,
          occurrences: maxCount,
          confidence: maxCount / pattern.totalEvents
        });
      }
    }
  }

  /**
   * Detecta patrones de frecuencia
   */
  detectFrequencyPatterns(events) {
    const actionFrequency = new Map();

    for (const event of events) {
      const action = event.action;
      actionFrequency.set(action, (actionFrequency.get(action) || 0) + 1);
    }

    // Identificar acciones frecuentes
    for (const [action, count] of actionFrequency) {
      if (count >= this.config.minPatternOccurrences) {
        this.detectedPatterns.set(`frequency:${action}`, {
          type: 'frequency',
          action,
          occurrences: count,
          frequency: count / events.length,
          confidence: Math.min(1, count / (this.config.minPatternOccurrences * 2))
        });
      }
    }
  }

  /**
   * Detecta correlaciones entre acciones
   */
  detectCorrelationPatterns(events) {
    for (let i = 0; i < events.length - 1; i++) {
      const eventA = events[i];
      const eventB = events[i + 1];

      const timeDiff = eventB.timestamp - eventA.timestamp;

      // Solo considerar eventos cercanos en tiempo
      if (timeDiff < 60000) { // 1 minuto
        const correlationKey = `${eventA.action}→${eventB.action}`;

        if (!this.correlations.has(correlationKey)) {
          this.correlations.set(correlationKey, {
            actionA: eventA.action,
            actionB: eventB.action,
            occurrences: 0,
            avgTimeDiff: 0
          });
        }

        const correlation = this.correlations.get(correlationKey);
        correlation.occurrences++;
        correlation.avgTimeDiff = (correlation.avgTimeDiff * (correlation.occurrences - 1) + timeDiff) / correlation.occurrences;

        if (correlation.occurrences >= this.config.minPatternOccurrences) {
          this.detectedPatterns.set(`correlation:${correlationKey}`, {
            type: 'correlation',
            ...correlation,
            confidence: Math.min(1, correlation.occurrences / this.config.minPatternOccurrences)
          });
        }
      }
    }
  }

  /**
   * Detecta rutinas diarias/semanales
   */
  detectRoutines(events) {
    const routines = new Map();

    // Agrupar eventos por día
    const eventsByDay = new Map();

    for (const event of events) {
      const date = new Date(event.timestamp);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, []);
      }

      eventsByDay.get(dayKey).push(event);
    }

    // Analizar cada día
    for (const [day, dayEvents] of eventsByDay) {
      // Extraer secuencia de acciones del día
      const dailySequence = dayEvents.map(e => e.action).join(' → ');

      if (!routines.has(dailySequence)) {
        routines.set(dailySequence, {
          sequence: dailySequence,
          occurrences: 0,
          days: []
        });
      }

      const routine = routines.get(dailySequence);
      routine.occurrences++;
      routine.days.push(day);
    }

    // Identificar rutinas recurrentes
    for (const [sequence, routine] of routines) {
      if (routine.occurrences >= 2) {
        this.detectedPatterns.set(`routine:${sequence.substring(0, 50)}`, {
          type: 'routine',
          ...routine,
          confidence: routine.occurrences / eventsByDay.size
        });
      }
    }
  }

  getSummary() {
    return {
      totalPatterns: this.detectedPatterns.size,
      byType: this.groupPatternsByType(),
      topPatterns: this.getTopPatterns(10),
      sequences: Array.from(this.sequences.values()).slice(0, 5),
      temporalPatterns: Array.from(this.temporalPatterns.entries()).slice(0, 5)
    };
  }

  groupPatternsByType() {
    const grouped = {};

    for (const [key, pattern] of this.detectedPatterns) {
      const type = pattern.type;
      if (!grouped[type]) grouped[type] = 0;
      grouped[type]++;
    }

    return grouped;
  }

  getTopPatterns(n = 10) {
    return Array.from(this.detectedPatterns.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, n);
  }

  getPatternsByType(type) {
    return Array.from(this.detectedPatterns.values())
      .filter(p => p.type === type);
  }
}

// ============================================================================
// PREFERENCE LEARNER
// ============================================================================

/**
 * Aprende y predice preferencias del usuario
 */
class PreferenceLearner extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      decayFactor: config.decayFactor || 0.95,
      minInteractions: config.minInteractions || 5,
      ...config
    };

    this.preferences = new Map();
    this.interactions = [];
  }

  /**
   * Registra una interacción del usuario
   */
  recordInteraction(interaction) {
    const {
      feature,
      choice,
      alternatives = [],
      satisfaction = null,
      timestamp = Date.now()
    } = interaction;

    this.interactions.push({
      feature,
      choice,
      alternatives,
      satisfaction,
      timestamp
    });

    // Actualizar preferencias
    this.updatePreferences(feature, choice, satisfaction);

    this.emit('interactionRecorded', interaction);
  }

  updatePreferences(feature, choice, satisfaction) {
    if (!this.preferences.has(feature)) {
      this.preferences.set(feature, {
        choices: new Map(),
        totalInteractions: 0,
        lastUpdate: Date.now()
      });
    }

    const pref = this.preferences.get(feature);
    pref.totalInteractions++;
    pref.lastUpdate = Date.now();

    // Actualizar score del choice
    if (!pref.choices.has(choice)) {
      pref.choices.set(choice, {
        count: 0,
        score: 0,
        avgSatisfaction: 0
      });
    }

    const choiceData = pref.choices.get(choice);
    choiceData.count++;

    // Si hay satisfaction rating, incorporarlo
    if (satisfaction !== null) {
      choiceData.avgSatisfaction = (choiceData.avgSatisfaction * (choiceData.count - 1) + satisfaction) / choiceData.count;
      choiceData.score = choiceData.count * choiceData.avgSatisfaction;
    } else {
      choiceData.score = choiceData.count;
    }
  }

  /**
   * Predice la preferencia del usuario para una característica
   */
  predictPreference(feature) {
    const pref = this.preferences.get(feature);

    if (!pref || pref.totalInteractions < this.config.minInteractions) {
      return {
        prediction: null,
        confidence: 0,
        reason: 'insufficient_data'
      };
    }

    // Aplicar decay temporal
    const age = Date.now() - pref.lastUpdate;
    const decayMultiplier = Math.pow(this.config.decayFactor, age / (24 * 60 * 60 * 1000));

    // Encontrar mejor choice
    let bestChoice = null;
    let bestScore = -Infinity;

    for (const [choice, data] of pref.choices) {
      const decayedScore = data.score * decayMultiplier;

      if (decayedScore > bestScore) {
        bestScore = decayedScore;
        bestChoice = choice;
      }
    }

    const confidence = Math.min(1, pref.totalInteractions / (this.config.minInteractions * 2));

    return {
      prediction: bestChoice,
      confidence,
      score: bestScore,
      alternatives: this.getAlternatives(feature, bestChoice)
    };
  }

  getAlternatives(feature, excludeChoice) {
    const pref = this.preferences.get(feature);
    if (!pref) return [];

    return Array.from(pref.choices.entries())
      .filter(([choice]) => choice !== excludeChoice)
      .map(([choice, data]) => ({ choice, score: data.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  getPreferenceSummary() {
    const summary = {};

    for (const [feature, pref] of this.preferences) {
      const prediction = this.predictPreference(feature);

      summary[feature] = {
        totalInteractions: pref.totalInteractions,
        preferredChoice: prediction.prediction,
        confidence: prediction.confidence,
        choices: Object.fromEntries(pref.choices)
      };
    }

    return summary;
  }
}

// ============================================================================
// ANOMALY DETECTOR
// ============================================================================

/**
 * Detecta comportamientos anómalos del usuario
 */
class AnomalyDetector extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      sensitivityThreshold: config.sensitivityThreshold || 2.0, // Desviaciones estándar
      minDataPoints: config.minDataPoints || 30,
      ...config
    };

    this.baseline = {
      eventsPerHour: [],
      sessionDuration: [],
      actionsPerSession: [],
      responseTime: []
    };

    this.anomalies = [];
  }

  /**
   * Establece línea base de comportamiento normal
   */
  establishBaseline(events, sessions) {
    // Eventos por hora
    const hourlyEvents = this.calculateHourlyEvents(events);
    this.baseline.eventsPerHour = hourlyEvents;

    // Duración de sesiones
    this.baseline.sessionDuration = sessions.map(s => s.duration);

    // Acciones por sesión
    this.baseline.actionsPerSession = sessions.map(s => s.events.length);

    this.emit('baselineEstablished', {
      eventsPerHour: this.getStats(this.baseline.eventsPerHour),
      sessionDuration: this.getStats(this.baseline.sessionDuration),
      actionsPerSession: this.getStats(this.baseline.actionsPerSession)
    });
  }

  calculateHourlyEvents(events) {
    const hourly = new Map();

    for (const event of events) {
      const hour = Math.floor(event.timestamp / (60 * 60 * 1000));

      hourly.set(hour, (hourly.get(hour) || 0) + 1);
    }

    return Array.from(hourly.values());
  }

  /**
   * Detecta anomalías en tiempo real
   */
  detectAnomalies(currentMetrics) {
    const anomalies = [];

    // Verificar eventos por hora
    if (this.baseline.eventsPerHour.length >= this.config.minDataPoints) {
      const stats = this.getStats(this.baseline.eventsPerHour);
      const zScore = (currentMetrics.eventsThisHour - stats.mean) / stats.stdDev;

      if (Math.abs(zScore) > this.config.sensitivityThreshold) {
        anomalies.push({
          type: 'unusual_activity_level',
          metric: 'eventsPerHour',
          expected: stats.mean,
          actual: currentMetrics.eventsThisHour,
          zScore,
          severity: this.calculateSeverity(zScore)
        });
      }
    }

    // Verificar duración de sesión
    if (currentMetrics.sessionDuration && this.baseline.sessionDuration.length >= this.config.minDataPoints) {
      const stats = this.getStats(this.baseline.sessionDuration);
      const zScore = (currentMetrics.sessionDuration - stats.mean) / stats.stdDev;

      if (Math.abs(zScore) > this.config.sensitivityThreshold) {
        anomalies.push({
          type: 'unusual_session_duration',
          metric: 'sessionDuration',
          expected: stats.mean,
          actual: currentMetrics.sessionDuration,
          zScore,
          severity: this.calculateSeverity(zScore)
        });
      }
    }

    if (anomalies.length > 0) {
      this.anomalies.push({
        timestamp: Date.now(),
        anomalies
      });

      this.emit('anomalyDetected', anomalies);
    }

    return anomalies;
  }

  getStats(data) {
    if (data.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      min: Math.min(...data),
      max: Math.max(...data)
    };
  }

  calculateSeverity(zScore) {
    const absZ = Math.abs(zScore);

    if (absZ > 3) return 'critical';
    if (absZ > 2.5) return 'high';
    if (absZ > 2) return 'medium';
    return 'low';
  }

  getRecentAnomalies(count = 10) {
    return this.anomalies.slice(-count);
  }
}

// ============================================================================
// USER PATTERN ANALYZER (Main Coordinator)
// ============================================================================

/**
 * Coordina todos los componentes de análisis de usuario
 */
class UserPatternAnalyzer extends EventEmitter {
  constructor(userId, config = {}) {
    super();

    this.userId = userId;

    this.behaviorTracker = new UserBehaviorTracker(userId, config.tracking);
    this.patternDetector = new PatternDetector(config.patterns);
    this.preferenceLearner = new PreferenceLearner(config.preferences);
    this.anomalyDetector = new AnomalyDetector(config.anomalies);

    // Análisis periódico
    this.analysisInterval = setInterval(() => {
      this.runPeriodicAnalysis();
    }, config.analysisInterval || 5 * 60 * 1000); // 5 minutos
  }

  async initialize() {
    console.log(`\n⚡ USER PATTERN ANALYZER INITIALIZING for user: ${this.userId}...\n`);

    // Cargar datos históricos
    await this.loadHistoricalData();

    // Establecer baseline
    const events = this.behaviorTracker.getRecentEvents(1000);
    if (events.length > 0) {
      this.patternDetector.analyzeEvents(events);
      this.anomalyDetector.establishBaseline(events, this.behaviorTracker.sessions);
    }

    console.log('✓ User Pattern Analyzer ready\n');
    console.log('"I\'m learning your patterns, sir."\n');
  }

  /**
   * Registra un evento de usuario y analiza
   */
  trackUserAction(action) {
    // Track event
    const event = this.behaviorTracker.trackEvent(action);

    // Detectar anomalías en tiempo real
    const currentMetrics = {
      eventsThisHour: this.behaviorTracker.getRecentEvents(60).length,
      sessionDuration: this.behaviorTracker.currentSession?.duration || 0
    };

    const anomalies = this.anomalyDetector.detectAnomalies(currentMetrics);

    if (anomalies.length > 0) {
      this.emit('anomalyDetected', anomalies);
    }

    return event;
  }

  /**
   * Análisis periódico completo
   */
  runPeriodicAnalysis() {
    const events = this.behaviorTracker.getRecentEvents(500);

    if (events.length < 10) return;

    // Analizar patrones
    const patterns = this.patternDetector.analyzeEvents(events);

    this.emit('analysisCompleted', {
      timestamp: Date.now(),
      patterns,
      preferences: this.preferenceLearner.getPreferenceSummary(),
      anomalies: this.anomalyDetector.getRecentAnomalies(5)
    });
  }

  /**
   * Predice la próxima acción del usuario
   */
  predictNextAction(context = {}) {
    // Obtener patrones relevantes
    const recentEvents = this.behaviorTracker.getRecentEvents(10);
    const recentSequence = recentEvents.map(e => e.action).join(' → ');

    // Buscar patrones de secuencia que coincidan
    const matchingPatterns = this.patternDetector.getPatternsByType('sequence')
      .filter(p => p.pattern.startsWith(recentSequence));

    if (matchingPatterns.length > 0) {
      // Ordenar por confianza
      matchingPatterns.sort((a, b) => b.confidence - a.confidence);

      const bestPattern = matchingPatterns[0];
      const actions = bestPattern.pattern.split(' → ');
      const nextAction = actions[actions.length - 1];

      return {
        prediction: nextAction,
        confidence: bestPattern.confidence,
        reason: 'sequence_pattern',
        pattern: bestPattern.pattern
      };
    }

    // Fallback: usar patrones temporales
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const temporalPatterns = this.patternDetector.getPatternsByType('temporal')
      .filter(p => p.dayOfWeek === day && p.hour === hour);

    if (temporalPatterns.length > 0) {
      temporalPatterns.sort((a, b) => b.confidence - a.confidence);
      const bestTemporal = temporalPatterns[0];

      return {
        prediction: bestTemporal.action,
        confidence: bestTemporal.confidence,
        reason: 'temporal_pattern',
        timeOfDay: `${day}:${hour}`
      };
    }

    return {
      prediction: null,
      confidence: 0,
      reason: 'insufficient_data'
    };
  }

  /**
   * Obtiene recomendaciones personalizadas
   */
  getPersonalizedRecommendations() {
    const recommendations = [];

    // Basado en patrones frecuentes
    const frequencyPatterns = this.patternDetector.getPatternsByType('frequency');

    for (const pattern of frequencyPatterns.slice(0, 5)) {
      recommendations.push({
        type: 'frequent_action',
        action: pattern.action,
        frequency: pattern.frequency,
        suggestion: `Acceso rápido a "${pattern.action}"`
      });
    }

    // Basado en preferencias
    const preferences = this.preferenceLearner.getPreferenceSummary();

    for (const [feature, pref] of Object.entries(preferences)) {
      if (pref.confidence > 0.7) {
        recommendations.push({
          type: 'preference',
          feature,
          preferred: pref.preferredChoice,
          confidence: pref.confidence,
          suggestion: `Pre-configurar "${feature}" como "${pref.preferredChoice}"`
        });
      }
    }

    return recommendations.sort((a, b) => (b.confidence || b.frequency || 0) - (a.confidence || a.frequency || 0));
  }

  async loadHistoricalData() {
    const filePath = path.join(__dirname, 'memory', `user-${this.userId}-history.json`);

    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

      this.behaviorTracker.events = data.events || [];
      this.behaviorTracker.sessions = data.sessions || [];

      console.log(`  Loaded ${this.behaviorTracker.events.length} historical events`);

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('  Warning: Could not load historical data:', error.message);
      }
    }
  }

  async save() {
    const data = {
      userId: this.userId,
      events: this.behaviorTracker.events,
      sessions: this.behaviorTracker.sessions,
      patterns: Array.from(this.patternDetector.detectedPatterns.entries()),
      preferences: this.preferenceLearner.getPreferenceSummary()
    };

    const filePath = path.join(__dirname, 'memory', `user-${this.userId}-history.json`);

    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('✓ User data saved');
    } catch (error) {
      console.error('✗ Failed to save user data:', error.message);
    }
  }

  shutdown() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    this.behaviorTracker.endSession();
  }

  getStatistics() {
    return {
      userId: this.userId,
      tracking: this.behaviorTracker.realtimeStats,
      patterns: this.patternDetector.getSummary(),
      preferences: this.preferenceLearner.getPreferenceSummary(),
      anomalies: this.anomalyDetector.getRecentAnomalies(5)
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  UserPatternAnalyzer,
  UserBehaviorTracker,
  PatternDetector,
  PreferenceLearner,
  AnomalyDetector
};

// CLI Test
if (require.main === module) {
  (async () => {
    const analyzer = new UserPatternAnalyzer('user-stark-001', {
      analysisInterval: 10000
    });

    await analyzer.initialize();

    console.log('\n🧪 Simulating user actions...\n');

    const testActions = [
      { type: 'click', action: 'open_project', target: 'project-1' },
      { type: 'input', action: 'write_code', target: 'editor' },
      { type: 'click', action: 'run_tests', target: 'test-runner' },
      { type: 'click', action: 'commit_changes', target: 'git' },
      { type: 'click', action: 'open_project', target: 'project-1' },
      { type: 'input', action: 'write_code', target: 'editor' },
      { type: 'click', action: 'run_tests', target: 'test-runner' }
    ];

    for (const action of testActions) {
      analyzer.trackUserAction(action);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🔮 Predicting next action...\n');

    const prediction = analyzer.predictNextAction();
    console.log('Prediction:', prediction);

    console.log('\n💡 Getting personalized recommendations...\n');

    const recommendations = analyzer.getPersonalizedRecommendations();
    console.log('Recommendations:', recommendations.slice(0, 3));

    console.log('\n📊 Statistics:');
    const stats = analyzer.getStatistics();
    console.log(JSON.stringify(stats, null, 2));

    await analyzer.save();

    analyzer.shutdown();

    console.log('\n"I know your patterns now, sir."\n');

    process.exit(0);
  })();
}
