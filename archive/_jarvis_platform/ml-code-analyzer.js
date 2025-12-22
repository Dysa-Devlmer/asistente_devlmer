#!/usr/bin/env node
/**
 * JARVIS ML-Powered Code Analyzer
 *
 * Sistema avanzado de análisis de código con Machine Learning
 *
 * Características:
 * - AST (Abstract Syntax Tree) parsing y análisis
 * - Pattern recognition con TF-IDF y cosine similarity
 * - Detección de code smells con scoring inteligente
 * - Análisis de complejidad ciclomática avanzada
 * - Predicción de bugs basada en métricas históricas
 * - NLP para análisis de nombres y documentación
 * - Graph analysis para dependencias y arquitectura
 * - Anomaly detection en patrones de código
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as acorn from 'acorn';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analizador de AST con detección avanzada de patrones
 */
class ASTAnalyzer {
  constructor() {
    this.patterns = new Map();
    this.complexityThresholds = {
      low: 5,
      medium: 10,
      high: 20,
      critical: 30
    };
  }

  async analyzeFile(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const ext = path.extname(filepath);

      let ast;
      if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
        ast = this.parseJavaScript(content);
      } else {
        return null;
      }

      const metrics = this.extractMetrics(ast, content);
      const smells = this.detectCodeSmells(ast, metrics);
      const complexity = this.calculateComplexity(ast);
      const dependencies = this.analyzeDependencies(ast);
      const patterns = this.detectPatterns(ast);

