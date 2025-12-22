// test-autocommit.js
// Script de prueba para validar el flujo completo de Auto-Commit

// Issue intencional: uso de eval() (security vulnerability)
const userInput = '{"name": "test"}';
const result = eval('(' + userInput + ')'); // Security issue: eval usage

console.log('Resultado:', result);

// Issue intencional: null reference sin validación
function processData(data) {
  return data.value.toString(); // Potential null reference
}

// Issue intencional: missing error handling
async function fetchData(url) {
  const response = await fetch(url); // Missing error handling
  return response.json();
}

console.log('Test Auto-Commit completado');
