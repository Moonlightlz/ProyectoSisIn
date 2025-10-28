// Función para agregar información de conteos y listas completas
const path = require('path');

const { loadIndex } = require('../src/store');

function getWorkersCount() {
  const index = loadIndex();
  const workerDocs = index.vectors.filter(doc => 
    doc.meta && doc.meta.collection === 'workers'
  );
  
  return {
    count: workerDocs.length,
    workers: workerDocs.map(doc => ({
      name: doc.meta.title || 'Sin nombre',
      id: doc.meta.docId,
      content: doc.text
    }))
  };
}

function getCollectionStats() {
  const index = loadIndex();
  const stats = {};
  
  index.vectors.forEach(doc => {
    const collection = doc.meta?.collection || 'unknown';
    if (!stats[collection]) {
      stats[collection] = { count: 0, documents: [] };
    }
    stats[collection].count++;
    stats[collection].documents.push({
      id: doc.meta?.docId || 'unknown',
      title: doc.meta?.title || 'Sin título'
    });
  });
  
  return stats;
}

function analyzeCollections() {
  console.log('📊 Estadísticas de colecciones:\n');
  
  const stats = getCollectionStats();
  
  Object.entries(stats).forEach(([collection, data]) => {
    console.log(`📁 ${collection}: ${data.count} documentos`);
  });
  
  console.log('\n👥 Análisis detallado de trabajadores:');
  const workersInfo = getWorkersCount();
  console.log(`Total de trabajadores: ${workersInfo.count}`);
  
  console.log('\n📋 Lista completa de trabajadores:');
  workersInfo.workers.forEach((worker, i) => {
    console.log(`${i + 1}. ${worker.name}`);
  });
}

if (require.main === module) {
  analyzeCollections();
}

module.exports = { getWorkersCount, getCollectionStats };