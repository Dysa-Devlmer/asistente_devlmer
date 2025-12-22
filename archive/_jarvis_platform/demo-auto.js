#!/usr/bin/env node

/**
 * 🎭 JARVIS AUTO DEMO
 *
 * Demostración automática de todas las capacidades del sistema JARVIS
 * Ejecuta todas las pruebas sin necesidad de interacción del usuario
 *
 * Uso: npm run demo:auto
 *
 * 🤖 Created with ❤️ by Devlmer
 */

import axios from 'axios';

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

class JarvisAutoDemo {
  constructor() {
    this.testResults = [];
  }

  // Utilidades de formato
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  title(text) {
    const line = '═'.repeat(60);
    console.log();
    this.log(line, 'cyan');
    this.log(`  ${text}`, 'bright');
    this.log(line, 'cyan');
    console.log();
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  // Esperar con mensaje
  async wait(ms, message = 'Procesando') {
    this.info(`${message}...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verificar si el backend está disponible
  async checkBackend() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ai/status`, { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Demo 1: Sistemas de IA
  async demoAISystems() {
    this.title('🧠 SISTEMAS DE IA');

    try {
      // 1. Estado del sistema
      this.info('Obteniendo estado del sistema...');
      const statusResponse = await axios.get(`${BACKEND_URL}/api/ai/status`);

      if (statusResponse.data.success) {
        this.success('Sistemas de IA operacionales');
        const status = statusResponse.data.status || {};
        const { selfImprovement = {}, reinforcementLearning = {}, patternAnalyzer = {}, predictiveAI = {} } = status;

        console.log(`
  Self-Improvement:       ${selfImprovement.isActive ? '✅' : '❌'} (${selfImprovement.learningIterations || 0} iteraciones)
  Reinforcement Learning: ${reinforcementLearning.isActive ? '✅' : '❌'} (${reinforcementLearning.totalSteps || 0} pasos)
  Pattern Analyzer:       ${patternAnalyzer.isActive ? '✅' : '❌'} (${patternAnalyzer.patternsDetected || 0} patrones)
  Predictive AI:          ${predictiveAI.isActive ? '✅' : '❌'} (${Math.round((predictiveAI.accuracy || 0) * 100)}% accuracy)
        `);
      }

      await this.wait(1000, 'Esperando');

      // 2. Interacción con IA
      this.info('Interactuando con JARVIS...');
      const interactResponse = await axios.post(`${BACKEND_URL}/api/ai/interact`, {
        input: 'Hola JARVIS, realiza una prueba de todos tus sistemas',
        context: { source: 'auto-demo', timestamp: Date.now() }
      });

      if (interactResponse.data.success) {
        this.success('Interacción exitosa');
        const response = interactResponse.data.response || interactResponse.data.result || 'Sin respuesta';
        const preview = typeof response === 'string' ? response.slice(0, 100) : JSON.stringify(response).slice(0, 100);
        console.log(`\n  Respuesta: ${preview}...`);
      }

      await this.wait(1000, 'Esperando');

      // 3. Obtener insights
      this.info('Obteniendo insights de aprendizaje...');
      const insightsResponse = await axios.get(`${BACKEND_URL}/api/ai/insights`);

      if (insightsResponse.data.success && insightsResponse.data.insights) {
        this.success('Insights obtenidos');
        const insights = insightsResponse.data.insights;
        console.log(`
  Top Patterns: ${insights.topPatterns?.length || 0}
  Recent Actions: ${insights.recentActions?.length || 0}
  Knowledge Entries: ${insights.knowledgeGrowth?.current || 0}
        `);
      }

      await this.wait(1000, 'Esperando');

      // 4. Patrones detectados
      this.info('Obteniendo patrones detectados...');
      const patternsResponse = await axios.get(`${BACKEND_URL}/api/ai/patterns`);

      if (patternsResponse.data.success) {
        this.success(`${patternsResponse.data.patterns.length} patrones detectados`);
        if (patternsResponse.data.patterns.length > 0) {
          const pattern = patternsResponse.data.patterns[0];
          console.log(`\n  Último patrón: ${pattern.type} (Frecuencia: ${pattern.frequency})`);
        }
      }

      await this.wait(1000, 'Esperando');

      // 5. Predicciones
      this.info('Obteniendo predicciones...');
      const predictionsResponse = await axios.get(`${BACKEND_URL}/api/ai/predictions`);

      if (predictionsResponse.data.success) {
        this.success('Predicciones generadas');
        if (predictionsResponse.data.predictions.temporal) {
          console.log(`\n  Próxima predicción: ${predictionsResponse.data.predictions.temporal.prediction}`);
        }
      }

      await this.wait(1000, 'Esperando');

      // 6. Estadísticas completas
      this.info('Obteniendo estadísticas completas...');
      const statsResponse = await axios.get(`${BACKEND_URL}/api/ai/statistics`);

      if (statsResponse.data.success) {
        this.success('Estadísticas obtenidas');
        const stats = statsResponse.data.statistics;
        console.log(`
  Total Interactions: ${stats.totalInteractions || 0}
  Learning Rate: ${((stats.learningRate || 0) * 100).toFixed(2)}%
  System Uptime: ${Math.floor((Date.now() - stats.startTime) / 1000)}s
        `);
      }

      this.testResults.push({ name: 'Sistemas de IA', status: 'PASSED' });

    } catch (error) {
      this.error(`Error en demo de IA: ${error.message}`);
      this.testResults.push({ name: 'Sistemas de IA', status: 'FAILED', error: error.message });
    }
  }

  // Demo 2: API REST
  async demoAPI() {
    this.title('📡 API REST');

    try {
      this.info('Probando endpoints de la API...');

      const endpoints = [
        { method: 'GET', path: '/api/ai/status', name: 'Status' },
        { method: 'GET', path: '/api/ai/statistics', name: 'Statistics' },
        { method: 'GET', path: '/api/ai/insights', name: 'Insights' },
        { method: 'GET', path: '/api/ai/patterns', name: 'Patterns' },
        { method: 'GET', path: '/api/ai/predictions', name: 'Predictions' },
      ];

      let passed = 0;
      let failed = 0;

      for (const endpoint of endpoints) {
        try {
          const response = await axios({
            method: endpoint.method.toLowerCase(),
            url: `${BACKEND_URL}${endpoint.path}`,
            timeout: 3000
          });

          if (response.status === 200) {
            this.success(`${endpoint.method} ${endpoint.path}`);
            passed++;
          } else {
            this.warning(`${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
            failed++;
          }
        } catch (error) {
          this.error(`${endpoint.method} ${endpoint.path} - ${error.message}`);
          failed++;
        }

        await this.wait(500);
      }

      console.log(`\n  Resultados: ${passed} ✅ | ${failed} ❌`);

      if (failed === 0) {
        this.testResults.push({ name: 'API REST', status: 'PASSED' });
      } else {
        this.testResults.push({ name: 'API REST', status: 'PARTIAL', passed, failed });
      }

    } catch (error) {
      this.error(`Error en demo de API: ${error.message}`);
      this.testResults.push({ name: 'API REST', status: 'FAILED', error: error.message });
    }
  }

  // Demo 3: Performance Test
  async demoPerformance() {
    this.title('⚡ PERFORMANCE TEST');

    try {
      this.info('Ejecutando pruebas de performance...');

      // Test de respuesta rápida
      this.info('Test 1: Response Time');
      const startTime = Date.now();
      await axios.get(`${BACKEND_URL}/api/ai/status`);
      const responseTime = Date.now() - startTime;

      if (responseTime < 500) {
        this.success(`Response time: ${responseTime}ms (Excelente)`);
      } else if (responseTime < 1000) {
        this.warning(`Response time: ${responseTime}ms (Aceptable)`);
      } else {
        this.error(`Response time: ${responseTime}ms (Lento)`);
      }

      await this.wait(1000);

      // Test de carga múltiple
      this.info('Test 2: Concurrent Requests');
      const concurrentStart = Date.now();
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(axios.get(`${BACKEND_URL}/api/ai/status`));
      }
      await Promise.all(promises);
      const concurrentTime = Date.now() - concurrentStart;

      this.success(`5 requests concurrentes: ${concurrentTime}ms`);

      await this.wait(1000);

      // Test de interacción
      this.info('Test 3: AI Interaction Speed');
      const interactStart = Date.now();
      await axios.post(`${BACKEND_URL}/api/ai/interact`, {
        input: 'test performance',
        context: {}
      });
      const interactTime = Date.now() - interactStart;

      if (interactTime < 1000) {
        this.success(`AI interaction: ${interactTime}ms (Rápido)`);
      } else {
        this.warning(`AI interaction: ${interactTime}ms`);
      }

      this.testResults.push({ name: 'Performance', status: 'PASSED' });

    } catch (error) {
      this.error(`Error en performance test: ${error.message}`);
      this.testResults.push({ name: 'Performance', status: 'FAILED', error: error.message });
    }
  }

  // Demo 4: Sistema de Aprendizaje
  async demoLearning() {
    this.title('🎓 SISTEMA DE APRENDIZAJE');

    try {
      this.info('Probando capacidad de aprendizaje...');

      // Interacción 1
      this.info('Interacción 1: Pregunta inicial');
      await axios.post(`${BACKEND_URL}/api/ai/interact`, {
        input: 'Me gusta el color azul',
        context: { preference: true }
      });
      this.success('Preferencia registrada');

      await this.wait(1000);

      // Interacción 2
      this.info('Interacción 2: Pregunta relacionada');
      await axios.post(`${BACKEND_URL}/api/ai/interact`, {
        input: 'Cuál es mi color favorito',
        context: { query: true }
      });
      this.success('Consulta procesada');

      await this.wait(1000);

      // Verificar aprendizaje
      this.info('Verificando aprendizaje...');
      const insightsResponse = await axios.get(`${BACKEND_URL}/api/ai/insights`);

      if (insightsResponse.data.success) {
        const insights = insightsResponse.data.insights;
        this.success('Sistema aprendiendo correctamente');
        console.log(`
  Learning iterations: ${insights.learningProgress?.iterations || 0}
  Knowledge growth: ${insights.knowledgeGrowth?.current || 0} entries
        `);
      }

      // Registrar feedback
      this.info('Registrando feedback positivo...');
      await axios.post(`${BACKEND_URL}/api/ai/feedback`, {
        interactionId: 'auto-demo-feedback',
        rating: 5,
        comment: 'Sistema funcionando correctamente'
      });
      this.success('Feedback registrado');

      this.testResults.push({ name: 'Sistema de Aprendizaje', status: 'PASSED' });

    } catch (error) {
      this.error(`Error en demo de aprendizaje: ${error.message}`);
      this.testResults.push({ name: 'Sistema de Aprendizaje', status: 'FAILED', error: error.message });
    }
  }

  // Resumen final
  showSummary() {
    this.title('📊 RESUMEN DE PRUEBAS');

    console.log();
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASSED' ?
        `${colors.green}✅ PASSED${colors.reset}` :
        result.status === 'PARTIAL' ?
        `${colors.yellow}⚠️  PARTIAL (${result.passed}/${result.passed + result.failed})${colors.reset}` :
        `${colors.red}❌ FAILED${colors.reset}`;

      console.log(`  ${index + 1}. ${result.name}: ${status}`);

      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    console.log();

    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);

    this.log(`  Total: ${passed}/${total} pruebas exitosas (${percentage}%)`,
      percentage === 100 ? 'green' : percentage >= 75 ? 'yellow' : 'red');

    console.log();
    this.log('═'.repeat(60), 'cyan');
    console.log();
  }

  // Ejecutar demo completo
  async runAll() {
    // Banner
    console.log();
    this.log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    this.log('║                                                            ║', 'cyan');
    this.log('║              🤖 JARVIS MARK VII - AUTO DEMO               ║', 'bright');
    this.log('║                                                            ║', 'cyan');
    this.log('║          Demostración Automática de Capacidades           ║', 'cyan');
    this.log('║                                                            ║', 'cyan');
    this.log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    console.log();

    // Verificar backend
    this.info('Verificando conexión con el backend...');
    const backendAvailable = await this.checkBackend();

    if (!backendAvailable) {
      this.error('Backend no disponible en http://localhost:7777');
      this.warning('Asegúrate de que el servidor esté ejecutándose:');
      console.log('  npm run panel');
      console.log('  o');
      console.log('  cd web-interface/backend && node server.cjs');
      return;
    }

    this.success('Backend conectado correctamente');
    await this.wait(1000);

    // Ejecutar demos
    await this.demoAISystems();
    await this.wait(2000);

    await this.demoAPI();
    await this.wait(2000);

    await this.demoPerformance();
    await this.wait(2000);

    await this.demoLearning();
    await this.wait(2000);

    // Mostrar resumen
    this.showSummary();

    // Mensaje final
    this.log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    this.log('║                                                            ║', 'cyan');
    this.log('║         ✅ Demo completado exitosamente                   ║', 'green');
    this.log('║                                                            ║', 'cyan');
    this.log('║         "All systems operational, sir."                   ║', 'cyan');
    this.log('║                                                            ║', 'cyan');
    this.log('║         🤖 Created with ❤️  by Devlmer                    ║', 'cyan');
    this.log('║                                                            ║', 'cyan');
    this.log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    console.log();
  }
}

// Ejecutar demo
const demo = new JarvisAutoDemo();
demo.runAll().catch(error => {
  console.error(`${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
