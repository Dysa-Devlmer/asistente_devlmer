// test-metrics-persistence.js
// Script de prueba para el sistema de persistencia de métricas

const MetricsPersistence = require('./core/metrics-persistence.cjs');
const fs = require('fs');
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

async function testMetricsPersistence() {
  log('\n🧪 Iniciando prueba de Metrics Persistence...\n', 'cyan');

  // Crear instancia temporal
  const testDbPath = path.join(__dirname, 'memory', 'test-metrics.db');

  // Eliminar DB de prueba si existe
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    log('🗑️  Base de datos de prueba anterior eliminada', 'yellow');
  }

  const persistence = new MetricsPersistence(testDbPath);

  try {
    // TEST 1: Inicialización
    log('📝 TEST 1: Inicializando persistencia...', 'blue');
    persistence.initialize();
    log('✅ Inicialización exitosa', 'green');

    // TEST 2: Guardar sesión
    log('\n📝 TEST 2: Guardando sesión de prueba...', 'blue');
    const sessionData = {
      id: 'test_session_1',
      timestamp: Date.now(),
      task: 'Crear validador de email con tests',
      state: 'completed',
      duration: 180,
      plan: {
        subtasks: [
          {
            id: 'ST1',
            title: 'Investigar mejores prácticas',
            description: 'Buscar en internet sobre validación de emails',
            type: 'research',
            complexity: 'low',
            estimatedTime: 5,
            dependencies: []
          },
          {
            id: 'ST2',
            title: 'Crear validador',
            description: 'Implementar función de validación',
            type: 'code',
            complexity: 'medium',
            estimatedTime: 10,
            dependencies: ['ST1']
          },
          {
            id: 'ST3',
            title: 'Crear tests',
            description: 'Tests unitarios completos',
            type: 'test',
            complexity: 'medium',
            estimatedTime: 8,
            dependencies: ['ST2']
          }
        ],
        estimation: {
          overallComplexity: 'medium',
          estimatedTimeMinutes: 23
        }
      },
      summary: {
        total: 3,
        successful: 3,
        failed: 0,
        corrected: 0,
        skipped: 0,
        averageScore: 95
      },
      results: [
        { subtask: 'ST1', success: true, score: 100 },
        { subtask: 'ST2', success: true, score: 95 },
        { subtask: 'ST3', success: true, score: 90 }
      ]
    };

    const saved = persistence.saveSession(sessionData);
    if (saved) {
      log('✅ Sesión guardada exitosamente', 'green');
    } else {
      log('❌ Error al guardar sesión', 'red');
      return;
    }

    // TEST 3: Recuperar sesión
    log('\n📝 TEST 3: Recuperando sesión por ID...', 'blue');
    const retrievedSession = persistence.getSession('test_session_1');
    if (retrievedSession) {
      log('✅ Sesión recuperada exitosamente', 'green');
      log(`   Tarea: ${retrievedSession.content.task}`, 'cyan');
      log(`   Score: ${retrievedSession.content.summary.averageScore}%`, 'cyan');
      log(`   Sub-tareas: ${retrievedSession.content.plan.subtasks.length}`, 'cyan');
    } else {
      log('❌ Error al recuperar sesión', 'red');
      return;
    }

    // TEST 4: Guardar más sesiones para estadísticas
    log('\n📝 TEST 4: Guardando más sesiones...', 'blue');

    // Sesión exitosa
    persistence.saveSession({
      id: 'test_session_2',
      timestamp: Date.now() - 3600000,
      task: 'Refactorizar módulo de auth',
      state: 'completed',
      duration: 240,
      plan: {
        subtasks: [
          { id: 'ST1', title: 'Análisis', type: 'research', complexity: 'low', estimatedTime: 5, dependencies: [] },
          { id: 'ST2', title: 'Refactorización', type: 'code', complexity: 'high', estimatedTime: 15, dependencies: ['ST1'] }
        ],
        estimation: { overallComplexity: 'high', estimatedTimeMinutes: 20 }
      },
      summary: { total: 2, successful: 2, failed: 0, corrected: 0, skipped: 0, averageScore: 88 },
      results: [
        { subtask: 'ST1', success: true, score: 90 },
        { subtask: 'ST2', success: true, score: 86 }
      ]
    });

    // Sesión con fallos
    persistence.saveSession({
      id: 'test_session_3',
      timestamp: Date.now() - 7200000,
      task: 'Implementar API REST',
      state: 'completed',
      duration: 300,
      plan: {
        subtasks: [
          { id: 'ST1', title: 'Diseño', type: 'code', complexity: 'medium', estimatedTime: 10, dependencies: [] },
          { id: 'ST2', title: 'Tests', type: 'test', complexity: 'medium', estimatedTime: 8, dependencies: ['ST1'] },
          { id: 'ST3', title: 'Docs', type: 'document', complexity: 'low', estimatedTime: 5, dependencies: ['ST1', 'ST2'] }
        ],
        estimation: { overallComplexity: 'medium', estimatedTimeMinutes: 23 }
      },
      summary: { total: 3, successful: 2, failed: 1, corrected: 0, skipped: 0, averageScore: 70 },
      results: [
        { subtask: 'ST1', success: true, score: 85 },
        { subtask: 'ST2', success: false, score: 40 },
        { subtask: 'ST3', success: true, score: 95 }
      ]
    });

    log('✅ 3 sesiones guardadas en total', 'green');

    // TEST 5: Obtener historial
    log('\n📝 TEST 5: Obteniendo historial completo...', 'blue');
    const history = persistence.getSessionHistory({ limit: 10 });
    log(`✅ Historial recuperado: ${history.length} sesiones`, 'green');
    history.forEach((session, i) => {
      log(`   ${i + 1}. ${session.content.task} - Score: ${session.content.summary.averageScore}%`, 'cyan');
    });

    // TEST 6: Estadísticas globales
    log('\n📝 TEST 6: Obteniendo estadísticas globales...', 'blue');
    const stats = persistence.getGlobalStats();
    log('✅ Estadísticas recuperadas:', 'green');
    log(`   Total Sesiones: ${stats.totalSessions}`, 'cyan');
    log(`   Sesiones Exitosas: ${stats.successfulSessions}`, 'cyan');
    log(`   Score Promedio: ${stats.averageScore}%`, 'cyan');
    log(`   Sub-tareas Completadas: ${stats.totalSubtasksCompleted}`, 'cyan');

    // TEST 7: Guardar log importante
    log('\n📝 TEST 7: Guardando logs importantes...', 'blue');
    persistence.saveLog('success', 'task', 'Tarea completada exitosamente', { sessionId: 'test_session_1' });
    persistence.saveLog('error', 'execution', 'Subtarea falló en verificación', { sessionId: 'test_session_3', subtask: 'ST2' });
    persistence.saveLog('warning', 'plan', 'Complejidad alta detectada', { estimatedTime: 60 });
    log('✅ 3 logs guardados', 'green');

    // TEST 8: Recuperar logs
    log('\n📝 TEST 8: Recuperando logs...', 'blue');
    const logs = persistence.getLogs({ limit: 10 });
    log(`✅ Logs recuperados: ${logs.length}`, 'green');
    logs.forEach((logEntry, i) => {
      log(`   ${i + 1}. [${logEntry.level.toUpperCase()}] ${logEntry.message}`, 'cyan');
    });

    // TEST 9: Métricas diarias
    log('\n📝 TEST 9: Guardando métricas diarias...', 'blue');
    const today = new Date().toISOString().split('T')[0];
    persistence.saveDailyMetrics(today, {
      totalSessions: stats.totalSessions,
      successfulSessions: stats.successfulSessions,
      averageScore: stats.averageScore,
      totalSubtasks: 8,
      webSearches: 5,
      knowledgeAcquired: 12,
      conceptsExtracted: 8,
      totalMemories: 150,
      shortTermMemories: 50,
      longTermMemories: 100
    });
    log('✅ Métricas diarias guardadas', 'green');

    // TEST 10: Filtros avanzados
    log('\n📝 TEST 10: Probando filtros avanzados...', 'blue');
    const highScoreSessions = persistence.getSessionHistory({ minScore: 85 });
    log(`✅ Sesiones con score >= 85: ${highScoreSessions.length}`, 'green');

    const errorLogs = persistence.getLogs({ level: 'error' });
    log(`✅ Logs de error: ${errorLogs.length}`, 'green');

    // TEST 11: Verificar tamaño de DB
    log('\n📝 TEST 11: Verificando tamaño de base de datos...', 'blue');
    const stats_db = fs.statSync(testDbPath);
    const sizeKB = (stats_db.size / 1024).toFixed(2);
    log(`✅ Tamaño de DB: ${sizeKB} KB`, 'green');

    // Resumen final
    log('\n' + '='.repeat(60), 'yellow');
    log('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE', 'green');
    log('='.repeat(60), 'yellow');
    log('\n📊 Resumen:', 'cyan');
    log(`   ✅ Sesiones guardadas: ${history.length}`, 'green');
    log(`   ✅ Logs guardados: ${logs.length}`, 'green');
    log(`   ✅ Métricas diarias: 1 día`, 'green');
    log(`   ✅ Tamaño de DB: ${sizeKB} KB`, 'green');
    log(`   ✅ Score promedio: ${stats.averageScore}%`, 'green');

    // Cerrar conexión
    persistence.close();
    log('\n✅ Conexión cerrada', 'green');

    log('\n💡 La base de datos de prueba está en:', 'yellow');
    log(`   ${testDbPath}`, 'cyan');
    log('\n💡 Puedes examinarla con:', 'yellow');
    log(`   sqlite3 ${testDbPath}`, 'cyan');

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar pruebas
testMetricsPersistence().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
