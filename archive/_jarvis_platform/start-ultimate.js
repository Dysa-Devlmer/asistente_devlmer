#!/usr/bin/env node
// Script ultimate para iniciar JARVIS automáticamente
// Se ejecuta desde Claude Code

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.clear();
console.log('\n⚡ J.A.R.V.I.S. MARK VII - ULTIMATE START\n');
console.log('═══════════════════════════════════════════════════\n');

console.log('📍 Ubicación:', __dirname);
console.log('🚀 Iniciando J.A.R.V.I.S...\n');

// Cambiar al directorio correcto
process.chdir(__dirname);

// Iniciar npm start
const jarvis = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

jarvis.on('error', (error) => {
  console.error('\n❌ Error al iniciar J.A.R.V.I.S.:', error.message);
  console.log('\n💡 Asegúrate de haber ejecutado: npm install');
  process.exit(1);
});

jarvis.on('close', (code) => {
  if (code !== 0) {
    console.log(`\n⚠️  J.A.R.V.I.S. terminó con código: ${code}`);
  }
  process.exit(code);
});

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚡ Deteniendo J.A.R.V.I.S...');
  jarvis.kill('SIGINT');
  setTimeout(() => process.exit(0), 1000);
});
