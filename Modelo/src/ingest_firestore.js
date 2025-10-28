const fs = require('fs');
const admin = require('firebase-admin');
const { config } = require('./config');
const { chunkText } = require('./chunking');
const { embedTexts } = require('./embeddings');
const { loadIndex, saveIndex, upsertDocuments } = require('./store');

async function initFirestore() {
  if (!config.serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT no configurado en .env');
  }
  const serviceAccount = JSON.parse(fs.readFileSync(config.serviceAccountPath, 'utf-8'));
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin.firestore();
}

function flattenDocData(data, collectionName) {
  const parts = [];
  
  // Agregar contexto de la colección
  const collectionContext = getCollectionContext(collectionName);
  if (collectionContext) {
    parts.push(collectionContext);
  }
  
  function walk(obj, prefix = '') {
    for (const [k, v] of Object.entries(obj || {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v == null) continue;
      
      // Formatear campos de manera más legible
      const friendlyKey = getFriendlyFieldName(k, collectionName);
      
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        parts.push(`${friendlyKey}: ${v}`);
      } else if (Array.isArray(v)) {
        const arrayStr = v.map((x) => {
          if (typeof x === 'object' && x !== null) {
            return JSON.stringify(x);
          }
          return String(x);
        }).join(', ');
        parts.push(`${friendlyKey}: ${arrayStr}`);
      } else if (typeof v === 'object') {
        // Para objetos anidados, expandir con contexto
        if (k === 'timestamp' || k === 'createdAt' || k === 'updatedAt') {
          const date = v.toDate ? v.toDate() : new Date(v);
          parts.push(`${friendlyKey}: ${date.toLocaleDateString('es-ES')}`);
        } else {
          walk(v, key);
        }
      }
    }
  }
  walk(data);
  return parts.join('\n');
}

function getCollectionContext(collectionName) {
  const contexts = {
    'workers': 'Información de trabajadores y empleados de la empresa',
    'users': 'Datos de usuarios del sistema',
    'productos': 'Catálogo de productos disponibles',
    'sales': 'Registro de ventas realizadas',
    'suppliers': 'Información de proveedores',
    'rawMaterials': 'Inventario de materias primas',
    'attendance': 'Registros de asistencia de empleados',
    'attendance_logs': 'Histórico detallado de asistencias',
    'bonuses': 'Bonificaciones y beneficios de empleados',
    'payrollSettings': 'Configuración de nómina',
    'payroll_records': 'Registros históricos de nómina'
  };
  return contexts[collectionName] || `Datos de ${collectionName}`;
}

function getFriendlyFieldName(fieldName, collectionName) {
  const fieldMappings = {
    // Campos generales
    'id': 'ID',
    'name': 'Nombre',
    'email': 'Correo electrónico',
    'phone': 'Teléfono',
    'address': 'Dirección',
    'status': 'Estado',
    'createdAt': 'Fecha de creación',
    'updatedAt': 'Última actualización',
    
    // Trabajadores
    'position': 'Puesto',
    'department': 'Departamento',
    'salary': 'Salario',
    'hireDate': 'Fecha de contratación',
    
    // Productos
    'price': 'Precio',
    'stock': 'Stock disponible',
    'category': 'Categoría',
    'description': 'Descripción',
    
    // Ventas
    'total': 'Total',
    'customer': 'Cliente',
    'date': 'Fecha',
    'items': 'Productos vendidos',
    
    // Materiales
    'quantity': 'Cantidad',
    'unit': 'Unidad',
    'supplier': 'Proveedor',
    
    // Asistencia
    'checkIn': 'Entrada',
    'checkOut': 'Salida',
    'workerId': 'ID del trabajador',
    'hours': 'Horas trabajadas'
  };
  
  return fieldMappings[fieldName] || fieldName;
}

async function ingest() {
  const db = await initFirestore();
  if (!config.collections.length) {
    throw new Error('QA_COLLECTIONS vacío. Define colecciones en .env');
  }

  let index = loadIndex();
  const docsToUpsert = [];

  for (const collName of config.collections) {
    console.log(`Leyendo colección: ${collName}`);
    const snap = await db.collection(collName).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const title = data.title || data.name || data.nombre || `${collName} ${doc.id}`;
      const text = flattenDocData(data, collName);
      const chunks = chunkText(text, 1200);
      const ids = chunks.map((_, i) => `${collName}/${doc.id}#${i}`);

      // Embed in batches for this document's chunks
      const vectors = await embedTexts(chunks);

      for (let i = 0; i < chunks.length; i++) {
        docsToUpsert.push({
          id: ids[i],
          text: chunks[i],
          meta: { collection: collName, docId: doc.id, title },
          vector: vectors[i],
        });
      }
    }
  }

  index = upsertDocuments(index, docsToUpsert);
  saveIndex(index);
  console.log(`Ingesta completa. Total vectores: ${index.vectors.length}`);
}

if (require.main === module) {
  ingest().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { ingest };