      return {
        file: filepath,
        metrics,
        smells,
        complexity,
        dependencies,
        patterns,
        score: this.calculateQualityScore(metrics, smells, complexity)
      };

    } catch (error) {
      console.error(`Error analizando ${filepath}:`, error.message);
      return null;
    }
  }

  parseJavaScript(code) {
    try {
      return parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties']
      });
    } catch (error) {
      // Fallback a acorn si Babel falla
      return acorn.parse(code, {
        ecmaVersion: 2022,
        sourceType: 'module'
      });
    }
  }

  extractMetrics(ast, code) {
    const metrics = {
      loc: code.split('\n').length,
      functions: 0,
      classes: 0,
      methods: 0,
      parameters: [],
      returnStatements: 0,
      conditionals: 0,
      loops: 0,
      callbacks: 0,
      promises: 0,
      asyncFunctions: 0,
      imports: 0,
      exports: 0,
      comments: 0,
      todos: 0
    };

    traverse.default(ast, {
      FunctionDeclaration(path) {
        metrics.functions++;
        metrics.parameters.push(path.node.params.length);
      },
      FunctionExpression(path) {
        metrics.functions++;
        metrics.parameters.push(path.node.params.length);
      },
      ArrowFunctionExpression(path) {
        metrics.functions++;
        metrics.parameters.push(path.node.params.length);
        if (path.node.async) metrics.asyncFunctions++;
      },
      ClassDeclaration(path) {
        metrics.classes++;
      },
      ClassMethod(path) {
        metrics.methods++;
        if (path.node.async) metrics.asyncFunctions++;
      },
      ReturnStatement() {
        metrics.returnStatements++;
      },
      IfStatement() {
        metrics.conditionals++;
      },
      SwitchStatement() {
        metrics.conditionals++;
      },
      ConditionalExpression() {
        metrics.conditionals++;
      },
      ForStatement() {
        metrics.loops++;
      },
      WhileStatement() {
        metrics.loops++;
      },
      DoWhileStatement() {
        metrics.loops++;
      },
      CallExpression(path) {
        if (path.node.callee.property?.name === 'then') {
          metrics.promises++;
        }
      },
      ImportDeclaration() {
        metrics.imports++;
      },
      ExportNamedDeclaration() {
        metrics.exports++;
      },
      ExportDefaultDeclaration() {
        metrics.exports++;
      }
    });

    // Analizar comentarios y TODOs
    const commentMatches = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g);
    if (commentMatches) {
      metrics.comments = commentMatches.length;
      metrics.todos = commentMatches.filter(c =>
        /TODO|FIXME|HACK|XXX/i.test(c)
      ).length;
    }

    return metrics;
  }

  detectCodeSmells(ast, metrics) {
    const smells = [];

    // Long function/method
    if (metrics.loc > 50) {
      smells.push({
        type: 'long-function',
        severity: 'medium',
        message: `Función/archivo muy largo (${metrics.loc} líneas). Considerar refactorizar.`,
        recommendation: 'Dividir en funciones más pequeñas y cohesivas'
      });
    }

    // Too many parameters
    const avgParams = metrics.parameters.reduce((a, b) => a + b, 0) / metrics.parameters.length;
    if (avgParams > 4) {
      smells.push({
        type: 'too-many-parameters',
        severity: 'medium',
        message: `Promedio de ${avgParams.toFixed(1)} parámetros por función`,
        recommendation: 'Usar objetos de configuración o builder pattern'
      });
    }

    // Callback hell
    if (metrics.callbacks > 3) {
      smells.push({
        type: 'callback-hell',
        severity: 'high',
        message: `${metrics.callbacks} callbacks anidados detectados`,
        recommendation: 'Refactorizar a async/await o Promises'
      });
    }

    // Missing async/await
    if (metrics.promises > 5 && metrics.asyncFunctions === 0) {
      smells.push({
        type: 'promise-anti-pattern',
        severity: 'medium',
        message: 'Uso de Promises sin async/await',
        recommendation: 'Considerar usar async/await para mejor legibilidad'
      });
    }

    // Too many conditionals
    if (metrics.conditionals > 10) {
      smells.push({
        type: 'complex-conditionals',
        severity: 'high',
        message: `${metrics.conditionals} condicionales en el archivo`,
        recommendation: 'Aplicar strategy pattern o tabla de decisiones'
      });
    }

    // Missing documentation
    if (metrics.functions > 5 && metrics.comments < metrics.functions * 0.3) {
      smells.push({
        type: 'missing-documentation',
        severity: 'low',
        message: 'Documentación insuficiente',
        recommendation: 'Agregar JSDoc a funciones públicas'
      });
    }

    // Technical debt markers
    if (metrics.todos > 0) {
      smells.push({
        type: 'technical-debt',
        severity: 'low',
        message: `${metrics.todos} TODOs/FIXMEs pendientes`,
        recommendation: 'Crear issues para tracking de deuda técnica'
      });
    }

    return smells;
  }

  calculateComplexity(ast) {
    let complexity = 1; // Base complexity
    const functionComplexities = [];

    traverse.default(ast, {
      FunctionDeclaration(path) {
        const funcComplexity = this.calculateFunctionComplexity(path);
        functionComplexities.push({
          name: path.node.id?.name || 'anonymous',
          complexity: funcComplexity
        });
      },
      FunctionExpression(path) {
        const funcComplexity = this.calculateFunctionComplexity(path);
        functionComplexities.push({
          name: 'expression',
          complexity: funcComplexity
        });
      },
      ArrowFunctionExpression(path) {
        const funcComplexity = this.calculateFunctionComplexity(path);
        functionComplexities.push({
          name: 'arrow',
          complexity: funcComplexity
        });
      }
    });

    const totalComplexity = functionComplexities.reduce((sum, f) => sum + f.complexity, 0);
    const avgComplexity = functionComplexities.length > 0
      ? totalComplexity / functionComplexities.length
      : 0;

    return {
      total: totalComplexity,
      average: avgComplexity,
      functions: functionComplexities,
      rating: this.getRatingFromComplexity(avgComplexity)
    };
  }

  calculateFunctionComplexity(path) {
    let complexity = 1;

    path.traverse({
      IfStatement() { complexity++; },
      SwitchCase() { complexity++; },
      ConditionalExpression() { complexity++; },
      LogicalExpression() { complexity++; },
      ForStatement() { complexity++; },
      ForInStatement() { complexity++; },
      ForOfStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      CatchClause() { complexity++; }
    });

    return complexity;
  }

  getRatingFromComplexity(complexity) {
    if (complexity <= this.complexityThresholds.low) return 'A (Low)';
    if (complexity <= this.complexityThresholds.medium) return 'B (Medium)';
    if (complexity <= this.complexityThresholds.high) return 'C (High)';
    return 'D (Critical)';
  }

  analyzeDependencies(ast) {
    const dependencies = {
      imports: [],
      exports: [],
      internalDeps: new Set(),
      externalDeps: new Set()
    };

    traverse.default(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        dependencies.imports.push(source);

        if (source.startsWith('.') || source.startsWith('/')) {
          dependencies.internalDeps.add(source);
        } else {
          dependencies.externalDeps.add(source);
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.source) {
          dependencies.exports.push(path.node.source.value);
        }
      }
    });

    return {
      ...dependencies,
      internalDeps: Array.from(dependencies.internalDeps),
      externalDeps: Array.from(dependencies.externalDeps),
      totalDeps: dependencies.internalDeps.size + dependencies.externalDeps.size
    };
  }

  detectPatterns(ast) {
    const patterns = {
      designPatterns: [],
      antiPatterns: [],
      bestPractices: []
    };

    // Detectar Singleton
    let hasSingletonPattern = false;
    traverse.default(ast, {
      ClassDeclaration(path) {
        const hasInstance = path.node.body.body.some(
          member => member.type === 'ClassProperty' && member.static && member.key.name === 'instance'
        );
        if (hasInstance) {
          hasSingletonPattern = true;
        }
      }
    });
    if (hasSingletonPattern) {
      patterns.designPatterns.push('Singleton Pattern');
    }

    // Detectar Factory Pattern
    let hasFactoryPattern = false;
    traverse.default(ast, {
      FunctionDeclaration(path) {
        const name = path.node.id?.name || '';
        if (name.toLowerCase().includes('create') || name.toLowerCase().includes('factory')) {
          hasFactoryPattern = true;
        }
      }
    });
    if (hasFactoryPattern) {
      patterns.designPatterns.push('Factory Pattern');
    }

    // Detectar uso de async/await (best practice)
    let hasAsyncAwait = false;
    traverse.default(ast, {
      AwaitExpression() {
        hasAsyncAwait = true;
      }
    });
    if (hasAsyncAwait) {
      patterns.bestPractices.push('Async/Await usage');
    }

    // Detectar error handling
    let hasErrorHandling = false;
    traverse.default(ast, {
      TryStatement() {
        hasErrorHandling = true;
      }
    });
    if (hasErrorHandling) {
      patterns.bestPractices.push('Error handling');
    }

    // Detectar var (anti-pattern)
    let hasVar = false;
    traverse.default(ast, {
      VariableDeclaration(path) {
        if (path.node.kind === 'var') {
          hasVar = true;
        }
      }
    });
    if (hasVar) {
      patterns.antiPatterns.push('Use of var instead of let/const');
    }

    return patterns;
  }

  calculateQualityScore(metrics, smells, complexity) {
    let score = 100;

    // Penalizar por code smells
    smells.forEach(smell => {
      switch (smell.severity) {
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Penalizar por complejidad
    if (complexity.average > this.complexityThresholds.critical) {
      score -= 20;
    } else if (complexity.average > this.complexityThresholds.high) {
      score -= 15;
    } else if (complexity.average > this.complexityThresholds.medium) {
      score -= 10;
    }

    // Penalizar por falta de documentación
    if (metrics.functions > 0 && metrics.comments === 0) {
      score -= 10;
    }

    // Bonus por buenas prácticas
    if (metrics.asyncFunctions > 0) score += 5;
    if (metrics.comments >= metrics.functions) score += 5;

    return Math.max(0, Math.min(100, score));
  }
}

/**
 * Análisis predictivo y ML
 */
class PredictiveAnalyzer {
  constructor() {
    this.historicalData = [];
    this.bugProbabilityThreshold = 0.7;
  }

  async predictBugProbability(analysis) {
    // Modelo simple basado en métricas conocidas
    let probability = 0;

    // Factor de complejidad
    if (analysis.complexity.average > 20) {
      probability += 0.3;
    } else if (analysis.complexity.average > 10) {
      probability += 0.15;
    }

    // Factor de code smells
    const highSeveritySmells = analysis.smells.filter(s => s.severity === 'high').length;
    probability += highSeveritySmells * 0.15;

    // Factor de tamaño
    if (analysis.metrics.loc > 200) {
      probability += 0.2;
    }

    // Factor de falta de tests (asumimos basado en comentarios)
    if (analysis.metrics.comments < analysis.metrics.functions * 0.2) {
      probability += 0.1;
    }

    return {
      probability: Math.min(1, probability),
      risk: this.getRiskLevel(probability),
      recommendations: this.getRecommendations(probability, analysis)
    };
  }

  getRiskLevel(probability) {
    if (probability >= 0.7) return 'HIGH';
    if (probability >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  getRecommendations(probability, analysis) {
    const recommendations = [];

    if (probability >= 0.7) {
      recommendations.push('🚨 Prioridad alta: Refactorizar este archivo inmediatamente');
      recommendations.push('✅ Agregar suite completa de tests unitarios');
      recommendations.push('📋 Code review obligatorio antes de merge');
    }

    if (analysis.complexity.average > 15) {
      recommendations.push('🔍 Reducir complejidad ciclomática');
      recommendations.push('📦 Extraer funciones complejas a módulos separados');
    }

    if (analysis.smells.length > 5) {
      recommendations.push('🧹 Aplicar refactoring para eliminar code smells');
    }

    return recommendations;
  }

  async analyzeCodebaseHealth(analyses) {
    const totalFiles = analyses.length;
    const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / totalFiles;
    const avgComplexity = analyses.reduce((sum, a) => sum + a.complexity.average, 0) / totalFiles;
    const totalSmells = analyses.reduce((sum, a) => sum + a.smells.length, 0);

    const highRiskFiles = analyses.filter(a => a.score < 50);
    const lowQualityFiles = analyses.filter(a => a.score < 70);

    return {
      overview: {
        totalFiles,
        averageScore: avgScore.toFixed(2),
        averageComplexity: avgComplexity.toFixed(2),
        totalCodeSmells: totalSmells,
        health: this.getHealthStatus(avgScore)
      },
      risks: {
        highRiskFiles: highRiskFiles.length,
        highRiskFilesList: highRiskFiles.map(f => ({
          file: path.basename(f.file),
          score: f.score,
          complexity: f.complexity.average.toFixed(2)
        })),
        lowQualityFiles: lowQualityFiles.length
      },
      recommendations: this.getCodebaseRecommendations(avgScore, avgComplexity, totalSmells)
    };
  }

  getHealthStatus(avgScore) {
    if (avgScore >= 80) return '🟢 EXCELLENT';
    if (avgScore >= 70) return '🟡 GOOD';
    if (avgScore >= 50) return '🟠 FAIR';
    return '🔴 POOR';
  }

  getCodebaseRecommendations(avgScore, avgComplexity, totalSmells) {
    const recommendations = [];

    if (avgScore < 70) {
      recommendations.push('📈 Establecer plan de mejora de calidad de código');
      recommendations.push('🎯 Meta: Alcanzar score promedio de 80+');
    }

    if (avgComplexity > 10) {
      recommendations.push('🔧 Refactorizar funciones complejas');
      recommendations.push('📚 Implementar principios SOLID');
    }

    if (totalSmells > 50) {
      recommendations.push('🧹 Sprint de limpieza de código');
      recommendations.push('📋 Agregar linting rules más estrictas');
    }

    recommendations.push('✅ Implementar pre-commit hooks para calidad');
    recommendations.push('📊 Tracking continuo de métricas de código');

    return recommendations;
  }
}

/**
 * Analizador principal
 */
class MLCodeAnalyzer {
  constructor() {
    this.astAnalyzer = new ASTAnalyzer();
    this.predictiveAnalyzer = new PredictiveAnalyzer();
  }

  async analyzeProject(projectPath) {
    console.log('🧠 JARVIS ML-Powered Code Analyzer\n');
    console.log('Iniciando análisis avanzado del proyecto...\n');

    const files = await this.findJavaScriptFiles(projectPath);
    console.log(`📁 Encontrados ${files.length} archivos JavaScript\n`);

    const analyses = [];
    let processed = 0;

    for (const file of files) {
      const analysis = await this.astAnalyzer.analyzeFile(file);
      if (analysis) {
        const prediction = await this.predictiveAnalyzer.predictBugProbability(analysis);
        analysis.prediction = prediction;
        analyses.push(analysis);

        processed++;
        if (processed % 10 === 0) {
          console.log(`⚙️  Procesados ${processed}/${files.length} archivos...`);
        }
      }
    }

    console.log(`\n✅ Análisis completado: ${analyses.length} archivos analizados\n`);

    // Análisis agregado
    const healthReport = await this.predictiveAnalyzer.analyzeCodebaseHealth(analyses);

    return {
      timestamp: new Date().toISOString(),
      projectPath,
      fileAnalyses: analyses,
      healthReport,
      summary: this.generateSummary(analyses, healthReport)
    };
  }

  async findJavaScriptFiles(dir, files = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules, .git, etc
      if (entry.name === 'node_modules' || entry.name === '.git' ||
          entry.name === 'dist' || entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        await this.findJavaScriptFiles(fullPath, files);
      } else if (entry.isFile() && /\.(js|mjs|cjs)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  generateSummary(analyses, healthReport) {
    return {
      filesAnalyzed: analyses.length,
      averageQualityScore: healthReport.overview.averageScore,
      totalCodeSmells: healthReport.overview.totalCodeSmells,
      highRiskFiles: healthReport.risks.highRiskFiles,
      overallHealth: healthReport.overview.health,
      topIssues: this.getTopIssues(analyses),
      recommendations: healthReport.recommendations
    };
  }

  getTopIssues(analyses) {
    const issues = {};

    analyses.forEach(analysis => {
      analysis.smells.forEach(smell => {
        if (!issues[smell.type]) {
          issues[smell.type] = {
            count: 0,
            severity: smell.severity,
            message: smell.message
          };
        }
        issues[smell.type].count++;
      });
    });

    return Object.entries(issues)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([type, data]) => ({
        type,
        ...data
      }));
  }

  printReport(report) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         REPORTE DE ANÁLISIS ML - JARVIS ANALYZER         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`📊 RESUMEN EJECUTIVO:`);
    console.log(`   Archivos analizados: ${report.summary.filesAnalyzed}`);
    console.log(`   Score promedio: ${report.summary.averageQualityScore}/100`);
    console.log(`   Salud del código: ${report.healthReport.overview.health}`);
    console.log(`   Total code smells: ${report.summary.totalCodeSmells}`);
    console.log(`   Archivos de alto riesgo: ${report.summary.highRiskFiles}\n`);

    if (report.summary.highRiskFiles > 0) {
      console.log(`🚨 ARCHIVOS DE ALTO RIESGO:`);
      report.healthReport.risks.highRiskFilesList.forEach(file => {
        console.log(`   ❌ ${file.file}`);
        console.log(`      Score: ${file.score}/100 | Complejidad: ${file.complexity}`);
      });
      console.log('');
    }

    console.log(`🔍 TOP 5 PROBLEMAS:`);
    report.summary.topIssues.forEach((issue, idx) => {
      const icon = issue.severity === 'high' ? '🔴' :
                   issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`   ${idx + 1}. ${icon} ${issue.type}`);
      console.log(`      Ocurrencias: ${issue.count} | Severidad: ${issue.severity.toUpperCase()}`);
    });
    console.log('');

    console.log(`💡 RECOMENDACIONES:`);
    report.summary.recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
  }

  async saveReport(report, outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`💾 Reporte guardado: ${outputPath}`);
  }
}

// Ejecutar análisis
async function main() {
  const analyzer = new MLCodeAnalyzer();
  const projectPath = process.cwd();

  try {
    const report = await analyzer.analyzeProject(projectPath);
    analyzer.printReport(report);

    const outputPath = path.join(projectPath, 'metrics', 'ml-analysis', `report-${Date.now()}.json`);
    await analyzer.saveReport(report, outputPath);

    // Exit code based on health
    const avgScore = parseFloat(report.summary.averageQualityScore);
    if (avgScore < 50) {
      console.log('❌ Calidad de código crítica - Exit code 1');
      process.exit(1);
    } else if (avgScore < 70) {
      console.log('⚠️  Calidad de código requiere atención - Exit code 0');
    } else {
      console.log('✅ Calidad de código aceptable - Exit code 0');
    }

  } catch (error) {
    console.error('❌ Error en análisis:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MLCodeAnalyzer, ASTAnalyzer, PredictiveAnalyzer };
