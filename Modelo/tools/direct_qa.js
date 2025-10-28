// Script para hacer preguntas directamente sin servidor HTTP
const path = require('path');

const { loadIndex, search } = require('../src/store');
const { embedQuery } = require('../src/embeddings');
const { generateAnswer } = require('../src/qa');

async function askQuestion(question) {
  try {
    console.log(`\n🤖 Pregunta: ${question}`);
    console.log('⏳ Procesando...');
    
    // Cargar índice
    const index = loadIndex();
    console.log(`📚 Índice cargado con ${index.vectors.length} vectores`);
    
    // Generar embedding de la pregunta
    const queryVector = await embedQuery(question);
    
    // Buscar documentos relevantes
    const results = search(index, queryVector, 4);
    
    if (results.length === 0) {
      console.log('❌ No se encontraron documentos relevantes');
      return;
    }
    
    console.log(`🔍 Se encontraron ${results.length} documentos relevantes`);
    
    // Generar respuesta
    const answer = await generateAnswer(question, results);
    
    console.log(`\n✅ Respuesta: ${answer}`);
    console.log(`\n📋 Fuentes consultadas:`);
    results.forEach((result, i) => {
      const collection = result.meta?.collection || 'Desconocida';
      const docId = result.meta?.docId || 'N/A';
      const score = result.score ? result.score.toFixed(3) : 'N/A';
      console.log(`   ${i + 1}. ${collection}/${docId} (Score: ${score})`);
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas directas del sistema Q&A...');
  
  const questions = [
    "¿Cuántos trabajadores hay registrados en el sistema?",
    "¿Qué productos están disponibles?",
    "¿Cuáles son los proveedores registrados?",
    "¿Qué materiales están en inventario?",
    "¿Hay información sobre ventas?"
  ];
  
  for (const question of questions) {
    await askQuestion(question);
    console.log('\n' + '='.repeat(80));
  }
  
  console.log('\n🎉 Pruebas completadas!');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { askQuestion };