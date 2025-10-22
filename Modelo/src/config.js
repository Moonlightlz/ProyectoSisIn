const path = require('path');
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3030', 10),
  topK: parseInt(process.env.TOPK || '4', 10),
  ollamaHost: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  embedModel: process.env.EMBED_MODEL || 'nomic-embed-text',
  llmModel: process.env.LLM_MODEL || 'llama3.1:8b-instruct',
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
