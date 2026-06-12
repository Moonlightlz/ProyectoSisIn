# CASOS DE PRUEBA - FLUJO 05: REPORTES Y ANÁLISIS

**Versión:** 2.0  
**Fecha de Actualización:** 2026-06-12  
**Estado:** ACTUALIZADO A PARTIR DE SCRIPTS REALES  
**Archivo de Pruebas:** `flujo_05_reportes.test.js`

---

## MAPEO DE REQUERIMIENTOS FUNCIONALES

| Requerimiento | Caso de Prueba | Script Test | Componente |
|---------------|----------------|------------|-----------|
| RF-08: Visualizar reportes con gráficos | CP-05.01 | 3.1 - Interacción con gráficos | ReportsPage.js, Chart.js |
| RF-08: Acceso a históricos | CP-05.02 | 3.1 - Botones de Histórico | ReportsPage.js |
| RF-XX: Visualización de datos detallados | CP-05.03 | 3.1 - Tablas de Histórico | ReportsPage.js |

---

## CASO DE PRUEBA 05.01: NAVEGACIÓN A MÓDULO DE REPORTES E INTERACCIÓN CON GRÁFICOS

**ID del Caso:** CP-05.01  
**Nombre:** Acceso al módulo de Reportes y visualización de gráficos interactivos  
**Flujo Asociado:** Flujo 05 - Reportes  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-08: Visualizar reportes  
**Estado:** Activo  
**Prioridad:** Alta

### Descripción
Valida que el usuario administrador pueda acceder al módulo de Reportes y que se carguen correctamente todos los gráficos de análisis (ventas, asistencia, trabajadores, etc).

### Precondiciones
- Usuario administrador autenticado (`jvalenzuela884@calzado.com`)
- La aplicación está disponible en `http://localhost:3000`
- Firebase Firestore está operativa con datos de reportes
- El navegador soporta Canvas (para Chart.js)

### Datos de Entrada
- Ninguno requerido (datos desde BD)

### Pasos de Ejecución
1. Completar login como administrador (Ver CP-01.01)
2. Desde el Dashboard, hacer clic en "Reportes"
3. Esperar a que cargue el módulo (máximo 3 segundos)
4. Verificar que aparezca el título "Reportes y Estadísticas"
5. Esperar a que se rendericen todos los gráficos
6. Permitir 4 segundos de visualización inicial

### Resultado Esperado
- ✅ La URL cambia a ruta de reportes (`/reports`, `/reportes`)
- ✅ Se carga el componente `ReportsPage.js` correctamente
- ✅ Aparece el título "Reportes y Estadísticas"
- ✅ Se renderizan múltiples gráficos/canvas (selector: `canvas`)
- ✅ Los gráficos están visibles y completos
- ✅ Los datos se cargan desde Firestore sin error
- ✅ No hay console errors
- ✅ Los gráficos son interactivos (mouse over, click)

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/ReportsPage.js` - Página principal de reportes
- `src/contexts/AuthContext.js` - Control de sesión
- Chart.js o Recharts - Librerías de gráficos
- `src/services/saleService.ts` - Obtención de datos de ventas
- `src/services/workerService.ts` - Obtención de datos de asistencia

**Selectores Utilizados:**
```javascript
By.xpath('//a[contains(text(), "Reportes")]')         // Reports link
By.xpath('//*[contains(text(), "Reportes y Estadísticas")]')  // Title
By.css('canvas')                                       // Chart.js canvas
By.css('svg')                                          // SVG (Recharts alternative)
By.css('.chart-card')                                  // Chart container
By.css('div[class*="chart"]')                          // Generic chart div
```

**Datos Esperados en Gráficos:**
- Gráficos de ventas (por estado, por mes)
- Gráficos de asistencia (presente/ausente)
- Gráficos de horas trabajadas
- Análisis de desempeño por trabajador

**Criterios de Aceptación Técnica:**
- Al menos 1 elemento `<canvas>` renderizado
- Los datos se cargan correctamente desde Firestore
- No hay errores HTTP 404 o de CORS
- El bundle de Chart.js está cargado correctamente

---

## CASO DE PRUEBA 05.02: INTERACCIÓN CON BOTONES DE HISTÓRICO

**ID del Caso:** CP-05.02  
**Nombre:** Acceso a datos históricos a través de botones "Histórico" en gráficos  
**Flujo Asociado:** Flujo 05 - Reportes  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-08: Acceso a información detallada  
**Estado:** Activo  
**Prioridad:** Alta

### Descripción
Valida que cada gráfico en el módulo de Reportes tenga un botón "Histórico" que al ser pulsado muestre los datos detallados en una tabla o modal, permitiendo el análisis profundo de la información.

### Precondiciones
- Usuario está en el módulo de Reportes (CP-05.01)
- Se han cargado correctamente todos los gráficos
- Existen registros históricos en la BD
- Firebase Firestore está operativa

### Datos de Entrada
- Ninguno requerido

### Pasos de Ejecución
1. Desde la página de Reportes, buscar todos los botones de "Histórico"
   (XPath: `//button[contains(translate(text(), "HISTORICO", "historico"), "historico")]`)
