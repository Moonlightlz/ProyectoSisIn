# Suite de Automatización QA - CalzaSoft

**Proyecto:** CalzaSoft (React + Firebase SPA)  
**Framework:** Selenium WebDriver + Mocha + Node.js  
**Navegador:** Chrome (ChromeDriver)  
**Timeout:** 30 segundos por test  
**Versión:** 2.0 - Actualizado 2026-06-12  
**Total de Casos:** 13 casos funcionales en 5 flujos

---

## 1. Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm install selenium-webdriver mocha chromedriver --save-dev
```

**Dependencias instaladas:**
- `selenium-webdriver`: API para control remoto del navegador
- `mocha`: Framework de pruebas unitarias/funcionales
- `chromedriver`: Driver del navegador Chrome para Selenium

---

## 2. Estructura de Carpetas

```
/tests
├── GUIA_PRUEBAS.md                         # Este archivo
├── CHEAT_SHEET.md                          # Quick reference
├── INDICE.md                               # Índice completo
├── README.md                               # Quick start
├── RESUMEN_ENTREGA.md                      # Resumen ejecutivo
├── casos_prueba/                           # ⭐ NUEVO: Casos documentados
│   ├── casos_flujo_01_autenticacion.md
│   ├── casos_flujo_02_asistencia.md
│   ├── casos_flujo_03_navegacion.md
│   ├── casos_flujo_04_trabajadores.md
│   └── casos_flujo_05_reportes.md
├── flujo_01_autenticacion.test.js          # 3 tests
├── flujo_02_asistencia.test.js             # 3 tests
├── flujo_03_navegacion.test.js             # 4 tests
├── flujo_04_trabajadores.test.js           # 2 tests
└── flujo_05_reportes.test.js               # 1 test
```

---

## 3. Ejecución de la Suite Completa

Para **correr todos los tests** con salida en consola:

```bash
npx mocha tests/*.test.js --timeout 30000
```

**Opciones disponibles:**

- **Ver salida detallada (verbose):**
  ```bash
  npx mocha tests/*.test.js --timeout 30000 --reporter spec
  ```

- **Ejecutar un archivo específico:**
  ```bash
  npx mocha tests/flujo_01_autenticacion.test.js --timeout 30000
  ```

- **Ejecutar un suite específico:**
  ```bash
  npx mocha tests/*.test.js --timeout 30000 --grep "Login exitoso"
  ```

- **Ver salida JSON (para integración CI/CD):**
  ```bash
  npx mocha tests/*.test.js --timeout 30000 --reporter json > test-results.json
  ```

---

## 4. Descripción de los Tests (13 Casos Funcionales)

### **Flujo 1: Autenticación (3 tests)**
- ✓ **CP-01.01 - Login exitoso:** Credenciales válidas → Redirección a Dashboard
- ✓ **CP-01.02 - Login fallido:** Credenciales inválidas → Mensaje de error en UI
- ✓ **CP-01.03 - Reconocimiento DNI:** DNI válido → Saludo personalizado del trabajador

**Script:** `flujo_01_autenticacion.test.js`  
**Documentación:** `casos_prueba/casos_flujo_01_autenticacion.md`

### **Flujo 2: Asistencia (3 tests)**
- ✓ **CP-02.01 - Marcar entrada:** DNI válido → Registro exitoso
- ✓ **CP-02.02 - Límite lógico:** Mismo DNI, mismo día → Sistema rechaza doble entrada
- ✓ **CP-02.03 - Auditoría:** Admin modifica hora → Cambio registrado en audit log

**Script:** `flujo_02_asistencia.test.js`  
**Documentación:** `casos_prueba/casos_flujo_02_asistencia.md`

### **Flujo 3: Navegación y Dashboards (4 tests)**
- ✓ **CP-03.01 - Dashboard de Inicio:** Acceso exitoso y renderizado
- ✓ **CP-03.02 - Módulo de Reportes:** Navegación y carga de gráficos (Chart.js)
- ✓ **CP-03.03 - Módulo de Trabajadores:** Navegación y renderizado de lista
- ✓ **CP-03.04 - Rendimiento:** Carga total ≤ 4 segundos

**Script:** `flujo_03_navegacion.test.js`  
**Documentación:** `casos_prueba/casos_flujo_03_navegacion.md`

### **Flujo 4: Gestión de Trabajadores (2 tests + 5 sub-casos)**
- ✓ **CP-04.01 a CP-04.04 - Gestión General:** Login, Configurar Planilla, Nuevo Trabajador, Asistencia
- ✓ **CP-04.05 - Acciones en Tarjeta:** Mostrar Planilla, Ajustar, Historial, Ajustar Sueldo, Agregar Bono

**Script:** `flujo_04_trabajadores.test.js`  
**Documentación:** `casos_prueba/casos_flujo_04_trabajadores.md`

### **Flujo 5: Reportes e Interacción (1 test + 3 sub-casos)**
- ✓ **CP-05.01 - Gráficos:** Navegación a Reportes y renderizado de canvas
- ✓ **CP-05.02 - Botones Histórico:** Acceso a datos detallados por gráfico
- ✓ **CP-05.03 - Tablas Históricas:** Lectura y análisis de datos en tablas

**Script:** `flujo_05_reportes.test.js`  
**Documentación:** `casos_prueba/casos_flujo_05_reportes.md`

---

## 5. Prerequisitos Antes de Ejecutar

### 5.1 Aplicación en Funcionamiento

La aplicación debe estar corriendo en `http://localhost:3000`:

```bash
npm start
```

### 5.2 Base de Datos

Asegurar que Firebase está conectado y disponible con:
- Usuarios de prueba creados
- Colecciones en Firestore preparadas
- Trabajadores con DNI válido (25481579 para casos de demo)

### 5.3 Permisos del Navegador

ChromeDriver requiere permisos para:
- Acceso a almacenamiento local
- Cookies
- Cambios de URL (redirecciones)

---

## 6. Interpretación de Resultados

### Salida de Ejemplo (Éxito)

```
  Flujo 1: Autenticación y Asistencia
    1.1 - Login exitoso
      ✓ Debe iniciar sesión como Admin y mostrar la interfaz (1234ms)
    1.2 - Login fallido
      ✓ Debe mostrar error por credenciales inválidas (567ms)
    1.3 - Reconocimiento de DNI en Asistencia
      ✓ Debe ir a Asistencia, ingresar DNI y mostrar nombre (2345ms)

  Flujo 2: Asistencia
    2.1 - Marcar entrada
      ✓ Debe registrar entrada con DNI válido (1567ms)
    ...

  Passing (13)
  Failing (0)
```

### Salida de Ejemplo (Fallo)

```
  1.1 Login exitoso
    1) Debe iniciar sesión como Admin
    Error: Timeout de 30000ms excedido. Selector no encontrado: #email
```

---

## 7. Documentación de Casos de Prueba

Cada flujo tiene un documento `.md` asociado en `casos_prueba/`:

**Contenido de cada caso:**
- ID único del caso (CP-XX.XX)
- Descripción funcional
- Precondiciones
- Datos de entrada
- Pasos de ejecución detallados
- Resultado esperado
- Selectores reales (extraídos del código)
- Componentes involucrados
- Servicios de negocio
- Validaciones técnicas

**Ubicación:** `/tests/casos_prueba/casos_flujo_XX_*.md`

---

## 8. Debugging

### Ver logs del navegador:

Descomenta en los archivos `.test.js` la línea:

```javascript
// const logs = await driver.manage().logs().get(webdriver.logging.Type.BROWSER);
// console.log('Browser logs:', logs);
```

### Pausar un test específico:

Usa `.only` en el test a debuguear:

```javascript
it.only('Debe iniciar sesión', async function() {
  // Este será el único test ejecutado
});
```

### Screenshots en caso de error:

Agregado automáticamente en cada test con:

```javascript
await driver.takeScreenshot().then(image => {
  require('fs').writeFileSync('./debug_screenshot.png', image, 'base64');
});
```

### Incrementar timeout para debugging:

```bash
npx mocha tests/flujo_01_*.test.js --timeout 60000  # Espera más tiempo
```

---

## 9. Mantenimiento de Selectores

**Importante:** Si el código React cambia y los selectores ya no funcionan:

1. Abre la aplicación en navegador
2. Abre DevTools (F12)
3. Inspecciona el elemento
4. Actualiza el selector en el archivo `.test.js`
5. Actualiza la documentación en `casos_prueba/`
6. Prueba el test nuevamente

---

## 10. Integración CI/CD

Para integrar en pipelines (GitHub Actions, GitLab CI, Jenkins):

```yaml
# GitHub Actions ejemplo
- name: Run QA Automation
  run: npx mocha tests/*.test.js --timeout 30000 --reporter json > test-results.json
  
- name: Upload Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: test-results.json
```

---

## 11. Referencias Rápidas

- **Mocha Docs:** https://mochajs.org/
- **Selenium Docs:** https://www.selenium.dev/documentation/webdriver/
- **Node Assert:** https://nodejs.org/api/assert.html
- **Chrome DevTools:** https://developer.chrome.com/docs/devtools/

---

**Última actualización:** 2026-06-12  
**Autor:** Auditoría Técnica Automatizada  
**Estado:** ✅ Listo para Producción
