const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { loadIndex, search } = require('./store');
const { embedQuery } = require('./embeddings');
const { generateAnswer } = require('./qa');
const { countSales, listLowStockRawMaterialsGrouped } = require('./metrics');

const app = express();
app.use(express.json({ limit: '2mb' }));
// CORS explícito: permitir encabezado X-User-Role
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-User-Role'],
}));

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
    // Guardrails básicos: bloquear solicitudes de credenciales/secretos/PII
    const lower = query.toLowerCase();
    const forbidden = [
      'contraseña', 'password', 'pass', 'clave', 'token', 'api key', 'apikey', 'llave', 'secreto', 'secret',
      '.env', 'firebase api key', 'service account', 'private key', 'refresh token', 'session cookie',
      'dni', 'documento', 'email de usuario', 'correo del usuario', 'número de tarjeta', 'cvv'
    ];
    if (forbidden.some(k => lower.includes(k))) {
      return res.status(400).json({
        error: 'forbidden_request',
        message: 'Por seguridad, no se pueden procesar solicitudes de credenciales o datos sensibles.'
      });
    }
  // Derivar rol desde header; por defecto 'user'
  const role = String(req.header('x-user-role') || 'user').toLowerCase();
  const isAdmin = role === 'admin';

  // Armar allowlist de colecciones por rol
  const allowed = isAdmin ? config.allowedCollectionsAdmin : config.allowedCollectionsDefault;
  const allowAll = isAdmin && allowed.length === 1 && allowed[0] === '*';

  const k = Math.max(1, Math.min(20, Number(topK) || config.topK));

    // Optional server-side filters by meta
    const filterFn = (doc) => {
      if (!filters || typeof filters !== 'object') return true;
      return Object.entries(filters).every(([k, v]) => doc.meta && doc.meta[k] === v);
    };

    // Filtrado por rol: si no es admin y no tiene '*' se limita a colecciones permitidas
    const roleFilter = (doc) => {
      if (!doc?.meta?.collection) return false;
      if (allowAll) return true;
      return allowed.includes(doc.meta.collection);
    };

    // Intentos “rápidos” con datos exactos (ventas del mes, total de ventas)
    const low = query.toLowerCase();
    const asksTotal = /\b(total|cu[aá]ntas?|n[uú]mero|cantidad)\b/.test(low);
    const mentionsSales = /\bventa(s)?\b/.test(low);
    const mentionsMonth = /\b(este mes|mes actual|del mes|mensual)\b/.test(low);

    if (mentionsSales && asksTotal) {
      const period = mentionsMonth ? 'month' : 'all';
      const { total, sources } = await countSales(period);
      const answer = mentionsMonth
        ? `El total de ventas registradas en el mes actual es ${total}.`
        : `El total de ventas registradas es ${total}.`;
      return res.json({
        answer,
        sources: (sources || []).map((s) => ({ id: `${s.collection}/${s.id}#0`, collection: s.collection, docId: s.id, score: 1.0 })),
      });
    }

    // Intento exacto: ayuda del sistema → dónde ver alertas de stock bajo de materia prima
  const t = low;
  const asksWhere = t.includes('donde') || t.includes('dónde');
  const mentionsAlerts = t.includes('alerta');
  const mentionsLowStock = t.includes('stock bajo') || (t.includes('stock') && t.includes('bajo')) || t.includes('umbral');
  const mentionsRawMaterials = t.includes('materia prima') || t.includes('raw materials') || t.includes('raw material') || t.includes('material');
  if (asksWhere && mentionsAlerts && mentionsLowStock && mentionsRawMaterials) {
      const needsAdmin = role !== 'admin' ? ' Nota: la sección Reportes solo está visible para administradores.' : '';
      const answer = [
        'Puedes ver las alertas de stock bajo aquí en la aplicación:',
        '1) Menú superior → Reportes (/reports).',
        '2) En la página "Reportes y Estadísticas", busca la tarjeta "Alertas de Stock Bajo" (ícono de almacén).',
        '   - Ahí verás el Top 5 de materiales críticos y, si no hay alertas, se mostrará un mensaje de que todo está OK.',
        '3) También puedes ver "Materiales por Categoría" para entender la distribución del inventario.',
        needsAdmin.trim()
      ].filter(Boolean).join('\n');
      return res.json({ answer, sources: [] });
    }

    // Intento exacto: materiales por categoría con stock bajo
    const mentionsRaw = /\b(materia prima|material(es)?|raw ?materials)\b/.test(low);
    const mentionsStock = /\bstock|existenci(a|as)|inventario|cantidad\b/.test(low);
  const mentionsCategory = /categor/.test(low);
    if (mentionsRaw && mentionsStock && mentionsCategory) {
      const { groups, sources } = await listLowStockRawMaterialsGrouped();
      if (!groups.length) {
        return res.json({ answer: 'No hay materiales con stock bajo según los umbrales configurados.', sources: [] });
      }
      const parts = groups.map(g => {
        const items = g.items.map(it => `- ${it.name} (stock ${it.stock} / umbral ${it.threshold})`).join('\n');
        return `• ${g.category}\n${items}`;
      });
      const answer = `Materiales con stock bajo por categoría:\n\n${parts.join('\n\n')}`;
      return res.json({
        answer,
        sources: (sources || []).map((s) => ({ id: `${s.collection}/${s.id}#0`, collection: s.collection, docId: s.id, score: 1.0 })),
      });
    }

    const qVec = await embedQuery(query);
    const retrieved = search(index, qVec, k, (doc) => filterFn(doc) && roleFilter(doc));

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
