// test-autonomous-agent.js
// Script de prueba para JARVIS Autonomous Agent System

const AutonomousAgentManager = require('./core/autonomous-agent/autonomous-agent-manager.cjs');

async function test() {
  console.log('🤖 Iniciando test de JARVIS Autonomous Agent System...\n');

  const agent = new AutonomousAgentManager({
    projectRoot: __dirname
  });

  // Escuchar eventos para ver el progreso
  agent.on('task:planned', (data) => {
    console.log(`\n📋 Plan creado con ${data.subtaskCount} sub-tareas\n`);
  });

  agent.on('execution:start', (data) => {
    console.log(`\n▶️ Ejecutando: ${data.subtask.title}`);
  });

  agent.on('execution:complete', (data) => {
    console.log(`✅ Completada: ${data.subtask.title}`);
  });

  agent.on('verification:passed', (data) => {
    console.log(`✅ Verificación pasada (score: ${data.score}%)`);
  });

  agent.on('verification:failed', (data) => {
    console.log(`❌ Verificación fallida: ${data.issues.length} issues`);
  });

  agent.on('subtask:corrected', (data) => {
    console.log(`🔧 Sub-tarea corregida automáticamente`);
  });

  agent.on('task:complete', (data) => {
    console.log(`\n🎉 TAREA COMPLETADA!`);
    console.log(`   Duración: ${data.duration}s`);
    console.log(`   Exitosas: ${data.summary.successful}/${data.summary.total}`);
  });

  // Inicializar
  await agent.initialize();

  // TEST: Tarea compleja de ejemplo
  console.log('\n🎯 TEST: Crear un validador de email con tests y documentación\n');

  const result = await agent.executeTask(
    'Crear un validador de email con tests y documentación',
    {
      projectName: 'JARVIS',
      language: 'javascript',
      testFramework: 'jest'
    }
  );

  // Resultados
  console.log('\n📊 RESULTADOS FINALES:\n');
  console.log(`✅ Éxito: ${result.success}`);
  console.log(`📝 Sub-tareas: ${result.summary.total}`);
  console.log(`✅ Exitosas: ${result.summary.successful}`);
  console.log(`❌ Fallidas: ${result.summary.failed}`);
  console.log(`📊 Score promedio: ${result.summary.averageScore}%`);

  // Estadísticas globales
  console.log('\n📈 ESTADÍSTICAS GLOBALES:\n');
  const stats = await agent.getStats();
  console.log(`   Total sesiones: ${stats.totalSessions}`);
  console.log(`   Sesiones exitosas: ${stats.successfulSessions}`);
  console.log(`   Sub-tareas completadas: ${stats.totalSubtasksCompleted}`);
  console.log(`   Score promedio: ${stats.averageScore}%`);

  console.log('\n✅ Test completado!\n');
}

test().catch(error => {
  console.error('\n💥 Error en test:', error);
  process.exit(1);
});
