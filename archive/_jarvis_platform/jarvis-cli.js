#!/usr/bin/env node

/**
 * 🎯 JARVIS CLI - Command Line Interface
 * Interfaz de línea de comandos interactiva y profesional
 *
 * Features:
 * - Menú interactivo con inquirer
 * - Comandos con argumentos
 * - Autocompletado
 * - Colores y formato
 * - Progreso y spinners
 * - Historial de comandos
 */

const inquirer = require('inquirer');
const colors = require('colors');
const path = require('path');
const { execSync } = require('child_process');

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗              ║
║        ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝              ║
║        ██║███████║██████╔╝██║   ██║██║███████╗              ║
║   ██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║              ║
║   ╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║              ║
║    ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝              ║
║                                                               ║
║         Just A Rather Very Intelligent System                ║
║                    Mark VII - v2.1.0                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`.cyan;

class JarvisCLI {
  constructor() {
    this.running = true;
    this.logger = null;
  }

  /**
   * Inicia el CLI
   */
  async start() {
    console.clear();
    console.log(banner);
    console.log('\n' + '  "Good morning, sir. JARVIS at your service."'.gray);
    console.log('  Type "help" for available commands or use the interactive menu.\n'.gray);

    await this.showMainMenu();
  }

  /**
   * Muestra el menú principal
   */
  async showMainMenu() {
    while (this.running) {
      try {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do, sir?',
            choices: [
              { name: '🚀 Start JARVIS System', value: 'start' },
              { name: '🎛️  Control Panel (Web Interface)', value: 'panel' },
              { name: '🧪 Run Demo', value: 'demo' },
              { name: '🤖 AI Chat', value: 'chat' },
              { name: '📊 System Status', value: 'status' },
              { name: '🗂️  Manage Projects', value: 'projects' },
              { name: '🔌 Manage Plugins', value: 'plugins' },
              { name: '📝 View Logs', value: 'logs' },
              { name: '⚙️  Configuration', value: 'config' },
              { name: '🧰 Utilities', value: 'utils' },
              { name: '📚 Documentation', value: 'docs' },
              { name: '❌ Exit', value: 'exit' }
            ],
            pageSize: 15
          }
        ]);

        await this.handleAction(action);

      } catch (error) {
        if (error.isTtyError) {
          console.error('Prompt couldn\'t be rendered in the current environment'.red);
          this.running = false;
        } else {
          console.error('Error:'.red, error.message);
        }
      }
    }
  }

  /**
   * Maneja las acciones del menú
   */
  async handleAction(action) {
    console.log(''); // Espacio

    switch (action) {
      case 'start':
        await this.startSystem();
        break;
      case 'panel':
        await this.startPanel();
        break;
      case 'demo':
        await this.runDemo();
        break;
      case 'chat':
        await this.startChat();
        break;
      case 'status':
        await this.showStatus();
        break;
      case 'projects':
        await this.manageProjects();
        break;
      case 'plugins':
        await this.managePlugins();
        break;
      case 'logs':
        await this.viewLogs();
        break;
      case 'config':
        await this.manageConfig();
        break;
      case 'utils':
        await this.showUtilities();
        break;
      case 'docs':
        await this.showDocs();
        break;
      case 'exit':
        this.exit();
        break;
    }

    if (this.running && action !== 'chat') {
      await this.pause();
    }
  }

  /**
   * Inicia el sistema JARVIS
   */
  async startSystem() {
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select startup mode:',
        choices: [
          { name: '🎯 Complete System (Recommended)', value: 'complete' },
          { name: '⚡ Quick Start', value: 'quick' },
          { name: '🛡️  Protected Mode (Auto-restart)', value: 'protected' },
          { name: '💾 Pure Memory Mode', value: 'pure' },
          { name: '🧠 AI Only', value: 'ai' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (mode === 'back') return;

    console.log('\n🚀 Starting JARVIS in'.green, mode.toUpperCase().yellow, 'mode...\n'.green);

    const commands = {
      complete: 'npm start',
      quick: 'npm run pure',
      protected: 'npm run protected',
      pure: 'npm run pure:memory',
      ai: 'npm run jarvis'
    };

    try {
      execSync(commands[mode], { stdio: 'inherit', cwd: path.join(__dirname) });
    } catch (error) {
      console.error('\n❌ Failed to start JARVIS:'.red, error.message);
    }
  }

  /**
   * Inicia el panel web
   */
  async startPanel() {
    console.log('\n🎛️  Starting Web Control Panel...'.green);
    console.log('   Frontend: http://localhost:5173'.cyan);
    console.log('   Backend:  http://localhost:7777\n'.cyan);

    try {
      execSync('npm run panel', { stdio: 'inherit', cwd: path.join(__dirname) });
    } catch (error) {
      console.error('\n❌ Failed to start panel:'.red, error.message);
    }
  }

  /**
   * Ejecuta demo
   */
  async runDemo() {
    const { demoType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'demoType',
        message: 'Select demo type:',
        choices: [
          { name: '⚡ Automatic Demo (No interaction)', value: 'auto' },
          { name: '🎮 Interactive Demo', value: 'interactive' },
          { name: '🌟 All Systems Demo', value: 'all' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (demoType === 'back') return;

    const commands = {
      auto: 'npm run demo:auto',
      interactive: 'npm run demo',
      all: 'npm run demo:all'
    };

    try {
      execSync(commands[demoType], { stdio: 'inherit', cwd: path.join(__dirname) });
    } catch (error) {
      console.error('\n❌ Demo failed:'.red, error.message);
    }
  }

  /**
   * Inicia chat con IA
   */
  async startChat() {
    console.log('\n💬 Starting AI Chat Session...'.green);
    console.log('   Type "exit" to return to main menu\n'.gray);

    const axios = require('axios');
    let chatting = true;

    while (chatting) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'You:',
          validate: (input) => input.trim().length > 0 || 'Message cannot be empty'
        }
      ]);

      if (message.toLowerCase() === 'exit') {
        chatting = false;
        console.log('\n👋 Chat session ended.\n'.gray);
        break;
      }

      try {
        console.log('\n🧠 JARVIS is thinking...\n'.gray);

        const response = await axios.post('http://localhost:7777/api/v1/ai/chat', {
          message,
          userId: 'cli-user'
        });

        console.log('JARVIS:'.cyan, response.data.response + '\n');

      } catch (error) {
        console.error('❌ Error:'.red, error.message);
        console.log('💡 Make sure JARVIS backend is running (npm run panel)\n'.yellow);
      }
    }
  }

  /**
   * Muestra estado del sistema
   */
  async showStatus() {
    console.log('\n📊 JARVIS SYSTEM STATUS\n'.green.bold);

    const config = require('./core/config-manager');
    const os = require('os');

    console.log('Environment:'.cyan, config.get('env'));
    console.log('Server:'.cyan, `${config.get('server.host')}:${config.get('server.port')}`);
    console.log('AI Provider:'.cyan, config.get('ai.provider'));
    console.log('Memory:'.cyan, config.get('memory.enabled') ? 'Enabled' : 'Disabled');
    console.log('Web Interface:'.cyan, config.get('web.enabled') ? 'Enabled' : 'Disabled');
    console.log('\nSystem:'.yellow);
    console.log('  CPU:'.cyan, `${os.cpus().length} cores - ${os.cpus()[0].model}`);
    console.log('  RAM:'.cyan, `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB total, ${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB free`);
    console.log('  Platform:'.cyan, `${os.type()} ${os.release()} (${os.arch()})`);
    console.log('  Uptime:'.cyan, `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`);
    console.log('');
  }

  /**
   * Gestiona proyectos
   */
  async manageProjects() {
    const projectManager = require('./core/project-memory-manager');
    const projects = await projectManager.listProjects();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Project Management:',
        choices: [
          { name: `📋 List Projects (${projects.length})`, value: 'list' },
          { name: '➕ Register New Project', value: 'add' },
          { name: '📊 Project Report', value: 'report' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') return;

    switch (action) {
      case 'list':
        console.log('\n📁 REGISTERED PROJECTS:\n'.green);
        if (projects.length === 0) {
          console.log('  No projects registered yet.'.gray);
        } else {
          projects.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`.cyan);
            console.log(`   Status: ${p.status} | Progress: ${p.progress} | Last Update: ${p.lastUpdate}`.gray);
          });
        }
        console.log('');
        break;

      case 'report':
        const report = await projectManager.generateStatusReport();
        console.log('\n' + report);
        break;

      case 'add':
        console.log('\n➕ Register New Project\n'.green);
        // Implementar formulario de registro
        console.log('   Feature coming soon...'.gray);
        break;
    }
  }

  /**
   * Gestiona plugins
   */
  async managePlugins() {
    const PluginManager = require('./core/plugin-manager');
    const pluginManager = new PluginManager();

    const stats = pluginManager.getStats();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Plugin Management:',
        choices: [
          { name: `📋 List Plugins (${stats.total})`, value: 'list' },
          { name: '🔌 Create Example Plugin', value: 'example' },
          { name: '🔄 Reload All Plugins', value: 'reload' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') return;

    switch (action) {
      case 'list':
        console.log('\n🔌 INSTALLED PLUGINS:\n'.green);
        if (stats.plugins.length === 0) {
          console.log('  No plugins installed.'.gray);
        } else {
          stats.plugins.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`.cyan, `v${p.version}`.gray);
            console.log(`   State: ${p.state} | ${p.description || 'No description'}`.gray);
          });
        }
        console.log('');
        break;

      case 'example':
        const examplePath = pluginManager.createExamplePlugin();
        console.log('\n✅ Example plugin created at:'.green, examplePath.cyan);
        break;

      case 'reload':
        await pluginManager.loadAllPlugins();
        console.log('\n✅ All plugins reloaded'.green);
        break;
    }
  }

  /**
   * Ver logs
   */
  async viewLogs() {
    const { logType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'logType',
        message: 'Select log type:',
        choices: [
          { name: '📝 Combined Logs', value: 'combined' },
          { name: '❌ Error Logs', value: 'error' },
          { name: '⚡ Performance Logs', value: 'performance' },
          { name: '📊 Log Statistics', value: 'stats' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (logType === 'back') return;

    if (logType === 'stats') {
      const { getLogger } = require('./core/logger');
      const logger = getLogger();
      const stats = await logger.getStats();

      console.log('\n📊 LOG STATISTICS:\n'.green);
      console.log('Total Size:'.cyan, stats.totalSizeFormatted);
      console.log('Files:'.cyan, stats.files.length);
      console.log('Path:'.cyan, stats.logPath);
      console.log('');

      if (stats.files.length > 0) {
        console.log('Recent Files:'.yellow);
        stats.files.slice(0, 5).forEach(f => {
          console.log(`  - ${f.name}`.gray, `(${f.sizeFormatted})`.gray);
        });
      }
      console.log('');
    } else {
      console.log(`\n📝 Opening ${logType} logs...\n`.green);
      try {
        execSync(`code logs/${logType}-*.log || cat logs/${logType}-*.log | tail -50`, {
          stdio: 'inherit',
          cwd: path.join(__dirname)
        });
      } catch (error) {
        console.log('💡 Log files location: ./logs/\n'.gray);
      }
    }
  }

  /**
   * Gestiona configuración
   */
  async manageConfig() {
    const config = require('./core/config-manager');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Configuration:',
        choices: [
          { name: '📋 View Current Config', value: 'view' },
          { name: '🔄 Reload Config', value: 'reload' },
          { name: '💾 Export Config', value: 'export' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') return;

    switch (action) {
      case 'view':
        config.print();
        break;

      case 'reload':
        config.reload();
        console.log('\n✅ Configuration reloaded\n'.green);
        break;

      case 'export':
        const exported = config.export(false);
        console.log('\n📄 Current Configuration:\n'.green);
        console.log(JSON.stringify(exported, null, 2).gray);
        console.log('');
        break;
    }
  }

  /**
   * Muestra utilidades
   */
  async showUtilities() {
    const { util } = await inquirer.prompt([
      {
        type: 'list',
        name: 'util',
        message: 'Utilities:',
        choices: [
          { name: '🧹 Clean Logs', value: 'clean-logs' },
          { name: '💾 Backup System', value: 'backup' },
          { name: '🧪 Run Tests', value: 'test' },
          { name: '📦 Update Dependencies', value: 'update' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (util === 'back') return;

    switch (util) {
      case 'clean-logs':
        const { getLogger } = require('./core/logger');
        const logger = getLogger();
        const deleted = await logger.cleanup(14);
        console.log(`\n✅ Cleaned ${deleted} old log files\n`.green);
        break;

      case 'backup':
        console.log('\n💾 Creating backup...\n'.green);
        try {
          execSync('npm run backup', { stdio: 'inherit', cwd: path.join(__dirname) });
        } catch (error) {
          console.error('❌ Backup failed:'.red, error.message);
        }
        break;

      case 'test':
        console.log('\n🧪 Running tests...\n'.green);
        try {
          execSync('npm test', { stdio: 'inherit', cwd: path.join(__dirname) });
        } catch (error) {
          console.log('\n⚠️  Some tests may have failed\n'.yellow);
        }
        break;

      case 'update':
        console.log('\n📦 Updating dependencies...\n'.green);
        try {
          execSync('npm update', { stdio: 'inherit', cwd: path.join(__dirname) });
          console.log('\n✅ Dependencies updated\n'.green);
        } catch (error) {
          console.error('❌ Update failed:'.red, error.message);
        }
        break;
    }
  }

  /**
   * Muestra documentación
   */
  async showDocs() {
    const { doc } = await inquirer.prompt([
      {
        type: 'list',
        name: 'doc',
        message: 'Documentation:',
        choices: [
          { name: '📘 README', value: 'README.md' },
          { name: '🚀 Quick Start Guide', value: 'QUICK-START-GUIDE.md' },
          { name: '📚 Complete Platform Guide', value: 'JARVIS-COMPLETE-PLATFORM-GUIDE.md' },
          { name: '🏗️  Deployment Guide', value: 'DEPLOYMENT-GUIDE.md' },
          { name: '🔧 Advanced Features', value: 'ADVANCED-FEATURES-GUIDE.md' },
          { name: '⬅️  Back', value: 'back' }
        ]
      }
    ]);

    if (doc === 'back') return;

    try {
      execSync(`code ${doc} || cat ${doc} | less`, {
        stdio: 'inherit',
        cwd: path.join(__dirname)
      });
    } catch (error) {
      console.log(`\n💡 View documentation at: ./${doc}\n`.gray);
    }
  }

  /**
   * Pausa para continuar
   */
  async pause() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press ENTER to continue...'
      }
    ]);
  }

  /**
   * Sale del CLI
   */
  exit() {
    console.log('\n' + '  "It has been a privilege serving you, sir."'.gray);
    console.log('  Goodbye! 👋\n'.cyan);
    this.running = false;
    process.exit(0);
  }
}

// Iniciar CLI si se ejecuta directamente
if (require.main === module) {
  const cli = new JarvisCLI();
  cli.start().catch((error) => {
    console.error('CLI Error:'.red, error);
    process.exit(1);
  });
}

module.exports = JarvisCLI;
