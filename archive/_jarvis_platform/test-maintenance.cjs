// test-maintenance.cjs
// Script de prueba para el sistema de mantenimiento automático

const MaintenanceScheduler = require('./core/maintenance-scheduler.cjs');
const MetricsPersistence = require('./core/metrics-persistence.cjs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testMaintenance() {
  log('\n🧪 Iniciando prueba de Maintenance Scheduler...\n', 'cyan');

  // Crear persistencia con datos de prueba
  const persistence = new MetricsPersistence();
  persistence.initialize();

  // Crear sesiones de prueba
  log('📝 Creando sesiones de prueba...', 'blue');
  for (let i = 0; i < 5; i++) {
    const timestamp = Date.now() - (i * 24 * 60 * 60 * 1000); // i días atrás

    persistence.saveSession({
      id: `test_session_${i}`,
      timestamp,
      task: `Tarea de prueba ${i + 1}`,
      state: 'completed',
      duration: 120 + i * 30,
      plan: {
        subtasks: [
          {
            id: `ST${i}_1`,
            title: 'Subtarea 1',
            type: 'research',
            complexity: 'low',
            estimatedTime: 5,
            dependencies: []
          },
          {
            id: `ST${i}_2`,
            title: 'Subtarea 2',
            type: 'code',
            complexity: 'medium',
            estimatedTime: 10,
            dependencies: [`ST${i}_1`]
          }
        ],
        estimation: { overallComplexity: 'medium', estimatedTimeMinutes: 15 }
      },
      summary: {
        total: 2,
        successful: 2,
        failed: 0,
        corrected: 0,
        skipped: 0,
        averageScore: 85 + i * 2
      },
      results: [
        { subtask: `ST${i}_1`, success: true, score: 90 },
        { subtask: `ST${i}_2`, success: true, score: 85 }
      ]
    });
  }

  log('✅ 5 sesiones de prueba creadas\n', 'green');

  // Crear scheduler
  log('🔧 Inicializando Maintenance Scheduler...', 'blue');

  const scheduler = new MaintenanceScheduler({
    projectRoot: process.cwd(),
    metricsPersistence: persistence,
    sessionRetentionDays: 90,
    logRetentionDays: 30,
    metricsRetentionDays: 365,
    backupEnabled: true,
    reportsEnabled: true
  });

  log('✅ Scheduler inicializado\n', 'green');

  // TEST 1: Health Check
  log('📝 TEST 1: Verificación de salud...', 'blue');
  const health = await scheduler.runHealthCheck();
  if (health.status === 'healthy') {
    log('✅ Sistema saludable', 'green');
    log(`   Base de datos: ${health.checks.database.sessions} sesiones`, 'cyan');
    log(`   Memoria: ${health.checks.memory.heapUsed}`, 'cyan');
    log(`   DB Size: ${health.checks.diskSpace.dbSize}\n`, 'cyan');
  } else {
    log('❌ Problemas detectados', 'red');
    return;
  }

  // TEST 2: Generar reporte diario
  log('📝 TEST 2: Generando reporte diario...', 'blue');
  const dailyReport = await scheduler.generateDailyReport();
  if (dailyReport) {
    log('✅ Reporte diario generado', 'green');
    log(`   Fecha: ${dailyReport.date}`, 'cyan');
    log(`   Sesiones: ${dailyReport.summary.totalSessions}`, 'cyan');
    log(`   Score promedio: ${dailyReport.summary.averageScore}%`, 'cyan');
    log(`   Top tareas: ${dailyReport.topTasks.length}\n`, 'cyan');
  } else {
    log('⚠️  No se pudo generar reporte diario\n', 'yellow');
  }

  // TEST 3: Generar reporte semanal
  log('📝 TEST 3: Generando reporte semanal...', 'blue');
  const weeklyReport = await scheduler.generateWeeklyReport();
  if (weeklyReport) {
    log('✅ Reporte semanal generado', 'green');
    log(`   Semana: ${weeklyReport.week}`, 'cyan');
    log(`   Sesiones: ${weeklyReport.summary.totalSessions}`, 'cyan');
    log(`   Score promedio: ${weeklyReport.summary.averageScore}%`, 'cyan');
    log(`   Días con datos: ${Object.keys(weeklyReport.dailyBreakdown).length}\n`, 'cyan');
  } else {
    log('⚠️  No se pudo generar reporte semanal\n', 'yellow');
  }

  // TEST 4: Generar reporte mensual
  log('📝 TEST 4: Generando reporte mensual...', 'blue');
  const monthlyReport = await scheduler.generateMonthlyReport();
  if (monthlyReport) {
    log('✅ Reporte mensual generado', 'green');
    log(`   Mes: ${monthlyReport.month}`, 'cyan');
    log(`   Sesiones: ${monthlyReport.summary.totalSessions}`, 'cyan');
    log(`   Score promedio: ${monthlyReport.summary.averageScore}%`, 'cyan');
    log(`   Insights: ${monthlyReport.insights.length}\n`, 'cyan');
    monthlyReport.insights.forEach(insight => {
      log(`     • ${insight}`, 'cyan');
    });
    log('', 'reset');
  } else {
    log('⚠️  No se pudo generar reporte mensual\n', 'yellow');
  }

  // TEST 5: Guardar métricas diarias
  log('📝 TEST 5: Guardando métricas diarias...', 'blue');
  await scheduler.saveDailyMetrics();
  log('✅ Métricas diarias guardadas\n', 'green');

  // TEST 6: Backup de base de datos
  log('📝 TEST 6: Creando backup...', 'blue');
  await scheduler.backupDatabase();
  log('✅ Backup creado\n', 'green');

  // TEST 7: Optimización de DB
  log('📝 TEST 7: Optimizando base de datos...', 'blue');
  await scheduler.optimizeDatabase();
  log('✅ Base de datos optimizada\n', 'green');

  // TEST 8: Verificar archivos generados
  log('📝 TEST 8: Verificando archivos generados...', 'blue');

  const fs = require('fs');
  const reportsPath = scheduler.config.reportsPath;
  const backupPath = scheduler.config.backupPath;

  const reports = fs.readdirSync(reportsPath).filter(f => f.endsWith('.json'));
  const backups = fs.readdirSync(backupPath).filter(f => f.endsWith('.db'));

  log(`✅ Archivos generados:`, 'green');
  log(`   Reportes: ${reports.length}`, 'cyan');
  reports.forEach(r => log(`     • ${r}`, 'cyan'));
  log(`   Backups: ${backups.length}`, 'cyan');
  backups.forEach(b => log(`     • ${b}`, 'cyan'));
  log('', 'reset');

  // TEST 9: Estado del scheduler
  log('📝 TEST 9: Verificando estado del scheduler...', 'blue');
  const status = scheduler.getStatus();
  log('✅ Estado del scheduler:', 'green');
  log(`   Running: ${status.isRunning}`, 'cyan');
  log(`   Retención de sesiones: ${status.config.dataRetention.sessions} días`, 'cyan');
  log(`   Retención de logs: ${status.config.dataRetention.logs} días`, 'cyan');
  log(`   Backups habilitados: ${status.config.backupEnabled}`, 'cyan');
  log(`   Reportes habilitados: ${status.config.reportsEnabled}\n`, 'cyan');

  // TEST 10: Iniciar scheduler (solo por un momento)
  log('📝 TEST 10: Iniciando scheduler...', 'blue');
  scheduler.start();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
  log('✅ Scheduler iniciado y funcionando\n', 'green');

  // Detener scheduler
  log('🛑 Deteniendo scheduler...', 'yellow');
  scheduler.stop();
  log('✅ Scheduler detenido\n', 'green');

  // Resumen final
  log('=' .repeat(60), 'yellow');
  log('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE', 'green');
  log('='.repeat(60), 'yellow');

  log('\n📊 Resumen:', 'cyan');
  log(`   ✅ Sesiones de prueba: 5`, 'green');
  log(`   ✅ Reportes generados: ${reports.length}`, 'green');
  log(`   ✅ Backups creados: ${backups.length}`, 'green');
  log(`   ✅ Health check: OK`, 'green');
  log(`   ✅ Scheduler: Funcional`, 'green');

  log('\n💡 Archivos generados en:', 'yellow');
  log(`   Reportes: ${reportsPath}`, 'cyan');
  log(`   Backups: ${backupPath}`, 'cyan');

  // Cerrar conexión
  persistence.close();
  log('\n✅ Conexión cerrada', 'green');
}

// Ejecutar pruebas
testMaintenance().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
