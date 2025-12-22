#!/usr/bin/env node
/**
 * JARVIS - Prueba Rápida de API
 */

import axios from 'axios';

const API = 'http://localhost:7777/api';

console.log('\n🤖 JARVIS - Prueba Rápida de API\n');
console.log('═══════════════════════════════════\n');

try {
  // 1. Dashboard
  const dash = await axios.get(`${API}/dashboard`);
  console.log('✅ Dashboard:', {
    memorias: dash.data.memory.total,
    tareas_totales: dash.data.tasks.total,
    tareas_pendientes: dash.data.tasks.pending,
    estado: dash.data.system.status,
    uptime: Math.floor(dash.data.system.uptime / 60) + 'm'
  });

  // 2. Búsqueda de código
  const search = await axios.post(`${API}/code-search`, {
    query: 'jarvis',
    mode: 'keyword'
  });
  console.log('\n✅ Búsqueda:', search.data.results?.length || 0, 'resultados');

  // 3. Métricas
  const metrics = await axios.get(`${API}/performance/metrics`);
  console.log('\n✅ Métricas:', {
    operaciones: metrics.data.operations || 0,
    cache: metrics.data.cache?.hits || 0
  });

  console.log('\n═══════════════════════════════════');
  console.log('✅ API funcionando correctamente!');
  console.log('\n📱 Dashboard: http://localhost:5173');
  console.log('🌐 API: http://localhost:7777/api\n');

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
