# CASOS DE PRUEBA - FLUJO 03: NAVEGACIÓN Y DASHBOARDS

**Versión:** 2.0  
**Fecha de Actualización:** 2026-06-12  
**Estado:** ACTUALIZADO A PARTIR DE SCRIPTS REALES  
**Archivo de Pruebas:** `flujo_03_navegacion.test.js`

---

## MAPEO DE REQUERIMIENTOS FUNCIONALES

| Requerimiento | Caso de Prueba | Script Test | Componente |
|---------------|----------------|------------|-----------|
| RF-08: Visualizar reportes | CP-03.01 | 4.1 - Dashboard de Inicio | HomePage.js, ReportsPage.js |
| RF-08: Acceso a módulo de reportes | CP-03.02 | 4.2 - Navegación a Reportes | ReportsPage.js, AppLayout.js |
| RF-XX: Acceso a módulo de trabajadores | CP-03.03 | 4.3 - Navegación a Trabajadores | WorkerManagement.tsx, AppLayout.js |
| RNF-XX: Rendimiento de carga | CP-03.04 | 4.4 - Rendimiento (< 4 segundos) | App.js (bundle) |

---

## CASO DE PRUEBA 03.01: ACCESO AL DASHBOARD DE INICIO

**ID del Caso:** CP-03.01  
**Nombre:** Acceso y renderizado correcto del Dashboard de Inicio  
**Flujo Asociado:** Flujo 03 - Navegación  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-08: Visualizar reportes  
**Estado:** Activo  
**Prioridad:** Alta

### Descripción
Valida que después del login exitoso, el usuario administrador acceda correctamente a la página principal del sistema que muestra el Dashboard de Ventas con todos los elementos de UI esperados.

### Precondiciones
- Usuario administrador autenticado (`jvalenzuela884@calzado.com`)
- La aplicación está disponible en `http://localhost:3000`
- Firebase Firestore está operativa
- El layout y componentes principales están renderizados

### Datos de Entrada
- Ninguno requerido (datos cargados desde BD)

### Pasos de Ejecución
1. Completar login como administrador (Ver CP-01.01)
2. Esperar a que aparezca la interfaz principal
3. Verificar que la URL sea diferente a `/login` (debe ser `/`, `/home`, o similar)
4. Verificar que aparezca el título "Dashboard de Ventas" (XPath: `//*[contains(text(), "Dashboard de Ventas")]`)
5. Permitir 2-3 segundos para que todos los elementos se carguen
6. Verificar visibilidad del contenido principal

### Resultado Esperado
- ✅ El usuario está redirigido a la página de inicio (no en `/login`)
- ✅ Aparece el título "Dashboard de Ventas" (visible y accesible)
- ✅ La barra de navegación superior está visible
- ✅ Se muestra el contenido del dashboard
- ✅ No hay errores en consola del navegador
- ✅ Los gráficos y componentes de inicio están presentes
- ✅ La página es completamente navegable

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/HomePage.js` - Página de inicio
- `src/components/AppLayout.js` - Layout con navegación
- `src/App.js` - Rutas y carga del AppLayout

**Selectores Utilizados:**
```javascript
By.xpath('//*[contains(text(), "Dashboard de Ventas")]')  // Dashboard title
By.xpath('//a[contains(text(), "Reportes")] | //li[contains(text(), "Reportes")]')  // Reports nav
By.css('body')  // Page container
```

**Criterios de Aceptación Técnica:**
- El título está renderizado por React
- Los componentes están cargados en el DOM
- No hay errores de 404 o redirección inesperada

---

## CASO DE PRUEBA 03.02: NAVEGACIÓN AL MÓDULO DE REPORTES

**ID del Caso:** CP-03.02  
**Nombre:** Navegación exitosa al módulo de Reportes y renderizado de gráficos  
**Flujo Asociado:** Flujo 03 - Navegación  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-08: Visualizar reportes con gráficos  
**Estado:** Activo  
**Prioridad:** Alta

### Descripción
Valida que el usuario pueda navegar desde el Dashboard hacia el módulo de Reportes y que todos los gráficos se rendericen correctamente (Chart.js, Recharts, o similar).

### Precondiciones
- Usuario administrador autenticado
- Está en la página de inicio/Dashboard
- Firebase Firestore está operativa con datos de reportes
- El navegador soporta Canvas (Chart.js)

### Datos de Entrada
- Ninguno requerido

### Pasos de Ejecución
1. Desde el Dashboard de Inicio, localizar enlace/botón de "Reportes" en navegación superior
   (XPath: `//a[contains(text(), "Reportes")] | //li[contains(text(), "Reportes")]`)
