#!/usr/bin/env node

/**
 * 🚀 JARVIS INSTALLER
 * Professional installer for Windows, Linux, and macOS
 *
 * Features:
 * - Interactive setup wizard
 * - Dependency checking
 * - Configuration setup
 * - Database initialization
 * - Service installation (optional)
 * - Post-install validation
 */

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const colors = require('colors');

class JarvisInstaller {
  constructor() {
    this.platform = os.platform();
    this.homeDir = os.homedir();
    this.installPath = process.cwd();
    this.config = {};
  }

  /**
   * Inicia el instalador
   */
  async install() {
    console.clear();
    this.printBanner();

    console.log('\n  Welcome to JARVIS Installation Wizard\n'.cyan);
    console.log('  This will guide you through the setup process.\n'.gray);

    try {
      // 1. Check prerequisites
      await this.checkPrerequisites();

      // 2. Interactive setup
      await this.interactiveSetup();

      // 3. Install dependencies
      await this.installDependencies();

      // 4. Configure environment
      await this.configureEnvironment();

      // 5. Initialize database
      await this.initializeDatabase();

      // 6. Create directories
      await this.createDirectories();

      // 7. Optional: Install as service
      if (this.config.installAsService) {
        await this.installService();
      }

      // 8. Post-install validation
      await this.validateInstallation();

      // 9. Success message
      this.printSuccess();

    } catch (error) {
      console.error('\n❌ Installation failed:'.red, error.message);
      console.log('\n💡 Please check the error and try again.\n'.yellow);
      process.exit(1);
    }
  }

