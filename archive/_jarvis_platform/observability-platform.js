#!/usr/bin/env node

/**
 * ============================================
 * JARVIS Observability Platform
 * OpenTelemetry-based distributed tracing,
 * metrics, and unified logging
 * ============================================
 *
 * Features:
 * - Distributed tracing with context propagation
 * - Custom metrics with Prometheus format
 * - Structured logging with correlation IDs
 * - Performance profiling & bottleneck detection
 * - SLA/SLO monitoring
 * - Real-time dashboards
 */

import { EventEmitter } from 'events';
import { writeFileSync, existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// ============================================
// Trace Context & Propagation
// ============================================
class TraceContext {
  constructor(traceId = null, spanId = null, parentSpanId = null) {
    this.traceId = traceId || this.generateId();
    this.spanId = spanId || this.generateId();
    this.parentSpanId = parentSpanId;
    this.baggage = new Map();
  }

  generateId() {
    return createHash('md5')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
  }

  createChild() {
    return new TraceContext(this.traceId, this.generateId(), this.spanId);
  }

  setBaggage(key, value) {
    this.baggage.set(key, value);
  }

  getBaggage(key) {
    return this.baggage.get(key);
  }

  toHeaders() {
    return {
      'x-trace-id': this.traceId,
      'x-span-id': this.spanId,
      'x-parent-span-id': this.parentSpanId || '',
      'x-baggage': JSON.stringify(Object.fromEntries(this.baggage))
    };
  }

  static fromHeaders(headers) {
    const context = new TraceContext(
      headers['x-trace-id'],
      headers['x-span-id'],
      headers['x-parent-span-id']
    );

    if (headers['x-baggage']) {
      try {
        const baggage = JSON.parse(headers['x-baggage']);
        Object.entries(baggage).forEach(([k, v]) => context.setBaggage(k, v));
      } catch (e) {
        // Invalid baggage
      }
    }

    return context;
  }
}

// ============================================
// Span - Distributed Tracing Unit
// ============================================
class Span {
  constructor(name, context, tracer) {
    this.name = name;
    this.context = context;
    this.tracer = tracer;
    this.startTime = Date.now();
    this.endTime = null;
    this.attributes = {};
    this.events = [];
    this.status = { code: 'UNSET' };
    this.kind = 'INTERNAL'; // CLIENT, SERVER, PRODUCER, CONSUMER, INTERNAL
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
    return this;
  }

  addEvent(name, attributes = {}) {
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes
    });
    return this;
  }

  setStatus(code, message = '') {
    this.status = { code, message };
    return this;
  }

  setKind(kind) {
    this.kind = kind;
    return this;
  }

  end() {
    this.endTime = Date.now();
    this.tracer.recordSpan(this);
  }

  duration() {
    return this.endTime ? this.endTime - this.startTime : null;
  }

  toJSON() {
    return {
      name: this.name,
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      parentSpanId: this.context.parentSpanId,
      kind: this.kind,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration(),
      attributes: this.attributes,
      events: this.events,
      status: this.status
    };
  }
}

// ============================================
// Tracer - Creates and manages spans
// ============================================
class Tracer extends EventEmitter {
  constructor(serviceName) {
    super();
    this.serviceName = serviceName;
    this.spans = [];
    this.activeSpans = new Map();
  }

  startSpan(name, context = null) {
    const spanContext = context || new TraceContext();
    const span = new Span(name, spanContext, this);

    this.activeSpans.set(spanContext.spanId, span);
    this.emit('span-start', span);

    return span;
  }

  recordSpan(span) {
    this.spans.push(span);
    this.activeSpans.delete(span.context.spanId);
    this.emit('span-end', span);
  }

  /**
   * Execute function within a span context
   */
  async trace(name, fn, context = null) {
    const span = this.startSpan(name, context);

    try {
      const result = await fn(span);
      span.setStatus('OK');
      return result;
    } catch (error) {
      span.setStatus('ERROR', error.message);
      span.setAttribute('error', true);
      span.setAttribute('error.message', error.message);
      span.setAttribute('error.stack', error.stack);
      throw error;
    } finally {
      span.end();
    }
  }

