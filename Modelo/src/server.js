const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { loadIndex, search } = require('./store');
const { embedQuery } = require('./embeddings');
const { generateAnswer } = require('./qa');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());

let index = loadIndex();
console.log(`Índice cargado. Vectores: ${index.vectors.length}`);

app.get('/health', (_req, res) => {
  res.json({ ok: true, vectors: index.vectors.length });
});

app.post('/qa', async (req, res) => {
  try {
    const { query, topK, filters } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query requerido (string)' });
    }
    const k = Math.max(1, Math.min(20, Number(topK) || config.topK));

    // Optional server-side filters by meta
    const filterFn = (doc) => {
      if (!filters || typeof filters !== 'object') return true;
      return Object.entries(filters).every(([k, v]) => doc.meta && doc.meta[k] === v);
    };

    const qVec = await embedQuery(query);
    const retrieved = search(index, qVec, k, filterFn);

    const answer = await generateAnswer(query, retrieved);
    const sources = retrieved.map((r) => ({
      id: r.id,
      collection: r.meta?.collection,
      docId: r.meta?.docId,
      title: r.meta?.title,
      score: Number(r.score?.toFixed(4) || 0),
    }));

    res.json({ answer, sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error', details: String(err.message || err) });
  }
});

app.post('/reload-index', (_req, res) => {
  index = loadIndex();
  res.json({ ok: true, vectors: index.vectors.length });
});

app.listen(config.port, () => {
  console.log(`QA server escuchando en http://localhost:${config.port}`);
});
