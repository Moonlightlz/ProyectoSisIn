import React, { useState } from 'react';
import './AssistantWidget.css';

function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError('');
      setAnswer('');
      setSources([]);
      const resp = await fetch('http://localhost:3030/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 4 })
      });
      if (!resp.ok) throw new Error('Error del servicio /qa');
      const data = await resp.json();
      setAnswer(data.answer || '');
      setSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (e) {
      console.error(e);
      setError('No se pudo conectar con el asistente. Verifica que el servicio local /qa esté ejecutándose.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-root">
      {/* Floating Button */}
      <button
        className={`assistant-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {open ? '✖' : '🤖'}
      </button>

      {/* Panel */}
      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <div>
              <strong>Asistente de Consultas</strong>
              <div className="assistant-sub">Pregunta sobre procesos, políticas o datos (Firestore).</div>
            </div>
            <button className="assistant-close" onClick={() => setOpen(false)}>✖</button>
          </div>
          <div className="assistant-body">
            <textarea
              className="assistant-textarea"
              placeholder="Escribe tu pregunta..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
            <button className="assistant-ask" onClick={handleAsk} disabled={loading}>
              {loading ? 'Consultando...' : 'Preguntar'}
            </button>
            {error && <div className="assistant-error">{error}</div>}
            {answer && (
              <div className="assistant-answer">
                <h4>Respuesta</h4>
                <p>{answer}</p>
              </div>
            )}
            {sources && sources.length > 0 && (
              <div className="assistant-sources">
                <h5>Fuentes</h5>
                <ul>
                  {sources.map((s) => (
                    <li key={s.id}>
                      <span className="source-chip">{s.collection}/{s.docId}</span>
                      <span className="source-score">score: {s.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssistantWidget;
