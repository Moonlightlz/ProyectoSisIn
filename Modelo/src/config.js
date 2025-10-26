const path = require('path');
// Carga .env siempre desde la carpeta Modelo, sin depender del cwd
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT || '3030', 10),
  topK: parseInt(process.env.TOPK || '4', 10),
  ollamaHost: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  embedModel: process.env.EMBED_MODEL || 'nomic-embed-text',
  llmModel: process.env.LLM_MODEL || 'llama3.1:8b-instruct',
  allowedCollectionsDefault: (process.env.ALLOWED_COLLECTIONS_DEFAULT || 'ventas,materiales')
    .split(',').map(s => s.trim()).filter(Boolean),
  allowedCollectionsAdmin: (process.env.ALLOWED_COLLECTIONS_ADMIN || '*')
    .split(',').map(s => s.trim()).filter(Boolean),
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null,
  collections: (process.env.QA_COLLECTIONS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  dataDir: path.resolve(__dirname, '..', 'data'),
  indexFile: path.resolve(__dirname, '..', 'data', 'index.json'),
};

module.exports = { config };
