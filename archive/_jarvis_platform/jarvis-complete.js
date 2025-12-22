#!/usr/bin/env node
// jarvis-complete.js
// JARVIS - Sistema Completo Integrado con todas las capacidades

const AutonomousAgentManager = require('./core/autonomous-agent/autonomous-agent-manager.cjs');
const ProactiveAgent = require('./core/proactive/proactive-agent.cjs');
const LearningCoordinator = require('./core/learning/learning-coordinator.cjs');
const readline = require('readline');
const chalk = require('chalk');

/**
 * JARVIS Complete - El sistema completo integrado
 */
class JARVISComplete {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();

    // Componentes principales
    this.autonomousAgent = new AutonomousAgentManager({
      projectRoot: this.projectRoot
    });

    this.proactiveAgent = new ProactiveAgent({
      projectRoot: this.projectRoot,
      watchEnabled: options.watchEnabled !== false
    });

    this.learningCoordinator = new LearningCoordinator({
      projectRoot: this.projectRoot
    });

    // Estado
    this.isRunning = false;
    this.mode = 'interactive'; // interactive, autonomous, proactive

    // Interface readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('JARVIS> ')
    });

    this.setupEventHandlers();
  }

  /**
   * Inicializa JARVIS completo
   */
  async initialize() {
    console.log(chalk.blue.bold('\n🤖 ═══════════════════════════════════════════════════════'));
    console.log(chalk.blue.bold('   JARVIS - Just A Rather Very Intelligent System'));
    console.log(chalk.blue.bold('   Sistema Completo v2.0'));
    console.log(chalk.blue.bold('═══════════════════════════════════════════════════════\n'));

    console.log(chalk.yellow('⚡ Inicializando sistemas...\n'));

    // Inicializar componentes
    console.log(chalk.gray('  [1/3] Autonomous Agent System...'));
    await this.autonomousAgent.initialize();

    console.log(chalk.gray('  [2/3] Proactive Monitoring System...'));
    await this.proactiveAgent.initialize();

    console.log(chalk.gray('  [3/3] Learning System...'));
    await this.learningCoordinator.initialize();

    console.log(chalk.green('\n✅ Todos los sistemas listos!\n'));

    this.showWelcomeMessage();
    this.isRunning = true;
  }

  /**
   * Muestra mensaje de bienvenida
   */
  showWelcomeMessage() {
    console.log(chalk.cyan('════════════════════════════════════════════════════════'));
    console.log(chalk.white.bold('\n💡 Capacidades de JARVIS:\n'));
    console.log(chalk.white('  🤖 Autonomous Mode    - Ejecuta tareas complejas autónomamente'));
    console.log(chalk.white('  👁️  Proactive Mode     - Monitorea código en tiempo real'));
    console.log(chalk.white('  🧠 Learning Mode      - Aprende de cada interacción'));
    console.log(chalk.white('  🌐 Web Intelligence   - Busca y aprende de internet'));
    console.log(chalk.white('  💾 Neural Memory      - Memoria permanente perfecta'));
    console.log(chalk.white('  🔧 Auto-Fix           - Corrige errores automáticamente'));
    console.log(chalk.white('  📊 Analytics          - Estadísticas y métricas'));

    console.log(chalk.cyan('\n════════════════════════════════════════════════════════'));
    console.log(chalk.yellow.bold('\n📝 Comandos disponibles:\n'));
    console.log(chalk.white('  help              - Muestra ayuda completa'));
    console.log(chalk.white('  autonomous <task> - Ejecuta tarea autónomamente'));
    console.log(chalk.white('  proactive start   - Inicia monitoreo proactivo'));
    console.log(chalk.white('  proactive stop    - Detiene monitoreo'));
    console.log(chalk.white('  learn <topic>     - Aprende sobre un tema'));
    console.log(chalk.white('  query <question>  - Pregunta sobre conocimiento adquirido'));
    console.log(chalk.white('  stats             - Muestra estadísticas globales'));
    console.log(chalk.white('  memory <query>    - Busca en memoria'));
    console.log(chalk.white('  status            - Estado de todos los sistemas'));
    console.log(chalk.white('  clear             - Limpia pantalla'));
    console.log(chalk.white('  exit              - Salir de JARVIS'));

    console.log(chalk.cyan('\n════════════════════════════════════════════════════════\n'));
  }

  /**
   * Inicia interfaz interactiva
   */
  async startInteractive() {
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        this.rl.prompt();
        return;
      }

      await this.handleCommand(input);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      this.shutdown();
    });
  }

  /**
   * Maneja comandos del usuario
   */
  async handleCommand(input) {
    const [command, ...args] = input.split(' ');
    const fullArgs = args.join(' ');

    try {
      switch (command.toLowerCase()) {
        case 'help':
          this.showWelcomeMessage();
          break;

        case 'autonomous':
          if (!fullArgs) {
            console.log(chalk.red('❌ Uso: autonomous <descripción de la tarea>'));
            break;
          }
          await this.executeAutonomousTask(fullArgs);
          break;

        case 'proactive':
          await this.handleProactiveCommand(args[0]);
          break;

        case 'learn':
          if (!fullArgs) {
            console.log(chalk.red('❌ Uso: learn <tema>'));
            break;
          }
          await this.learnAbout(fullArgs);
          break;

        case 'query':
          if (!fullArgs) {
            console.log(chalk.red('❌ Uso: query <pregunta>'));
            break;
          }
          await this.queryKnowledge(fullArgs);
          break;

        case 'stats':
          await this.showStats();
          break;

        case 'memory':
          if (!fullArgs) {
            console.log(chalk.red('❌ Uso: memory <búsqueda>'));
            break;
          }
          await this.searchMemory(fullArgs);
          break;

        case 'status':
          this.showStatus();
          break;

        case 'clear':
          console.clear();
          this.showWelcomeMessage();
          break;

        case 'exit':
        case 'quit':
          this.rl.close();
          break;

        default:
          console.log(chalk.red(`❌ Comando desconocido: ${command}`));
          console.log(chalk.yellow('💡 Escribe "help" para ver comandos disponibles'));
      }
    } catch (error) {
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
  }

  /**
   * Ejecuta tarea autónoma
   */
  async executeAutonomousTask(taskDescription) {
    console.log(chalk.blue.bold(`\n🤖 Iniciando modo autónomo...\n`));
    console.log(chalk.white(`📋 Tarea: ${taskDescription}\n`));

    const startTime = Date.now();

    const result = await this.autonomousAgent.executeTask(taskDescription, {
      projectName: 'JARVIS',
      language: 'javascript'
    });

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (result.success) {
      console.log(chalk.green.bold(`\n✅ ¡TAREA COMPLETADA EXITOSAMENTE!\n`));
      console.log(chalk.white(`⏱️  Duración: ${duration}s`));
      console.log(chalk.white(`📊 Resultados:`));
      console.log(chalk.white(`   • Sub-tareas: ${result.summary.total}`));
      console.log(chalk.white(`   • Exitosas: ${result.summary.successful}`));
      console.log(chalk.white(`   • Fallidas: ${result.summary.failed}`));
      console.log(chalk.white(`   • Corregidas: ${result.summary.corrected}`));
      console.log(chalk.white(`   • Score: ${result.summary.averageScore}%\n`));
    } else {
      console.log(chalk.red.bold(`\n❌ Tarea falló\n`));
      console.log(chalk.red(`Error: ${result.error}\n`));
    }
  }

  /**
   * Maneja comandos de proactive
   */
  async handleProactiveCommand(action) {
    switch (action?.toLowerCase()) {
      case 'start':
        this.proactiveAgent.start();
        console.log(chalk.green('✅ Monitoreo proactivo iniciado\n'));
        break;

      case 'stop':
        this.proactiveAgent.stop();
        console.log(chalk.yellow('⏸️  Monitoreo proactivo detenido\n'));
        break;

      case 'status':
        const isRunning = this.proactiveAgent.watcher?.isWatching || false;
        console.log(chalk.white(`\n👁️  Proactive Mode: ${isRunning ? chalk.green('Activo') : chalk.gray('Inactivo')}\n`));
        break;

      default:
        console.log(chalk.red('❌ Uso: proactive [start|stop|status]'));
    }
  }

  /**
   * Aprende sobre un tema
   */
  async learnAbout(topic) {
    console.log(chalk.blue(`\n🎓 Aprendiendo sobre: "${topic}"...\n`));

    const result = await this.autonomousAgent.webIntelligence.learnAbout(topic);

    if (result.success) {
      console.log(chalk.green(`✅ Aprendizaje completado!\n`));
      console.log(chalk.white(`📚 Conocimientos adquiridos: ${result.knowledgeCount}`));
      console.log(chalk.white(`📊 Conceptos: ${result.summary.totalConcepts}`));
      console.log(chalk.white(`🔑 Key points: ${result.summary.totalKeyPoints}`));
      console.log(chalk.white(`⭐ Confianza promedio: ${result.summary.avgConfidence}\n`));
    } else {
      console.log(chalk.red(`❌ No pude aprender sobre ese tema\n`));
    }
  }

  /**
   * Consulta conocimiento adquirido
   */
  async queryKnowledge(question) {
    console.log(chalk.blue(`\n❓ Consultando: "${question}"...\n`));

    const result = await this.autonomousAgent.webIntelligence.query(question);

    if (result.success) {
      console.log(chalk.green(`💡 Respuesta:\n`));
      console.log(chalk.white(`${result.answer}\n`));
      console.log(chalk.gray(`📚 Fuentes consultadas: ${result.sources}\n`));
    } else {
      console.log(chalk.red(`❌ No tengo información sobre eso\n`));
    }
  }

  /**
   * Muestra estadísticas globales
   */
  async showStats() {
    console.log(chalk.blue.bold(`\n📊 ESTADÍSTICAS GLOBALES DE JARVIS\n`));

    const stats = await this.autonomousAgent.getStats();

    console.log(chalk.white('🤖 Autonomous Agent:'));
    console.log(chalk.white(`   • Sesiones totales: ${stats.totalSessions}`));
    console.log(chalk.white(`   • Sesiones exitosas: ${stats.successfulSessions}`));
    console.log(chalk.white(`   • Tasa de fallo: ${stats.failureRate}%`));
    console.log(chalk.white(`   • Score promedio: ${stats.averageScore}%`));
    console.log(chalk.white(`   • Sub-tareas completadas: ${stats.totalSubtasksCompleted}\n`));

    console.log(chalk.white('🌐 Web Intelligence:'));
    console.log(chalk.white(`   • Búsquedas totales: ${stats.webIntelligenceStats.totalSearches}`));
    console.log(chalk.white(`   • Conocimientos: ${stats.webIntelligenceStats.totalKnowledge}`));
    console.log(chalk.white(`   • Conceptos: ${stats.webIntelligenceStats.totalConcepts}\n`));

    console.log(chalk.white('💾 Neural Memory:'));
    const memStats = stats.memoryStats;
    console.log(chalk.white(`   • Memorias totales: ${memStats.totalMemories}`));
    console.log(chalk.white(`   • Corto plazo: ${memStats.shortTermCount}`));
    console.log(chalk.white(`   • Largo plazo: ${memStats.longTermCount}`));
    console.log(chalk.white(`   • Episódica: ${memStats.episodicCount}\n`));

    const learningStats = await this.learningCoordinator.getAnalytics();
    console.log(chalk.white('🧠 Learning System:'));
    console.log(chalk.white(`   • Patrones aprendidos: ${learningStats.totalPatterns}`));
    console.log(chalk.white(`   • Fixes exitosos: ${learningStats.totalSuccessfulFixes}`));
    console.log(chalk.white(`   • Tasa de éxito: ${learningStats.successRate}%\n`));
  }

  /**
   * Busca en memoria
   */
  async searchMemory(query) {
    console.log(chalk.blue(`\n🔍 Buscando en memoria: "${query}"...\n`));

    const memories = await this.autonomousAgent.memoryManager.recall(query, 5);

    if (memories.length === 0) {
      console.log(chalk.yellow('⚠️  No encontré nada relacionado\n'));
      return;
    }

    console.log(chalk.green(`✅ Encontré ${memories.length} memorias:\n`));

    memories.forEach((memory, i) => {
      console.log(chalk.white(`${i + 1}. [${memory.type}] ${memory.metadata?.query || 'Sin título'}`));
      console.log(chalk.gray(`   Relevancia: ${(memory.relevance * 100).toFixed(0)}%`));
      console.log(chalk.gray(`   Importancia: ${(memory.importance * 100).toFixed(0)}%\n`));
    });
  }

  /**
   * Muestra estado de sistemas
   */
  showStatus() {
    console.log(chalk.blue.bold(`\n📡 ESTADO DE SISTEMAS\n`));

    const agentState = this.autonomousAgent.getState();

    console.log(chalk.white(`🤖 Autonomous Agent: ${this.getStateColor(agentState.state)}`));
    if (agentState.progress) {
      console.log(chalk.white(`   Progreso: ${agentState.progress.current}/${agentState.progress.total} (${agentState.progress.percentage}%)`));
    }

    const proactiveStatus = this.proactiveAgent.watcher?.isWatching ? 'Activo' : 'Inactivo';
    console.log(chalk.white(`👁️  Proactive Mode: ${proactiveStatus === 'Activo' ? chalk.green(proactiveStatus) : chalk.gray(proactiveStatus)}`));

    console.log(chalk.white(`🧠 Learning System: ${chalk.green('Activo')}`));
    console.log(chalk.white(`💾 Neural Memory: ${chalk.green('Activo')}`));
    console.log(chalk.white(`🌐 Web Intelligence: ${chalk.green('Activo')}\n`));
  }

  /**
   * Obtiene color para estado
   */
  getStateColor(state) {
    switch (state) {
      case 'idle': return chalk.gray('Idle');
      case 'planning': return chalk.yellow('Planificando');
      case 'executing': return chalk.blue('Ejecutando');
      case 'verifying': return chalk.cyan('Verificando');
      case 'completed': return chalk.green('Completado');
      case 'failed': return chalk.red('Fallido');
      case 'paused': return chalk.yellow('Pausado');
      default: return chalk.white(state);
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Autonomous Agent events
    this.autonomousAgent.on('task:start', () => {
      // Silencioso, ya se muestra en executeAutonomousTask
    });

    this.autonomousAgent.on('subtask:success', (data) => {
      console.log(chalk.green(`  ✅ [${data.index}/${data.total}] Completada`));
    });

    this.autonomousAgent.on('subtask:failed', (data) => {
      console.log(chalk.red(`  ❌ [${data.index}/${data.total}] Fallida`));
    });

    // Proactive Agent events
    this.proactiveAgent.on('alert', (data) => {
      if (this.mode === 'interactive') {
        console.log(chalk.yellow(`\n⚠️  Alerta proactiva: ${data.file}`));
        console.log(chalk.yellow(`   ${data.issues.length} problema(s) detectado(s)\n`));
        this.rl.prompt();
      }
    });
  }

  /**
   * Cierra JARVIS
   */
  async shutdown() {
    console.log(chalk.yellow('\n👋 Cerrando JARVIS...\n'));

    if (this.proactiveAgent.watcher?.isWatching) {
      this.proactiveAgent.stop();
    }

    console.log(chalk.green('✅ JARVIS cerrado correctamente\n'));
    process.exit(0);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  const jarvis = new JARVISComplete({
    projectRoot: process.cwd(),
    watchEnabled: false // Por defecto off para evitar ruido
  });

  jarvis.initialize()
    .then(() => jarvis.startInteractive())
    .catch(error => {
      console.error(chalk.red(`\n💥 Error fatal: ${error.message}\n`));
      process.exit(1);
    });
}

module.exports = JARVISComplete;