  /**
   * Imprime banner
   */
  printBanner() {
    const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                    JARVIS INSTALLER                           ║
║              Just A Rather Very Intelligent System            ║
║                        Mark VII v2.1.0                        ║
╚═══════════════════════════════════════════════════════════════╝
    `.cyan;

    console.log(banner);
  }

  /**
   * Verifica prerequisitos
   */
  async checkPrerequisites() {
    console.log('\n📋 Checking prerequisites...\n'.yellow);

    const checks = [
      { name: 'Node.js', command: 'node --version', required: true, minVersion: '16.0.0' },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'Git', command: 'git --version', required: false },
      { name: 'Python', command: 'python --version', required: false },
      { name: 'Ollama', command: 'ollama --version', required: false }
    ];

    for (const check of checks) {
      try {
        const output = execSync(check.command, { encoding: 'utf8' }).trim();
        console.log(`  ✅ ${check.name}:`.green, output.gray);

        if (check.minVersion) {
          const version = output.match(/\d+\.\d+\.\d+/)?.[0];
          if (version && this.compareVersions(version, check.minVersion) < 0) {
            throw new Error(`${check.name} version ${check.minVersion} or higher required`);
          }
        }

      } catch (error) {
        if (check.required) {
          console.log(`  ❌ ${check.name}: Not found`.red);
          throw new Error(`${check.name} is required but not installed`);
        } else {
          console.log(`  ⚠️  ${check.name}: Not found (optional)`.yellow);
        }
      }
    }

    console.log('\n✅ All required prerequisites met!\n'.green);
  }

  /**
   * Setup interactivo
   */
  async interactiveSetup() {
    console.log('⚙️  Configuration Setup\n'.yellow);

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'installType',
        message: 'Select installation type:',
        choices: [
          { name: '🏠 Personal (Local development)', value: 'personal' },
          { name: '🏢 Production (Server deployment)', value: 'production' },
          { name: '🧪 Development (Full dev environment)', value: 'development' }
        ]
      },
      {
        type: 'confirm',
        name: 'enableAI',
        message: 'Enable AI features (requires Ollama)?',
        default: true
      },
      {
        type: 'input',
        name: 'ollamaHost',
        message: 'Ollama host:',
        default: 'http://localhost:11434',
        when: (answers) => answers.enableAI
      },
      {
        type: 'confirm',
        name: 'enableWeb',
        message: 'Enable web interface?',
        default: true
      },
      {
        type: 'number',
        name: 'webPort',
        message: 'Backend port:',
        default: 7777,
        when: (answers) => answers.enableWeb
      },
      {
        type: 'number',
        name: 'frontendPort',
        message: 'Frontend port:',
        default: 5173,
        when: (answers) => answers.enableWeb
      },
      {
        type: 'confirm',
        name: 'enableMemory',
        message: 'Enable memory/learning system?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableMonitoring',
        message: 'Enable system monitoring?',
        default: true
      },
      {
        type: 'confirm',
        name: 'installAsService',
        message: 'Install as system service? (requires sudo/admin)',
        default: false,
        when: () => this.platform !== 'win32'
      },
      {
        type: 'list',
        name: 'logLevel',
        message: 'Log level:',
        choices: ['error', 'warn', 'info', 'debug', 'verbose'],
        default: 'info'
      }
    ]);

    this.config = answers;
    console.log('');
  }

  /**
   * Instala dependencias
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...\n'.yellow);

    try {
      console.log('  Running npm install (this may take a few minutes)...\n'.gray);

      const installCmd = this.config.installType === 'production'
        ? 'npm install --production'
        : 'npm install';

      execSync(installCmd, {
        stdio: 'inherit',
        cwd: this.installPath
      });

      console.log('\n✅ Dependencies installed successfully!\n'.green);

    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  /**
   * Configura environment
   */
  async configureEnvironment() {
    console.log('🔧 Configuring environment...\n'.yellow);

    const envPath = path.join(this.installPath, '.env');
    const envExamplePath = path.join(this.installPath, '.env.example');

    // Si ya existe .env, hacer backup
    if (fs.existsSync(envPath)) {
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.copyFileSync(envPath, backupPath);
      console.log(`  Backed up existing .env to ${path.basename(backupPath)}`.gray);
    }

    // Crear .env desde configuración
    const envContent = `# JARVIS Configuration
# Generated by installer on ${new Date().toISOString()}

# Environment
NODE_ENV=${this.config.installType}

# Server
PORT=${this.config.webPort || 7777}
HOST=localhost

# AI
AI_ENABLED=${this.config.enableAI}
OLLAMA_HOST=${this.config.ollamaHost || 'http://localhost:11434'}
OLLAMA_MODEL=mistral:latest

# Memory
MEMORY_ENABLED=${this.config.enableMemory}
MEMORY_PATH=./memory

# Monitoring
MONITORING_ENABLED=${this.config.enableMonitoring}

# Web Interface
WEB_ENABLED=${this.config.enableWeb}
WEB_FRONTEND_PORT=${this.config.frontendPort || 5173}
WEB_BACKEND_PORT=${this.config.webPort || 7777}

# Logging
LOG_LEVEL=${this.config.logLevel}
LOG_FILE=true
LOG_CONSOLE=true
LOG_PATH=./logs

# Security
JWT_SECRET=${this.generateSecret()}

# Database
DB_TYPE=sqlite
DB_PATH=./memory/jarvis.db
`;

    fs.writeFileSync(envPath, envContent);

    console.log('  ✅ Environment configured\n'.green);
  }

  /**
   * Inicializa base de datos
   */
  async initializeDatabase() {
    console.log('💾 Initializing database...\n'.yellow);

    try {
      const DatabaseMigrator = require('./core/database-migrator');

      const migrator = new DatabaseMigrator({
        dbType: 'sqlite',
        connection: {
          path: path.join(this.installPath, 'memory', 'jarvis.db')
        }
      });

      await migrator.connect();
      await migrator.migrate();
      await migrator.close();

      console.log('  ✅ Database initialized\n'.green);

    } catch (error) {
      console.log('  ⚠️  Database initialization skipped (will auto-create on first run)\n'.yellow);
    }
  }

  /**
   * Crea directorios necesarios
   */
  async createDirectories() {
    console.log('📁 Creating directories...\n'.yellow);

    const directories = [
      'memory',
      'logs',
      'backups',
      'Proyectos',
      'plugins',
      'temp'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.installPath, dir);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created ${dir}/`.green);
      } else {
        console.log(`  ✓ ${dir}/ already exists`.gray);
      }
    }

    console.log('');
  }

  /**
   * Instala como servicio del sistema
   */
  async installService() {
    console.log('🔧 Installing system service...\n'.yellow);

    try {
      if (this.platform === 'linux' || this.platform === 'darwin') {
        await this.installSystemdService();
      } else if (this.platform === 'win32') {
        await this.installWindowsService();
      }

      console.log('  ✅ Service installed\n'.green);

    } catch (error) {
      console.log('  ⚠️  Service installation failed (you can run JARVIS manually)\n'.yellow);
    }
  }

  /**
   * Instala servicio systemd (Linux)
   */
  async installSystemdService() {
    const serviceName = 'jarvis';
    const serviceFile = `/etc/systemd/system/${serviceName}.service`;

    const serviceContent = `[Unit]
Description=JARVIS - Just A Rather Very Intelligent System
After=network.target

[Service]
Type=simple
User=${os.userInfo().username}
WorkingDirectory=${this.installPath}
ExecStart=${process.execPath} ${path.join(this.installPath, 'app.js')}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;

    // Escribir archivo de servicio (requiere sudo)
    fs.writeFileSync(`${serviceName}.service`, serviceContent);

    console.log('  To complete service installation, run:'.yellow);
    console.log(`  sudo mv ${serviceName}.service ${serviceFile}`.cyan);
    console.log(`  sudo systemctl daemon-reload`.cyan);
    console.log(`  sudo systemctl enable ${serviceName}`.cyan);
    console.log(`  sudo systemctl start ${serviceName}`.cyan);
  }

  /**
   * Instala servicio Windows
   */
  async installWindowsService() {
    console.log('  Windows service installation requires additional tools.'.yellow);
    console.log('  Consider using PM2: npm install -g pm2'.cyan);
    console.log('  Then: pm2 start app.js --name jarvis'.cyan);
  }

  /**
   * Valida instalación
   */
  async validateInstallation() {
    console.log('✅ Validating installation...\n'.yellow);

    const validations = [
      { name: 'package.json', path: 'package.json' },
      { name: '.env file', path: '.env' },
      { name: 'core modules', path: 'core' },
      { name: 'memory directory', path: 'memory' },
      { name: 'logs directory', path: 'logs' }
    ];

    for (const validation of validations) {
      const fullPath = path.join(this.installPath, validation.path);

      if (fs.existsSync(fullPath)) {
        console.log(`  ✅ ${validation.name}`.green);
      } else {
        console.log(`  ❌ ${validation.name}`.red);
        throw new Error(`Validation failed: ${validation.name} not found`);
      }
    }

    console.log('\n✅ Installation validated successfully!\n'.green);
  }

  /**
   * Imprime mensaje de éxito
   */
  printSuccess() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗'.green);
    console.log('║                   INSTALLATION COMPLETE!                      ║'.green);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n'.green);

    console.log('🎉 JARVIS has been successfully installed!\n'.cyan);

    console.log('📚 Next Steps:\n'.yellow);

    if (this.config.enableWeb) {
      console.log('  1. Start the system:'.white);
      console.log('     npm run panel\n'.cyan);

      console.log('  2. Open your browser:'.white);
      console.log(`     Frontend: http://localhost:${this.config.frontendPort}`.cyan);
      console.log(`     Backend:  http://localhost:${this.config.webPort}\n`.cyan);
    } else {
      console.log('  1. Start JARVIS:'.white);
      console.log('     npm start\n'.cyan);
    }

    console.log('  2. Run the CLI:'.white);
    console.log('     node jarvis-cli.js\n'.cyan);

    console.log('  3. Check documentation:'.white);
    console.log('     cat README.md\n'.cyan);

    console.log('💡 Tips:\n'.yellow);
    console.log('  • Run "npm run demo:auto" for a quick demo'.gray);
    console.log('  • Edit .env to customize configuration'.gray);
    console.log('  • Check logs/ directory for system logs'.gray);

    console.log('\n🤖 "All systems operational, sir."\n'.cyan);
  }

  /**
   * Helpers
   */
  generateSecret() {
    return require('crypto').randomBytes(64).toString('hex');
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }
}

// Ejecutar instalador
if (require.main === module) {
  const installer = new JarvisInstaller();
  installer.install().catch((error) => {
    console.error('Fatal error:'.red, error);
    process.exit(1);
  });
}

module.exports = JarvisInstaller;
