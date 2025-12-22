#!/usr/bin/env node
/**
 * JARVIS WATCHDOG - Auto-restart protector
 * Reinicia JARVIS automáticamente si se cierra inesperadamente
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  maxRestarts: 10,
  restartDelay: 3000, // 3 segundos
  resetCounterAfter: 300000, // 5 minutos
  logFile: join(__dirname, 'logs', 'watchdog.log'),
  targetScript: join(__dirname, 'jarvis-safe.js')
};

let restartCount = 0;
let lastRestart = 0;
let isShuttingDown = false;
let currentProcess = null;

// Asegurar directorio de logs
const logDir = dirname(CONFIG.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  const emoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'SUCCESS' ? '✅' : '📝';
  console.log(`${emoji} ${message}`);

  try {
    fs.appendFileSync(CONFIG.logFile, logMessage);
  } catch (error) {
    console.error('No se pudo escribir en el log:', error.message);
  }
}

function startJarvis() {
  if (isShuttingDown) return;

  const now = Date.now();
  const timeSinceLastRestart = now - lastRestart;

  // Reset contador si pasaron más de 5 minutos
  if (timeSinceLastRestart > CONFIG.resetCounterAfter) {
    restartCount = 0;
    log('Contador de reinicios reseteado', 'INFO');
  }

  // Verificar límite de reinicios
  if (restartCount >= CONFIG.maxRestarts) {
    log(
      `❌ MÁXIMO DE REINICIOS ALCANZADO (${CONFIG.maxRestarts}). Deteniendo watchdog.`,
      'ERROR'
    );
    log('Por favor, revisa los logs para identificar el problema', 'ERROR');
    process.exit(1);
  }

  restartCount++;
  lastRestart = now;

  log(
    `Iniciando JARVIS (intento ${restartCount}/${CONFIG.maxRestarts})...`,
    'INFO'
  );

  // Iniciar proceso con --expose-gc para habilitar GC manual
  currentProcess = spawn('node', ['--expose-gc', CONFIG.targetScript], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
    env: {
      ...process.env,
      JARVIS_WATCHDOG: 'true'
    }
  });

  log(`Proceso iniciado con PID: ${currentProcess.pid}`, 'SUCCESS');

  currentProcess.on('error', (error) => {
    log(`Error al iniciar proceso: ${error.message}`, 'ERROR');
    log(`Stack: ${error.stack}`, 'ERROR');
  });

  currentProcess.on('exit', (code, signal) => {
    if (isShuttingDown) {
      log('Proceso terminado durante shutdown controlado', 'INFO');
      return;
    }

    if (code === 0) {
      log('JARVIS terminó normalmente (código 0)', 'INFO');
      log('Watchdog detenido', 'INFO');
      process.exit(0);
    } else {
      log(
        `⚠️ JARVIS terminó inesperadamente - Código: ${code} | Señal: ${signal}`,
        'WARN'
      );

      log(`Reiniciando en ${CONFIG.restartDelay / 1000} segundos...`, 'WARN');

      setTimeout(() => {
        startJarvis();
      }, CONFIG.restartDelay);
    }
  });
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  log('Recibido SIGINT - Deteniendo watchdog...', 'WARN');

  if (currentProcess && !currentProcess.killed) {
    log('Deteniendo proceso JARVIS...', 'INFO');
    currentProcess.kill('SIGTERM');

    // Forzar después de 5 segundos si no responde
    setTimeout(() => {
      if (currentProcess && !currentProcess.killed) {
        log('Forzando terminación del proceso...', 'WARN');
        currentProcess.kill('SIGKILL');
      }
    }, 5000);
  }

  setTimeout(() => {
    log('Watchdog detenido', 'INFO');
    process.exit(0);
  }, 6000);
});

process.on('SIGTERM', () => {
  if (isShuttingDown) return;

  isShuttingDown = true;
  log('Recibido SIGTERM - Deteniendo watchdog...', 'WARN');

  if (currentProcess && !currentProcess.killed) {
    currentProcess.kill('SIGTERM');
  }

  setTimeout(() => process.exit(0), 5000);
});

// Banner
console.clear();
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    🛡️ J.A.R.V.I.S. WATCHDOG - AUTO-RESTART             ║
║                                                           ║
║    Protección contra cierres inesperados                 ║
║    Reinicio automático inteligente                       ║
║    Monitoreo continuo 24/7                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

log('JARVIS Watchdog iniciado', 'SUCCESS');
log(`Archivo objetivo: ${CONFIG.targetScript}`, 'INFO');
log(`Máximo reinicios: ${CONFIG.maxRestarts}`, 'INFO');
log(`Delay entre reinicios: ${CONFIG.restartDelay}ms`, 'INFO');
log(`Log file: ${CONFIG.logFile}`, 'INFO');
log('', 'INFO');
log('Presiona Ctrl+C para detener el watchdog y JARVIS', 'INFO');
log('', 'INFO');

// Iniciar JARVIS
startJarvis();
