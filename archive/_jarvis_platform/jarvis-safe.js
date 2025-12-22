#!/usr/bin/env node
/**
 * JARVIS SAFE MODE - Versión optimizada con protección anti-cierre
 * Carga módulos de forma lazy y con gestión de memoria
 */

import 'dotenv/config';
import readline from 'readline';
import ProcessGuardian from './core/process-guardian.js';

// Inicializar Guardian PRIMERO
const guardian = new ProcessGuardian({
  processName: 'JARVIS-SAFE',
  memoryThreshold: 85,
  memoryCheckInterval: 5000, // 5 segundos
  gcInterval: 20000 // 20 segundos
});

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    🛡️ J.A.R.V.I.S. SAFE MODE - PROTECTED               ║
║                                                           ║
║    Sistema con protección anti-cierre                    ║
║    Gestión inteligente de memoria                        ║
║    Auto-recovery y monitoreo continuo                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

guardian.initialize();

// Módulos lazy-loaded
let jarvis = null;
let memory = null;
let voiceEngine = null;
let searchEngine = null;
let proactive = null;

// Sistema de carga lazy
const modules = {
  jarvis: async () => {
    if (!jarvis) {
      console.log('🔄 Cargando JARVIS core...');
      const Jarvis = (await import('./core/jarvis-pure.js')).default;
      jarvis = new Jarvis();
      await jarvis.initialize();
      console.log('✅ JARVIS core listo');
    }
    return jarvis;
  },

  memory: async () => {
    if (!memory) {
      console.log('🔄 Cargando sistema de memoria...');
      const PersistentMemory = (await import('./core/persistent-memory.js')).default;
      memory = new PersistentMemory();
      await memory.initialize();
      console.log('✅ Memoria persistente lista');
    }
    return memory;
  },

  voice: async () => {
    if (!voiceEngine) {
      console.log('🔄 Cargando motor de voz...');
      const VoiceEngine = (await import('./voice/voice-engine.js')).default;
      voiceEngine = new VoiceEngine(console);
      await voiceEngine.initialize();
      console.log('✅ Motor de voz listo');
    }
    return voiceEngine;
  },

  search: async () => {
    if (!searchEngine) {
      console.log('🔄 Cargando motor de búsqueda...');
      const SearchEngine = (await import('./core/search-engine.js')).default;
      searchEngine = new SearchEngine(console);
      await searchEngine.initialize();
      console.log('✅ Motor de búsqueda listo');
    }
    return searchEngine;
  },

  proactive: async () => {
    if (!proactive) {
      console.log('🔄 Cargando modo proactivo...');
      const { ProactiveEngineV2 } = await import('./core/fase-7-ultimate.js');
      const j = await modules.jarvis();
      proactive = new ProactiveEngineV2(j);
      console.log('✅ Modo proactivo listo');
    }
    return proactive;
  }
};

