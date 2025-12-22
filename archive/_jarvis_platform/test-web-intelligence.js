// test-web-intelligence.js
// Script de prueba para JARVIS Web Intelligence System

const WebIntelligenceManager = require('./core/web-intelligence/web-intelligence-manager.cjs');

async function test() {
  console.log('🚀 Iniciando test de JARVIS Web Intelligence...\n');

  const webIntel = new WebIntelligenceManager({
    projectRoot: __dirname,
    maxSearchResults: 3
  });

  await webIntel.initialize();

  // Test 1: Aprender sobre un tema
  console.log('\n📚 TEST 1: Aprender sobre React Hooks\n');
  const learningResult = await webIntel.learnAbout('React hooks tutorial');

  if (learningResult.success) {
    console.log(`✅ Aprendizaje exitoso!`);
    console.log(`   - ${learningResult.knowledgeCount} fuentes procesadas`);
    console.log(`   - Promedio de confianza: ${learningResult.summary.avgConfidence}`);
  } else {
    console.log(`❌ Error: ${learningResult.message}`);
  }

  // Test 2: Query sobre lo aprendido
  console.log('\n❓ TEST 2: Query sobre React Hooks\n');
  const queryResult = await webIntel.query('¿Cómo usar useState en React?');

  if (queryResult.success) {
    console.log(`✅ Respuesta generada!`);
    console.log(`   - ${queryResult.sources} fuentes consultadas`);
    console.log(`\n   Respuesta:\n   ${queryResult.answer}`);
  } else {
    console.log(`❌ Error: ${queryResult.message}`);
  }

  // Estadísticas
  console.log('\n📊 Estadísticas:');
  const stats = webIntel.getStats();
  console.log(`   - Total búsquedas: ${stats.totalSearches}`);
  console.log(`   - Total conocimientos: ${stats.totalKnowledge}`);
  console.log(`   - Total conceptos: ${stats.totalConcepts}`);
}

test().catch(console.error);