  getSpans(filter = null) {
    if (!filter) return this.spans;
    return this.spans.filter(filter);
  }

  getTrace(traceId) {
    return this.spans.filter(s => s.context.traceId === traceId);
  }

  /**
   * Build trace tree structure
   */
  buildTraceTree(traceId) {
    const spans = this.getTrace(traceId);
    const spanMap = new Map(spans.map(s => [s.context.spanId, s]));
    const roots = [];

    spans.forEach(span => {
      if (!span.context.parentSpanId) {
        roots.push(this.buildNode(span, spanMap));
      }
    });

    return roots;
  }

  buildNode(span, spanMap) {
    const children = Array.from(spanMap.values())
      .filter(s => s.context.parentSpanId === span.context.spanId)
      .map(s => this.buildNode(s, spanMap));

    return {
      span: span.toJSON(),
      children
    };
  }
}

// ============================================
// Metrics Collector
// ============================================
class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.summaries = new Map();
  }

  /**
   * Counter - monotonically increasing value
   */
  counter(name, labels = {}) {
    const key = this.getKey(name, labels);

    if (!this.counters.has(key)) {
      this.counters.set(key, { name, labels, value: 0 });
    }

    return {
      inc: (value = 1) => {
        this.counters.get(key).value += value;
      },
      get: () => this.counters.get(key).value
    };
  }

  /**
   * Gauge - can go up and down
   */
  gauge(name, labels = {}) {
    const key = this.getKey(name, labels);

    if (!this.gauges.has(key)) {
      this.gauges.set(key, { name, labels, value: 0 });
    }

    return {
      set: (value) => {
        this.gauges.get(key).value = value;
      },
      inc: (value = 1) => {
        this.gauges.get(key).value += value;
      },
      dec: (value = 1) => {
        this.gauges.get(key).value -= value;
      },
      get: () => this.gauges.get(key).value
    };
  }

  /**
   * Histogram - distribution of values
   */
  histogram(name, labels = {}, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
    const key = this.getKey(name, labels);

    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        name,
        labels,
        buckets,
        counts: new Array(buckets.length).fill(0),
        sum: 0,
        count: 0
      });
    }

    return {
      observe: (value) => {
        const hist = this.histograms.get(key);
        hist.sum += value;
        hist.count++;

        // Find bucket
        for (let i = 0; i < hist.buckets.length; i++) {
          if (value <= hist.buckets[i]) {
            hist.counts[i]++;
          }
        }
      },
      get: () => this.histograms.get(key)
    };
  }

  /**
   * Summary - similar to histogram but with quantiles
   */
  summary(name, labels = {}, quantiles = [0.5, 0.9, 0.95, 0.99]) {
    const key = this.getKey(name, labels);

    if (!this.summaries.has(key)) {
      this.summaries.set(key, {
        name,
        labels,
        quantiles,
        values: [],
        sum: 0,
        count: 0
      });
    }

    return {
      observe: (value) => {
        const summary = this.summaries.get(key);
        summary.values.push(value);
        summary.sum += value;
        summary.count++;

        // Keep only last 1000 values
        if (summary.values.length > 1000) {
          summary.values.shift();
        }
      },
      get: () => {
        const summary = this.summaries.get(key);
        const sorted = [...summary.values].sort((a, b) => a - b);
        const quantileValues = {};

        summary.quantiles.forEach(q => {
          const index = Math.ceil(sorted.length * q) - 1;
          quantileValues[q] = sorted[index] || 0;
        });

        return {
          ...summary,
          quantileValues,
          mean: summary.count > 0 ? summary.sum / summary.count : 0
        };
      }
    };
  }

  getKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheus() {
    let output = '';

    // Counters
    this.counters.forEach(({ name, labels, value }) => {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      output += `${name}{${labelStr}} ${value}\n`;
    });

    // Gauges
    this.gauges.forEach(({ name, labels, value }) => {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      output += `${name}{${labelStr}} ${value}\n`;
    });

    // Histograms
    this.histograms.forEach(({ name, labels, buckets, counts, sum, count }) => {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      buckets.forEach((bucket, i) => {
        output += `${name}_bucket{${labelStr},le="${bucket}"} ${counts[i]}\n`;
      });
      output += `${name}_bucket{${labelStr},le="+Inf"} ${count}\n`;
      output += `${name}_sum{${labelStr}} ${sum}\n`;
      output += `${name}_count{${labelStr}} ${count}\n`;
    });

    return output;
  }

  getAllMetrics() {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.values()),
      summaries: Array.from(this.summaries.values()).map(s => ({
        ...s,
        ...this.summary(s.name, s.labels).get()
      }))
    };
  }
}

