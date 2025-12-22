#!/usr/bin/env node
// jarvis-proactive.cjs
// JARVIS Proactive Mode - Asistente que monitorea y analiza tu código en tiempo real

const ProactiveAgent = require('./core/proactive/proactive-agent.cjs');
const path = require('path');
const colors = require('colors');

// Banner
console.log(colors.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🤖  J.A.R.V.I.S. PROACTIVE MODE  ⚡                ║
║                                                           ║
║   "Monitoring your code, Señor. Alerting on issues       ║
║    before you even notice them."                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

// Configuración
const config = {
  projectRoot: process.cwd(),
  enabled: true,
  autoAnalyze: true,
  notifyOnBugs: true,
  notifyOnSecurity: true,
  notifyOnPerformance: true,
  minSeverity: 'medium',
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:32b',
  ignorePaths: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/*.log',
    '**/memory/**',
    '**/web-interface/frontend/node_modules/**',
    '**/web-interface/frontend/dist/**'
  ]
};

console.log(colors.yellow('📋 Configuración:'));
console.log(colors.gray(`   Proyecto: ${config.projectRoot}`));
console.log(colors.gray(`   Modelo IA: ${config.model}`));
console.log(colors.gray(`   Auto-análisis: ${config.autoAnalyze ? 'Activado ✅' : 'Desactivado ❌'}`));
console.log(colors.gray(`   Severidad mínima: ${config.minSeverity}`));
console.log('');

// Crear agente
const agent = new ProactiveAgent(config);

// Event Listeners
agent.on('ready', (data) => {
  console.log(colors.green(`✅ Modo proactivo activo`));
  console.log(colors.gray(`   Monitoreando ${data.filesWatched} archivos\n`));
});

agent.on('file:changed', (data) => {
  const icon = data.hasErrors ? '⚠️' : '📝';
  const complexityColor = data.complexity === 'high' || data.complexity === 'very-high' ? 'red' : 'gray';

  console.log(`${icon} ${colors.cyan(data.path)} ${colors[complexityColor](`[${data.changeType}]`)}`);
});

agent.on('analysis:complete', (data) => {
  const totalIssues = data.analysis.bugs.length +
                      data.analysis.security.length +
                      data.analysis.performance.length;

  if (totalIssues > 0) {
    console.log(colors.yellow(`   🔍 Análisis: ${totalIssues} issues encontrados`));
  } else {
    console.log(colors.green(`   ✅ Análisis: Sin problemas detectados`));
  }
});

agent.on('notification', (notification) => {
  // Las notificaciones ya se imprimen formateadas en el agente
  // Este evento está disponible para integración con UI
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(colors.yellow('\n\n🛑 Deteniendo JARVIS Proactive Mode...'));

  const stats = agent.getStats();

  console.log(colors.cyan('\n📊 Estadísticas de la sesión:'));
  console.log(colors.gray(`   Archivos monitoreados: ${stats.filesMonitored}`));
  console.log(colors.gray(`   Cambios detectados: ${stats.changesDetected}`));
  console.log(colors.gray(`   Análisis realizados: ${stats.analysisPerformed}`));
  console.log(colors.gray(`   Issues encontrados: ${stats.issuesFound}`));
  console.log(colors.gray(`   Notificaciones enviadas: ${stats.notificationsSent}`));
  console.log(colors.gray(`   Uptime: ${Math.floor(stats.uptime / 1000)}s`));

  await agent.stop();

  console.log(colors.green('\n✅ JARVIS Proactive Mode detenido'));
  console.log(colors.cyan('   "Until next time, Señor."\n'));

  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error(colors.red('\n❌ Error crítico:'), error.message);
  console.error(colors.gray(error.stack));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red('\n❌ Promise rechazada:'), reason);
});

// Iniciar agente
(async () => {
  try {
    await agent.start();

    console.log(colors.green('🚀 JARVIS Proactive Mode ejecutándose...'));
    console.log(colors.gray('   Presiona Ctrl+C para detener\n'));

    // Mostrar stats cada 5 minutos
    setInterval(() => {
      const stats = agent.getStats();
      console.log(colors.cyan('\n📊 Stats:'),
        colors.gray(`${stats.changesDetected} cambios | ${stats.analysisPerformed} análisis | ${stats.issuesFound} issues\n`));
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error(colors.red('❌ Error iniciando modo proactivo:'), error.message);
    console.error(colors.gray(error.stack));
    process.exit(1);
  }
})();
