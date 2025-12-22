#!/usr/bin/env node
/**
 * JARVIS API - Ejemplo de Uso
 * Demuestra cómo interactuar con la API de JARVIS
 */

import axios from 'axios';

const API_BASE = 'http://localhost:7777/api';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(title, data) {
  console.log(`\n${colors.bright}${colors.cyan}═══ ${title} ═══${colors.reset}`);
  console.log(JSON.stringify(data, null, 2));
}

async function testJarvisAPI() {
  try {
    console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🤖 JARVIS API - Ejemplo de Uso                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

    // 1. Dashboard - Estado del sistema
    console.log(`\n${colors.yellow}📊 1. Obteniendo estado del dashboard...${colors.reset}`);
    const dashboard = await axios.get(`${API_BASE}/dashboard`);
    log('Dashboard Info', {
      memoria: dashboard.data.memory.total + ' memorias',
      tareas: `${dashboard.data.tasks.total} (${dashboard.data.tasks.pending} pendientes)`,
      sistema: dashboard.data.system.status,
      uptime: Math.floor(dashboard.data.system.uptime / 60) + ' minutos'
    });

    // 2. Memorias - Sistema neural
    console.log(`\n${colors.yellow}🧠 2. Consultando memorias del sistema...${colors.reset}`);
    const memories = await axios.get(`${API_BASE}/memories`);
    log('Neural Memory', {
      total: memories.data.memories?.length || 0,
      stats: memories.data.stats
    });

    // 3. Tareas - Lista de tareas
    console.log(`\n${colors.yellow}📝 3. Obteniendo lista de tareas...${colors.reset}`);
    const tasks = await axios.get(`${API_BASE}/tasks`);
    log('Tasks', {
      total: tasks.data.tasks?.length || 0,
      pendientes: tasks.data.tasks?.filter(t => t.status === 'pending').length || 0,
      completadas: tasks.data.tasks?.filter(t => t.status === 'completed').length || 0
    });

    // 4. Notificaciones
    console.log(`\n${colors.yellow}🔔 4. Verificando notificaciones...${colors.reset}`);
    const notifications = await axios.get(`${API_BASE}/notifications`);
    log('Notifications', {
      total: notifications.data.notifications?.length || 0,
      no_leidas: notifications.data.notifications?.filter(n => !n.read).length || 0,
      recientes: notifications.data.notifications?.slice(0, 3).map(n => ({
        tipo: n.type,
        titulo: n.title,
        fecha: new Date(n.timestamp).toLocaleString()
      })) || []
    });

    // 5. Búsqueda de código
    console.log(`\n${colors.yellow}🔍 5. Buscando código (ejemplo: "jarvis")...${colors.reset}`);
    const search = await axios.post(`${API_BASE}/code-search`, {
      query: 'jarvis',
      mode: 'semantic'
    });
    log('Code Search Results', {
      resultados: search.data.results?.length || 0,
      top_3: search.data.results?.slice(0, 3).map(r => ({
        archivo: r.file,
        linea: r.line,
        score: r.score?.toFixed(2)
      })) || []
    });

    // 6. Configuración del sistema
    console.log(`\n${colors.yellow}⚙️ 6. Obteniendo configuración...${colors.reset}`);
    const settings = await axios.get(`${API_BASE}/settings`);
    log('System Settings', {
      ambiente: settings.data.environment || 'development',
      modulos_activos: Object.keys(settings.data.modules || {}).length
    });

    // 7. Métricas del sistema
    console.log(`\n${colors.yellow}📈 7. Consultando métricas...${colors.reset}`);
    const metrics = await axios.get(`${API_BASE}/performance/metrics`);
    log('Performance Metrics', {
      operaciones: metrics.data.operations || 0,
      cache_hits: metrics.data.cache?.hits || 0,
      cache_misses: metrics.data.cache?.misses || 0
    });

    // Resumen final
    console.log(`\n${colors.bright}${colors.green}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      ✅ Todas las pruebas completadas exitosamente      ║
║                                                           ║
║      JARVIS API está funcionando correctamente           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`\n${colors.cyan}💡 Próximos pasos:${colors.reset}
  - Abre el dashboard en: ${colors.bright}http://localhost:5173${colors.reset}
  - Usa el chat para interactuar con JARVIS
  - Explora la documentación de la API
  - Crea workflows personalizados\n`);

  } catch (error) {
    console.error(`\n${colors.bright}❌ Error:${colors.reset}`, error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Ejecutar
testJarvisAPI();
