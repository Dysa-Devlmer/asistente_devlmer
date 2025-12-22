#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Master Orchestrator
 * Unified control for all advanced systems
 * ============================================
 *
 * Integrates:
 * - Intelligent Auto-Healing
 * - Observability Platform
 * - Chaos Engineering
 * - Feature Flags
 * - Service Mesh
 *
 * Provides:
 * - Unified dashboard
 * - Cross-system automation
 * - Centralized monitoring
 * - Emergency controls
 */

import { EventEmitter } from 'events';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Import all advanced systems
import { AutoHealingEngine } from './intelligent-healing-system.js';
import { ObservabilityPlatform } from './observability-platform.js';
import { ChaosEngine, CHAOS_TYPES } from './chaos-engineering-framework.js';
import { FeatureFlagManager } from './feature-flags-system.js';
import { ServiceRegistry, ServiceMeshProxy, ServiceInstance } from './service-mesh.js';

// ============================================
// Master Orchestrator
// ============================================
class MasterOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.serviceName = config.serviceName || 'jarvis';
    this.environment = config.environment || 'production';

    // Initialize all subsystems
    this.autoHealing = new AutoHealingEngine();
    this.observability = new ObservabilityPlatform(this.serviceName);
    this.chaos = new ChaosEngine();
    this.featureFlags = new FeatureFlagManager();
    this.serviceRegistry = new ServiceRegistry();
    this.serviceMesh = null; // Initialized after registry setup

    this.startTime = Date.now();
    this.systemHealth = 'HEALTHY';

    this.setupIntegrations();
    this.setupEmergencyControls();
  }

  /**
   * Setup cross-system integrations
   */
  setupIntegrations() {
    // Auto-Healing → Observability
    this.autoHealing.on('healing-complete', async (record) => {
      await this.observability.tracer.trace('auto-healing', async (span) => {
        span.setAttribute('anomaly.type', record.anomaly.type);
        span.setAttribute('success', record.success);

        this.observability.logger.info('Auto-healing completed', {
          anomaly: record.anomaly.type,
          actions: record.result.actions
        }, span);
      });

      this.observability.metrics.counter('healing_actions_total', {
        type: record.anomaly.type,
        success: record.success.toString()
      }).inc();
    });

    // Chaos → Observability
    this.chaos.on('experiment-start', (experiment) => {
      this.observability.logger.warn('Chaos experiment started', {
        name: experiment.name,
        type: experiment.type
      });
    });

    this.chaos.on('experiment-complete', (result) => {
      this.observability.metrics.counter('chaos_experiments_total', {
        name: result.experiment.name,
        state: result.experiment.state
      }).inc();

      this.observability.metrics.gauge('chaos_resilience_score', {
        name: result.experiment.name
      }).set(result.resilience.overall);
    });

    // Service Mesh → Observability
    this.serviceRegistry.on('service-registered', (instance) => {
      this.observability.logger.info('Service registered', {
        name: instance.name,
        version: instance.version,
        host: instance.host
      });
    });

    // Feature Flags → Observability
    this.featureFlags.on('flag-evaluated', ({ flag, result }) => {
      this.observability.metrics.counter('feature_flag_evaluations', {
        flag,
        enabled: result.enabled.toString()
      }).inc();
    });
  }

  /**
   * Setup emergency control mechanisms
   */
  setupEmergencyControls() {
    // Emergency shutdown on critical health
    this.autoHealing.healthMonitor.on('health-failure', async ({ service, error }) => {
      this.observability.logger.error('Critical service failure', {
        service,
        error
      });

      // Check if we should trigger emergency mode
      if (this.shouldEnterEmergencyMode()) {
        await this.enterEmergencyMode();
      }
    });

    // Automatic feature flag kill switches on chaos failures
    this.chaos.on('experiment-rollback', async ({ flag }) => {
      this.observability.logger.warn('Chaos rollback - activating kill switches');

      // Disable risky features
      const riskyFlags = this.featureFlags.getAllFlags()
        .filter(f => f.metadata?.risky === true);

      riskyFlags.forEach(flag => {
        const f = this.featureFlags.getFlag(flag.name);
        f?.activateKillSwitch();
      });
    });
  }

  /**
   * Initialize service mesh
   */
  initializeServiceMesh(config = {}) {
    this.serviceMesh = new ServiceMeshProxy(this.serviceRegistry, {
      loadBalancingStrategy: config.loadBalancingStrategy || 'least-connections',
      requestTimeout: config.requestTimeout || 30000,
      retryPolicy: config.retryPolicy,
      rateLimit: config.rateLimit
    });

    // Integrate mesh with observability
    this.serviceMesh.on('request-start', ({ serviceName, traceId }) => {
      this.observability.metrics.counter('mesh_requests_total', {
        service: serviceName
      }).inc();
    });

    this.serviceMesh.on('request-success', ({ serviceName, duration }) => {
      this.observability.metrics.histogram('mesh_request_duration', {
        service: serviceName
      }).observe(duration / 1000);
    });

    this.serviceMesh.on('request-failure', ({ serviceName, error }) => {
      this.observability.metrics.counter('mesh_errors_total', {
        service: serviceName,
        error: error
      }).inc();
    });

    this.observability.logger.info('Service mesh initialized', {
      strategy: config.loadBalancingStrategy
    });
  }

  /**
   * Register a service instance
   */
  registerService(config) {
    const instance = new ServiceInstance(config.id, config);
    this.serviceRegistry.register(instance);

    // Setup health check with auto-healing
    this.autoHealing.healthMonitor.registerService(
      config.name,
      async () => {
        try {
          const response = await fetch(`http://${config.host}:${config.port}/health`);
          return { healthy: response.ok };
        } catch {
          return { healthy: false };
        }
      }
    );

    return instance;
  }

  /**
   * Create and register a feature flag
   */
  createFeatureFlag(name, config) {
    return this.featureFlags.createFlag(name, config);
  }

  /**
   * Run chaos experiment with safety controls
   */
  async runChaosExperiment(name, workload, config = {}) {
    // Check if chaos testing is enabled via feature flag
    if (!this.featureFlags.isEnabled('chaos-testing-enabled', {
      environment: this.environment
    })) {
      throw new Error('Chaos testing is disabled via feature flag');
    }

    // Register experiment
    this.chaos.registerExperiment(name, config);

    // Run with observability
    return await this.observability.tracer.trace(`chaos-experiment-${name}`, async (span) => {
      span.setAttribute('experiment.name', name);
      span.setAttribute('experiment.type', config.type);

      const result = await this.chaos.runExperiment(name, workload);

      span.setAttribute('resilience.score', result.resilience.overall);
      span.setAttribute('experiment.state', result.experiment.state);

      return result;
    });
  }

  /**
   * Start gradual feature rollout
   */
  startGradualRollout(flagName, config) {
    const rollout = this.featureFlags.startGradualRollout(flagName, config);

    // Monitor rollout health
    rollout.on('stage-progress', async ({ stage, percentage, metrics }) => {
      await this.observability.tracer.trace('rollout-stage', async (span) => {
        span.setAttribute('flag', flagName);
        span.setAttribute('stage', stage);
        span.setAttribute('percentage', percentage);

        this.observability.logger.info('Rollout progressed', {
          flag: flagName,
          percentage,
          errorRate: metrics.errorRate
        }, span);
      });

      // Auto-healing integration: monitor rollout health
      this.autoHealing.analyzeAndHeal(`rollout_error_rate_${flagName}`, metrics.errorRate);
    });

    return rollout;
  }

  /**
   * Make service request through mesh
   */
  async meshRequest(serviceName, operation, context = {}) {
    if (!this.serviceMesh) {
      throw new Error('Service mesh not initialized');
    }

    // Add observability
    return await this.observability.instrumentHTTP(
      'MESH',
      serviceName,
      async (span) => {
        context.traceId = span.context.traceId;

        return await this.serviceMesh.request(serviceName, operation, context);
      }
    );
  }

  /**
   * Check if should enter emergency mode
   */
  shouldEnterEmergencyMode() {
    const healthStatus = this.autoHealing.healthMonitor.getAllStatuses();
    const unhealthyCount = healthStatus.filter(s => s.status === 'UNHEALTHY').length;

    return unhealthyCount > healthStatus.length * 0.5; // >50% unhealthy
  }

  /**
   * Enter emergency mode
   */
  async enterEmergencyMode() {
    this.systemHealth = 'EMERGENCY';

    this.observability.logger.fatal('ENTERING EMERGENCY MODE', {
      reason: 'Critical system health failure'
    });

    // 1. Activate all kill switches
    this.featureFlags.getAllFlags().forEach(flag => {
      const f = this.featureFlags.getFlag(flag.name);
      f?.activateKillSwitch();
    });

    this.observability.logger.warn('All feature flags disabled');

    // 2. Stop all chaos experiments
    if (this.chaos.activeExperiment) {
      this.chaos.activeExperiment.state = 'ABORTED';
    }

    this.observability.logger.warn('All chaos experiments aborted');

    // 3. Trigger system-wide healing
    await this.autoHealing.heal({
      type: 'SERVICE_RESTART',
      severity: 'CRITICAL',
      reason: 'Emergency mode triggered'
    });

    this.emit('emergency-mode-activated');
  }

  /**
   * Exit emergency mode
   */
  exitEmergencyMode() {
    this.systemHealth = 'RECOVERING';

    this.observability.logger.info('Exiting emergency mode');

    // Gradually re-enable system
    setTimeout(() => {
      this.systemHealth = 'HEALTHY';
      this.observability.logger.info('System recovered');
      this.emit('emergency-mode-deactivated');
    }, 60000); // 1 minute recovery period
  }

  /**
   * Get unified dashboard data
   */
  async getDashboard() {
    const obsDashboard = this.observability.getDashboard();
    const healingReport = this.autoHealing.getSystemReport();
    const chaosReport = this.chaos.generateReport();
    const flagAnalytics = this.featureFlags.getAllAnalytics();
    const meshStats = this.serviceMesh?.getStatistics() || null;

    return {
      timestamp: Date.now(),
      systemHealth: this.systemHealth,
      uptime: Date.now() - this.startTime,
      environment: this.environment,

      observability: {
        performance: obsDashboard.performance,
        slos: obsDashboard.slos,
        recentTraces: obsDashboard.recentTraces.slice(0, 10)
      },

      autoHealing: {
        anomalies: healingReport.anomalies.slice(-10),
        healingActions: healingReport.healingHistory.slice(-10),
        healthStatus: healingReport.healthStatus
      },

      chaos: {
        totalExperiments: chaosReport.totalExperiments,
        overallResilience: chaosReport.overallResilience,
        recommendations: chaosReport.recommendations.slice(0, 5)
      },

      featureFlags: {
        totalFlags: flagAnalytics.length,
        activeFlags: flagAnalytics.filter(f => f.enablementRate > 0).length,
        topFlags: flagAnalytics
          .sort((a, b) => b.evaluations - a.evaluations)
          .slice(0, 5)
      },

      serviceMesh: meshStats ? {
        totalRequests: meshStats.totalRequests,
        successRate: meshStats.successRate,
        services: meshStats.services
      } : null
    };
  }

  /**
   * Export complete system state
   */
  exportSystemState() {
    const exportDir = join(process.cwd(), 'exports');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = Date.now();

    // Export dashboard
    const dashboard = this.getDashboard();
    const dashboardPath = join(exportDir, `dashboard-${timestamp}.json`);
    writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));

    // Export telemetry
    const telemetry = this.observability.exportTelemetry();

    // Export chaos report
    const chaosPath = this.chaos.exportReport();

    return {
      dashboard: dashboardPath,
      telemetry,
      chaos: chaosPath
    };
  }

  /**
   * Start all monitoring
   */
  startMonitoring() {
    this.autoHealing.healthMonitor.startMonitoring();
    this.observability.logger.info('Monitoring started');
    this.emit('monitoring-started');
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring() {
    this.autoHealing.healthMonitor.stopMonitoring();
    this.observability.logger.info('Monitoring stopped');
    this.emit('monitoring-stopped');
  }

  /**
   * Get system status summary
   */
  getStatus() {
    return {
      health: this.systemHealth,
      uptime: Date.now() - this.startTime,
      subsystems: {
        autoHealing: this.autoHealing.healthMonitor.getAllStatuses().length > 0,
        observability: true,
        chaos: this.chaos.experiments.size > 0,
        featureFlags: this.featureFlags.flags.size,
        serviceMesh: this.serviceMesh !== null
      }
    };
  }
}