2. Para cada botón encontrado (máximo 5):
   - Scroll suave hacia el botón
   - Esperar 2 segundos
   - Hacer clic en el botón de Histórico
   - Esperar a que cargue la vista/modal de histórico
   - Permitir 5 segundos de visualización
   - Cerrar la vista (con ESC o botón cerrar)
   - Regresar a la vista de gráficos

### Resultado Esperado
- ✅ Se encuentran múltiples botones de "Histórico" (al menos 2)
- ✅ Cada botón es clickeable
- ✅ Al hacer clic, se abre un modal o vista de detalles
- ✅ Se muestra una tabla con datos históricos (últimos registros)
- ✅ La tabla contiene columnas relevantes (fecha, valor, trabajador, etc)
- ✅ Los datos son legibles y correctos
- ✅ Se puede cerrar la vista
- ✅ Se regresa a la vista de gráficos sin problemas
- ✅ No hay errores durante la interacción

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/ReportsPage.js` - Contenedor de gráficos
- `src/components/HistoryAnalysisModal.tsx` o similar - Modal de histórico
- Chart.js - Gráficos con eventos

**Selectores Utilizados:**
```javascript
By.xpath('//button[contains(translate(text(), "HISTORICO", "historico"), "historico")]')  // Histórico buttons
By.xpath('//button[contains(text(), "Historico")]')  // Alternative
By.css('[class*="historic"], [class*="history"]')    // CSS alternative
By.xpath('//table | //div[contains(@class, "table")]')  // Table/list display
By.xpath('//button[contains(@class, "close")]')      // Close button
By.key('Escape')                                      // ESC key to close
```

**Datos en Tabla Histórica:**
- Fecha/Período
- Descripción del evento
- Cantidad/Valor
- Responsable
- Acciones (si aplica)

**Criterios de Aceptación Técnica:**
- Modal se abre sin lag
- Datos se cargan desde Firestore correctamente
- Tabla es scrollable si tiene muchas filas
- No hay console errors

---

## CASO DE PRUEBA 05.03: VISUALIZACIÓN DE TABLAS HISTÓRICAS DETALLADAS

**ID del Caso:** CP-05.03  
**Nombre:** Lectura y análisis de datos en tablas históricas de reportes  
**Flujo Asociado:** Flujo 05 - Reportes  
**Tipo de Prueba:** Funcional Verificativa  
**Requisito Asociado:** RF-08: Acceso a información detallada  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que las tablas históricas muestren datos correctos, con formateo adecuado de fechas, monedas, y estados, permitiendo que el usuario realice análisis de datos para la toma de decisiones.

### Precondiciones
- Usuario está viendo una tabla histórica abierta (CP-05.02)
- Existen registros con datos válidos
- La tabla está completamente cargada

### Datos de Entrada
- Ninguno (se valida lo que está en pantalla)

### Pasos de Ejecución
1. Desde una tabla histórica abierta, verificar estructura:
   - Encabezados visibles
   - Al menos 1 fila de datos
2. Verificar formateo:
   - Fechas en formato legible (DD/MM/YYYY o similar)
   - Monedas con símbolo (S/, $, etc)
   - Estados con colores o etiquetas
3. Verificar datos:
   - No hay valores `null` o `undefined` visibles
   - Los números están formatados correctamente
   - Los textos son legibles
4. Validar interactividad:
   - Si hay filtros, probar que funcionan
   - Si hay paginación, probar siguiente/anterior

### Resultado Esperado
- ✅ La tabla tiene estructura clara con encabezados
- ✅ Las fechas están formateadas correctamente
- ✅ Las monedas muestran símbolo y decimales
- ✅ Los estados están claramente etiquetados
- ✅ No hay valores vacíos o indefinidos
- ✅ Los datos coinciden con lo esperado en la BD
- ✅ La tabla es fácil de leer y comprender
- ✅ Si hay filtros, funcionan correctamente
- ✅ Si hay paginación, permite navegar

### Evidencia Técnica
**Componentes Involucrados:**
- Componentes de tabla (generalmente en `HistoryAnalysisModal` o similar)
- Pipes/Formatos de fecha y moneda en React
- Servicios de obtención de datos históricos

**Formateo Esperado:**
```javascript
// Fechas
2026-06-12  → 12/06/2026 (o formato local)

