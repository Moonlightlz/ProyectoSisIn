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

module.exports = { countSales, listLowStockRawMaterialsGrouped };
