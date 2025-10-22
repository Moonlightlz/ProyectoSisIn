const ollama = require('ollama');
const { config } = require('./config');

if (config.ollamaHost) {
  ollama.defaults = { host: config.ollamaHost };
}

function buildPrompt(question, docs) {
  const header = `Eres un asistente de la empresa. Responde en español de forma concisa y precisa usando EXCLUSIVAMENTE el siguiente contexto. Si no encuentras la respuesta en el contexto, responde: "No tengo esa información en este momento".`;
  const ctx = docs
    .map((d, i) => `Fuente ${i + 1} [${d.meta?.collection}/${d.meta?.docId}]:\n${d.text}`)
    .join('\n\n---\n\n');
  const user = `Contexto:\n${ctx}\n\nPregunta: ${question}\n\nResponde citando las fuentes relevantes (por ejemplo: [Fuente 1, Fuente 3]).`;
  return { header, user };
}

async function generateAnswer(question, retrievedDocs) {
  const { header, user } = buildPrompt(question, retrievedDocs);
  const res = await ollama.chat({
    model: config.llmModel,
    messages: [
      { role: 'system', content: header },
      { role: 'user', content: user },
    ],
    options: {
      temperature: 0.2,
    },
  });
  return res.message?.content || '';
}

module.exports = { generateAnswer };
