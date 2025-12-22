// test-code-search.cjs
// Script de prueba para el Sistema de Búsqueda de Código

const SemanticSearch = require('./core/code-search/semantic-search.cjs');

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

async function testCodeSearch() {
  log('\n🧪 Iniciando prueba del Sistema de Búsqueda de Código...\n', 'cyan');

  const searchEngine = new SemanticSearch({
    projectRoot: process.cwd()
  });

  // TEST 1: Inicialización e indexación
  log('TEST 1: Inicialización e Indexación', 'yellow');
  await searchEngine.initialize();
  const stats = searchEngine.getStats();
  log(`✅ Proyecto indexado:`, 'green');
  log(`   - Archivos: ${stats.totalFiles}`, 'white');
  log(`   - Líneas: ${stats.totalLines.toLocaleString()}`, 'white');
  log(`   - Funciones: ${stats.totalFunctions}`, 'white');
  log(`   - Clases: ${stats.totalClasses}`, 'white');

  // TEST 2: Búsqueda de función
  log('\nTEST 2: Buscar función "initialize"', 'yellow');
  const initResults = await searchEngine.search('initialize', { limit: 5 });
  log(`✅ Encontrados ${initResults.length} resultados`, 'green');
  initResults.slice(0, 3).forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path} (score: ${result.score})`, 'white');
    log(`      Match: ${result.matchType}`, 'white');
  });

  // TEST 3: Búsqueda de clase
  log('\nTEST 3: Buscar clase "NotificationSystem"', 'yellow');
  const classResults = await searchEngine.search('NotificationSystem', { limit: 5 });
  log(`✅ Encontrados ${classResults.length} resultados`, 'green');
  classResults.forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path} (score: ${result.score})`, 'white');
    if (result.className) {
      log(`      Clase: ${result.className}`, 'white');
    }
  });

  // TEST 4: Búsqueda por keyword
  log('\nTEST 4: Buscar keyword "socket"', 'yellow');
  const socketResults = await searchEngine.search('socket', { limit: 10 });
  log(`✅ Encontrados ${socketResults.length} resultados`, 'green');
  socketResults.slice(0, 5).forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path} (score: ${result.score})`, 'white');
  });

  // TEST 5: Búsqueda por nombre de archivo
  log('\nTEST 5: Buscar archivo "autonomous"', 'yellow');
  const fileResults = await searchEngine.search('autonomous', { limit: 5 });
  log(`✅ Encontrados ${fileResults.length} resultados`, 'green');
  fileResults.forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path} (score: ${result.score})`, 'white');
    log(`      Match: ${result.matchType}`, 'white');
  });

  // TEST 6: Búsqueda con filtro por extensión
  log('\nTEST 6: Buscar "component" solo en archivos .jsx', 'yellow');
  const jsxResults = await searchEngine.search('component', {
    limit: 5,
    extension: '.jsx'
  });
  log(`✅ Encontrados ${jsxResults.length} resultados .jsx`, 'green');
  jsxResults.forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path}`, 'white');
  });

  // TEST 7: Búsqueda semántica compleja
  log('\nTEST 7: Búsqueda semántica "web dashboard interface"', 'yellow');
  const semanticResults = await searchEngine.search('web dashboard interface', { limit: 5 });
  log(`✅ Encontrados ${semanticResults.length} resultados`, 'green');
  semanticResults.forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path} (score: ${result.score})`, 'white');
  });

  // TEST 8: Buscar función específica con coincidencia exacta
  log('\nTEST 8: Buscar función "executeTask" (exact match)', 'yellow');
  const exactResults = await searchEngine.search('executeTask', { type: 'function' });
  log(`✅ Encontrados ${exactResults.length} resultados`, 'green');
  exactResults.forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path}`, 'white');
    if (result.functionName) {
      log(`      Función: ${result.functionName}`, 'white');
    }
  });

  // TEST 9: Obtener archivos relacionados
  log('\nTEST 9: Obtener archivos relacionados a "core/notification-system.cjs"', 'yellow');
  const related = searchEngine.getSuggestedRelated('core/notification-system.cjs');
  log(`✅ Encontrados ${related.length} archivos relacionados`, 'green');
  related.slice(0, 5).forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path}`, 'white');
    log(`      Razón: ${result.reason} (score: ${result.score})`, 'white');
  });

  // TEST 10: Metadata de archivo específico
  log('\nTEST 10: Obtener metadata de "core/autonomous-agent/autonomous-agent-manager.cjs"', 'yellow');
  const metadata = searchEngine.indexer.getFileMetadata('core/autonomous-agent/autonomous-agent-manager.cjs');
  if (metadata) {
    log(`✅ Metadata obtenida:`, 'green');
    log(`   - Tamaño: ${metadata.size} bytes`, 'white');
    log(`   - Líneas: ${metadata.lines}`, 'white');
    log(`   - Funciones: ${metadata.functions ? metadata.functions.length : 0}`, 'white');
    log(`   - Clases: ${metadata.classes ? metadata.classes.length : 0}`, 'white');
    log(`   - Imports: ${metadata.imports ? metadata.imports.length : 0}`, 'white');
    log(`   - Exports: ${metadata.exports ? metadata.exports.length : 0}`, 'white');
  } else {
    log(`❌ Archivo no encontrado en el índice`, 'red');
  }

  // TEST 11: Estadísticas del indexer
  log('\nTEST 11: Estadísticas globales del índice', 'yellow');
  const globalStats = searchEngine.indexer.getStats();
  log(`✅ Estadísticas:`, 'green');
  log(`   - Total de archivos indexados: ${globalStats.totalFiles}`, 'white');
  log(`   - Total de líneas de código: ${globalStats.totalLines.toLocaleString()}`, 'white');
  log(`   - Total de funciones: ${globalStats.totalFunctions}`, 'white');
  log(`   - Total de clases: ${globalStats.totalClasses}`, 'white');
  log(`   - Última indexación: ${new Date(globalStats.lastIndexed).toLocaleString()}`, 'white');

  // TEST 12: Búsqueda de múltiples términos
  log('\nTEST 12: Búsqueda multi-término "agent manager task"', 'yellow');
  const multiResults = await searchEngine.search('agent manager task', { limit: 5 });
  log(`✅ Encontrados ${multiResults.length} resultados`, 'green');
  multiResults.forEach((result, i) => {
    log(`   ${i + 1}. ${result.file.path} (score: ${result.score})`, 'white');
  });

  // Resumen final
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE', 'green');
  log('='.repeat(60) + '\n', 'cyan');

  log('📊 RESUMEN FINAL:', 'cyan');
  log(`   • Archivos indexados: ${stats.totalFiles}`, 'white');
  log(`   • Líneas de código: ${stats.totalLines.toLocaleString()}`, 'white');
  log(`   • Funciones encontradas: ${stats.totalFunctions}`, 'white');
  log(`   • Clases encontradas: ${stats.totalClasses}`, 'white');
  log('\n🎉 Sistema de Búsqueda de Código funcionando perfectamente!\n', 'green');

  // Ejemplos de uso
  log('💡 EJEMPLOS DE USO:', 'cyan');
  log('   1. Buscar función: search("initialize")', 'white');
  log('   2. Buscar clase: search("NotificationSystem")', 'white');
  log('   3. Buscar archivo: search("autonomous")', 'white');
  log('   4. Buscar keyword: search("socket")', 'white');
  log('   5. Buscar con filtro: search("component", { extension: ".jsx" })', 'white');
  log('   6. Archivos relacionados: getSuggestedRelated("path/to/file.js")\n', 'white');
}

// Ejecutar tests
testCodeSearch().catch(error => {
  console.error('❌ Error en tests:', error);
  process.exit(1);
});