// Monedas
1000.50  → S/ 1,000.50 (o según zona)

// Estados
"pending"  → "Pendiente" (con ícono/color)
"paid"     → "Pagado" (verde)
"cancelled" → "Cancelado" (rojo)
```

**Selectores Utilizados:**
```javascript
By.css('table')                          // Table element
By.css('thead')                          // Table headers
By.css('tbody tr')                       // Table rows
By.css('td, th')                        // Table cells
By.xpath('//input[@type="text"]')       // Filter input
By.xpath('//button[contains(text(), "Anterior")]')  // Previous page
By.xpath('//button[contains(text(), "Siguiente")]')  // Next page
```

**Validaciones de Contenido:**
- No permitir `null`, `undefined`, o `N/A` sin contexto
- Verificar que dates sean válidas
- Verificar que números sean numéricos
- Verificar que estados sean reconocibles

---

## MATRIZ DE COBERTURA - FLUJO 05

| Caso | Componente | RF Asociado | Status | Evidencia |
|------|-----------|-----------|--------|-----------|
| CP-05.01 | ReportsPage.js, Chart.js | RF-08 | ✅ | Script 3.1 |
| CP-05.02 | HistoryAnalysisModal.tsx | RF-08 | ✅ | Script 3.1 |
| CP-05.03 | Componentes de tabla | RF-08 | ✅ | Script 3.1 |

---

## NOTAS TÉCNICAS

### Timing y Pausas
- Visualización inicial: 4 segundos
- Entre acciones: 2 segundos (para scroll suave)
- Visualización de modal: 5 segundos
- Este es un "modo demostración lenta" para observación visual

### Gráficos Esperados
En ReportsPage.js se esperan mínimo:
1. Gráfico de Ventas (estados)
2. Gráfico de Asistencia
3. Gráfico de Horas Trabajadas
4. Gráfico de Desempeño

### Datos Tipos
- Ventas: Por estado (Pendiente, Entregado, etc)
- Asistencia: Por tipo (Presente, Ausente, Tarde)
- Horas: Por trabajador
- Análisis: Por período (diario, semanal, mensual)

### Performance
- Primera carga: ≤ 3 segundos
- Modal histórico: ≤ 1 segundo
- Tabla con 100 filas: ≤ 2 segundos

---

## CASOS ADICIONALES (FUTURO)

Casos que podrían agregarse:
- **CP-05.04:** Filtros de fecha/período en reportes
- **CP-05.05:** Export de reportes (PDF, Excel)
- **CP-05.06:** Comparación entre períodos
- **CP-05.07:** Análisis de clustering

---

**Generado por:** Auditoría Técnica Automatizada  
**Basado en:** flujo_05_reportes.test.js  
**Última actualización:** 2026-06-12
