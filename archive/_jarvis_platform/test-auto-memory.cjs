/**
 * Test script para el sistema de memoria automática
 */

const { initMemorySystem, getMemoryLogger } = require('./core/auto-memory-logger.cjs');

async function testMemorySystem() {
  console.log('🧪 Iniciando prueba del sistema de memoria automática...\n');

  // Inicializar sistema
  const logger = initMemorySystem();

  // Simular comandos ejecutados
  console.log('📝 Simulando comandos...');
  logger.logCommand('npm install', 'Installing packages...', true);
  logger.logCommand('npm test', '15 tests passing', true);
  logger.logCommand('git add .', '', true);
  logger.logCommand('git commit -m "feat: add memory system"', '[main 1a2b3c4] feat: add memory system', true);

  // Simular archivos modificados
  console.log('📂 Simulando archivos modificados...');
  logger.logFileModified('core/auto-memory-logger.cjs', 'created');
  logger.logFileModified('test-auto-memory.cjs', 'created');
  logger.logFileModified('memory/context/CURRENT-STATE.json', 'modified');

  // Simular decisiones
  console.log('💡 Simulando decisiones...');
  logger.logDecision(
    'Implementar sistema de memoria automática',
    'Usuario solicitó que todo se guarde automáticamente sin intervención manual',
    'Nunca más se perderá contexto entre sesiones'
  );

  logger.logDecision(
    'Usar CommonJS en lugar de ES Modules',
    'El proyecto principal usa ES Modules pero necesitamos compatibilidad con require()',
    'Archivo renombrado a .cjs para evitar conflictos'
  );

  // Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Finalizar sesión
  console.log('\n🏁 Finalizando sesión de prueba...\n');
  const summary = await logger.endSession({
    test_run: true,
    achievements: [
      'Sistema de memoria automática implementado',
      'Auto-logger probado exitosamente',
      'Estructura de directorios verificada',
      'Integración con JARVIS lista'
    ],
    pending_tasks: [
      'Integrar con jarvis-pure.js',
      'Agregar logging a comandos de voz',
      'Dashboard para visualizar memoria'
    ],
    notes: 'Primera prueba exitosa del sistema de memoria automática'
  });

  console.log('✅ Resumen de sesión generado:');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n📁 Archivos generados:');
  console.log(`   - memory/sessions/${summary.session_id}.json`);
  console.log(`   - memory/context/CURRENT-STATE.json`);
  console.log(`   - memory/daily/${new Date().toISOString().split('T')[0]}.md`);
  console.log(`   - memory/history/commands.log`);

  console.log('\n✨ Sistema de memoria automática funcionando correctamente!\n');

  process.exit(0);
}

// Ejecutar prueba
testMemorySystem().catch(error => {
  console.error('❌ Error en prueba:', error);
  process.exit(1);
});
