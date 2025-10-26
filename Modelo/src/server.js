const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { loadIndex, search } = require('./store');
const { embedQuery } = require('./embeddings');
const { generateAnswer } = require('./qa');
const { countSales, listLowStockRawMaterialsGrouped, findSaleByCode, countSalesByDistributor, leastWorkedWorker } = require('./metrics');

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

  // Intentos “rápidos” con datos exactos (inyectaremos contexto a la IA en lugar de responder directo)
    const low = query.toLowerCase();
    const asksTotal = /\b(total|cu[aá]ntas?|n[uú]mero|cantidad)\b/.test(low);
    const mentionsSales = /\bventa(s)?\b/.test(low);
    const mentionsMonth = /\b(este mes|mes actual|del mes|mensual)\b/.test(low);

  // Acumuladores de contexto adicional para el LLM
  const extraDocs = [];
  const extraSources = [];

    // Intento exacto: ¿a qué venta corresponde este código?
    const codeMatch = (query.match(/[A-Za-z]{1,5}-\d{4,}/) || query.match(/\b[A-Za-z0-9_-]{5,}\b/));
    const mentionsWhichSale = /a\s*qu[eé]\s*venta|corresponde\s+el\s+c[oó]digo|c[oó]digo\s+de\s+venta/.test(low);
    if (mentionsWhichSale && codeMatch) {
      const code = codeMatch[0];
      // Buscar directamente en el índice por texto y pasar esas fuentes al LLM
      const codeLow = code.toLowerCase();
      const matches = index.vectors.filter(v => v.meta?.collection === 'sales' && typeof v.text === 'string' && v.text.toLowerCase().includes(codeLow));
      const unique = Array.from(new Map(matches.map(m => [m.meta.docId, m])).values());
      extraDocs.push(...unique.slice(0, 6));
    }

    // Intento exacto: ¿cuántas ventas por distribuidor/cliente?
    const asksHowMany = /\b(cu[aá]ntas?|cuantos|cuántos|n[uú]mero|cantidad)\b/.test(low);
    const mentionsDistributor = /distribuidor|vendedor|cliente/.test(low);
  if (mentionsSales && asksHowMany && mentionsDistributor) {
      // extraer nombre después de palabra clave o entre comillas
      const quoted = (query.match(/["'“”‘’]([^"'“”‘’]+)["'“”‘’]/) || [])[1];
      let name = quoted || '';
      if (!name) {
        const m = query.match(/(?:distribuidor|cliente|vendedor)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ]+){0,3})/i);
        if (m) name = m[1];
      }
      name = name.trim();
      if (!name) {
        // fallback: intenta último par de palabras capitalizadas
        const caps = query.match(/[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ]+){0,3}/g);
        if (caps && caps.length) name = caps[caps.length - 1];
      }
      if (!name) {
        // sin nombre, seguir al flujo general de RAG
      } else {
        try {
          const { total, sources } = await countSalesByDistributor(name);
          if (total > 0 || (sources && sources.length)) {
            const text = `Resumen de ventas por distribuidor/cliente\nNombre: ${name}\nVentas encontradas: ${total}\nMuestras: ${(sources||[]).map(s=>s.id).join(', ')}`;
            extraDocs.push({ id: `sales/metrics:distributor:${name}#0`, text, meta: { collection: 'sales', docId: `metrics:distributor:${name}`, title: `Ventas por ${name}` }, vector: [] });
            extraSources.push(...(sources||[]));
          }
        } catch (_e) {
          // ignore and try fallback
        }
        if (!extraDocs.length) {
          // Fallback: estimación por índice
          const target = name.toLowerCase();
          const matches = index.vectors.filter(v => v.meta?.collection === 'sales' && typeof v.text === 'string' && v.text.toLowerCase().includes(target));
          const uniqueDocIds = Array.from(new Set(matches.map(m => m.meta.docId)));
          const text = `Estimación por índice (ventas por ${name}): ${uniqueDocIds.length} documentos.`;
          extraDocs.push({ id: `sales/estimate:distributor:${name}#0`, text, meta: { collection: 'sales', docId: `estimate:distributor:${name}`, title: `Estimación ventas ${name}` }, vector: [] });
        }
      }
    }

    // Conteo total de ventas (mensual o global), solo si no hay otro modificador (distribuidor/cliente)
    if (mentionsSales && asksTotal && !/distribuidor|vendedor|cliente/.test(low)) {
      const period = mentionsMonth ? 'month' : 'all';
      const { total, sources } = await countSales(period);
      const label = mentionsMonth ? 'ventas del mes actual' : 'ventas totales';
      const text = `Resumen ${label}: ${total}`;
      extraDocs.push({ id: `sales/metrics:${label}#0`, text, meta: { collection: 'sales', docId: `metrics:${label}`, title: `Resumen ${label}` }, vector: [] });
      extraSources.push(...(sources||[]));
    }

    // Intento exacto: ayuda del sistema → dónde ver alertas de stock bajo de materia prima
  const t = low;
  const asksWhere = t.includes('donde') || t.includes('dónde');
  const mentionsAlerts = t.includes('alerta');
  const mentionsLowStock = t.includes('stock bajo') || (t.includes('stock') && t.includes('bajo')) || t.includes('umbral');
  const mentionsRawMaterials = t.includes('materia prima') || t.includes('raw materials') || t.includes('raw material') || t.includes('material');
  if (asksWhere && mentionsAlerts && mentionsLowStock && mentionsRawMaterials) {
      // No responder directo: dejar a la IA usar el repo/index
    }

    // Intento exacto: ¿dónde crear usuarios?
    const asksWhere2 = /\b(donde|dónde)\b/.test(low);
    const mentionsUsers = /\busuari(o|os|a|as)\b/.test(low);
    const mentionsCreate = /\b(crear|nuevo|registrar|alta)\b/.test(low);
    if (asksWhere2 && mentionsUsers && mentionsCreate) {
      // No responder directo: el índice del repo contiene la navegación a /users
    }

    // Intento exacto: ¿quién es el trabajador con menos días trabajados (mes actual)?
    const asksWho = /\bqui[eé]n\b/.test(low);
    const mentionsWorker = /\b(trabajador|empleado|operario|worker)\b/.test(low);
    const mentionsLeast = /\b(men(o|ó)s|menos)\b/.test(low) && /d[ií]as?\s+trabaj/.test(low);
    if (asksWho && mentionsWorker && mentionsLeast) {
      // Intento con Firestore
      let result = await leastWorkedWorker('month');
      if (result && result.worker) {
        const text = `Trabajador con menos días trabajados (mes actual): ${result.worker.name} (${result.worker.id}) con ${result.worker.daysWorked} día(s).`;
        extraDocs.push({ id: `attendance/metrics:leastWorked#0`, text, meta: { collection: 'attendance', docId: 'metrics:leastWorked', title: 'Menos días trabajados' }, vector: [] });
        extraSources.push(...(result.sources || []));
      } else {
        // Fallback por índice: contar apariciones por trabajador en 'attendance'
        const attendanceDocs = index.vectors.filter(v => v.meta?.collection === 'attendance' && typeof v.text === 'string');
        const byName = new Map();
        for (const v of attendanceDocs) {
          const t2 = v.text.toLowerCase();
          const m = t2.match(/workername\s*[:=]\s*([a-záéíóúñ\s]+)/i) || t2.match(/nombre\s*[:=]\s*([a-záéíóúñ\s]+)/i);
          const name2 = (m && (m[1] || '').trim()) || null;
          if (!name2) continue;
          byName.set(name2, (byName.get(name2) || 0) + 1);
        }
        if (byName.size > 0) {
          let minName = null, minCount = Infinity;
          for (const [nm, cnt] of byName.entries()) { if (cnt < minCount) { minCount = cnt; minName = nm; } }
          const text = `Estimación por índice: trabajador con menos registros es ${minName} con ${minCount} registro(s).`;
          extraDocs.push({ id: `attendance/estimate:leastWorked#0`, text, meta: { collection: 'attendance', docId: 'estimate:leastWorked', title: 'Estimación menos días' }, vector: [] });
        }
      }
    }

    // Intento exacto: materiales por categoría con stock bajo
    const mentionsRaw = /\b(materia prima|material(es)?|raw ?materials)\b/.test(low);
    const mentionsStock = /\bstock|existenci(a|as)|inventario|cantidad\b/.test(low);
  const mentionsCategory = /categor/.test(low);
    if (mentionsRaw && mentionsStock && mentionsCategory) {
      try {
        const { groups, sources } = await listLowStockRawMaterialsGrouped();
        if (groups && groups.length) {
          const parts = groups.map(g => {
            const items = g.items.map(it => `- ${it.name} (stock ${it.stock} / umbral ${it.threshold})`).join('\n');
            return `• ${g.category}\n${items}`;
          });
          const text = `Alertas de stock bajo por categoría (datos exactos):\n\n${parts.join('\n\n')}`;
          extraDocs.push({ id: 'rawMaterials/metrics:lowstock#0', text, meta: { collection: 'rawMaterials', docId: 'metrics:lowstock', title: 'Stock bajo por categoría' }, vector: [] });
          extraSources.push(...(sources||[]));
        }
      } catch (_e) { /* ignore */ }
    }

    const qVec = await embedQuery(query);
    const retrieved = search(index, qVec, k, (doc) => filterFn(doc) && roleFilter(doc));
    const combined = [...extraDocs, ...retrieved];

    const answer = await generateAnswer(query, combined);
    const sources = [
      ...extraSources.map((s) => ({ id: `${s.collection}/${s.id}#0`, collection: s.collection, docId: s.id, score: 1.0 })),
      ...retrieved.map((r) => ({
        id: r.id,
        collection: r.meta?.collection,
        docId: r.meta?.docId,
        title: r.meta?.title,
        score: Number(r.score?.toFixed(4) || 0),
      })),
    ];

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
