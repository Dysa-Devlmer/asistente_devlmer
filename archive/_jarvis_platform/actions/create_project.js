// actions/create_project.js
// Acción real: Crea estructura completa de proyecto Node.js

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class CreateProjectAction {
  constructor() {
    this.name = 'create_project';
    this.description = 'Crea estructura completa de proyecto Node.js con Git, package.json, README, etc.';
  }

  /**
   * Ejecuta la creación del proyecto
   * @param {Object} params - Parámetros de la acción
   * @param {string} params.projectName - Nombre del proyecto
   * @param {string} params.projectPath - Ruta donde crear el proyecto (opcional)
   * @param {string} params.template - Tipo de proyecto (node, express, react, etc.)
   * @param {boolean} params.initGit - Inicializar repositorio Git
   * @returns {Object} Resultado de la acción
   */
  async execute(params = {}) {
    const {
      projectName = 'nuevo-proyecto',
      projectPath = process.cwd(),
      template = 'node',
      initGit = true,
      author = 'Ulmer Solier',
      license = 'MIT'
    } = params;

    try {
      // Validar nombre del proyecto
      const sanitizedName = this.sanitizeProjectName(projectName);
      const fullPath = path.join(projectPath, sanitizedName);

      // Verificar si ya existe
      if (fs.existsSync(fullPath)) {
        return {
          success: false,
          error: `El directorio '${sanitizedName}' ya existe en ${projectPath}`,
          path: fullPath
        };
      }

      // Crear estructura según template
      const structure = this.getProjectStructure(template);
      await this.createStructure(fullPath, structure);

      // Crear package.json
      const packageJson = this.generatePackageJson(sanitizedName, template, author, license);
      fs.writeFileSync(
        path.join(fullPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Crear README.md
      const readme = this.generateReadme(sanitizedName, template, author);
      fs.writeFileSync(path.join(fullPath, 'README.md'), readme);

      // Crear .gitignore
      const gitignore = this.generateGitignore(template);
      fs.writeFileSync(path.join(fullPath, '.gitignore'), gitignore);

      // Crear LICENSE
      const licenseText = this.generateLicense(license, author);
      fs.writeFileSync(path.join(fullPath, 'LICENSE'), licenseText);

      // Crear archivos específicos del template
      await this.createTemplateFiles(fullPath, template, sanitizedName);

      // Inicializar Git
      let gitInitialized = false;
      if (initGit) {
        try {
          execSync('git init', { cwd: fullPath, stdio: 'ignore' });
          execSync('git add .', { cwd: fullPath, stdio: 'ignore' });
          execSync('git commit -m "Initial commit - Project created by J.A.R.V.I.S"', {
            cwd: fullPath,
            stdio: 'ignore'
          });
          gitInitialized = true;
        } catch (gitError) {
          // Git opcional, no bloqueante
        }
      }

      // Instalar dependencias (opcional)
      let depsInstalled = false;
      if (params.installDeps) {
        try {
          execSync('npm install', { cwd: fullPath, stdio: 'inherit' });
          depsInstalled = true;
        } catch (npmError) {
          // No bloqueante
        }
      }

      return {
        success: true,
        message: `Proyecto '${sanitizedName}' creado exitosamente`,
        path: fullPath,
        template,
        gitInitialized,
        depsInstalled,
        files: this.countFiles(fullPath)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Sanitiza el nombre del proyecto
   */
  sanitizeProjectName(name) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Retorna estructura de carpetas según template
   */
  getProjectStructure(template) {
    const structures = {
      node: {
        'src': {},
        'tests': {},
        'config': {},
        'docs': {}
      },
      express: {
        'src': {
          'routes': {},
          'controllers': {},
          'models': {},
          'middleware': {},
          'utils': {}
        },
        'tests': {},
        'config': {},
        'public': {
          'css': {},
          'js': {},
          'images': {}
        }
      },
      react: {
        'src': {
          'components': {},
          'pages': {},
          'hooks': {},
          'utils': {},
          'styles': {}
        },
        'public': {},
        'tests': {}
      },
      cli: {
        'src': {
          'commands': {},
          'utils': {}
        },
        'tests': {},
        'bin': {}
      }
    };

    return structures[template] || structures.node;
  }

  /**
   * Crea estructura de carpetas recursivamente
   */
  async createStructure(basePath, structure) {
    fs.mkdirSync(basePath, { recursive: true });

    for (const [name, children] of Object.entries(structure)) {
      const dirPath = path.join(basePath, name);
      fs.mkdirSync(dirPath, { recursive: true });

      if (Object.keys(children).length > 0) {
        await this.createStructure(dirPath, children);
      }
    }
  }

  /**
   * Genera package.json según template
   */
  generatePackageJson(name, template, author, license) {
    const base = {
      name,
      version: '1.0.0',
      description: `${name} - Proyecto creado por J.A.R.V.I.S.`,
      main: template === 'cli' ? 'bin/index.js' : 'src/index.js',
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon src/index.js',
        test: 'jest'
      },
      keywords: [],
      author,
      license,
      dependencies: {},
      devDependencies: {
        'nodemon': '^3.0.0',
        'jest': '^29.0.0'
      }
    };

    // Template específico
    if (template === 'express') {
      base.dependencies.express = '^4.18.0';
      base.scripts.start = 'node src/app.js';
      base.scripts.dev = 'nodemon src/app.js';
    } else if (template === 'react') {
      base.scripts = {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      };
      base.dependencies.react = '^18.0.0';
      base.dependencies['react-dom'] = '^18.0.0';
      base.devDependencies['react-scripts'] = '^5.0.0';
    } else if (template === 'cli') {
      base.bin = {
        [name]: './bin/index.js'
      };
      base.dependencies.commander = '^11.0.0';
      base.dependencies.chalk = '^5.0.0';
    }

    return base;
  }

  /**
   * Genera README.md
   */
  generateReadme(name, template, author) {
    return `# ${name}

> Proyecto creado por J.A.R.V.I.S. - Sistema de IA de Ulmer Solier

## Descripción

Proyecto ${template} creado automáticamente.

## Instalación

\`\`\`bash
npm install
\`\`\`

## Uso

\`\`\`bash
npm start
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

## Tests

\`\`\`bash
npm test
\`\`\`

## Autor

${author}

## Licencia

MIT

---

_Generado automáticamente por J.A.R.V.I.S. el ${new Date().toLocaleDateString('es-ES')}_
`;
  }

  /**
   * Genera .gitignore
   */
  generateGitignore(template) {
    const base = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.tgz

# Logs
logs/
*.log

# Testing
coverage/
.nyc_output/
`;

    if (template === 'react') {
      return base + `
# React specific
build/
.cache/
`;
    }

    return base;
  }

  /**
   * Genera LICENSE
   */
  generateLicense(type, author) {
    const year = new Date().getFullYear();

    if (type === 'MIT') {
      return `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    }

    return `Copyright (c) ${year} ${author}. All rights reserved.`;
  }

  /**
   * Crea archivos específicos del template
   */
  async createTemplateFiles(basePath, template, projectName) {
    if (template === 'express') {
      // app.js
      fs.writeFileSync(path.join(basePath, 'src', 'app.js'), `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${projectName}!' });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});

module.exports = app;
`);
    } else if (template === 'react') {
      // index.js
      fs.writeFileSync(path.join(basePath, 'src', 'index.js'), `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);
      // App.js
      fs.writeFileSync(path.join(basePath, 'src', 'App.js'), `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to ${projectName}</h1>
      <p>Created by J.A.R.V.I.S.</p>
    </div>
  );
}

export default App;
`);
    } else if (template === 'cli') {
      // bin/index.js
      fs.writeFileSync(path.join(basePath, 'bin', 'index.js'), `#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
  .name('${projectName}')
  .description('CLI tool created by J.A.R.V.I.S.')
  .version('1.0.0');

program.parse();
`);
      // Hacer ejecutable
      try {
        fs.chmodSync(path.join(basePath, 'bin', 'index.js'), 0o755);
      } catch (e) {
        // Windows no soporta chmod
      }
    } else {
      // Default node project
      fs.writeFileSync(path.join(basePath, 'src', 'index.js'), `// ${projectName}
// Created by J.A.R.V.I.S.

console.log('Hello from ${projectName}!');

module.exports = {};
`);
    }
  }

  /**
   * Cuenta archivos creados
   */
  countFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        count += this.countFiles(fullPath);
      } else {
        count++;
      }
    });

    return count;
  }
}

export default CreateProjectAction;
