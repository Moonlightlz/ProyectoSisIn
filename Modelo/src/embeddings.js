const { config } = require('./config');
const ollama = require('ollama');

// Configure ollama host if provided
if (config.ollamaHost) {
  ollama.defaults = { host: config.ollamaHost };
}

async function embedTexts(texts) {
  if (!Array.isArray(texts)) throw new Error('embedTexts expects an array of strings');
  if (texts.length === 0) return [];

  // Ollama embeddings API accepts array input; returns { embeddings: number[][] }
  const res = await ollama.embeddings({ model: config.embedModel, input: texts });
  const vectors = res.embeddings || [];
  return vectors;
}

async function embedQuery(query) {
  const [vec] = await embedTexts([query]);
  return vec || [];
}

module.exports = { embedTexts, embedQuery };
