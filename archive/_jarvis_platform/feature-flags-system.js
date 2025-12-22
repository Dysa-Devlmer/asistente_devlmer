#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Feature Flags System
 * Dynamic feature control, A/B testing,
 * gradual rollouts without redeployment
 * ============================================
 *
 * Features:
 * - Dynamic feature toggling
 * - Percentage-based rollouts
 * - User/context targeting
 * - A/B testing framework
 * - Kill switches for emergency shutdowns
 * - Feature analytics
 * - Gradual rollout with auto-rollback
 */

import { EventEmitter } from 'events';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// ============================================
// Targeting Rules
// ============================================
class TargetingRule {
  constructor(type, config) {
    this.type = type;
    this.config = config;
  }

  evaluate(context) {
    switch (this.type) {
      case 'user_id':
        return this.evaluateUserId(context);

      case 'percentage':
        return this.evaluatePercentage(context);

      case 'attribute':
        return this.evaluateAttribute(context);

      case 'segment':
        return this.evaluateSegment(context);

      case 'time_window':
        return this.evaluateTimeWindow(context);

      default:
        return false;
    }
  }

  evaluateUserId(context) {
    const allowedIds = this.config.userIds || [];
    return allowedIds.includes(context.userId);
  }

  evaluatePercentage(context) {
    const percentage = this.config.percentage || 0;
    const hash = this.hashContext(context);
    const bucket = hash % 100;

    return bucket < percentage;
  }

  evaluateAttribute(context) {
    const { attribute, operator, value } = this.config;
    const contextValue = context[attribute];

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'not_equals':
        return contextValue !== value;
      case 'contains':
        return Array.isArray(value) ? value.includes(contextValue) : false;
      case 'greater_than':
        return contextValue > value;
      case 'less_than':
        return contextValue < value;
      default:
        return false;
    }
  }

  evaluateSegment(context) {
    const segment = this.config.segment;
    return context.segments?.includes(segment) || false;
  }

  evaluateTimeWindow(context) {
    const now = Date.now();
    const start = this.config.startTime || 0;
    const end = this.config.endTime || Infinity;

    return now >= start && now <= end;
  }

  hashContext(context) {
    const str = JSON.stringify(context);
    const hash = createHash('md5').update(str).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }
}

// ============================================
// Feature Flag
// ============================================
class FeatureFlag {
  constructor(name, config = {}) {
    this.name = name;
    this.description = config.description || '';
    this.enabled = config.enabled !== false;
    this.defaultValue = config.defaultValue || false;
    this.rules = (config.rules || []).map(r => new TargetingRule(r.type, r.config));
    this.variants = config.variants || { control: 50, treatment: 50 };
    this.killSwitch = config.killSwitch || false;
    this.metadata = config.metadata || {};
    this.createdAt = config.createdAt || Date.now();
    this.updatedAt = Date.now();

    // Analytics
    this.evaluations = 0;
    this.trueCount = 0;
    this.falseCount = 0;
    this.variantCounts = {};
  }

  /**
   * Evaluate if flag is enabled for given context
   */
  evaluate(context = {}) {
    this.evaluations++;

    // Kill switch overrides everything
    if (this.killSwitch) {
      this.falseCount++;
      return {
        enabled: false,
        variant: null,
        reason: 'KILL_SWITCH'
      };
    }

    // Check if flag is globally enabled
    if (!this.enabled) {
      this.falseCount++;
      return {
        enabled: false,
        variant: null,
        reason: 'DISABLED'
      };
    }

    // Evaluate targeting rules
    let matched = false;
    for (const rule of this.rules) {
      if (rule.evaluate(context)) {
        matched = true;
        break;
      }
    }

    // If no rules or rules don't match, use default
    const enabled = this.rules.length === 0 ? this.defaultValue : matched;

    if (enabled) {
      this.trueCount++;
    } else {
      this.falseCount++;
    }

    // Determine variant if enabled
    let variant = null;
    if (enabled && Object.keys(this.variants).length > 0) {
      variant = this.selectVariant(context);
      this.variantCounts[variant] = (this.variantCounts[variant] || 0) + 1;
    }

    return {
      enabled,
      variant,
      reason: matched ? 'RULE_MATCH' : 'DEFAULT'
    };
  }

  /**
   * Select variant using consistent hashing
   */
  selectVariant(context) {
    const hash = this.hashContext(context);
    const total = Object.values(this.variants).reduce((a, b) => a + b, 0);
    let cumulative = 0;

    for (const [variant, weight] of Object.entries(this.variants)) {
      cumulative += weight;
      if (hash % total < cumulative) {
        return variant;
      }
    }

    return Object.keys(this.variants)[0];
  }

