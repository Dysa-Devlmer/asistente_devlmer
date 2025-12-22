#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Chaos Engineering Framework
 * Controlled failure injection & resilience testing
 * ============================================
 *
 * Features:
 * - Controlled chaos experiments
 * - Network latency & packet loss injection
 * - Resource exhaustion simulation
 * - Service dependency failures
 * - Gradual rollout with safety controls
 * - Automated rollback on critical impact
 * - Resilience scoring
 */

import { EventEmitter } from 'events';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================
// Chaos Experiment Types
// ============================================
const CHAOS_TYPES = {
  LATENCY: 'latency',
  ERROR: 'error',
  RESOURCE_EXHAUSTION: 'resource_exhaustion',
  NETWORK_PARTITION: 'network_partition',
  SERVICE_FAILURE: 'service_failure',
  DATA_CORRUPTION: 'data_corruption',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit'
};

// ============================================
// Chaos Experiment
// ============================================
class ChaosExperiment {
  constructor(name, config) {
    this.name = name;
    this.type = config.type;
    this.target = config.target;
    this.parameters = config.parameters || {};
    this.duration = config.duration || 60000; // 1 minute default
    this.rolloutPercentage = config.rolloutPercentage || 100;
    this.safetyChecks = config.safetyChecks || [];
    this.hypothesis = config.hypothesis;

    this.state = 'READY'; // READY, RUNNING, PAUSED, COMPLETED, ABORTED
    this.startTime = null;
    this.endTime = null;
    this.metrics = {
      totalRequests: 0,
      affectedRequests: 0,
      errors: 0,
      latency: []
    };
  }

  /**
   * Check if request should be affected by chaos
   */
  shouldApplyChaos() {
    return Math.random() * 100 < this.rolloutPercentage;
  }

  /**
   * Apply chaos to a request/operation
   */
  async apply(operation) {
    this.metrics.totalRequests++;

    if (!this.shouldApplyChaos()) {
      return await operation();
    }

    this.metrics.affectedRequests++;

    switch (this.type) {
      case CHAOS_TYPES.LATENCY:
        return await this.injectLatency(operation);

      case CHAOS_TYPES.ERROR:
        return await this.injectError(operation);

      case CHAOS_TYPES.TIMEOUT:
        return await this.injectTimeout(operation);

      case CHAOS_TYPES.RESOURCE_EXHAUSTION:
        return await this.exhaustResources(operation);

      case CHAOS_TYPES.RATE_LIMIT:
        return await this.applyRateLimit(operation);

      default:
        return await operation();
    }
  }

  /**
   * Inject artificial latency
   */
  async injectLatency(operation) {
    const delay = this.parameters.delay || 1000;
    const jitter = this.parameters.jitter || 0;

    const actualDelay = delay + (Math.random() * jitter);

    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, actualDelay));

    const result = await operation();

    this.metrics.latency.push(Date.now() - startTime);

    return result;
  }

  /**
   * Inject errors
   */
  async injectError(operation) {
    const errorRate = this.parameters.errorRate || 0.5;

    if (Math.random() < errorRate) {
      this.metrics.errors++;
      throw new Error(this.parameters.errorMessage || 'Chaos-induced error');
    }

    return await operation();
  }

  /**
   * Inject timeout
   */
  async injectTimeout(operation) {
    const timeout = this.parameters.timeout || 5000;

    return await Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => {
          this.metrics.errors++;
          reject(new Error('Chaos-induced timeout'));
        }, timeout)
      )
    ]);
  }

  /**
   * Simulate resource exhaustion
   */
  async exhaustResources(operation) {
    // Simulate CPU-intensive work
    if (this.parameters.exhaustCPU) {
      const startTime = Date.now();
      while (Date.now() - startTime < this.parameters.exhaustCPU) {
        Math.sqrt(Math.random());
      }
    }

    // Simulate memory allocation
    if (this.parameters.exhaustMemory) {
      const junk = new Array(this.parameters.exhaustMemory * 1024 * 1024);
      junk.fill(Math.random());
    }

    return await operation();
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit(operation) {
    const maxConcurrent = this.parameters.maxConcurrent || 1;

    // Simple rate limiting simulation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

    return await operation();
  }

  getMetrics() {
    const avgLatency = this.metrics.latency.length > 0
      ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
      : 0;

    const p95Latency = this.metrics.latency.length > 0
      ? this.metrics.latency.sort((a, b) => a - b)[Math.floor(this.metrics.latency.length * 0.95)]
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      affectedRequests: this.metrics.affectedRequests,
      errors: this.metrics.errors,
      errorRate: this.metrics.totalRequests > 0
        ? this.metrics.errors / this.metrics.totalRequests
        : 0,
      avgLatency,
      p95Latency
    };
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      target: this.target,
      state: this.state,
      duration: this.duration,
      rolloutPercentage: this.rolloutPercentage,
      hypothesis: this.hypothesis,
      metrics: this.getMetrics()
    };
  }
}

