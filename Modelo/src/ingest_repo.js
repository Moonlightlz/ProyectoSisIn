const fs = require('fs');
const path = require('path');
const { chunkText } = require('./chunking');
const { embedTexts } = require('./embeddings');
const { loadIndex, saveIndex, upsertDocuments } = require('./store');

const REPO_ROOT = path.resolve(__dirname, '..', '..'); // ProyectoSisIn/

const INCLUDE_DIRS = [
  'src',
  'public',
  'front',
  'back',
  'api',
];

const INCLUDE_FILES = [
  'settings.py',
  'urls.py',
];

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.py']);

function shouldSkip(p) {
  const bn = path.basename(p);
  if (bn.startsWith('.')) return true;
  const parts = p.split(path.sep);
  return parts.some((seg) => ['node_modules', '.git', 'data', 'Modelo'].includes(seg));
}

function collectFiles() {
  const files = [];
  for (const dir of INCLUDE_DIRS) {
    const base = path.join(REPO_ROOT, dir);
    if (!fs.existsSync(base)) continue;
    walk(base, files);
  }
  for (const f of INCLUDE_FILES) {
    const p = path.join(REPO_ROOT, f);
    if (fs.existsSync(p)) files.push(p);
  }
  // Also include root-level files with known extensions (e.g., ReportsPage.js)
  const rootEnts = fs.readdirSync(REPO_ROOT, { withFileTypes: true });
  for (const ent of rootEnts) {
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name).toLowerCase();
    if (EXTENSIONS.has(ext)) {
      const p = path.join(REPO_ROOT, ent.name);
      if (!shouldSkip(p)) files.push(p);
    }
  }
  return files;
}

function walk(dir, out) {
  if (shouldSkip(dir)) return;
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of ents) {
    const p = path.join(dir, ent.name);
    if (shouldSkip(p)) continue;
    if (ent.isDirectory()) {
      walk(p, out);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (EXTENSIONS.has(ext)) out.push(p);
    }
  }
}

async function ingestRepo() {
  const index = loadIndex();
  const files = collectFiles();
  const docs = [];

  for (const absPath of files) {
    try {
      const rel = path.relative(REPO_ROOT, absPath).replace(/\\/g, '/');
      const text = fs.readFileSync(absPath, 'utf-8');
      // Quick heuristic: collapse excessive whitespace
      const clean = text.replace(/[\t ]+/g, ' ').replace(/\r?\n{2,}/g, '\n');
      const chunks = chunkText(clean, 1200);
      const vectors = await embedTexts(chunks);
      for (let i = 0; i < chunks.length; i++) {
        docs.push({
          id: `repo/${rel}#${i}`,
          text: chunks[i],
          meta: { collection: 'repo', docId: rel, title: rel },
          vector: vectors[i],
        });
      }
      // Upsert in batches to avoid large memory spikes
      if (docs.length > 200) {
        const newIndex = upsertDocuments(index, docs.splice(0, docs.length));
        Object.assign(index, newIndex);
      }
    } catch (e) {
      console.warn('Skip file (read/embed error):', absPath, String(e.message || e));
    }
  }

  const finalIndex = upsertDocuments(index, docs);
  saveIndex(finalIndex);
  console.log(`Ingesta de repo completa. Vectores: ${finalIndex.vectors.length}`);
}

if (require.main === module) {
  ingestRepo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { ingestRepo };