// ============================================
// Structured Logger with Correlation
// ============================================
class StructuredLogger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logLevel = 'INFO';
    this.logLevels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4 };
    this.logDir = join(process.cwd(), 'logs', 'observability');

    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, context = {}, span = null) {
    if (this.logLevels[level] < this.logLevels[this.logLevel]) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context
    };

    // Add trace context if available
    if (span) {
      logEntry.trace = {
        traceId: span.context.traceId,
        spanId: span.context.spanId,
        parentSpanId: span.context.parentSpanId
      };
    }

    // Console output with color
    const colors = {
      DEBUG: '\x1b[36m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      FATAL: '\x1b[35m'
    };

    console.log(
      `${colors[level]}[${level}]\x1b[0m ${logEntry.timestamp} ${this.serviceName} - ${message}`,
      context
    );

    // Write to file
    const logFile = join(this.logDir, `${this.serviceName}-${new Date().toISOString().split('T')[0]}.log`);
    appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  debug(message, context, span) { this.log('DEBUG', message, context, span); }
  info(message, context, span) { this.log('INFO', message, context, span); }
  warn(message, context, span) { this.log('WARN', message, context, span); }
  error(message, context, span) { this.log('ERROR', message, context, span); }
  fatal(message, context, span) { this.log('FATAL', message, context, span); }
}

// ============================================
// SLA/SLO Monitor
// ============================================
class SLOMonitor {
  constructor() {
    this.slos = new Map();
    this.measurements = new Map();
  }

  defineSLO(name, config) {
    this.slos.set(name, {
      name,
      target: config.target, // e.g., 0.99 for 99%
      window: config.window || 86400000, // 24 hours default
      metric: config.metric,
      threshold: config.threshold
    });

    this.measurements.set(name, []);
  }

  recordMeasurement(sloName, value) {
    const slo = this.slos.get(sloName);
    if (!slo) return;

    const measurements = this.measurements.get(sloName);
    measurements.push({
      timestamp: Date.now(),
      value,
      success: this.isSuccess(slo, value)
    });

    // Keep only measurements within window
    const cutoff = Date.now() - slo.window;
    this.measurements.set(
      sloName,
      measurements.filter(m => m.timestamp >= cutoff)
    );
  }

  isSuccess(slo, value) {
    switch (slo.metric) {
      case 'latency':
        return value <= slo.threshold;
      case 'availability':
        return value === true;
      case 'error_rate':
        return value <= slo.threshold;
      default:
        return true;
    }
  }

  getSLOStatus(sloName) {
    const slo = this.slos.get(sloName);
    const measurements = this.measurements.get(sloName) || [];

    if (measurements.length === 0) {
      return { status: 'NO_DATA', compliance: null };
    }

    const successCount = measurements.filter(m => m.success).length;
    const compliance = successCount / measurements.length;

    return {
      name: sloName,
      target: slo.target,
      compliance,
      status: compliance >= slo.target ? 'MEETING' : 'VIOLATED',
      errorBudget: slo.target - compliance,
      measurements: measurements.length
    };
  }

