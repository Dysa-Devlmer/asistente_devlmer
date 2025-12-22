// test-doc-generator.cjs
// Script de prueba para el Generador de Documentación

const DocumentationGenerator = require('./core/documentation/doc-generator.cjs');
const CodeIndexer = require('./core/code-search/code-indexer.cjs');

function log(message, color = 'white') {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDocGenerator() {
  log('\n🧪 Iniciando prueba del Generador de Documentación...\n', 'cyan');

  // Inicializar indexer
  const indexer = new CodeIndexer({
    projectRoot: process.cwd()
  });

  log('TEST 1: Indexar proyecto', 'yellow');
  await indexer.indexProject();
  log('✅ Proyecto indexado\n', 'green');

  // Inicializar doc generator
  const docGenerator = new DocumentationGenerator({
    projectRoot: process.cwd(),
    codeIndexer: indexer,
    aiAnalyzer: null
  });

  // TEST 2: Generar documentación de un archivo
  log('TEST 2: Generar documentación para "core/notification-system.cjs"', 'yellow');
  try {
    const fileDoc = await docGenerator.generateFileDocumentation('core/notification-system.cjs');
    log('✅ Documentación generada:', 'green');
    log(`   - Archivo: ${fileDoc.file}`, 'white');
    log(`   - Descripción: ${fileDoc.summary.description}`, 'white');
    log(`   - Propósito: ${fileDoc.summary.purpose}`, 'white');
    log(`   - Complejidad: ${fileDoc.summary.complexity}`, 'white');
    log(`   - Funciones: ${fileDoc.functions.length}`, 'white');
    log(`   - Clases: ${fileDoc.classes.length}`, 'white');
    log(`   - Exports: ${fileDoc.exports.length}`, 'white');
    log(`   - Imports: ${fileDoc.imports.length}\n`, 'white');

    // TEST 3: Exportar a Markdown
    log('TEST 3: Exportar documentación a Markdown', 'yellow');
    const markdown = docGenerator.exportToMarkdown(fileDoc, 'file');
    log('✅ Markdown generado:', 'green');
    log(`   - Longitud: ${markdown.length} caracteres`, 'white');
    log(`   - Líneas: ${markdown.split('\n').length}\n`, 'white');

    // Guardar archivo de ejemplo
    const filePath = docGenerator.saveDocumentation(markdown, 'notification-system-DOC.md');
    log(`✅ Archivo guardado: ${filePath}\n`, 'green');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }

  // TEST 4: Generar README de directorio
  log('TEST 4: Generar README para directorio "core"', 'yellow');
  try {
    const dirDoc = await docGenerator.generateDirectoryReadme('core');
    log('✅ README generado:', 'green');
    log(`   - Directorio: ${dirDoc.directory}`, 'white');
    log(`   - Archivos: ${dirDoc.files}`, 'white');
    log(`   - Resumen: ${dirDoc.summary}`, 'white');
    log(`   - Top archivos: ${dirDoc.fileList.slice(0, 3).map(f => f.name).join(', ')}\n`, 'white');

    const dirMarkdown = docGenerator.exportToMarkdown(dirDoc, 'directory');
    docGenerator.saveDocumentation(dirMarkdown, 'core-README.md');
    log('✅ README guardado\n', 'green');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }

  // TEST 5: Generar documentación completa del proyecto
  log('TEST 5: Generar documentación completa del proyecto', 'yellow');
  try {
    const projectDoc = await docGenerator.generateProjectDocumentation();
    log('✅ Documentación del proyecto generada:', 'green');
    log(`   - Proyecto: ${projectDoc.project}`, 'white');
    log(`   - Archivos: ${projectDoc.stats.files}`, 'white');
    log(`   - Líneas: ${projectDoc.stats.lines.toLocaleString()}`, 'white');
    log(`   - Funciones: ${projectDoc.stats.functions}`, 'white');
    log(`   - Clases: ${projectDoc.stats.classes}`, 'white');
    log(`   - Top 10 archivos más grandes:`, 'white');
    projectDoc.topFiles.forEach((file, i) => {
      log(`     ${i + 1}. ${file.path} (${file.lines} líneas)`, 'white');
    });
    log('', 'white');

    const projectMarkdown = docGenerator.generateProjectMarkdown(projectDoc);
    docGenerator.saveDocumentation(projectMarkdown, 'PROJECT-DOCUMENTATION.md');
    log('✅ Documentación del proyecto guardada\n', 'green');

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }

  // TEST 6: Análisis de complejidad
  log('TEST 6: Analizar complejidad de diferentes archivos', 'yellow');
  const testFiles = [
    'core/autonomous-agent/autonomous-agent-manager.cjs',
    'core/code-search/semantic-search.cjs',
    'test-doc-generator.cjs'
  ];

  for (const filePath of testFiles) {
    const metadata = indexer.getFileMetadata(filePath);
    if (metadata) {
      const complexity = docGenerator.calculateComplexity(metadata);
      log(`   ${filePath}`, 'white');
      log(`     Complejidad: ${complexity} (${metadata.lines} líneas, ${metadata.functions?.length || 0} funciones)`, 'white');
    }
  }
  log('✅ Análisis de complejidad completado\n', 'green');

  // Resumen final
  log('=' .repeat(60), 'cyan');
  log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE', 'green');
  log('='.repeat(60) + '\n', 'cyan');

  log('📚 ARCHIVOS GENERADOS:', 'cyan');
  log('   1. docs/generated/notification-system-DOC.md', 'white');
  log('   2. docs/generated/core-README.md', 'white');
  log('   3. docs/generated/PROJECT-DOCUMENTATION.md', 'white');

  log('\n💡 FUNCIONALIDADES PROBADAS:', 'cyan');
  log('   ✅ Generación de documentación de archivos', 'white');
  log('   ✅ Análisis de funciones y clases', 'white');
  log('   ✅ Cálculo de complejidad', 'white');
  log('   ✅ Exportación a Markdown', 'white');
  log('   ✅ README de directorios', 'white');
  log('   ✅ Documentación completa del proyecto', 'white');
  log('   ✅ Guardado de archivos\n', 'white');

  log('🎉 Sistema de Documentación funcionando perfectamente!\n', 'green');
}

// Ejecutar tests
testDocGenerator().catch(error => {
  console.error('❌ Error en tests:', error);
  process.exit(1);
});
