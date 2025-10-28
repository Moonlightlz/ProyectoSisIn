# 🛠️ Herramientas de Q&A

Esta carpeta contiene herramientas útiles para trabajar con el sistema de preguntas y respuestas.

## 📁 Archivos Disponibles

### `smart_qa.js`
Sistema inteligente de Q&A que detecta automáticamente el tipo de consulta y proporciona respuestas optimizadas:
- **Conteos**: "¿Cuántos trabajadores hay?" → Respuesta directa con lista completa
- **Listas**: "Dame todos los empleados" → Lista completa organizada
- **Búsquedas**: "¿Qué productos están disponibles?" → Búsqueda semántica

**Uso:**
```bash
node tools/smart_qa.js
```

### `direct_qa.js`
Herramienta para hacer preguntas directamente al sistema sin servidor HTTP. Útil para pruebas y desarrollo.

**Uso:**
```bash
node tools/direct_qa.js
```

### `analyze_workers.js`
Analiza los datos de trabajadores en el índice vectorial. Muestra estadísticas y listados completos.

**Uso:**
```bash
node tools/analyze_workers.js
```

### `collection_stats.js`
Proporciona estadísticas detalladas de todas las colecciones en el índice vectorial.

**Uso:**
```bash
node tools/collection_stats.js
```

## 🚀 Ejecución

Para ejecutar cualquier herramienta, navega al directorio del Modelo primero:

```bash
cd Modelo
node tools/[nombre-del-archivo].js
```

## 📊 Datos Disponibles

El sistema tiene acceso a:
- **21 trabajadores** registrados
- **7 productos** en el catálogo
- **130 registros de ventas**
- **52 materiales** en inventario
- **1 proveedor** registrado
- **679 registros de asistencia**
- Y más...

**Total: 939 vectores** indexados para búsqueda semántica.