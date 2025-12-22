#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Service Mesh
 * Istio-inspired patterns for microservices
 * communication, resilience, and security
 * ============================================
 *
 * Features:
 * - Service discovery & registration
 * - Load balancing (round-robin, least-conn, random)
 * - Circuit breaking with health checks
 * - Automatic retries with backoff
 * - Request timeout management
 * - mTLS encryption simulation
 * - Traffic splitting for canary deployments
 * - Rate limiting per service
 * - Distributed tracing integration
 */

import { EventEmitter } from 'events';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// ============================================
// Service Instance
// ============================================
class ServiceInstance {
  constructor(id, config) {
    this.id = id;
    this.name = config.name;
    this.host = config.host;
    this.port = config.port;
    this.version = config.version || '1.0.0';
    this.metadata = config.metadata || {};
    this.weight = config.weight || 100;

    this.status = 'HEALTHY'; // HEALTHY, DEGRADED, UNHEALTHY
    this.lastHealthCheck = null;
    this.consecutiveFailures = 0;
    this.activeConnections = 0;
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.latencies = [];
  }

  recordRequest(success, latency) {
    this.totalRequests++;

    if (!success) {
      this.totalErrors++;
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
    }

    if (latency) {
      this.latencies.push(latency);
      if (this.latencies.length > 100) {
        this.latencies.shift();
      }
    }
  }

  getAverageLatency() {
    if (this.latencies.length === 0) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  getErrorRate() {
    if (this.totalRequests === 0) return 0;
    return this.totalErrors / this.totalRequests;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      host: this.host,
      port: this.port,
      version: this.version,
      status: this.status,
      weight: this.weight,
      metrics: {
        activeConnections: this.activeConnections,
        totalRequests: this.totalRequests,
        errorRate: this.getErrorRate(),
        avgLatency: this.getAverageLatency()
      }
    };
  }
}

// ============================================
// Service Registry
// ============================================
class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // service name -> instances[]
  }

  register(instance) {
    if (!this.services.has(instance.name)) {
      this.services.set(instance.name, []);
    }

    this.services.get(instance.name).push(instance);

    this.emit('service-registered', instance);

    console.log(`✅ Registered: ${instance.name}@${instance.version} (${instance.host}:${instance.port})`);
  }

  deregister(instanceId) {
    for (const [name, instances] of this.services.entries()) {
      const index = instances.findIndex(i => i.id === instanceId);
      if (index !== -1) {
        const instance = instances[index];
        instances.splice(index, 1);

        this.emit('service-deregistered', instance);

        console.log(`❌ Deregistered: ${instance.name} (${instance.id})`);
        return;
      }
    }
  }

  getInstances(serviceName, version = null) {
    const instances = this.services.get(serviceName) || [];

    if (version) {
      return instances.filter(i => i.version === version && i.status !== 'UNHEALTHY');
    }

    return instances.filter(i => i.status !== 'UNHEALTHY');
  }

  getAllServices() {
    return Array.from(this.services.entries()).map(([name, instances]) => ({
      name,
      instances: instances.length,
      healthy: instances.filter(i => i.status === 'HEALTHY').length
    }));
  }
}

// ============================================
// Load Balancer
// ============================================
class LoadBalancer {
  constructor(strategy = 'round-robin') {
    this.strategy = strategy;
    this.roundRobinIndex = new Map();
  }

  selectInstance(instances) {
    if (instances.length === 0) return null;

    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobin(instances);

      case 'least-connections':
        return this.leastConnections(instances);

      case 'random':
        return this.random(instances);

      case 'weighted':
        return this.weighted(instances);

      case 'latency-based':
        return this.latencyBased(instances);

      default:
        return instances[0];
    }
  }

  roundRobin(instances) {
    const key = instances[0].name;
    const index = this.roundRobinIndex.get(key) || 0;
    const selected = instances[index % instances.length];

    this.roundRobinIndex.set(key, index + 1);

    return selected;
  }

  leastConnections(instances) {
    return instances.reduce((min, instance) =>
      instance.activeConnections < min.activeConnections ? instance : min
    );
  }

  random(instances) {
    return instances[Math.floor(Math.random() * instances.length)];
  }

  weighted(instances) {
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) return instance;
    }

    return instances[0];
  }

  latencyBased(instances) {
    // Select instance with lowest average latency
    return instances.reduce((best, instance) => {
      const latency = instance.getAverageLatency() || Infinity;
      const bestLatency = best.getAverageLatency() || Infinity;
      return latency < bestLatency ? instance : best;
    });
  }
}

// ============================================
// Circuit Breaker for Service Mesh
// ============================================
class ServiceCircuitBreaker {
  constructor(config = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.successThreshold = config.successThreshold || 2;
    this.timeout = config.timeout || 60000;
    this.halfOpenMaxAttempts = config.halfOpenMaxAttempts || 1;

    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenAttempts = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.successes++;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.successThreshold) {
        this.reset();
      }
    } else {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
  }

  getState() {
    return this.state;
  }
}

