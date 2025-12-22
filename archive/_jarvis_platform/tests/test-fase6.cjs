#!/usr/bin/env node
// tests/test-fase6.js
// J.A.R.V.I.S. MARK VII - Tests FASE 6
// Automation, CI/CD y Metrics

const AutomationEngine = require('../core/automation-engine.cjs');
const CICDManager = require('../core/cicd-manager.cjs');
const MetricsEngine = require('../core/metrics-engine.cjs');

// Simple logger
const logger = {
  info: (msg) => console.log(`  ${msg}`),
  error: (msg) => console.error(`  ❌ ${msg}`),
  warn: (msg) => console.warn(`  ⚠️ ${msg}`)
};

// Test runner
async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║      🧪 TESTS FASE 6 - AUTOMATIZACIÓN AVANZADA           ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  try {
    // ===== TEST 1: Automation Engine =====
    console.log('📋 Test 1: Automation Engine - Crear Workflow');
    const automationEngine = new AutomationEngine(logger);

    const workflow = automationEngine.createWorkflow('Test Workflow', [
      { action: 'memory', data: 'test data' },
      { action: 'task', data: 'test task' },
      { action: 'notify', message: 'Workflow completed' }
    ], 'manual');

    if (workflow && workflow.id && workflow.steps.length === 3) {
      console.log('✅ Test 1 PASÓ: Workflow creado correctamente\n');
      passed++;
    } else {
      console.log('❌ Test 1 FALLÓ\n');
      failed++;
    }

    // ===== TEST 2: Ejecutar Workflow =====
    console.log('📋 Test 2: Automation Engine - Ejecutar Workflow');
    const result = await automationEngine.executeWorkflow(workflow.id);

    if (result.success && result.result.memory && result.result.task) {
      console.log('✅ Test 2 PASÓ: Workflow ejecutado correctamente\n');
      passed++;
    } else {
      console.log('❌ Test 2 FALLÓ\n');
      failed++;
    }

    // ===== TEST 3: Métricas de Automation =====
    console.log('📋 Test 3: Automation Engine - Métricas');
    const metrics = automationEngine.getMetrics();

    if (metrics.executions > 0 && metrics.workflowCount > 0) {
      console.log('✅ Test 3 PASÓ: Métricas correctas');
      console.log(`  📊 Workflows: ${metrics.workflowCount}, Ejecuciones: ${metrics.executions}\n`);
      passed++;
    } else {
      console.log('❌ Test 3 FALLÓ\n');
      failed++;
    }

    // ===== TEST 4: CI/CD Manager - Crear Pipeline =====
    console.log('📋 Test 4: CI/CD Manager - Crear Pipeline');
    const cicdManager = new CICDManager(logger);

    const pipeline = cicdManager.createPipeline('Test Pipeline', [
      { name: 'Build' },
      { name: 'Test' },
      { name: 'Deploy' }
    ]);

    if (pipeline && pipeline.id && pipeline.stages.length === 3) {
      console.log('✅ Test 4 PASÓ: Pipeline creado correctamente\n');
      passed++;
    } else {
      console.log('❌ Test 4 FALLÓ\n');
      failed++;
    }

    // ===== TEST 5: Ejecutar Pipeline =====
    console.log('📋 Test 5: CI/CD Manager - Ejecutar Pipeline');
    const buildResult = await cicdManager.runPipeline(pipeline.id);

    if (buildResult.success && buildResult.build && buildResult.build.stages.length === 3) {
      console.log('✅ Test 5 PASÓ: Pipeline ejecutado correctamente');
      console.log(`  🔧 Build ID: ${buildResult.build.id}, Status: ${buildResult.build.status}\n`);
      passed++;
    } else {
      console.log('❌ Test 5 FALLÓ\n');
      failed++;
    }

    // ===== TEST 6: CI/CD Status =====
    console.log('📋 Test 6: CI/CD Manager - Status y Métricas');
    const cicdStatus = cicdManager.getStatus();

    if (cicdStatus.totalBuilds > 0 && cicdStatus.pipelines > 0) {
      console.log('✅ Test 6 PASÓ: Status correcto');
      console.log(`  📊 Pipelines: ${cicdStatus.pipelines}, Builds: ${cicdStatus.totalBuilds}\n`);
      passed++;
    } else {
      console.log('❌ Test 6 FALLÓ\n');
      failed++;
    }

    // ===== TEST 7: Metrics Engine - Dashboard =====
    console.log('📋 Test 7: Metrics Engine - Dashboard');
    const metricsEngine = new MetricsEngine(logger);

    metricsEngine.incrementMetric('commands');
    metricsEngine.incrementMetric('workflows', 5);
    metricsEngine.incrementMetric('tasks', 10);

    const dashboard = metricsEngine.getDashboard();

    if (dashboard && dashboard.metrics && dashboard.health) {
      console.log('✅ Test 7 PASÓ: Dashboard generado correctamente');
      console.log(`  💚 Salud: ${dashboard.health.status.toUpperCase()}\n`);
      passed++;
    } else {
      console.log('❌ Test 7 FALLÓ\n');
      failed++;
    }

    // ===== TEST 8: Metrics - Reporte =====
    console.log('📋 Test 8: Metrics Engine - Generar Reporte');
    const report = metricsEngine.generateReport();

    if (report && report.metrics && report.recommendations) {
      console.log('✅ Test 8 PASÓ: Reporte generado correctamente');
      console.log(`  📈 ${report.summary}\n`);
      passed++;
    } else {
      console.log('❌ Test 8 FALLÓ\n');
      failed++;
    }

    // ===== TEST 9: Metrics - System Info =====
    console.log('📋 Test 9: Metrics Engine - Info del Sistema');
    const stats = metricsEngine.getStats();

    if (stats && stats.uptime && stats.health) {
      console.log('✅ Test 9 PASÓ: Stats del sistema correctos');
      console.log(`  ⏱️ Uptime: ${stats.uptime}\n`);
      passed++;
    } else {
      console.log('❌ Test 9 FALLÓ\n');
      failed++;
    }

    // ===== TEST 10: Integración Completa =====
    console.log('📋 Test 10: Integración - Workflow + Metrics + Pipeline');

    // Crear y ejecutar workflow
    const integrationWorkflow = automationEngine.createWorkflow('Integration Test', [
      { action: 'memory', data: 'integration' },
      { action: 'notify', message: 'Integration test' }
    ]);

    await automationEngine.executeWorkflow(integrationWorkflow.id);

    // Incrementar métricas
    metricsEngine.incrementMetric('workflows');
    metricsEngine.incrementMetric('commands');

    // Crear y ejecutar pipeline
    const integrationPipeline = cicdManager.createPipeline('Integration Pipeline', [
      { name: 'Integration Test' }
    ]);

    await cicdManager.runPipeline(integrationPipeline.id);

    const finalMetrics = metricsEngine.getDashboard();
    const finalWorkflows = automationEngine.getMetrics();
    const finalPipelines = cicdManager.getStatus();

    if (finalMetrics && finalWorkflows && finalPipelines) {
      console.log('✅ Test 10 PASÓ: Integración completa funcional\n');
      passed++;
    } else {
      console.log('❌ Test 10 FALLÓ\n');
      failed++;
    }

  } catch (error) {
    console.error('❌ Error en tests:', error);
    failed++;
  }

  // ===== RESUMEN =====
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              📊 RESUMEN DE TESTS FASE 6                   ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`  ✅ Pasaron:  ${passed}/${total}`);
  console.log(`  ❌ Fallaron: ${failed}/${total}`);
  console.log(`  📊 Éxito:    ${percentage}%\n`);

  if (failed === 0) {
    console.log('  🎉 TODOS LOS TESTS PASARON!\n');
    console.log('  ✅ FASE 6 - AUTOMATIZACIÓN AVANZADA COMPLETADA\n');
    return 0;
  } else {
    console.log(`  ⚠️ ${failed} test(s) fallaron\n`);
    return 1;
  }
}

// Ejecutar tests
if (require.main === module) {
  runTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
