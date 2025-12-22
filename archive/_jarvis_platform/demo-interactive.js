#!/usr/bin/env node

/**
 * 🎭 JARVIS INTERACTIVE DEMO
 *
 * Demostración interactiva de todas las capacidades del sistema JARVIS
 * Muestra cada funcionalidad en acción con ejemplos en vivo
 */

import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const BACKEND_URL = 'http://localhost:7777';

class JarvisDemo {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Utilidad para esperar input del usuario
  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  // Esperar con animación
  async wait(ms, message = 'Procesando') {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        process.stdout.write(`\r${colors.cyan}${frames[i]} ${message}...${colors.reset}`);
        i = (i + 1) % frames.length;
      }, 80);

      setTimeout(() => {
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        resolve();
      }, ms);
    });
  }

  // Imprimir header estilizado
  printHeader(text) {
    const width = 70;
    const padding = Math.floor((width - text.length - 2) / 2);
    console.log('\n' + colors.cyan + '═'.repeat(width) + colors.reset);
    console.log(colors.cyan + '║' + ' '.repeat(padding) + colors.bright + text + ' '.repeat(width - text.length - padding - 2) + colors.cyan + '║' + colors.reset);
    console.log(colors.cyan + '═'.repeat(width) + colors.reset + '\n');
  }

  // Imprimir sección
  printSection(emoji, title) {
    console.log(`\n${colors.yellow}${emoji} ${colors.bright}${title}${colors.reset}`);
    console.log(colors.yellow + '─'.repeat(50) + colors.reset);
  }

  // Imprimir resultado exitoso
  printSuccess(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
  }

  // Imprimir información
  printInfo(message) {
    console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
  }

  // Imprimir datos
  printData(label, value) {
    console.log(`  ${colors.cyan}${label}:${colors.reset} ${value}`);
  }

  // Demo de inicio
  async demoIntro() {
    console.clear();
    this.printHeader('🤖 JARVIS MARK VII - INTERACTIVE DEMO');

    console.log(`${colors.magenta}"Good evening, sir. Welcome to the demonstration."${colors.reset}\n`);

    console.log('Este demo interactivo te mostrará todas las capacidades de JARVIS:');
    console.log('');
    console.log(`${colors.cyan}1.${colors.reset} 🧠 Sistemas de Inteligencia Artificial (4 sistemas)`);
    console.log(`${colors.cyan}2.${colors.reset} 🤖 Agente Autónomo y Modo Proactivo`);
    console.log(`${colors.cyan}3.${colors.reset} 🔍 Búsqueda Semántica de Código`);
    console.log(`${colors.cyan}4.${colors.reset} 📊 Monitoreo y Performance`);
    console.log(`${colors.cyan}5.${colors.reset} 🎤 Control por Voz (Web Interface)`);
    console.log(`${colors.cyan}6.${colors.reset} ⏰ Scheduler y Workflows`);
    console.log(`${colors.cyan}7.${colors.reset} 💾 Sistema de Memoria Neural`);
    console.log(`${colors.cyan}8.${colors.reset} 🔐 Seguridad y Autenticación`);
    console.log('');

    await this.prompt(`${colors.green}Presiona Enter para comenzar...${colors.reset}`);
  }

  // Demo 1: Sistemas de IA
  async demoAISystems() {
    this.printSection('🧠', 'DEMO 1: Sistemas de Inteligencia Artificial');

    console.log('JARVIS incluye 4 sistemas de IA trabajando en conjunto:\n');

    try {
      // 1. Self-Improvement System
      console.log(`${colors.yellow}1. Self-Improvement System${colors.reset}`);
      await this.wait(1000, 'Consultando sistema de auto-mejora');

      const statusResponse = await axios.get(`${BACKEND_URL}/api/ai/status`);
      const status = statusResponse.data;

      this.printSuccess('Sistema de Auto-Mejora activo');
      this.printData('Knowledge Entries', status.selfImprovement?.knowledgeSize || 0);
      this.printData('Experiences', status.selfImprovement?.experienceSize || 0);
      console.log('');

      // 2. Interacción con IA
      console.log(`${colors.yellow}2. Interacción Inteligente${colors.reset}`);
      await this.wait(1000, 'Enviando mensaje a JARVIS');

      const interactResponse = await axios.post(`${BACKEND_URL}/api/ai/interact`, {
        input: 'Hola JARVIS, ¿cómo estás?',
        context: { domain: 'greeting', demo: true }
      });

      this.printSuccess('Respuesta recibida');
      this.printData('Mensaje', interactResponse.data.response);
      this.printData('Recompensa', interactResponse.data.reward?.toFixed(2));
      console.log('');

      // 3. Patrones detectados
      console.log(`${colors.yellow}3. Análisis de Patrones${colors.reset}`);
      await this.wait(1000, 'Analizando patrones de usuario');

      const patternsResponse = await axios.get(`${BACKEND_URL}/api/ai/patterns`);
      const patterns = patternsResponse.data;

      this.printSuccess('Patrones analizados');
      this.printData('Patrones detectados', patterns.patterns?.length || 0);
      this.printData('Frecuencia promedio', patterns.patterns?.[0]?.frequency?.toFixed(2) || 'N/A');
      console.log('');

      // 4. Predicciones
      console.log(`${colors.yellow}4. Sistema Predictivo${colors.reset}`);
      await this.wait(1000, 'Generando predicciones');

      const predictionsResponse = await axios.get(`${BACKEND_URL}/api/ai/predictions`);
      const predictions = predictionsResponse.data;

      this.printSuccess('Predicciones generadas');
      this.printData('Próximas acciones', predictions.predictions?.nextActions?.length || 0);
      this.printData('Recursos preparados', predictions.predictions?.preparedResources?.length || 0);
      console.log('');

      // 5. Estadísticas globales
      console.log(`${colors.yellow}5. Estadísticas del Sistema${colors.reset}`);
      await this.wait(1000, 'Recopilando estadísticas');

      const statsResponse = await axios.get(`${BACKEND_URL}/api/ai/statistics`);
      const stats = statsResponse.data;

      this.printSuccess('Estadísticas recopiladas');
      this.printData('Total Interacciones', stats.totalInteractions || 0);
      this.printData('Accuracy', (stats.accuracy * 100 || 0).toFixed(1) + '%');
      this.printData('Recompensa Promedio', stats.averageReward?.toFixed(2) || 0);
      this.printData('Success Rate', (stats.successRate * 100 || 0).toFixed(1) + '%');

    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}  Asegúrate de que el backend esté corriendo en ${BACKEND_URL}${colors.reset}`);
    }

    await this.prompt(`\n${colors.green}Presiona Enter para continuar...${colors.reset}`);
  }

  // Demo 2: Autonomous Agent
  async demoAutonomousAgent() {
    this.printSection('🤖', 'DEMO 2: Agente Autónomo y Modo Proactivo');

    console.log('El Agente Autónomo puede ejecutar tareas sin supervisión:\n');

    try {
      console.log(`${colors.yellow}1. Estado del Agente Autónomo${colors.reset}`);
      await this.wait(1000, 'Consultando agente autónomo');

      const autonomousResponse = await axios.get(`${BACKEND_URL}/api/autonomous/status`);
      const autonomous = autonomousResponse.data;

      this.printSuccess('Agente Autónomo operacional');
      this.printData('Estado', autonomous.running ? '🟢 Activo' : '🔴 Inactivo');
      this.printData('Tareas Completadas', autonomous.stats?.tasksCompleted || 0);
      this.printData('Uptime', autonomous.uptime || 'N/A');
      console.log('');

      console.log(`${colors.yellow}2. Modo Proactivo${colors.reset}`);
      await this.wait(1000, 'Verificando modo proactivo');

      const proactiveResponse = await axios.get(`${BACKEND_URL}/api/proactive/status`);
      const proactive = proactiveResponse.data;

      this.printSuccess('Modo Proactivo activo');
      this.printData('Archivos Monitoreados', proactive.stats?.filesWatched?.toLocaleString() || 0);
      this.printData('Alertas Generadas', proactive.stats?.alertsGenerated || 0);
      console.log('');

      console.log(`${colors.yellow}3. Notificaciones Recientes${colors.reset}`);
      await this.wait(1000, 'Obteniendo notificaciones');

      const notificationsResponse = await axios.get(`${BACKEND_URL}/api/notifications`);
      const notifications = notificationsResponse.data;

      this.printSuccess(`${notifications.notifications?.length || 0} notificaciones encontradas`);

      if (notifications.notifications && notifications.notifications.length > 0) {
        const recent = notifications.notifications.slice(0, 3);
        recent.forEach((notif, i) => {
          console.log(`\n  ${i + 1}. ${notif.title}`);
          console.log(`     ${colors.cyan}${notif.message}${colors.reset}`);
        });
      }

    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }

    await this.prompt(`\n${colors.green}Presiona Enter para continuar...${colors.reset}`);
  }

  // Demo 3: Code Search
  async demoCodeSearch() {
    this.printSection('🔍', 'DEMO 3: Búsqueda Semántica de Código');

    console.log('JARVIS puede buscar código de forma inteligente:\n');

    try {
      console.log(`${colors.yellow}1. Estado del Indexador${colors.reset}`);
      await this.wait(1000, 'Consultando indexador de código');

      const searchStatusResponse = await axios.get(`${BACKEND_URL}/api/code-search/status`);
      const searchStatus = searchStatusResponse.data;

      this.printSuccess('Indexador operacional');
      this.printData('Archivos Indexados', searchStatus.stats?.filesIndexed || 0);
      this.printData('Líneas de Código', searchStatus.stats?.linesIndexed?.toLocaleString() || 0);
      this.printData('Funciones', searchStatus.stats?.functionsIndexed || 0);
      this.printData('Clases', searchStatus.stats?.classesIndexed || 0);
      console.log('');

      console.log(`${colors.yellow}2. Búsqueda Semántica${colors.reset}`);
      await this.wait(1500, 'Buscando código relevante');

      const searchResponse = await axios.post(`${BACKEND_URL}/api/code-search/semantic`, {
        query: 'neural memory system',
        limit: 3
      });

      const results = searchResponse.data;

      this.printSuccess(`${results.results?.length || 0} resultados encontrados`);

      if (results.results && results.results.length > 0) {
        results.results.forEach((result, i) => {
          console.log(`\n  ${i + 1}. ${colors.cyan}${result.file}${colors.reset}`);
          console.log(`     Score: ${(result.score * 100).toFixed(1)}%`);
          console.log(`     Línea: ${result.line}`);
        });
      }

    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }

    await this.prompt(`\n${colors.green}Presiona Enter para continuar...${colors.reset}`);
  }

  // Demo 4: Performance Monitoring
  async demoPerformance() {
    this.printSection('📊', 'DEMO 4: Monitoreo y Performance');

    console.log('Sistema de monitoreo en tiempo real:\n');

    try {
      console.log(`${colors.yellow}1. Métricas del Sistema${colors.reset}`);
      await this.wait(1000, 'Recopilando métricas');

      const metricsResponse = await axios.get(`${BACKEND_URL}/api/metrics/system`);
      const metrics = metricsResponse.data;

      this.printSuccess('Métricas recopiladas');
      this.printData('CPU Usage', (metrics.cpu?.usage || 0).toFixed(2) + '%');
      this.printData('Memory Usage', (metrics.memory?.usagePercent || 0).toFixed(2) + '%');
      this.printData('Memory Used', ((metrics.memory?.used || 0) / 1024 / 1024 / 1024).toFixed(2) + ' GB');
      this.printData('Uptime', Math.floor((metrics.uptime || 0) / 60) + ' minutos');
      console.log('');

      console.log(`${colors.yellow}2. Performance del Backend${colors.reset}`);
      await this.wait(1000, 'Analizando performance');

      const perfResponse = await axios.get(`${BACKEND_URL}/api/performance/stats`);
      const perf = perfResponse.data;

      this.printSuccess('Análisis completado');
      this.printData('Response Time', (perf.averageResponseTime || 0).toFixed(2) + ' ms');
      this.printData('Requests/min', perf.requestsPerMinute || 0);
      this.printData('Cache Hit Rate', (perf.cacheHitRate * 100 || 0).toFixed(1) + '%');

    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }

    await this.prompt(`\n${colors.green}Presiona Enter para continuar...${colors.reset}`);
  }

  // Demo 5: Web Interface
  async demoWebInterface() {
    this.printSection('🎤', 'DEMO 5: Control por Voz (Web Interface)');

    console.log('JARVIS incluye un panel web con control por voz:\n');

    this.printInfo('Frontend: http://localhost:5173');
    this.printInfo('Backend: http://localhost:7777');
    console.log('');

    console.log(`${colors.yellow}Características del Panel Web:${colors.reset}\n`);

    console.log('  🧠 AI Brain Dashboard');
    console.log('     - Visualización en tiempo real de sistemas de IA');
    console.log('     - Live events stream');
    console.log('     - Estadísticas y métricas\n');

    console.log('  🎤 Voice Control');
    console.log('     - Reconocimiento de voz en español');
    console.log('     - Comandos naturales tipo "JARVIS, ..."');
    console.log('     - Respuestas TTS (Text-to-Speech)\n');

    console.log('  💬 Chat Interface');
    console.log('     - Conversación con JARVIS');
    console.log('     - Procesamiento inteligente de comandos');
    console.log('     - Historial de conversaciones\n');

    console.log('  🤖 Autonomous Mode');
    console.log('     - Ejecución autónoma de tareas');
    console.log('     - Análisis proactivo del sistema\n');

    this.printSuccess('Abre http://localhost:5173 en tu navegador para probarlo');

    await this.prompt(`\n${colors.green}Presiona Enter para continuar...${colors.reset}`);
  }

  // Demo Final
  async demoFinal() {
    this.printSection('🎯', 'RESUMEN DEL SISTEMA');

    console.log('JARVIS MARK VII está completamente operacional con:\n');

    console.log(`${colors.cyan}✓${colors.reset} 12 Subsistemas Integrados`);
    console.log(`${colors.cyan}✓${colors.reset} 4 Sistemas de Inteligencia Artificial`);
    console.log(`${colors.cyan}✓${colors.reset} Aprendizaje y Auto-mejora Continua`);
    console.log(`${colors.cyan}✓${colors.reset} Modo Autónomo y Proactivo`);
    console.log(`${colors.cyan}✓${colors.reset} Control por Voz Estilo Tony Stark`);
    console.log(`${colors.cyan}✓${colors.reset} Búsqueda Semántica de Código`);
    console.log(`${colors.cyan}✓${colors.reset} Monitoreo en Tiempo Real`);
    console.log(`${colors.cyan}✓${colors.reset} Sistema de Memoria Neural`);
    console.log(`${colors.cyan}✓${colors.reset} API REST + WebSocket`);
    console.log(`${colors.cyan}✓${colors.reset} Dashboard Web Interactivo`);
    console.log('');

    this.printHeader('📚 PRÓXIMOS PASOS');

    console.log(`${colors.yellow}1.${colors.reset} Abre el panel web: ${colors.cyan}http://localhost:5173${colors.reset}`);
    console.log(`${colors.yellow}2.${colors.reset} Prueba el control por voz en la pestaña "AI Brain"`);
    console.log(`${colors.yellow}3.${colors.reset} Chatea con JARVIS en la pestaña "Chat"`);
    console.log(`${colors.yellow}4.${colors.reset} Revisa las notificaciones en "Autonomous"`);
    console.log(`${colors.yellow}5.${colors.reset} Explora las métricas en "Dashboard"`);
    console.log('');

    console.log(`${colors.magenta}"I am ready to serve, sir. As always."${colors.reset}\n`);
  }

  // Menú principal
  async showMenu() {
    console.log('\n' + colors.yellow + '═'.repeat(50) + colors.reset);
    console.log(`${colors.bright}MENÚ DE DEMOS${colors.reset}\n`);
    console.log(`${colors.cyan}1.${colors.reset} 🧠 Sistemas de IA`);
    console.log(`${colors.cyan}2.${colors.reset} 🤖 Agente Autónomo`);
    console.log(`${colors.cyan}3.${colors.reset} 🔍 Búsqueda de Código`);
    console.log(`${colors.cyan}4.${colors.reset} 📊 Performance`);
    console.log(`${colors.cyan}5.${colors.reset} 🎤 Web Interface`);
    console.log(`${colors.cyan}6.${colors.reset} 🎯 Ver Resumen`);
    console.log(`${colors.cyan}7.${colors.reset} 🔄 Demo Completo`);
    console.log(`${colors.cyan}0.${colors.reset} ❌ Salir`);
    console.log(colors.yellow + '═'.repeat(50) + colors.reset);

    const choice = await this.prompt(`\n${colors.green}Selecciona una opción: ${colors.reset}`);
    return choice.trim();
  }

  // Ejecutar demo
  async run() {
    await this.demoIntro();

    let running = true;

    while (running) {
      const choice = await this.showMenu();

      switch (choice) {
        case '1':
          await this.demoAISystems();
          break;
        case '2':
          await this.demoAutonomousAgent();
          break;
        case '3':
          await this.demoCodeSearch();
          break;
        case '4':
          await this.demoPerformance();
          break;
        case '5':
          await this.demoWebInterface();
          break;
        case '6':
          await this.demoFinal();
          break;
        case '7':
          await this.demoAISystems();
          await this.demoAutonomousAgent();
          await this.demoCodeSearch();
          await this.demoPerformance();
          await this.demoWebInterface();
          await this.demoFinal();
          break;
        case '0':
          console.log(`\n${colors.magenta}"Until next time, sir."${colors.reset}\n`);
          running = false;
          break;
        default:
          console.log(`\n${colors.red}Opción no válida${colors.reset}`);
      }
    }

    this.rl.close();
  }
}

// Ejecutar demo
const demo = new JarvisDemo();
demo.run().catch(console.error);