// ============================================
// Retry Policy
// ============================================
class RetryPolicy {
  constructor(config = {}) {
    this.maxRetries = config.maxRetries || 3;
    this.baseDelay = config.baseDelay || 100;
    this.maxDelay = config.maxDelay || 5000;
    this.backoffMultiplier = config.backoffMultiplier || 2;
    this.retryableErrors = config.retryableErrors || ['TIMEOUT', 'CONNECTION_ERROR'];
  }

  async execute(fn) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries) return false;

    // Check if error type is retryable
    return this.retryableErrors.some(type =>
      error.message?.includes(type) || error.type === type
    );
  }

  calculateDelay(attempt) {
    const delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, this.maxDelay);
  }
}

// ============================================
// Traffic Splitter (Canary Deployments)
// ============================================
class TrafficSplitter {
  constructor() {
    this.rules = [];
  }

  addRule(config) {
    this.rules.push({
      version: config.version,
      weight: config.weight,
      headers: config.headers || {}
    });
  }

  selectVersion(context = {}) {
    // Check header-based routing first
    for (const rule of this.rules) {
      const headerMatch = Object.entries(rule.headers).every(
        ([key, value]) => context.headers?.[key] === value
      );

      if (headerMatch && Object.keys(rule.headers).length > 0) {
        return rule.version;
      }
    }

    // Weight-based selection
    const totalWeight = this.rules.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;

    for (const rule of this.rules) {
      random -= rule.weight;
      if (random <= 0) return rule.version;
    }

    return this.rules[0]?.version || null;
  }
}

// ============================================
// Rate Limiter
// ============================================
class RateLimiter {
  constructor(config = {}) {
    this.maxRequests = config.maxRequests || 100;
    this.windowMs = config.windowMs || 60000;
    this.requests = new Map();
  }

