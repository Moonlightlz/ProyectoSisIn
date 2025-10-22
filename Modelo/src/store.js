const fs = require('fs');
const path = require('path');
const { config } = require('./config');

function ensureDataDir() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

function loadIndex() {
  ensureDataDir();
  if (!fs.existsSync(config.indexFile)) {
    return { version: 1, embedModel: config.embedModel, vectors: [] };
  }
  try {
    const raw = fs.readFileSync(config.indexFile, 'utf-8');
    const json = JSON.parse(raw);
    if (!json.vectors) json.vectors = [];
    return json;
  } catch (e) {
    console.error('Failed to load index:', e.message);
    return { version: 1, embedModel: config.embedModel, vectors: [] };
  }
}

function saveIndex(index) {
  ensureDataDir();
  fs.writeFileSync(config.indexFile, JSON.stringify(index, null, 2), 'utf-8');
}

function cosineSim(a, b) {
  let dot = 0.0, na = 0.0, nb = 0.0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function upsertDocuments(index, docs) {
  const map = new Map(index.vectors.map((v) => [v.id, v]));
  for (const d of docs) {
    map.set(d.id, d);
  }
  index.vectors = Array.from(map.values());
  return index;
}

function search(index, queryVector, topK = 4, filterFn = null) {
  const items = filterFn ? index.vectors.filter(filterFn) : index.vectors;
  const scored = items.map((it) => ({ it, score: cosineSim(queryVector, it.vector || []) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(({ it, score }) => ({ ...it, score }));
}

module.exports = { loadIndex, saveIndex, upsertDocuments, search };
