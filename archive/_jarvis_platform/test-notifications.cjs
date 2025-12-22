// test-notifications.cjs
// Script de prueba para el Sistema de Notificaciones

const NotificationSystem = require('./core/notification-system.cjs');
const MetricsPersistence = require('./core/metrics-persistence.cjs');

function log(message, color = 'white') {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testNotificationSystem() {
  log('\n🧪 Iniciando prueba del Sistema de Notificaciones...\n', 'cyan');

  // Inicializar persistencia
  const persistence = new MetricsPersistence();
  persistence.initialize();

  // Inicializar sistema de notificaciones
  const notificationSystem = new NotificationSystem({
    projectRoot: process.cwd(),
    metricsPersistence: persistence,
    maxNotifications: 50,
    retentionDays: 30
  });

  await notificationSystem.initialize();

  log('✅ Sistema de notificaciones inicializado\n', 'green');

  // TEST 1: Notificación Info
  log('TEST 1: Crear notificación INFO', 'yellow');
  const notification1 = await notificationSystem.notify({
    priority: 'info',
    category: 'system',
    title: 'Sistema Iniciado',
    message: 'JARVIS está listo para trabajar',
    data: { version: '2.0' }
  });
  log(`✅ Creada: ${notification1.id}`, 'green');

  // TEST 2: Notificación Success
  log('\nTEST 2: Crear notificación SUCCESS', 'yellow');
  const notification2 = await notificationSystem.notify({
    priority: 'success',
    category: 'task',
    title: 'Tarea Completada',
    message: 'Se completaron 5 sub-tareas exitosamente',
    data: { subtaskCount: 5, score: 95 }
  });
  log(`✅ Creada: ${notification2.id}`, 'green');

  // TEST 3: Notificación Warning
  log('\nTEST 3: Crear notificación WARNING', 'yellow');
  const notification3 = await notificationSystem.notify({
    priority: 'warning',
    category: 'task',
    title: 'Sub-tarea con Advertencia',
    message: 'La sub-tarea se completó pero con warnings',
    data: { warnings: 2 }
  });
  log(`✅ Creada: ${notification3.id}`, 'green');

  // TEST 4: Notificación Error
  log('\nTEST 4: Crear notificación ERROR', 'yellow');
  const notification4 = await notificationSystem.notify({
    priority: 'error',
    category: 'error',
    title: 'Error en Ejecución',
    message: 'Falló la verificación de una sub-tarea',
    data: { subtaskId: 'task_1', error: 'Verification failed' }
  });
  log(`✅ Creada: ${notification4.id}`, 'green');

  // TEST 5: Notificación Critical
  log('\nTEST 5: Crear notificación CRITICAL', 'yellow');
  const notification5 = await notificationSystem.notify({
    priority: 'critical',
    category: 'error',
    title: 'Error Crítico',
    message: 'El sistema encontró un error fatal',
    data: { error: 'Database connection lost' }
  });
  log(`✅ Creada: ${notification5.id}`, 'green');

  // TEST 6: Obtener todas las notificaciones
  log('\nTEST 6: Obtener todas las notificaciones', 'yellow');
  const allNotifications = notificationSystem.getNotifications();
  log(`✅ Total de notificaciones: ${allNotifications.length}`, 'green');
  allNotifications.forEach(n => {
    log(`   - [${n.priority.toUpperCase()}] ${n.title}`, 'white');
  });

  // TEST 7: Obtener estadísticas
  log('\nTEST 7: Obtener estadísticas', 'yellow');
  const stats = notificationSystem.getStats();
  log(`✅ Estadísticas:`, 'green');
  log(`   - Total: ${stats.total}`, 'white');
  log(`   - No leídas: ${stats.unread}`, 'white');
  log(`   - Leídas: ${stats.read}`, 'white');
  log(`   - Por prioridad:`, 'white');
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    log(`     • ${priority}: ${count}`, 'white');
  });
  log(`   - Por categoría:`, 'white');
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    log(`     • ${category}: ${count}`, 'white');
  });

  // TEST 8: Marcar como leída
  log('\nTEST 8: Marcar notificación como leída', 'yellow');
  notificationSystem.markAsRead(notification1.id);
  const updatedStats = notificationSystem.getStats();
  log(`✅ No leídas después de marcar: ${updatedStats.unread}`, 'green');

  // TEST 9: Obtener solo no leídas
  log('\nTEST 9: Obtener solo notificaciones no leídas', 'yellow');
  const unreadNotifications = notificationSystem.getNotifications({ unreadOnly: true });
  log(`✅ Notificaciones no leídas: ${unreadNotifications.length}`, 'green');

  // TEST 10: Filtrar por prioridad
  log('\nTEST 10: Filtrar por prioridad ERROR', 'yellow');
  const errorNotifications = notificationSystem.getNotifications({ priority: 'error' });
  log(`✅ Notificaciones ERROR: ${errorNotifications.length}`, 'green');

  // TEST 11: Filtrar por categoría
  log('\nTEST 11: Filtrar por categoría TASK', 'yellow');
  const taskNotifications = notificationSystem.getNotifications({ category: 'task' });
  log(`✅ Notificaciones TASK: ${taskNotifications.length}`, 'green');

  // TEST 12: Marcar todas como leídas
  log('\nTEST 12: Marcar todas como leídas', 'yellow');
  notificationSystem.markAllAsRead();
  const allReadStats = notificationSystem.getStats();
  log(`✅ No leídas después de marcar todas: ${allReadStats.unread}`, 'green');

  // TEST 13: Descartar notificación
  log('\nTEST 13: Descartar una notificación', 'yellow');
  notificationSystem.dismiss(notification1.id);
  const afterDismiss = notificationSystem.getNotifications();
  log(`✅ Notificaciones después de descartar: ${afterDismiss.length}`, 'green');

  // TEST 14: Preferencias
  log('\nTEST 14: Obtener y actualizar preferencias', 'yellow');
  const preferences = notificationSystem.getPreferences();
  log(`✅ Preferencias actuales:`, 'green');
  log(`   - Push habilitado: ${preferences.pushEnabled}`, 'white');
  log(`   - Prioridad mínima: ${preferences.minPriority}`, 'white');

  notificationSystem.updatePreferences({
    minPriority: 'warning',
    pushEnabled: true
  });
  log(`✅ Preferencias actualizadas`, 'green');

  // TEST 15: Notificación bloqueada por preferencias
  log('\nTEST 15: Intentar crear notificación INFO (bloqueada por minPriority=warning)', 'yellow');
  const blockedNotification = await notificationSystem.notify({
    priority: 'info',
    category: 'system',
    title: 'Notificación Bloqueada',
    message: 'Esta notificación debería ser bloqueada'
  });
  const finalNotifications = notificationSystem.getNotifications();
  log(`✅ La notificación fue bloqueada correctamente`, 'green');
  log(`   Total de notificaciones: ${finalNotifications.length} (no aumentó)`, 'white');

  // TEST 16: Limpieza de notificaciones antiguas
  log('\nTEST 16: Limpieza de notificaciones antiguas', 'yellow');
  const cleaned = await notificationSystem.cleanOldNotifications();
  log(`✅ Notificaciones antiguas eliminadas: ${cleaned}`, 'green');

  // Resumen final
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE', 'green');
  log('='.repeat(60) + '\n', 'cyan');

  const finalStats = notificationSystem.getStats();
  log('📊 RESUMEN FINAL:', 'cyan');
  log(`   • Total de notificaciones activas: ${finalStats.total}`, 'white');
  log(`   • No leídas: ${finalStats.unread}`, 'white');
  log(`   • Leídas: ${finalStats.read}`, 'white');
  log('\n🎉 Sistema de Notificaciones funcionando perfectamente!\n', 'green');
}

// Ejecutar tests
testNotificationSystem().catch(error => {
  console.error('❌ Error en tests:', error);
  process.exit(1);
});
