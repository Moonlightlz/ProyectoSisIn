# Modelo (Asistente de consultas sin costo por uso)

Este módulo implementa un microservicio RAG local (sin costo por token) usando:
- Ollama para LLM y embeddings locales
- Un vector store sencillo en disco (JSON + similitud coseno)
- Ingesta desde Firebase Firestore
- API HTTP `/qa` para responder preguntas con contexto

Requisitos (Windows):
- Node.js 18+
- Ollama para Windows (con modelos locales)
- Service Account de Firebase (JSON) para leer Firestore

## Instalación

1) Instala Ollama y modelos necesarios (ejecuta en PowerShell):

```powershell
# Instala modelos una vez
ollama pull llama3.1:8b-instruct
ollama pull nomic-embed-text
```

2) Configura variables de entorno:

- Copia `.env.example` a `.env` y ajusta:
  - `FIREBASE_SERVICE_ACCOUNT`: ruta al JSON del Service Account (por ejemplo, `c:\Rutas\serviceAccountKey.json`)
  - `QA_COLLECTIONS`: colecciones de Firestore a indexar, separadas por coma (ej: `policies,procedures,products`)
  - `EMBED_MODEL`: `nomic-embed-text`
  - `LLM_MODEL`: `llama3.1:8b-instruct`
  - `OLLAMA_HOST`: opcional si usas un host distinto a `http://127.0.0.1:11434`

3) Instala dependencias (dentro de la carpeta `Modelo`):

```powershell
npm install
```

## Ingesta (indexado) desde Firestore

Genera embeddings y crea el índice local en `data/index.json`:

```powershell
npm run ingest
```

- Puedes re-ejecutar cuando haya cambios en Firestore.

## Servidor de preguntas /qa

Levanta el servidor HTTP:

```powershell
npm start
```

Consulta el endpoint desde tu app o vía curl/Postman:

POST http://localhost:3030/qa
Body JSON:
```json
{
  "query": "¿Cuál es el proceso de ventas?",
  "topK": 4
}
```

Respuesta JSON:
- `answer`: texto generado por el modelo
- `sources`: lista de fragmentos usados (colección, docId, score)

## Notas
- Este MVP usa búsqueda lineal (brute-force). Para mayor escala, cambia a un vector store dedicado (Qdrant/Chroma) sin coste adicional si lo autogestionas.
- Control de permisos: añade etiquetas en ingestión y filtra antes de la recuperación (ver `ingest_firestore.js` y `server.js`).

## Carpetas
- `src/` código fuente
- `data/` índice persistido (gitignored)

## Troubleshooting
- Si el endpoint tarda: confirma que Ollama está corriendo y los modelos están descargados.
- Si falla Firestore: revisa la ruta del JSON del Service Account y los permisos (rol de lector de BD).