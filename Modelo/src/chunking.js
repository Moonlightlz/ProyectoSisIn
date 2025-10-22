// Very simple chunker: splits by paragraphs and enforces max chars per chunk

function normalizeText(s) {
  return (s || '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // control chars
    .trim();
}

function chunkText(text, maxChars = 1200) {
  const clean = normalizeText(text);
  if (!clean) return [];
  const paras = clean.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const p of paras) {
    if ((current + '\n\n' + p).length <= maxChars) {
      current = current ? current + '\n\n' + p : p;
    } else {
      if (current) chunks.push(current);
      if (p.length <= maxChars) {
        current = p;
      } else {
        // hard split long paragraph
        for (let i = 0; i < p.length; i += maxChars) {
          const slice = p.slice(i, i + maxChars);
          chunks.push(slice);
        }
        current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

module.exports = { chunkText, normalizeText };