// ============================================
// Safety Monitor
// ============================================
class SafetyMonitor {
  constructor() {
    this.checks = new Map();
    this.violations = [];
  }

  registerCheck(name, checkFn, threshold) {
    this.checks.set(name, { name, checkFn, threshold });
  }

  async runChecks(experimentMetrics) {
    const results = [];

    for (const [name, check] of this.checks) {
      try {
        const value = await check.checkFn(experimentMetrics);
        const passed = value <= check.threshold;

        results.push({
          name,
          value,
          threshold: check.threshold,
          passed
        });

        if (!passed) {
          this.violations.push({
            name,
            value,
            threshold: check.threshold,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        results.push({
          name,
          error: error.message,
          passed: false
        });
      }
    }

    return results;
  }

  shouldAbort(checkResults) {
    return checkResults.some(r => !r.passed);
  }

  getViolations(limit = 10) {
    return this.violations.slice(-limit);
  }
}

// ============================================
// Resilience Scorer
// ============================================
class ResilienceScorer {
  /**
   * Calculate resilience score based on experiment results
   */
  calculateScore(experiment) {
    const metrics = experiment.getMetrics();

    // Components of resilience score
    const errorScore = this.scoreErrors(metrics.errorRate);
    const latencyScore = this.scoreLatency(metrics.avgLatency, metrics.p95Latency);
    const recoveryScore = this.scoreRecovery(experiment);
    const impactScore = this.scoreImpact(metrics.affectedRequests, metrics.totalRequests);

    // Weighted average
    const totalScore = (
      errorScore * 0.4 +
      latencyScore * 0.3 +
      recoveryScore * 0.2 +
      impactScore * 0.1
    );

    return {
      overall: Math.round(totalScore),
      breakdown: {
        errorHandling: Math.round(errorScore),
        latencyTolerance: Math.round(latencyScore),
        recovery: Math.round(recoveryScore),
        impactLimitation: Math.round(impactScore)
      },
      grade: this.getGrade(totalScore)
    };
  }

  scoreErrors(errorRate) {
    // Lower error rate = higher score
    if (errorRate === 0) return 100;
    if (errorRate < 0.01) return 90;
    if (errorRate < 0.05) return 70;
    if (errorRate < 0.1) return 50;
    if (errorRate < 0.25) return 30;
    return 10;
  }

  scoreLatency(avg, p95) {
    // Lower latency = higher score
    if (p95 < 100) return 100;
    if (p95 < 500) return 80;
    if (p95 < 1000) return 60;
    if (p95 < 2000) return 40;
    if (p95 < 5000) return 20;
    return 10;
  }

  scoreRecovery(experiment) {
    // Did system recover? Check if error rate decreased over time
    const latencies = experiment.metrics.latency;
    if (latencies.length < 10) return 50;

    const firstHalf = latencies.slice(0, Math.floor(latencies.length / 2));
    const secondHalf = latencies.slice(Math.floor(latencies.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond < avgFirst) return 100; // Recovered
    if (avgSecond === avgFirst) return 70; // Stable
    return 40; // Degrading
  }

  scoreImpact(affected, total) {
    // How well was impact contained?
    const affectedPercentage = total > 0 ? affected / total : 0;

    if (affectedPercentage < 0.1) return 100;
    if (affectedPercentage < 0.25) return 80;
    if (affectedPercentage < 0.5) return 60;
    if (affectedPercentage < 0.75) return 40;
    return 20;
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

// ============================================
// Chaos Engine
// ============================================
class ChaosEngine extends EventEmitter {
  constructor() {
    super();
    this.experiments = new Map();
    this.safetyMonitor = new SafetyMonitor();
    this.resilienceScorer = new ResilienceScorer();
    this.activeExperiment = null;
    this.experimentHistory = [];

    this.setupDefaultSafetyChecks();
  }

  setupDefaultSafetyChecks() {
    // Error rate threshold
    this.safetyMonitor.registerCheck(
      'error_rate',
      (metrics) => metrics.errorRate,
      0.5 // 50% max error rate
    );

    // P95 latency threshold
    this.safetyMonitor.registerCheck(
      'p95_latency',
      (metrics) => metrics.p95Latency,
      10000 // 10 seconds max
    );
  }

  /**
   * Register a chaos experiment
   */
  registerExperiment(name, config) {
    const experiment = new ChaosExperiment(name, config);
    this.experiments.set(name, experiment);
    return experiment;
  }

  /**
   * Run a chaos experiment
   */
  async runExperiment(name, workloadFn) {
    const experiment = this.experiments.get(name);
    if (!experiment) {
      throw new Error(`Experiment ${name} not found`);
    }

    if (this.activeExperiment) {
      throw new Error('Another experiment is already running');
    }

    this.activeExperiment = experiment;
    experiment.state = 'RUNNING';
    experiment.startTime = Date.now();

    console.log(`\n🧪 Starting Chaos Experiment: ${name}`);
    console.log(`   Type: ${experiment.type}`);
    console.log(`   Hypothesis: ${experiment.hypothesis}`);
    console.log(`   Rollout: ${experiment.rolloutPercentage}%`);
    console.log(`   Duration: ${experiment.duration}ms\n`);

    this.emit('experiment-start', experiment);

    try {
      // Run workload with chaos injection
      const endTime = Date.now() + experiment.duration;
      const checkInterval = 5000; // Check safety every 5 seconds
      let lastCheck = Date.now();

      while (Date.now() < endTime && experiment.state === 'RUNNING') {
        // Run workload
        try {
          await experiment.apply(workloadFn);
        } catch (error) {
          // Expected - chaos is injecting errors
        }

        // Periodic safety checks
        if (Date.now() - lastCheck > checkInterval) {
          const safetyResults = await this.safetyMonitor.runChecks(
            experiment.getMetrics()
          );

          this.emit('safety-check', { experiment: name, results: safetyResults });

          if (this.safetyMonitor.shouldAbort(safetyResults)) {
            console.log('\n⚠️  Safety threshold exceeded, aborting experiment!');
            experiment.state = 'ABORTED';
            break;
          }

          lastCheck = Date.now();
        }

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      experiment.endTime = Date.now();

      if (experiment.state === 'RUNNING') {
        experiment.state = 'COMPLETED';
      }

      // Calculate resilience score
      const resilienceScore = this.resilienceScorer.calculateScore(experiment);

      const result = {
        experiment: experiment.toJSON(),
        resilience: resilienceScore,
        safetyViolations: this.safetyMonitor.getViolations()
      };

      this.experimentHistory.push(result);

      this.emit('experiment-complete', result);

      console.log(`\n✅ Experiment ${experiment.state}`);
      console.log(`   Resilience Score: ${resilienceScore.overall}/100 (${resilienceScore.grade})`);

      return result;

    } catch (error) {
      experiment.state = 'ABORTED';
      experiment.endTime = Date.now();

      this.emit('experiment-error', { experiment: name, error });

      throw error;
    } finally {
      this.activeExperiment = null;
    }
  }

  /**
   * Get experiment results
   */
  getExperimentResult(name) {
    return this.experimentHistory.find(h => h.experiment.name === name);
  }

  /**
   * Generate resilience report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      totalExperiments: this.experimentHistory.length,
      experiments: this.experimentHistory,
      overallResilience: this.calculateOverallResilience(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  calculateOverallResilience() {
    if (this.experimentHistory.length === 0) return null;

    const scores = this.experimentHistory.map(h => h.resilience.overall);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      average: Math.round(avg),
      min: Math.min(...scores),
      max: Math.max(...scores)
    };
  }

  generateRecommendations() {
    const recommendations = [];

    this.experimentHistory.forEach(result => {
      const resilience = result.resilience;

      if (resilience.breakdown.errorHandling < 70) {
        recommendations.push({
          priority: 'HIGH',
          area: 'Error Handling',
          message: `Improve error handling for ${result.experiment.type} failures`,
          experiment: result.experiment.name
        });
      }

      if (resilience.breakdown.latencyTolerance < 60) {
        recommendations.push({
          priority: 'MEDIUM',
          area: 'Latency Tolerance',
          message: `Optimize timeout and retry strategies`,
          experiment: result.experiment.name
        });
      }

      if (resilience.breakdown.recovery < 50) {
        recommendations.push({
          priority: 'HIGH',
          area: 'Recovery',
          message: `Implement auto-healing mechanisms`,
          experiment: result.experiment.name
        });
      }
    });

    return recommendations;
  }

  /**
   * Export chaos report
   */
  exportReport() {
    const reportsDir = join(process.cwd(), 'metrics', 'chaos-reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const report = this.generateReport();
    const reportPath = join(reportsDir, `chaos-report-${Date.now()}.json`);

    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
  }
}

// ============================================
// Demonstration
// ============================================
async function demonstrateChaosEngineering() {
  console.log('\n' + '='.repeat(60));
  console.log('🌪️  JARVIS Chaos Engineering Framework');
  console.log('='.repeat(60) + '\n');

  const chaos = new ChaosEngine();

  // Define chaos experiments
  chaos.registerExperiment('latency-injection', {
    type: CHAOS_TYPES.LATENCY,
    target: 'api-service',
    parameters: {
      delay: 500,
      jitter: 200
    },
    duration: 10000,
    rolloutPercentage: 50,
    hypothesis: 'System should handle 500ms latency gracefully'
  });

  chaos.registerExperiment('error-injection', {
    type: CHAOS_TYPES.ERROR,
    target: 'database',
    parameters: {
      errorRate: 0.3,
      errorMessage: 'Database connection timeout'
    },
    duration: 10000,
    rolloutPercentage: 30,
    hypothesis: 'System should retry failed database operations'
  });

  chaos.registerExperiment('timeout-injection', {
    type: CHAOS_TYPES.TIMEOUT,
    target: 'external-api',
    parameters: {
      timeout: 2000
    },
    duration: 10000,
    rolloutPercentage: 40,
    hypothesis: 'System should timeout gracefully after 2 seconds'
  });

  // Simulated workload
  const mockWorkload = async () => {
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50));
    return { success: true };
  };

  // Run experiments
  const results = [];

  console.log('🔬 Running Chaos Experiments...\n');

  // Experiment 1: Latency
  const latencyResult = await chaos.runExperiment('latency-injection', mockWorkload);
  results.push(latencyResult);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Experiment 2: Errors
  const errorResult = await chaos.runExperiment('error-injection', mockWorkload);
  results.push(errorResult);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Experiment 3: Timeouts
  const timeoutResult = await chaos.runExperiment('timeout-injection', mockWorkload);
  results.push(timeoutResult);

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 Chaos Engineering Report');
  console.log('='.repeat(60));

  const report = chaos.generateReport();

  console.log(`\n🎯 Overall Resilience:`);
  console.log(`   Average Score: ${report.overallResilience.average}/100`);
  console.log(`   Range: ${report.overallResilience.min} - ${report.overallResilience.max}`);

  console.log(`\n📋 Experiment Results:`);
  results.forEach((result, i) => {
    const exp = result.experiment;
    const res = result.resilience;

    console.log(`\n   ${i + 1}. ${exp.name}`);
    console.log(`      Type: ${exp.type}`);
    console.log(`      Score: ${res.overall}/100 (Grade: ${res.grade})`);
    console.log(`      Error Rate: ${(exp.metrics.errorRate * 100).toFixed(2)}%`);
    console.log(`      Avg Latency: ${exp.metrics.avgLatency.toFixed(2)}ms`);
    console.log(`      State: ${exp.state}`);
  });

  console.log(`\n💡 Recommendations:`);
  if (report.recommendations.length === 0) {
    console.log('   ✅ System shows excellent resilience!');
  } else {
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. [${rec.priority}] ${rec.area}: ${rec.message}`);
    });
  }

  // Export report
  const reportPath = chaos.exportReport();
  console.log(`\n💾 Report saved: ${reportPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Chaos Engineering Demonstration Complete');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateChaosEngineering().catch(console.error);
}

export {
  CHAOS_TYPES,
  ChaosExperiment,
  SafetyMonitor,
  ResilienceScorer,
  ChaosEngine
};
