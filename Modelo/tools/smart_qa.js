// Mejorar el sistema de Q&A con agregaciones inteligentes
const path = require('path');

const { loadIndex, search } = require('../src/store');
const { embedQuery } = require('../src/embeddings');
const { generateAnswer } = require('../src/qa');

// Detectar si la pregunta es sobre conteo o listado
function detectQueryType(question) {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('cuántos') || lowerQ.includes('cuantos') || 
      lowerQ.includes('número') || lowerQ.includes('total')) {
    if (lowerQ.includes('trabajador') || lowerQ.includes('empleado') || 
        lowerQ.includes('personal')) {
      return 'count_workers';
    }
    if (lowerQ.includes('producto') || lowerQ.includes('artículo')) {
      return 'count_products';
    }
    if (lowerQ.includes('venta') || lowerQ.includes('ventas')) {
      return 'count_sales';
    }
    if (lowerQ.includes('proveedor') || lowerQ.includes('supplier')) {
      return 'count_suppliers';
    }
    return 'count_general';
  }
  
  if (lowerQ.includes('lista') || lowerQ.includes('todos') || 
      lowerQ.includes('nombres') || lowerQ.includes('quiénes') || 
      lowerQ.includes('quienes')) {
    if (lowerQ.includes('trabajador') || lowerQ.includes('empleado') || 
        lowerQ.includes('personal')) {
      return 'list_workers';
    }
    if (lowerQ.includes('producto')) {
      return 'list_products';
    }
    if (lowerQ.includes('proveedor')) {
      return 'list_suppliers';
    }
    return 'list_general';
  }
  
  return 'semantic_search';
}

// Obtener respuesta agregada para conteos específicos
function getAggregatedAnswer(queryType, index) {
  switch (queryType) {
    case 'count_workers':
    case 'list_workers':
      const workers = index.vectors.filter(doc => 
        doc.meta && doc.meta.collection === 'workers'
      );
      if (queryType === 'count_workers') {
        return `En el sistema hay registrados **${workers.length} trabajadores** en total.

Los trabajadores registrados son:
${workers.map((w, i) => `${i + 1}. ${w.meta.title}`).join('\n')}`;
      } else {
        return `**Lista completa de trabajadores:**

${workers.map((w, i) => `${i + 1}. ${w.meta.title}`).join('\n')}

**Total: ${workers.length} trabajadores registrados**`;
      }
      
    case 'count_products':
    case 'list_products':
      const products = index.vectors.filter(doc => 
        doc.meta && doc.meta.collection === 'products'
      );
      if (queryType === 'count_products') {
        return `Hay **${products.length} productos** registrados en el catálogo.`;
      } else {
        return `**Lista de productos:**
${products.map((p, i) => `${i + 1}. ${p.meta.title}`).join('\n')}`;
      }
      
    case 'count_sales':
      const sales = index.vectors.filter(doc => 
        doc.meta && doc.meta.collection === 'sales'
      );
      return `Hay **${sales.length} registros de ventas** en el sistema.`;
      
    case 'count_suppliers':
    case 'list_suppliers':
      const suppliers = index.vectors.filter(doc => 
        doc.meta && doc.meta.collection === 'suppliers'
      );
      if (queryType === 'count_suppliers') {
        return `Hay **${suppliers.length} proveedores** registrados.`;
      } else {
        return `**Lista de proveedores:**
${suppliers.map((s, i) => `${i + 1}. ${s.meta.title}`).join('\n')}`;
      }
      
    default:
      return null;
  }
}

async function smartAskQuestion(question) {
  try {
    console.log(`\n🤖 Pregunta: ${question}`);
    console.log('⏳ Analizando tipo de consulta...');
    
    const index = loadIndex();
    const queryType = detectQueryType(question);
    
    console.log(`🎯 Tipo de consulta detectado: ${queryType}`);
    
    // Si es una consulta de agregación, dar respuesta directa
    if (queryType !== 'semantic_search') {
      const aggregatedAnswer = getAggregatedAnswer(queryType, index);
      if (aggregatedAnswer) {
        console.log(`\n✅ Respuesta (agregación directa): ${aggregatedAnswer}`);
        return;
      }
    }
    
    // Si no, usar búsqueda semántica normal
    console.log('🔍 Usando búsqueda semántica...');
    const queryVector = await embedQuery(question);
    
    // Para listas/conteos, buscar más resultados y filtrar por colección relevante
    let topK = 4;
    let collectionFilter = null;
    
    if (queryType.includes('workers')) {
      topK = 15;
      collectionFilter = 'workers';
    } else if (queryType.includes('products')) {
      topK = 10;
      collectionFilter = 'products';
    }
    
    const results = search(index, queryVector, topK);
    
    // Filtrar por colección si es necesario
    let filteredResults = results;
    if (collectionFilter) {
      const collectionResults = results.filter(r => r.meta?.collection === collectionFilter);
      if (collectionResults.length > 0) {
        filteredResults = collectionResults.slice(0, 4);
      }
    }
    
    console.log(`🔍 Se encontraron ${filteredResults.length} documentos relevantes`);
    
    const answer = await generateAnswer(question, filteredResults);
    console.log(`\n✅ Respuesta: ${answer}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function runSmartTests() {
  console.log('🧠 Iniciando pruebas del sistema inteligente de Q&A...');
  
  const questions = [
    "¿Cuántos trabajadores hay registrados en el sistema?",
    "Dame la lista completa de todos los trabajadores",
    "¿Cuántos productos tenemos?",
    "¿Qué productos están disponibles?",
    "¿Cuántos proveedores hay?",
    "Lista todos los proveedores"
  ];
  
  for (const question of questions) {
    await smartAskQuestion(question);
    console.log('\n' + '='.repeat(80));
  }
  
  console.log('\n🎉 Pruebas completadas!');
}

if (require.main === module) {
  runSmartTests().catch(console.error);
}

module.exports = { smartAskQuestion, detectQueryType };