2. Hacer clic en "Reportes"
3. Esperar a que cargue la página de reportes (máximo 3 segundos)
4. Verificar que aparezca el título "Reportes y Estadísticas"
5. Esperar a que se rendericen todos los gráficos

### Resultado Esperado
- ✅ La URL cambia a ruta de reportes (`/reports`, `/reportes`, etc)
- ✅ Aparece el título "Reportes y Estadísticas" en la página
- ✅ Se renderizan múltiples gráficos (selector: `canvas`, `svg`, `.recharts-wrapper`)
- ✅ Se encuentran al menos 1 gráfico (puedes ser más)
- ✅ No hay errores de carga
- ✅ Los gráficos están visibles y son interactivos
- ✅ Los datos se cargan correctamente desde Firestore

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/ReportsPage.js` - Página principal de reportes
- `src/components/AppLayout.js` - Navegación
- Chart.js o Recharts - Librería de gráficos

**Selectores Utilizados:**
```javascript
By.xpath('//a[contains(text(), "Reportes")] | //li[contains(text(), "Reportes")]')  // Reports link
By.xpath('//*[contains(text(), "Reportes y Estadísticas")]')                         // Page title
By.css('canvas')                    // Chart.js canvas
By.css('svg')                       // SVG elements (Recharts)
By.css('.recharts-wrapper')         // Recharts wrapper
By.css('div[class*="chart"]')      // Chart container
```

**Criterios de Aceptación Técnica:**
- Se renderiza al menos un elemento `<canvas>` o SVG
- Los datos se cargan desde Firestore sin error
- No hay console errors
- La transición de página es suave

---

## CASO DE PRUEBA 03.03: NAVEGACIÓN AL MÓDULO DE TRABAJADORES

**ID del Caso:** CP-03.03  
**Nombre:** Navegación exitosa al módulo de Trabajadores  
**Flujo Asociado:** Flujo 03 - Navegación  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-XX: Acceso a gestión de trabajadores  
**Estado:** Activo  
**Prioridad:** Alta

### Descripción
Valida que el usuario administrador pueda navegar hacia el módulo de Gestión de Trabajadores y que la interfaz se cargue correctamente con la lista de trabajadores.

### Precondiciones
- Usuario administrador autenticado
- Está en el Dashboard
- Existe al menos un trabajador en Firestore
- Firebase Firestore está operativa

### Datos de Entrada
- Ninguno requerido

### Pasos de Ejecución
1. Desde el Dashboard, localizar enlace/botón "Trabajadores" en navegación superior
   (XPath: `//a[contains(text(), "Trabajadores")] | //li[contains(text(), "Trabajadores")]`)
2. Hacer clic en "Trabajadores"
3. Esperar a que cargue la página (máximo 3 segundos)
4. Verificar que aparezca un título relacionado a Trabajadores
5. Verificar que se cargue la lista o vista de trabajadores

### Resultado Esperado
- ✅ La URL cambia a ruta de trabajadores (`/workers`, `/trabajadores`, etc)
- ✅ Aparece un título de "Trabajadores", "Gestión de Trabajadores", o similar
   (XPath: `//*[contains(text(), "Trabajadores")]`)