// ============================================
// Comprehensive Demonstration
// ============================================
async function demonstrateMasterOrchestrator() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 JARVIS MASTER ORCHESTRATOR');
  console.log('    Unified Enterprise Platform');
  console.log('='.repeat(70) + '\n');

  // Initialize orchestrator
  const master = new MasterOrchestrator({
    serviceName: 'jarvis-enterprise',
    environment: 'production'
  });

  console.log('✅ Master Orchestrator initialized\n');

  // ==========================================
  // 1. Register Services
  // ==========================================
  console.log('📝 Registering services...\n');

  master.registerService({
    id: 'api-v1-1',
    name: 'api-service',
    host: 'localhost',
    port: 7777,
    version: '1.0.0'
  });

  master.registerService({
    id: 'api-v2-1',
    name: 'api-service',
    host: 'localhost',
    port: 7778,
    version: '2.0.0'
  });

  // Initialize service mesh
  master.initializeServiceMesh({
    loadBalancingStrategy: 'least-connections',
    requestTimeout: 5000
  });

  console.log('');

  // ==========================================
  // 2. Create Feature Flags
  // ==========================================
  console.log('🎚️  Creating feature flags...\n');

  master.createFeatureFlag('chaos-testing-enabled', {
    description: 'Enable chaos engineering experiments',
    enabled: true,
    defaultValue: true
  });

  master.createFeatureFlag('new-api-version', {
    description: 'New API v2.0',
    enabled: true,
    defaultValue: false
  });

  console.log('');

  // ==========================================
  // 3. Start Monitoring
  // ==========================================
  console.log('👁️  Starting health monitoring...\n');

  master.startMonitoring();

  await new Promise(resolve => setTimeout(resolve, 2000));

  // ==========================================
  // 4. Simulate Traffic Through Mesh
  // ==========================================
  console.log('🔄 Simulating service mesh traffic...\n');

  const mockOperation = async (instance, context) => {
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    if (Math.random() < 0.05) {
      throw new Error('SERVICE_ERROR');
    }

    return { instanceId: instance.id, version: instance.version };
  };

  for (let i = 0; i < 20; i++) {
    try {
      await master.meshRequest('api-service', mockOperation, {
        requestId: `req-${i}`
      });
    } catch (error) {
      // Expected
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');

  // ==========================================
  // 5. Unified Dashboard
  // ==========================================
  console.log('='.repeat(70));
  console.log('📊 UNIFIED DASHBOARD');
  console.log('='.repeat(70));

  const dashboard = await master.getDashboard();

  console.log(`\n🏥 System Health: ${dashboard.systemHealth}`);
  console.log(`⏱️  Uptime: ${Math.floor(dashboard.uptime / 1000)}s`);
  console.log(`🌍 Environment: ${dashboard.environment}`);

  console.log(`\n📈 Performance:`);
  console.log(`   Total Spans: ${dashboard.observability.performance.totalSpans}`);
  console.log(`   Avg Duration: ${dashboard.observability.performance.avgDuration.toFixed(2)}ms`);
  console.log(`   Error Rate: ${(dashboard.observability.performance.errorRate * 100).toFixed(2)}%`);

  console.log(`\n🎯 SLOs:`);
  dashboard.observability.slos.slice(0, 3).forEach(slo => {
    const icon = slo.status === 'MEETING' ? '✅' : '❌';
    console.log(`   ${icon} ${slo.name}: ${(slo.compliance * 100).toFixed(1)}%`);
  });

  console.log(`\n🏥 Auto-Healing:`);
  console.log(`   Anomalies Detected: ${dashboard.autoHealing.anomalies.length}`);
  console.log(`   Healing Actions: ${dashboard.autoHealing.healingActions.length}`);

  console.log(`\n🎚️  Feature Flags:`);
  console.log(`   Total Flags: ${dashboard.featureFlags.totalFlags}`);
  console.log(`   Active Flags: ${dashboard.featureFlags.activeFlags}`);

  if (dashboard.serviceMesh) {
    console.log(`\n🕸️  Service Mesh:`);
    console.log(`   Total Requests: ${dashboard.serviceMesh.totalRequests}`);
    console.log(`   Success Rate: ${(dashboard.serviceMesh.successRate * 100).toFixed(2)}%`);
    console.log(`   Services: ${dashboard.serviceMesh.services.length}`);
  }

  // ==========================================
  // 6. Export System State
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('💾 Exporting System State');
  console.log('='.repeat(70) + '\n');

  const exported = master.exportSystemState();

  console.log(`Dashboard: ${exported.dashboard}`);
  console.log(`Traces: ${exported.telemetry.tracesFile}`);
  console.log(`Metrics: ${exported.telemetry.metricsFile}`);
  console.log(`Chaos Report: ${exported.chaos}`);

  // ==========================================
  // 7. System Status
  // ==========================================
  console.log('\n' + '='.repeat(70));
  console.log('📋 System Status');
  console.log('='.repeat(70) + '\n');

  const status = master.getStatus();

  console.log(`Health: ${status.health}`);
  console.log(`Uptime: ${Math.floor(status.uptime / 1000)}s`);
  console.log('\nSubsystems:');
  Object.entries(status.subsystems).forEach(([name, active]) => {
    const icon = active ? '✅' : '❌';
    console.log(`   ${icon} ${name}`);
  });

  // Cleanup
  master.stopMonitoring();

  console.log('\n' + '='.repeat(70));
  console.log('✅ Master Orchestrator Demonstration Complete');
  console.log('='.repeat(70) + '\n');

  console.log('🎉 JARVIS Enterprise Platform is fully operational!\n');
  console.log('Available Systems:');
  console.log('   1. ✅ Intelligent Auto-Healing');
  console.log('   2. ✅ Observability Platform');
  console.log('   3. ✅ Chaos Engineering');
  console.log('   4. ✅ Feature Flags');
  console.log('   5. ✅ Service Mesh');
  console.log('   6. ✅ Master Orchestrator\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateMasterOrchestrator().catch(console.error);
}

export { MasterOrchestrator };
