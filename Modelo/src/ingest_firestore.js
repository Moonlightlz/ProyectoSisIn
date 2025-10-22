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

function flattenDocData(data) {
  const parts = [];
  function walk(obj, prefix = '') {
    for (const [k, v] of Object.entries(obj || {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v == null) continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        parts.push(`${k}: ${v}`);
      } else if (Array.isArray(v)) {
        parts.push(`${k}: ${v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ')}`);
      } else if (typeof v === 'object') {
        walk(v, key);
      }
    }
  }
  walk(data);
  return parts.join('\n');
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
      const title = data.title || data.name || doc.id;
      const text = flattenDocData(data);
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