- ✅ Se carga la interfaz correctamente
- ✅ No hay errores de permiso (user es admin)
- ✅ Los datos de trabajadores se cargan desde Firestore
- ✅ La página es completamente funcional

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/WorkerManagement.tsx` - Componente principal
- `src/components/AppLayout.js` - Navegación
- `src/services/workerService.ts` - Obtención de datos

**Selectores Utilizados:**
```javascript
By.xpath('//a[contains(text(), "Trabajadores")] | //li[contains(text(), "Trabajadores")]')  // Workers link
By.xpath('//*[contains(text(), "Trabajadores")]')  // Page title
```

**Criterios de Aceptación Técnica:**
- El componente se renderiza sin errores
- La lista de trabajadores se carga desde Firestore
- Verificación de permisos: solo admin puede acceder

---

## CASO DE PRUEBA 03.04: RENDIMIENTO DE CARGA DEL SISTEMA (< 4 segundos)

**ID del Caso:** CP-03.04  
**Nombre:** Verificación de rendimiento - Carga total del sistema ≤ 4 segundos  
**Flujo Asociado:** Flujo 03 - Navegación  
**Tipo de Prueba:** No Funcional (Rendimiento)  
**Requisito Asociado:** RNF-XX: Rendimiento  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que el sistema cumpla con estándares de rendimiento, asegurando que la carga de la página desde la autenticación hasta la renderización completa no exceda 4 segundos, cumpliendo con estándares de UX.

### Precondiciones
- Usuario administrador autenticado
- La aplicación está disponible
- El navegador Chrome está limpio (sin extensiones que ralenticen)
- La conexión de red es estable

### Datos de Entrada
- Ninguno

### Pasos de Ejecución
1. Desde el Dashboard, hacer un refresh de página (`F5` o `Ctrl+R`)
2. Esperar a que la página se recargue completamente
3. Usar la API de Performance del navegador para medir:
   - `domContentLoadedEventEnd - navigationStart` (DOM Ready)
   - `loadEventEnd - navigationStart` (Total Load)
4. Registrar los tiempos

### Resultado Esperado
- ✅ DOM Ready: ≤ 2 segundos
- ✅ Carga total (loadEventEnd): ≤ 4 segundos
- ✅ Todos los recursos están cargados
- ✅ No hay errores de red
- ✅ Los gráficos están renderizados

### Evidencia Técnica
**Medición Técnica:**
```javascript
const timing = window.performance.timing;
const domReady = (timing.domContentLoadedEventEnd - timing.navigationStart) / 1000;
const loadPage = (timing.loadEventEnd - timing.navigationStart) / 1000;
```

**Criterios de Aceptación Técnica:**
- `loadPage` ≤ 4.0 segundos
- No hay console errors
- Todos los recursos están cargados correctamente

**Optimizaciones esperadas:**
- Code splitting en React
- Lazy loading de componentes
- Caché de Firebase
- Minificación de bundle

---

## MATRIZ DE COBERTURA - FLUJO 03

| Caso | Componente | RF Asociado | Status | Evidencia |
|------|-----------|-----------|--------|-----------|
| CP-03.01 | HomePage.js, AppLayout.js | RF-08 | ✅ | Script 4.1 |
| CP-03.02 | ReportsPage.js, Chart.js | RF-08 | ✅ | Script 4.2 |
| CP-03.03 | WorkerManagement.tsx | RF-XX | ✅ | Script 4.3 |
| CP-03.04 | App.js, Performance API | RNF-XX | ✅ | Script 4.4 |

---

## NOTAS TÉCNICAS

### Dependencias
- Todos los casos requieren autenticación previa (CP-01.01)
- Orden recomendado: CP-03.01 → CP-03.02 → CP-03.03 → CP-03.04

### Selectores Dinámicos
Los XPath utilizan `|` (OR) para soportar variaciones en nombres de navegación:
- `//a[contains(...)] | //li[contains(...)]` captura tanto anchors como items de lista

### Performance Baseline
- Ambiente de desarrollo: 2-3 segundos típico
- Ambiente de producción: 1-2 segundos esperado
- El límite de 4 segundos es conservador para asegurar UX aceptable

---

**Generado por:** Auditoría Técnica Automatizada  
**Basado en:** flujo_03_navegacion.test.js (flujo_03_navegacion.test.js renombrado como flujo_04 en scripts)  
**Última actualización:** 2026-06-12
