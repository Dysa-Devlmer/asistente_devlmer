// test-logging.cjs
// Tests para Logger Manager y System Monitor

const LoggerManager = require('./core/logging/logger-manager.cjs');
const SystemMonitor = require('./core/logging/system-monitor.cjs');
const fs = require('fs-extra');
const path = require('path');

async function testLoggerManager() {
  console.log('='.repeat(60));
  console.log('🧪 TEST: Logger Manager');
  console.log('='.repeat(60));

  const logsDir = path.join(process.cwd(), 'test-logs');

  const loggerManager = new LoggerManager({
    projectRoot: process.cwd(),
    logsDir,
    level: 'debug',
    enableConsole: false
  });

  try {
    // Test 1: Inicialización
    console.log('\n📝 Test 1: Inicialización...');
    await loggerManager.initialize();
    console.log('✅ Logger inicializado');

    // Test 2: Logs en diferentes niveles
    console.log('\n📝 Test 2: Escribir logs...');
    loggerManager.debug('system', 'Debug message test');
    loggerManager.info('agent', 'Info message test');
    loggerManager.warn('scheduler', 'Warning message test');
    loggerManager.error('errors', 'Error message test', { code: 500 });
    console.log('✅ Logs escritos');

    // Test 3: Obtener logs recientes
    console.log('\n📝 Test 3: Obtener logs recientes...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Esperar async writes
    const logs = loggerManager.getRecentLogs({ limit: 10 });
    console.log(`✅ ${logs.length} logs obtenidos`);

    // Test 4: Estadísticas
    console.log('\n📝 Test 4: Obtener estadísticas...');
    const stats = loggerManager.getStats();
    console.log(`✅ Total logs: ${stats.totalLogs}`);
    console.log(`   Debug: ${stats.byLevel.debug}`);
    console.log(`   Info: ${stats.byLevel.info}`);
    console.log(`   Warn: ${stats.byLevel.warn}`);
    console.log(`   Error: ${stats.byLevel.error}`);

    // Cleanup
    await loggerManager.close();
    await fs.remove(logsDir);

    console.log('\n✅ Todos los tests de Logger Manager pasaron!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Error en tests de Logger Manager:', error);
    return false;
  }
}

async function testSystemMonitor() {
  console.log('='.repeat(60));
  console.log('🧪 TEST: System Monitor');
  console.log('='.repeat(60));

  const monitor = new SystemMonitor({
    interval: 2000
  });

  try {
    // Test 1: Inicialización y recolección
    console.log('\n📝 Test 1: Iniciar monitoreo...');
    await monitor.start();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar recolecciones
    console.log('✅ Monitoreo activo');

    // Test 2: Obtener métricas actuales
    console.log('\n📝 Test 2: Obtener métricas actuales...');
    const metrics = monitor.getCurrentMetrics();
    console.log(`✅ CPU: ${metrics.cpu.usage.toFixed(2)}%`);
    console.log(`   Memoria: ${metrics.memory.usage.toFixed(2)}%`);
    console.log(`   Disco: ${metrics.disk.usage.toFixed(2)}%`);

    // Test 3: Historial
    console.log('\n📝 Test 3: Obtener historial...');
    const history = monitor.getHistory('cpu', 5);
    console.log(`✅ ${history.length} mediciones en historial`);

    // Test 4: Reporte de salud
    console.log('\n📝 Test 4: Generar reporte de salud...');
    const healthReport = monitor.generateHealthReport();
    console.log(`✅ Estado: ${healthReport.status}`);
    console.log(`   ${healthReport.message}`);

    // Cleanup
    monitor.stop();

    console.log('\n✅ Todos los tests de System Monitor pasaron!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Error en tests de System Monitor:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Iniciando tests del sistema de Logging & Monitoring...\n');

  const results = {
    loggerManager: false,
    systemMonitor: false
  };

  // Ejecutar tests
  results.loggerManager = await testLoggerManager();
  results.systemMonitor = await testSystemMonitor();

  // Resumen
  console.log('='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));
  console.log(`Logger Manager: ${results.loggerManager ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`System Monitor: ${results.systemMonitor ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('\n🎉 ¡Todos los tests pasaron exitosamente!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Algunos tests fallaron\n');
    process.exit(1);
  }
}

// Ejecutar tests
runAllTests().catch(error => {
  console.error('❌ Error fatal en tests:', error);
  process.exit(1);
});
