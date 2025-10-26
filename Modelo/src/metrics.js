const { getDb } = require('./firebase_admin');

function startEndOfCurrentMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

async function tryMonthlyCountByField(coll, field, start, end) {
  const db = getDb();
  try {
    const snap = await db.collection(coll)
      .where(field, '>=', start)
      .where(field, '<', end)
      .get();
    return { count: snap.size, ids: snap.docs.slice(0, 4).map(d => d.id) };
  } catch (_e) {
    return null;
  }
}

async function countSales(period = 'month') {
  const db = getDb();
  const coll = 'sales';
  if (period === 'month') {
    const { start, end } = startEndOfCurrentMonth();
    const fields = ['date', 'createdAt', 'fecha', 'timestamp', 'created_at'];
    for (const f of fields) {
      const res = await tryMonthlyCountByField(coll, f, start, end);
      if (res) return { total: res.count, sources: res.ids.map(id => ({ collection: coll, id })) };
    }
    // Fallback: no campo temporal usable → devolver total general (mejor que nada)
  }
  // Total general
  try {
    // Intentar aggregate count si está disponible
    const snap = await db.collection(coll).get();
    return { total: snap.size, sources: snap.docs.slice(0, 4).map(d => ({ collection: coll, id: d.id })) };
  } catch (e) {
    return { total: 0, sources: [] };
  }
}

function pick(obj, keys, def = undefined) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return def;
}

async function listLowStockRawMaterialsGrouped() {
  const db = getDb();
  const coll = 'rawMaterials';
  const snap = await db.collection(coll).get();
  const groups = new Map();
  const usedIds = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    const name = pick(data, ['name','title','nombre','materialName'], d.id);
    const category = pick(data, ['category','categoria','type','materialCategory'], 'Sin categoría');
    const stock = Number(pick(data, ['stock','quantity','qty','existencia','cantidad'], 0));
    const threshold = Number(pick(data, ['minStock','min_stock','threshold','umbral','lowStockThreshold'], 0));
    if (threshold > 0 && stock <= threshold) {
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push({ id: d.id, name, stock, threshold });
      if (usedIds.length < 20) usedIds.push(d.id);
    }
  }
  // ordenar
  const result = Array.from(groups.entries())
    .map(([category, items]) => ({ category, items: items.sort((a,b) => a.name.localeCompare(b.name)) }))
    .sort((a,b) => a.category.localeCompare(b.category));

  const sources = usedIds.map(id => ({ collection: coll, id }));
  return { groups: result, sources };
}

function flattenStrings(obj, prefix = '', out = {}) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v == null) continue;
    if (typeof v === 'string') {
      out[key] = v;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[key] = String(v);
    } else if (Array.isArray(v)) {
      // join primitive strings/numbers for search
      const arrStr = v.map(x => (typeof x === 'object' ? null : String(x))).filter(Boolean).join(' ');
      if (arrStr) out[key] = arrStr;
      // also recurse objects
      v.forEach((x, i) => {
        if (x && typeof x === 'object') flattenStrings(x, `${key}[${i}]`, out);
      });
    } else if (typeof v === 'object') {
      flattenStrings(v, key, out);
    }
  }
  return out;
}

