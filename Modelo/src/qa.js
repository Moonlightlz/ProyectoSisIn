const ollama = require('ollama');
const { config } = require('./config');

// Configure Ollama SDK host if available
if (config.ollamaHost && ollama && typeof ollama === 'object') {
  ollama.defaults = { host: config.ollamaHost };
}

function buildPrompt(question, docs) {
  const header = `Eres un asistente virtual amigable del sistema de gestión empresarial IPCS. Tu objetivo es proporcionar respuestas claras, útiles y fáciles de entender para cualquier usuario, sin importar su nivel técnico.

REGLAS IMPORTANTES:
- Responde ÚNICAMENTE basándote en la información proporcionada en el contexto
- Usa un lenguaje sencillo y natural, como si estuvieras hablando con un colega
- NO menciones códigos técnicos, IDs de base de datos, ni referencias internas del sistema
- Si no encuentras la información específica, responde: "No tengo esa información disponible en este momento"
- Organiza las respuestas de manera clara con viñetas o listas cuando sea apropiado
- Proporciona números y datos específicos cuando estén disponibles
- NUNCA reveles información sensible como contraseñas, tokens o datos personales privados`;

  const ctx = docs
    .map((d, i) => {
      const collection = getCollectionFriendlyName(d.meta?.collection);
      return `Información ${i + 1} (${collection}):\n${d.text}`;
    })
    .join('\n\n---\n\n');
    
  const user = `Información disponible:\n${ctx}\n\nPregunta del usuario: ${question}\n\nProporciona una respuesta clara y útil basada únicamente en la información disponible:`;
  return { header, user };
}

function getCollectionFriendlyName(collection) {
  const friendlyNames = {
    'workers': 'de empleados',
    'users': 'de usuarios',
    'productos': 'de productos',
    'sales': 'de ventas',
    'suppliers': 'de proveedores', 
    'rawMaterials': 'de materiales',
    'attendance': 'de asistencia',
    'attendance_logs': 'de registros de asistencia',
    'bonuses': 'de bonificaciones',
    'payrollSettings': 'de configuración de nómina',
    'payroll_records': 'de nómina'
  };
  return friendlyNames[collection] || 'del sistema';
}

async function generateAnswer(question, retrievedDocs) {
  const { header, user } = buildPrompt(question, retrievedDocs);
  const payload = {
    model: config.llmModel,
    messages: [
      { role: 'system', content: header },
      { role: 'user', content: user },
    ],
    options: { temperature: 0.2 },
  };

  // Prefer SDK chat if available, else fallback to HTTP API
  if (ollama && typeof ollama.chat === 'function') {
    const res = await ollama.chat(payload);
    return res?.message?.content || '';
  }

  const host = (config.ollamaHost || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const resp = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, stream: false }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`chat HTTP error ${resp.status}: ${txt}`);
  }
  const json = await resp.json();
  return json?.message?.content || '';
}

module.exports = { generateAnswer };
