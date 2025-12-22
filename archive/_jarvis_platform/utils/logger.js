// utils/logger.js
// Sistema de logging profesional

import colors from 'colors';

class Logger {
  banner(title) {
    console.clear();
    console.log(colors.cyan(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🎩 ${title.padEnd(50)} ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`));
  }

  phase(number, title) {
    console.log(colors.blue(`\n📋 FASE ${number}: ${title}`));
  }

  success(message) {
    console.log(colors.green(`✅ ${message}`));
  }

  error(message) {
    console.log(colors.red(`❌ ${message}`));
  }

  info(message) {
    console.log(colors.cyan(`ℹ️ ${message}`));
  }

  warn(message) {
    console.log(colors.yellow(`⚠️ ${message}`));
  }

  debug(message) {
    if (process.env.DEBUG) console.log(colors.gray(`🔍 ${message}`));
  }
}

export default Logger;
