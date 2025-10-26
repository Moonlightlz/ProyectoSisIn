const { config } = require('./config');
const ollama = require('ollama');

// Configure ollama host if provided
if (config.ollamaHost) {
  ollama.defaults = { host: config.ollamaHost };
}

async function embedTexts(texts) {
  if (!Array.isArray(texts)) throw new Error('embedTexts expects an array of strings');
  if (texts.length === 0) return [];

  // Prefer SDK if disponible; fallback a llamada HTTP directa a /api/embeddings
  if (ollama && typeof ollama.embeddings === 'function') {
    const res = await ollama.embeddings({ model: config.embedModel, input: texts });
    return res?.embeddings || [];
  }
  // Fallback HTTP: manejar tanto 'embedding' (single) como 'embeddings' (batch)
  const host = config.ollamaHost?.replace(/\/$/, '') || 'http://127.0.0.1:11434';
  // Algunas versiones del API no aceptan batch; hacemos one-by-one para máxima compatibilidad
  const out = [];
  for (const t of texts) {
    const resp = await fetch(`${host}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.embedModel, prompt: t }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Embeddings HTTP error ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    if (Array.isArray(json?.embedding)) {
      out.push(json.embedding);
    } else if (Array.isArray(json?.embeddings) && Array.isArray(json.embeddings[0])) {
      out.push(json.embeddings[0]);
    } else {
      out.push([]);
    }
  }
  return out;
}

async function embedQuery(query) {
  const [vec] = await embedTexts([query]);
  return vec || [];
}

module.exports = { embedTexts, embedQuery };