console.log(`
════════════════════════════════════════════════════════════

✅ J.A.R.V.I.S. SAFE MODE - OPERACIONAL

🛡️ PROTECCIONES ACTIVAS:
  • Process Guardian: MONITOREANDO
  • Memory Management: ACTIVO
  • Auto GC: Cada 20 segundos
  • Memory Threshold: 85%
  • Uncaught Errors: CAPTURADOS

⚡ MODO DE CARGA:
  • Lazy Loading: Los módulos se cargan solo cuando se usan
  • Esto reduce el consumo de memoria al inicio
  • Tiempo de carga inicial: <1 segundo

════════════════════════════════════════════════════════════

💡 COMANDOS DISPONIBLES:

🤖 BÁSICOS:
  • [cualquier mensaje]     - Hablar con JARVIS
  • "status"                - Ver estado del sistema
  • "memory"                - Ver uso de memoria
  • "gc"                    - Forzar limpieza de memoria
  • "salir" / "exit"        - Salir de forma segura

🧠 MEMORIA:
  • "recuerda [texto]"      - Guardar en memoria
  • "busca en memoria [q]"  - Buscar en memoria
  • "estadísticas de memoria" - Stats de memoria

🔍 BÚSQUEDA:
  • "busca en web [query]"  - Búsqueda web
  • "resumen de [url]"      - Resumir página

🎙️ VOZ:
  • "status voz"            - Estado del motor de voz
  • "di [texto]"            - JARVIS habla texto

🔮 PROACTIVO:
  • "modo proactivo"        - Activar análisis proactivo

🎩 Como siempre, Señor Solier. ⚡

════════════════════════════════════════════════════════════
`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function processCommand(command) {
  const cmd = command.toLowerCase().trim();

  try {
    // Comandos de sistema
    if (cmd === 'salir' || cmd === 'exit') {
      console.log('\n🎩 Apagando sistemas JARVIS de forma segura...');

      if (memory) {
        await memory.saveSession();
        await memory.close();
      }

      guardian.stopMemoryMonitoring();
      console.log('⚡ Apagado seguro completado. Hasta pronto, Señor Solier.');
      process.exit(0);
    }

    if (cmd === 'status') {
      const status = guardian.getStatus();
      console.log('\n📊 Estado del Sistema:\n');
      console.log(`Proceso: ${status.processName}`);
      console.log(`Uptime: ${status.uptime} segundos`);
      console.log(`Reinicios: ${status.restartCount}`);
      console.log(`Salud: ${status.health === 'healthy' ? '✅ Saludable' : '⚠️ Advertencia'}`);
      console.log(`\nMemoria Sistema:`);
      console.log(`  Uso: ${status.memory.system.usagePercent}%`);
      console.log(`  Usado: ${status.memory.system.used}MB / ${status.memory.system.total}MB`);
      console.log(`\nMemoria Proceso:`);
      console.log(`  Heap: ${status.memory.process.heapUsed}MB / ${status.memory.process.heapTotal}MB`);
      console.log(`  RSS: ${status.memory.process.rss}MB`);
      return;
    }

    if (cmd === 'memory') {
      const sysMem = guardian.getSystemMemory();
      const procMem = guardian.getProcessMemory();
      console.log('\n💾 Uso de Memoria:\n');
      console.log(`Sistema: ${sysMem.usagePercent}% (${sysMem.used}MB/${sysMem.total}MB)`);
      console.log(`Proceso: ${procMem.heapUsed}MB heap, ${procMem.rss}MB RSS`);
      return;
    }

    if (cmd === 'gc') {
      console.log('\n🧹 Ejecutando limpieza de memoria...');
      await guardian.clearMemoryCaches();
      const memAfter = guardian.getSystemMemory();
      console.log(`✅ Memoria después: ${memAfter.usagePercent}%`);
      return;
    }

    // Comandos de memoria
    if (cmd.match(/recuerda (que\s+)?(.+)/i)) {
      const mem = await modules.memory();
      const content = cmd.replace(/recuerda( que)?/i, '').trim();
      await mem.saveEvent('note', content, { manual: true });
      console.log(`✅ Guardado en memoria: "${content}"`);
      return;
    }

    if (cmd.match(/busca en memoria\s+(.+)/i)) {
      const mem = await modules.memory();
      const query = cmd.replace(/busca en memoria\s+/i, '').trim();
      const results = await mem.searchEvents(query, 10);

      if (results.length > 0) {
        console.log(`\n✅ Encontrados ${results.length} resultado(s):\n`);
        results.forEach((r, i) => {
          console.log(`${i + 1}. [${r.event_type}] ${r.data_json || r.event_data}`);
        });
      } else {
        console.log(`❌ No encontré resultados para: "${query}"`);
      }
      return;
    }

    if (cmd.match(/estadísticas de memoria/i)) {
      const mem = await modules.memory();
      const stats = await mem.getStats();
      console.log('\n📈 Estadísticas de Memoria:\n');
      console.log(`Total eventos: ${stats.totalEvents}`);
      console.log(`Sesiones: ${stats.totalSessions}`);
      return;
    }

    // Comandos de búsqueda
    if (cmd.match(/busca en web\s+(.+)/i)) {
      const search = await modules.search();
      const query = cmd.replace(/busca en web\s+/i, '').trim();
      console.log(`🔍 Buscando: "${query}"...`);
      const result = await search.searchWeb(query, 5);

      if (result.success && result.data.length > 0) {
        console.log(`\n✅ ${result.data.length} resultados:\n`);
        result.data.forEach((r, i) => {
          console.log(`${i + 1}. ${r.title}`);
          console.log(`   ${r.url}`);
          console.log(`   ${r.description.substring(0, 120)}...\n`);
        });
      } else {
        console.log('❌ No se encontraron resultados');
      }
      return;
    }

    if (cmd.match(/resumen de\s+(.+)/i)) {
      const search = await modules.search();
      const url = cmd.replace(/resumen de\s+/i, '').trim();
      console.log(`📄 Resumiendo: ${url}...`);
      const result = await search.summarizeUrl(url);

      if (result.success) {
        console.log(`\n✅ Resumen:\n`);
        console.log(result.summary);
      } else {
        console.log(`❌ No se pudo resumir: ${result.summary}`);
      }
      return;
    }

    // Comandos de voz
    if (cmd.match(/^(status|estado)\s+(de\s+)?voz$/i)) {
      const voice = await modules.voice();
      const status = voice.getStatus();
      console.log('\n🎙️ Estado del Motor de Voz:\n');
      console.log(`Activado: ${status.enabled ? '✅' : '❌'}`);
      console.log(`Modo: ${status.mode}`);
      console.log(`Plataforma: ${status.platform}`);
      return;
    }

    if (cmd.match(/^(jarvis\s+)?di(ce)?\s+(.+)/i)) {
      const voice = await modules.voice();
      const match = cmd.match(/^(jarvis\s+)?di(ce)?\s+(.+)/i);
      const text = match[3];
      console.log(`🗣️ JARVIS dirá: "${text}"`);
      await voice.speak(text);
      return;
    }

    // Modo proactivo
    if (cmd.match(/modo proactivo/i)) {
      const pro = await modules.proactive();
      console.log('\n🔮 Analizando patrones y sugerencias...');
      pro.analyzeUserPatterns();
      const suggestions = await pro.suggestActions({
        cpuUsage: 50,
        memoryUsage: guardian.getSystemMemory().usagePercent,
        lastBackup: Date.now() - 3 * 24 * 60 * 60 * 1000
      });

      if (suggestions && suggestions.length > 0) {
        console.log('\n💡 Sugerencias:');
        suggestions.forEach(s => console.log(`   • ${s}`));
      } else {
        console.log('✅ Todo está óptimo, no hay sugerencias por ahora');
      }
      return;
    }

    // Default: JARVIS conversacional
    const j = await modules.jarvis();
    console.log(`🧠 Procesando: "${command}"`);
    const response = await j.processCommand(command);
    console.log(`\n🎩 JARVIS: ${response}\n`);

    // Guardar en memoria si está cargada
    if (memory) {
      await memory.saveEvent('command', command, { response });
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    guardian.log(`Error procesando comando: ${error.message}`, 'ERROR');
  }
}

function askCommand() {
  rl.question('\n🎩 Señor Solier > ', async (command) => {
    if (!command.trim()) {
      askCommand();
      return;
    }

    await processCommand(command);
    askCommand();
  });
}

// Iniciar el loop
askCommand();

// Manejar cierre controlado
process.on('SIGINT', async () => {
  console.log('\n\n🎩 Apagando JARVIS de forma segura...');

  if (memory) {
    await memory.saveSession();
    await memory.close();
  }

  guardian.gracefulShutdown();
});