function normalizeStr(s) {
  return String(s || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function findSaleByCode(codeRaw) {
  try {
    const db = getDb();
    const code = normalizeStr(codeRaw).toUpperCase();
    const coll = 'sales';
    const snap = await db.collection(coll).get();
    for (const d of snap.docs) {
      if (normalizeStr(d.id).toUpperCase() === code) {
        const data = d.data() || {};
        return { found: true, sale: { id: d.id, data }, sources: [{ collection: coll, id: d.id }] };
      }
      const data = d.data() || {};
      const flat = flattenStrings(data);
      const values = Object.values(flat);
      if (values.some(v => normalizeStr(v).toUpperCase() === code)) {
        return { found: true, sale: { id: d.id, data }, sources: [{ collection: coll, id: d.id }] };
      }
    }
    return { found: false, sale: null, sources: [] };
  } catch (_e) {
    return { found: false, sale: null, sources: [] };
  }
}

function extractNameFields(data) {
  const flat = flattenStrings(data);
  const candidates = [];
  for (const [k, v] of Object.entries(flat)) {
    const lk = k.toLowerCase();
    if (
      lk.includes('distrib') ||
      lk.includes('vendedor') ||
      lk.includes('seller') ||
      lk.includes('cliente') ||
      lk.endsWith('.name') ||
      lk.endsWith('name') ||
      lk.includes('usuario') ||
      lk.includes('responsable')
    ) {
      candidates.push(v);
    }
  }
  return candidates;
}

async function countSalesByDistributor(nameRaw) {
  try {
    const db = getDb();
    const coll = 'sales';
    const name = normalizeStr(nameRaw);
    const snap = await db.collection(coll).get();
    let total = 0;
    const ids = [];
    for (const d of snap.docs) {
      const data = d.data() || {};
      const names = extractNameFields(data).map(normalizeStr);
      if (names.some(n => n.includes(name))) {
        total += 1;
        if (ids.length < 10) ids.push(d.id);
      }
    }
    return { total, sources: ids.map(id => ({ collection: coll, id })) };
  } catch (_e) {
    return { total: 0, sources: [] };
  }
}

module.exports = { countSales, listLowStockRawMaterialsGrouped, findSaleByCode, countSalesByDistributor };
// --- Nuevas métricas: trabajador con menos días trabajados ---
function startEndOfMonth(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

async function leastWorkedWorker(period = 'month') {
  try {
    const db = getDb();
    const coll = 'attendance';
    let qSnap;
    if (period === 'month') {
      const { start, end } = startEndOfMonth();
      try {
        qSnap = await db.collection(coll)
          .where('timestamp', '>=', start)
          .where('timestamp', '<', end)
          .get();
      } catch (_e) {
        // Algunos registros podrían usar 'date'/'fecha'
        const altSnap = await db.collection(coll)
          .where('date', '>=', start)
          .where('date', '<', end)
          .get();
        qSnap = altSnap;
      }
    } else {
      qSnap = await db.collection(coll).get();
    }
    const byWorker = new Map(); // workerId -> { name, days:Set<string>, sampleIds:[] }
    for (const d of qSnap.docs) {
      const data = d.data() || {};
      const workerId = pick(data, ['workerId', 'worker_id', 'worker', 'empleadoId', 'dni'], null) || data.worker?.id || data.worker?.dni || data.id;
      const workerName = pick(data, ['workerName', 'nombre', 'name'], null) || data.worker?.name || data.worker?.nombre || 'Desconocido';
      let ts = data.timestamp || data.date || data.fecha || null;
      if (!ts) continue;
      // Convertir Timestamp a Date
      if (ts && typeof ts === 'object' && ts._seconds) {
        ts = new Date(ts._seconds * 1000);
      } else if (typeof ts === 'string' || typeof ts === 'number') {
        ts = new Date(ts);
      }
      if (!(ts instanceof Date) || isNaN(ts.getTime())) continue;
      const dayKey = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
      if (!byWorker.has(workerId)) byWorker.set(workerId, { name: workerName, days: new Set(), sampleIds: [] });
      const rec = byWorker.get(workerId);
      rec.days.add(dayKey);
      if (rec.sampleIds.length < 5) rec.sampleIds.push(d.id);
    }
    if (byWorker.size === 0) return { worker: null, sources: [] };
    let minId = null; let minDays = Infinity;
    for (const [wid, rec] of byWorker.entries()) {
      const count = rec.days.size;
      if (count < minDays) { minDays = count; minId = wid; }
    }
    const best = byWorker.get(minId);
    return {
      worker: { id: minId, name: best.name, daysWorked: minDays },
      sources: best.sampleIds.map(id => ({ collection: coll, id }))
    };
  } catch (_e) {
    return { worker: null, sources: [] };
  }
}

module.exports.leastWorkedWorker = leastWorkedWorker;