  getAllSLOStatus() {
    return Array.from(this.slos.keys()).map(name => this.getSLOStatus(name));
  }
}

// ============================================
// Observability Platform
// ============================================
class ObservabilityPlatform {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.tracer = new Tracer(serviceName);
    this.metrics = new MetricsCollector();
    this.logger = new StructuredLogger(serviceName);
    this.sloMonitor = new SLOMonitor();

    this.setupDefaultMetrics();
    this.setupDefaultSLOs();
  }

  setupDefaultMetrics() {
    // HTTP metrics
    this.httpRequestsTotal = this.metrics.counter('http_requests_total', {});
    this.httpRequestDuration = this.metrics.histogram('http_request_duration_seconds', {});
    this.httpErrorsTotal = this.metrics.counter('http_errors_total', {});

    // System metrics
    this.systemCPU = this.metrics.gauge('system_cpu_usage', {});
    this.systemMemory = this.metrics.gauge('system_memory_usage', {});
  }

  setupDefaultSLOs() {
    // API latency SLO: 99% of requests under 200ms
    this.sloMonitor.defineSLO('api_latency', {
      target: 0.99,
      metric: 'latency',
      threshold: 200
    });

    // Service availability SLO: 99.9% uptime
    this.sloMonitor.defineSLO('service_availability', {
      target: 0.999,
      metric: 'availability'
    });

    // Error rate SLO: < 0.1% error rate
    this.sloMonitor.defineSLO('error_rate', {
      target: 0.999,
      metric: 'error_rate',
      threshold: 0.001
    });
  }

  /**
   * Instrument HTTP request
   */
  async instrumentHTTP(method, path, handler) {
    const context = new TraceContext();

    return await this.tracer.trace(`HTTP ${method} ${path}`, async (span) => {
      span.setKind('SERVER');
      span.setAttribute('http.method', method);
      span.setAttribute('http.path', path);

      this.httpRequestsTotal.inc();
      const startTime = Date.now();

      try {
        const result = await handler(span);

        const duration = (Date.now() - startTime) / 1000;
        this.httpRequestDuration.observe(duration);

        span.setAttribute('http.status_code', 200);

        // Record SLO
        this.sloMonitor.recordMeasurement('api_latency', Date.now() - startTime);
        this.sloMonitor.recordMeasurement('service_availability', true);
        this.sloMonitor.recordMeasurement('error_rate', 0);

        this.logger.info(`${method} ${path} completed`, { duration }, span);

        return result;
      } catch (error) {
        this.httpErrorsTotal.inc();

        span.setAttribute('http.status_code', 500);
        span.setAttribute('error', true);

        this.sloMonitor.recordMeasurement('error_rate', 1);

        this.logger.error(`${method} ${path} failed`, { error: error.message }, span);

        throw error;
      }
    }, context);
  }

  /**
   * Generate observability dashboard data
   */
  getDashboard() {
    const allMetrics = this.metrics.getAllMetrics();
    const sloStatus = this.sloMonitor.getAllSLOStatus();

    // Get recent traces
    const recentTraces = this.tracer.spans
      .slice(-20)
      .map(s => s.toJSON());

    // Calculate performance statistics
    const durations = this.tracer.spans.map(s => s.duration()).filter(d => d !== null);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const p95Duration = durations.length > 0
      ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
      : 0;

    return {
      service: this.serviceName,
      timestamp: Date.now(),
      metrics: allMetrics,
      slos: sloStatus,
      performance: {
        totalSpans: this.tracer.spans.length,
        avgDuration,
        p95Duration,
        errorRate: this.calculateErrorRate()
      },
      recentTraces
    };
  }

  calculateErrorRate() {
    const total = this.tracer.spans.length;
    if (total === 0) return 0;

    const errors = this.tracer.spans.filter(s => s.status.code === 'ERROR').length;
    return errors / total;
  }

  /**
   * Export telemetry data
   */
  exportTelemetry() {
    const telemetryDir = join(process.cwd(), 'metrics', 'telemetry');
    if (!existsSync(telemetryDir)) {
      mkdirSync(telemetryDir, { recursive: true });
    }

    // Export traces
    const tracesFile = join(telemetryDir, `traces-${Date.now()}.json`);
    writeFileSync(tracesFile, JSON.stringify(this.tracer.spans.map(s => s.toJSON()), null, 2));

    // Export metrics in Prometheus format
    const metricsFile = join(telemetryDir, `metrics-${Date.now()}.prom`);
    writeFileSync(metricsFile, this.metrics.toPrometheus());

    // Export dashboard
    const dashboardFile = join(telemetryDir, `dashboard-${Date.now()}.json`);
    writeFileSync(dashboardFile, JSON.stringify(this.getDashboard(), null, 2));

    return { tracesFile, metricsFile, dashboardFile };
  }
}