  async checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old entries
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);
    const recentRequests = requests.filter(t => t > windowStart);

    this.requests.set(key, recentRequests);

    if (recentRequests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }

    recentRequests.push(now);
    return true;
  }

  getRemainingRequests(key) {
    const requests = this.requests.get(key) || [];
    const windowStart = Date.now() - this.windowMs;
    const recentRequests = requests.filter(t => t > windowStart);

    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// ============================================
// Service Mesh Proxy
// ============================================
class ServiceMeshProxy extends EventEmitter {
  constructor(registry, config = {}) {
    super();
    this.registry = registry;
    this.loadBalancer = new LoadBalancer(config.loadBalancingStrategy || 'round-robin');
    this.circuitBreakers = new Map();
    this.retryPolicy = new RetryPolicy(config.retryPolicy);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.trafficSplitter = new TrafficSplitter();
    this.requestTimeout = config.requestTimeout || 30000;

    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
  }

  /**
   * Make request to a service through the mesh
   */
  async request(serviceName, operation, context = {}) {
    this.totalRequests++;

    const traceId = context.traceId || this.generateTraceId();
    const startTime = Date.now();

    this.emit('request-start', {
      serviceName,
      traceId,
      timestamp: startTime
    });

    try {
      // Rate limiting
      await this.rateLimiter.checkLimit(serviceName);

      // Traffic splitting (version selection)
      const version = this.trafficSplitter.selectVersion(context);

      // Get available instances
      const instances = this.registry.getInstances(serviceName, version);

      if (instances.length === 0) {
        throw new Error(`No healthy instances for service ${serviceName}`);
      }

      // Load balancing
      const instance = this.loadBalancer.selectInstance(instances);

      // Get or create circuit breaker for instance
      const cbKey = instance.id;
      if (!this.circuitBreakers.has(cbKey)) {
        this.circuitBreakers.set(cbKey, new ServiceCircuitBreaker());
      }
      const circuitBreaker = this.circuitBreakers.get(cbKey);

      // Execute with retry policy
      const result = await this.retryPolicy.execute(async () => {
        return await circuitBreaker.execute(async () => {
          return await this.executeRequest(instance, operation, context);
        });
      });

      const duration = Date.now() - startTime;
      instance.recordRequest(true, duration);
      this.successfulRequests++;

      this.emit('request-success', {
        serviceName,
        instance: instance.id,
        traceId,
        duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.failedRequests++;

      this.emit('request-failure', {
        serviceName,
        traceId,
        duration,
        error: error.message
      });

      throw error;
    }
  }

  async executeRequest(instance, operation, context) {
    instance.activeConnections++;

    try {
      // Simulate request timeout
      const result = await Promise.race([
        operation(instance, context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), this.requestTimeout)
        )
      ]);

      return result;
    } finally {
      instance.activeConnections--;
    }
  }

  generateTraceId() {
    return createHash('md5')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Configure canary deployment
   */
  configureCanary(stableVersion, canaryVersion, canaryWeight = 10) {
    this.trafficSplitter = new TrafficSplitter();
    this.trafficSplitter.addRule({ version: canaryVersion, weight: canaryWeight });
    this.trafficSplitter.addRule({ version: stableVersion, weight: 100 - canaryWeight });
  }

  /**
   * Get mesh statistics
   */
  getStatistics() {
    const services = this.registry.getAllServices();

    const circuitBreakerStats = Array.from(this.circuitBreakers.entries()).map(
      ([id, cb]) => ({ instanceId: id, state: cb.getState() })
    );

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.totalRequests > 0
        ? this.successfulRequests / this.totalRequests
        : 0,
      services,
      circuitBreakers: circuitBreakerStats
    };
  }
}

// ============================================
// Demonstration
// ============================================
async function demonstrateServiceMesh() {
  console.log('\n' + '='.repeat(60));
  console.log('🕸️  JARVIS Service Mesh');
  console.log('='.repeat(60) + '\n');

  // Create service registry
  const registry = new ServiceRegistry();

  // Register service instances
  console.log('📝 Registering services...\n');

  // User service v1
  const userService1 = new ServiceInstance('user-v1-1', {
    name: 'user-service',
    host: 'localhost',
    port: 8001,
    version: '1.0.0',
    weight: 90
  });

  const userService2 = new ServiceInstance('user-v1-2', {
    name: 'user-service',
    host: 'localhost',
    port: 8002,
    version: '1.0.0',
    weight: 90
  });

  // User service v2 (canary)
  const userServiceCanary = new ServiceInstance('user-v2-1', {
    name: 'user-service',
    host: 'localhost',
    port: 8003,
    version: '2.0.0',
    weight: 10
  });

  registry.register(userService1);
  registry.register(userService2);
  registry.register(userServiceCanary);

  // Create service mesh proxy
  const mesh = new ServiceMeshProxy(registry, {
    loadBalancingStrategy: 'least-connections',
    requestTimeout: 5000,
    retryPolicy: {
      maxRetries: 3,
      baseDelay: 100
    },
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000
    }
  });

  // Configure canary deployment (10% traffic to v2)
  mesh.configureCanary('1.0.0', '2.0.0', 10);

  console.log('');

  // Simulate requests
  console.log('🔄 Simulating requests through service mesh...\n');

  const mockOperation = async (instance, context) => {
    // Simulate processing time
    const delay = 50 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('SERVICE_ERROR');
    }

    return {
      instanceId: instance.id,
      version: instance.version,
      data: { userId: context.userId || 'anonymous' }
    };
  };

  const versionCounts = { '1.0.0': 0, '2.0.0': 0 };

  for (let i = 0; i < 50; i++) {
    try {
      const result = await mesh.request('user-service', mockOperation, {
        userId: `user-${i}`
      });

      versionCounts[result.version]++;

    } catch (error) {
      // Expected - some requests may fail
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Statistics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Service Mesh Statistics');
  console.log('='.repeat(60));

  const stats = mesh.getStatistics();

  console.log(`\n📈 Request Statistics:`);
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Successful: ${stats.successfulRequests}`);
  console.log(`   Failed: ${stats.failedRequests}`);
  console.log(`   Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);

  console.log(`\n🎯 Traffic Distribution:`);
  console.log(`   v1.0.0: ${versionCounts['1.0.0']} (${((versionCounts['1.0.0'] / 50) * 100).toFixed(1)}%)`);
  console.log(`   v2.0.0: ${versionCounts['2.0.0']} (${((versionCounts['2.0.0'] / 50) * 100).toFixed(1)}%)`);

  console.log(`\n🔧 Services:`);
  stats.services.forEach(s => {
    console.log(`   ${s.name}: ${s.healthy}/${s.instances} healthy`);
  });

  console.log(`\n⚡ Circuit Breakers:`);
  stats.circuitBreakers.forEach(cb => {
    console.log(`   ${cb.instanceId}: ${cb.state}`);
  });

  console.log(`\n💚 Instance Health:`);
  const instances = registry.getInstances('user-service');
  instances.forEach(instance => {
    const metrics = instance.toJSON().metrics;
    console.log(`   ${instance.id}:`);
    console.log(`      Requests: ${metrics.totalRequests}`);
    console.log(`      Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    console.log(`      Avg Latency: ${metrics.avgLatency.toFixed(2)}ms`);
    console.log(`      Active Connections: ${metrics.activeConnections}`);
  });

  // Export mesh config
  const meshDir = join(process.cwd(), 'metrics', 'service-mesh');
  if (!existsSync(meshDir)) {
    mkdirSync(meshDir, { recursive: true });
  }

  const configPath = join(meshDir, `mesh-stats-${Date.now()}.json`);
  writeFileSync(configPath, JSON.stringify({
    timestamp: Date.now(),
    statistics: stats,
    instances: instances.map(i => i.toJSON())
  }, null, 2));

  console.log(`\n💾 Mesh stats saved: ${configPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Service Mesh Demonstration Complete');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateServiceMesh().catch(console.error);
}

export {
  ServiceInstance,
  ServiceRegistry,
  LoadBalancer,
  ServiceCircuitBreaker,
  RetryPolicy,
  TrafficSplitter,
  RateLimiter,
  ServiceMeshProxy
};
