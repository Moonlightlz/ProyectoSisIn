// Script para analizar la colección de trabajadores
const path = require('path');

const { loadIndex } = require('../src/store');

function analyzeWorkersData() {
  console.log('🔍 Analizando datos de trabajadores en el índice...\n');
  
  const index = loadIndex();
  console.log(`📚 Total de vectores en el índice: ${index.vectors.length}\n`);
  
  // Filtrar solo documentos de la colección workers
  const workerDocs = index.vectors.filter(doc => 
    doc.meta && doc.meta.collection === 'workers'
  );
  
  console.log(`👥 Documentos de trabajadores encontrados: ${workerDocs.length}\n`);
  
  if (workerDocs.length > 0) {
    console.log('📋 Lista de trabajadores en el índice:');
    workerDocs.forEach((doc, i) => {
      console.log(`\n${i + 1}. ID: ${doc.meta.docId}`);
      console.log(`   Título: ${doc.meta.title}`);
      console.log(`   Contenido (primeros 200 caracteres):`);
      console.log(`   "${doc.text.substring(0, 200)}..."`);
    });
  }
  
  // También analizar documentos de attendance que podrían tener info de trabajadores
  const attendanceDocs = index.vectors.filter(doc => 
    doc.meta && doc.meta.collection === 'attendance'
  );
  
  console.log(`\n📅 Documentos de asistencia encontrados: ${attendanceDocs.length}`);
  
  if (attendanceDocs.length > 0) {
    console.log('\n📋 Muestra de registros de asistencia (primeros 3):');
    attendanceDocs.slice(0, 3).forEach((doc, i) => {
      console.log(`\n${i + 1}. ID: ${doc.meta.docId}`);
      console.log(`   Contenido: "${doc.text.substring(0, 150)}..."`);
    });
  }
}

if (require.main === module) {
  analyzeWorkersData();
}