// ============================================
// Demonstration
// ============================================
async function demonstrateObservability() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 JARVIS Observability Platform');
  console.log('='.repeat(60) + '\n');

  const obs = new ObservabilityPlatform('jarvis-backend');

  // Simulate HTTP requests
  console.log('🔄 Simulating HTTP requests...\n');

  for (let i = 0; i < 10; i++) {
    await obs.instrumentHTTP('GET', '/api/dashboard', async (span) => {
      // Simulate database query
      await obs.tracer.trace('database.query', async (dbSpan) => {
        dbSpan.setKind('CLIENT');
        dbSpan.setAttribute('db.system', 'postgresql');
        dbSpan.setAttribute('db.statement', 'SELECT * FROM metrics');

        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }, span.context.createChild());

      // Simulate cache lookup
      await obs.tracer.trace('cache.get', async (cacheSpan) => {
        cacheSpan.setKind('CLIENT');
        cacheSpan.setAttribute('cache.hit', Math.random() > 0.3);

        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
      }, span.context.createChild());

      return { status: 'ok' };
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Simulate some errors
  console.log('\n💥 Simulating errors...\n');

  for (let i = 0; i < 2; i++) {
    try {
      await obs.instrumentHTTP('POST', '/api/process', async () => {
        throw new Error('Processing failed');
      });
    } catch (e) {
      // Expected
    }
  }

  // Generate dashboard
  console.log('\n' + '='.repeat(60));
  console.log('📈 Observability Dashboard');
  console.log('='.repeat(60));

  const dashboard = obs.getDashboard();

  console.log(`\n📊 Performance Metrics:`);
  console.log(`   Total Spans: ${dashboard.performance.totalSpans}`);
  console.log(`   Avg Duration: ${dashboard.performance.avgDuration.toFixed(2)}ms`);
  console.log(`   P95 Duration: ${dashboard.performance.p95Duration.toFixed(2)}ms`);
  console.log(`   Error Rate: ${(dashboard.performance.errorRate * 100).toFixed(2)}%`);

  console.log(`\n🎯 SLO Status:`);
  dashboard.slos.forEach(slo => {
    const icon = slo.status === 'MEETING' ? '✅' : '❌';
    console.log(`   ${icon} ${slo.name}: ${(slo.compliance * 100).toFixed(2)}% (Target: ${(slo.target * 100).toFixed(2)}%)`);
  });

  console.log(`\n📝 Recent Traces: ${dashboard.recentTraces.length}`);

  // Export telemetry
  const exported = obs.exportTelemetry();
  console.log(`\n💾 Telemetry Exported:`);
  console.log(`   Traces: ${exported.tracesFile}`);
  console.log(`   Metrics: ${exported.metricsFile}`);
  console.log(`   Dashboard: ${exported.dashboardFile}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Observability Platform Demonstration Complete');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateObservability().catch(console.error);
}

export {
  TraceContext,
  Span,
  Tracer,
  MetricsCollector,
  StructuredLogger,
  SLOMonitor,
  ObservabilityPlatform
};