  hashContext(context) {
    const str = JSON.stringify({ flag: this.name, ...context });
    const hash = createHash('md5').update(str).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Add targeting rule
   */
  addRule(type, config) {
    this.rules.push(new TargetingRule(type, config));
    this.updatedAt = Date.now();
  }

  /**
   * Update percentage rollout
   */
  setPercentage(percentage) {
    // Remove existing percentage rules
    this.rules = this.rules.filter(r => r.type !== 'percentage');

    // Add new percentage rule
    this.addRule('percentage', { percentage });
  }

  /**
   * Activate kill switch
   */
  activateKillSwitch() {
    this.killSwitch = true;
    this.updatedAt = Date.now();
  }

  deactivateKillSwitch() {
    this.killSwitch = false;
    this.updatedAt = Date.now();
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return {
      name: this.name,
      evaluations: this.evaluations,
      trueCount: this.trueCount,
      falseCount: this.falseCount,
      enablementRate: this.evaluations > 0
        ? this.trueCount / this.evaluations
        : 0,
      variantDistribution: this.variantCounts
    };
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      enabled: this.enabled,
      defaultValue: this.defaultValue,
      rules: this.rules.map(r => ({ type: r.type, config: r.config })),
      variants: this.variants,
      killSwitch: this.killSwitch,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// ============================================
// Gradual Rollout Manager
// ============================================
class GradualRollout extends EventEmitter {
  constructor(flag, config = {}) {
    super();
    this.flag = flag;
    this.stages = config.stages || [10, 25, 50, 75, 100];
    this.currentStage = 0;
    this.stageInterval = config.stageInterval || 3600000; // 1 hour
    this.autoProgress = config.autoProgress !== false;
    this.safetyThreshold = config.safetyThreshold || 0.05; // 5% error rate
    this.state = 'READY'; // READY, IN_PROGRESS, PAUSED, COMPLETED, ROLLED_BACK

    this.stageMetrics = [];
    this.startTime = null;
  }

  /**
   * Start gradual rollout
   */
  start() {
    if (this.state !== 'READY') {
      throw new Error('Rollout already started');
    }

    this.state = 'IN_PROGRESS';
    this.startTime = Date.now();

    console.log(`\n🚀 Starting gradual rollout for ${this.flag.name}`);
    console.log(`   Stages: ${this.stages.join('% → ')}%`);
    console.log(`   Interval: ${this.stageInterval / 1000}s\n`);

    this.emit('rollout-start', { flag: this.flag.name });

    if (this.autoProgress) {
      this.scheduleNextStage();
    }
  }

  /**
   * Progress to next stage
   */
  async progressToNextStage() {
    if (this.currentStage >= this.stages.length) {
      this.complete();
      return;
    }

    const percentage = this.stages[this.currentStage];

    console.log(`📊 Rolling out to ${percentage}% of users...`);

    // Update flag percentage
    this.flag.setPercentage(percentage);

    // Collect metrics for this stage
    const metrics = await this.collectStageMetrics();

    this.stageMetrics.push({
      stage: this.currentStage,
      percentage,
      metrics,
      timestamp: Date.now()
    });

    this.emit('stage-progress', {
      flag: this.flag.name,
      stage: this.currentStage,
      percentage,
      metrics
    });

    // Check safety
    if (metrics.errorRate > this.safetyThreshold) {
      console.log(`\n⚠️  Safety threshold exceeded (${(metrics.errorRate * 100).toFixed(2)}%)!`);
      this.rollback();
      return;
    }

    console.log(`   ✅ Stage ${this.currentStage + 1} completed successfully`);

    this.currentStage++;

    if (this.autoProgress && this.currentStage < this.stages.length) {
      this.scheduleNextStage();
    }
  }

  scheduleNextStage() {
    setTimeout(() => {
      if (this.state === 'IN_PROGRESS') {
        this.progressToNextStage();
      }
    }, this.stageInterval);
  }

  /**
   * Collect metrics for current stage
   */
  async collectStageMetrics() {
    // Simulate metric collection
    await new Promise(resolve => setTimeout(resolve, 1000));

    const analytics = this.flag.getAnalytics();

    return {
      evaluations: analytics.evaluations,
      enablementRate: analytics.enablementRate,
      errorRate: Math.random() * 0.03 // Simulated error rate
    };
  }

  /**
   * Pause rollout
   */
  pause() {
    this.state = 'PAUSED';
    this.emit('rollout-paused', { flag: this.flag.name });
    console.log(`\n⏸️  Rollout paused at ${this.stages[this.currentStage - 1]}%`);
  }

  /**
   * Resume rollout
   */
  resume() {
    if (this.state !== 'PAUSED') return;

    this.state = 'IN_PROGRESS';
    this.emit('rollout-resumed', { flag: this.flag.name });
    console.log(`\n▶️  Rollout resumed`);

    if (this.autoProgress) {
      this.scheduleNextStage();
    }
  }

  /**
   * Complete rollout
   */
  complete() {
    this.state = 'COMPLETED';
    this.flag.setPercentage(100);

    const duration = Date.now() - this.startTime;

    this.emit('rollout-complete', {
      flag: this.flag.name,
      duration,
      stages: this.stageMetrics
    });

    console.log(`\n✅ Rollout completed in ${(duration / 1000).toFixed(0)}s`);
  }

  /**
   * Rollback to 0%
   */
  rollback() {
    this.state = 'ROLLED_BACK';
    this.flag.setPercentage(0);
    this.flag.activateKillSwitch();

    this.emit('rollout-rollback', {
      flag: this.flag.name,
      reason: 'Safety threshold exceeded'
    });

    console.log(`\n🔄 Rollout rolled back to 0%`);
  }

  getStatus() {
    return {
      state: this.state,
      currentStage: this.currentStage,
      currentPercentage: this.currentStage > 0
        ? this.stages[this.currentStage - 1]
        : 0,
      stageMetrics: this.stageMetrics
    };
  }
}

// ============================================
// Feature Flag Manager
// ============================================
class FeatureFlagManager extends EventEmitter {
  constructor() {
    super();
    this.flags = new Map();
    this.rollouts = new Map();
    this.persistencePath = join(process.cwd(), 'data', 'feature-flags.json');

    this.load();
  }

  /**
   * Create or update feature flag
   */
  createFlag(name, config = {}) {
    const flag = new FeatureFlag(name, config);
    this.flags.set(name, flag);

    this.emit('flag-created', { name });
    this.persist();

    return flag;
  }

  /**
   * Get flag
   */
  getFlag(name) {
    return this.flags.get(name);
  }

  /**
   * Evaluate flag
   */
  isEnabled(flagName, context = {}) {
    const flag = this.flags.get(flagName);

    if (!flag) {
      console.warn(`Flag ${flagName} not found, returning false`);
      return false;
    }

    const result = flag.evaluate(context);

    this.emit('flag-evaluated', {
      flag: flagName,
      context,
      result
    });

    return result.enabled;
  }

  /**
   * Get variant for A/B testing
   */
  getVariant(flagName, context = {}) {
    const flag = this.flags.get(flagName);

    if (!flag) {
      return null;
    }

    const result = flag.evaluate(context);
    return result.variant;
  }

  /**
   * Start gradual rollout
   */
  startGradualRollout(flagName, config = {}) {
    const flag = this.flags.get(flagName);

    if (!flag) {
      throw new Error(`Flag ${flagName} not found`);
    }

    const rollout = new GradualRollout(flag, config);
    this.rollouts.set(flagName, rollout);

    // Forward events
    rollout.on('rollout-start', (e) => this.emit('rollout-start', e));
    rollout.on('stage-progress', (e) => this.emit('stage-progress', e));
    rollout.on('rollout-complete', (e) => this.emit('rollout-complete', e));
    rollout.on('rollout-rollback', (e) => this.emit('rollout-rollback', e));

    rollout.start();

    return rollout;
  }

  /**
   * Get all flags
   */
  getAllFlags() {
    return Array.from(this.flags.values()).map(f => f.toJSON());
  }

  /**
   * Get analytics for all flags
   */
  getAllAnalytics() {
    return Array.from(this.flags.values()).map(f => f.getAnalytics());
  }

  /**
   * Persist flags to disk
   */
  persist() {
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const data = {
      flags: Array.from(this.flags.entries()).map(([name, flag]) => ({
        name,
        config: flag.toJSON()
      })),
      timestamp: Date.now()
    };

    writeFileSync(this.persistencePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load flags from disk
   */
  load() {
    if (!existsSync(this.persistencePath)) {
      return;
    }

    try {
      const data = JSON.parse(readFileSync(this.persistencePath, 'utf-8'));

      data.flags.forEach(({ name, config }) => {
        this.flags.set(name, new FeatureFlag(name, config));
      });

      console.log(`📂 Loaded ${this.flags.size} feature flags`);
    } catch (error) {
      console.error('Failed to load feature flags:', error.message);
    }
  }
}

// ============================================
// Demonstration
// ============================================
async function demonstrateFeatureFlags() {
  console.log('\n' + '='.repeat(60));
  console.log('🎚️  JARVIS Feature Flags System');
  console.log('='.repeat(60) + '\n');

  const ffManager = new FeatureFlagManager();

  // Create feature flags
  console.log('📝 Creating feature flags...\n');

  // Simple toggle
  ffManager.createFlag('new-dashboard', {
    description: 'New redesigned dashboard',
    enabled: true,
    defaultValue: false,
    rules: [
      { type: 'percentage', config: { percentage: 50 } }
    ]
  });

  // A/B testing
  ffManager.createFlag('recommendation-algorithm', {
    description: 'ML-powered recommendations',
    enabled: true,
    defaultValue: true,
    variants: {
      control: 50,
      ml_based: 30,
      hybrid: 20
    }
  });

  // Targeted rollout
  ffManager.createFlag('premium-features', {
    description: 'Premium tier features',
    enabled: true,
    rules: [
      {
        type: 'attribute',
        config: {
          attribute: 'plan',
          operator: 'equals',
          value: 'premium'
        }
      }
    ]
  });

  // Time-based feature
  ffManager.createFlag('holiday-theme', {
    description: 'Holiday theme UI',
    enabled: true,
    rules: [
      {
        type: 'time_window',
        config: {
          startTime: Date.now(),
          endTime: Date.now() + 3600000 // 1 hour from now
        }
      }
    ]
  });

  // Evaluate flags
  console.log('🔍 Evaluating feature flags...\n');

  const contexts = [
    { userId: 'user-1', plan: 'free', segments: ['beta'] },
    { userId: 'user-2', plan: 'premium', segments: ['early-access'] },
    { userId: 'user-3', plan: 'free', segments: [] }
  ];

  contexts.forEach(context => {
    console.log(`   User: ${context.userId} (${context.plan})`);

    const newDashboard = ffManager.isEnabled('new-dashboard', context);
    console.log(`      new-dashboard: ${newDashboard ? '✅' : '❌'}`);

    const variant = ffManager.getVariant('recommendation-algorithm', context);
    console.log(`      recommendation variant: ${variant || 'control'}`);

    const premium = ffManager.isEnabled('premium-features', context);
    console.log(`      premium-features: ${premium ? '✅' : '❌'}`);

    console.log('');
  });

  // Gradual rollout
  console.log('🚀 Starting gradual rollout...\n');

  const rolloutFlag = ffManager.createFlag('new-search', {
    description: 'Enhanced search with ML',
    enabled: true,
    defaultValue: false
  });

  const rollout = ffManager.startGradualRollout('new-search', {
    stages: [10, 25, 50],
    stageInterval: 3000, // 3 seconds for demo
    autoProgress: true,
    safetyThreshold: 0.05
  });

  // Simulate traffic during rollout
  const simulateTraffic = setInterval(() => {
    const context = { userId: `user-${Math.floor(Math.random() * 100)}` };
    ffManager.isEnabled('new-search', context);
  }, 100);

  // Wait for rollout to complete
  await new Promise(resolve => {
    rollout.on('rollout-complete', () => {
      clearInterval(simulateTraffic);
      resolve();
    });
    rollout.on('rollout-rollback', () => {
      clearInterval(simulateTraffic);
      resolve();
    });
  });

  // Analytics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Feature Flag Analytics');
  console.log('='.repeat(60));

  const analytics = ffManager.getAllAnalytics();

  console.log('');
  analytics.forEach(a => {
    console.log(`   ${a.name}:`);
    console.log(`      Evaluations: ${a.evaluations}`);
    console.log(`      Enablement Rate: ${(a.enablementRate * 100).toFixed(2)}%`);

    if (Object.keys(a.variantDistribution).length > 0) {
      console.log(`      Variant Distribution:`);
      Object.entries(a.variantDistribution).forEach(([variant, count]) => {
        console.log(`         ${variant}: ${count}`);
      });
    }

    console.log('');
  });

  console.log('='.repeat(60));
  console.log('✅ Feature Flags System Demonstration Complete');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateFeatureFlags().catch(console.error);
}

export {
  TargetingRule,
  FeatureFlag,
  GradualRollout,
  FeatureFlagManager
};
