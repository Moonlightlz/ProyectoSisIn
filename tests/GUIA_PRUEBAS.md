# Suite de Automatización QA - CalzaSoft

**Proyecto:** CalzaSoft (React + Firebase SPA)  
**Framework:** Selenium WebDriver + Mocha + Node.js  
**Navegador:** Chrome (ChromeDriver)  
**Timeout:** 30 segundos por test

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
├── GUIA_PRUEBAS.md                    # Este archivo
├── flujo_01_autenticacion.test.js     # Tests de login y restricción de rutas
├── flujo_02_asistencia.test.js        # Tests de registro de asistencia
├── flujo_03_inventario.test.js        # Tests de gestión de materias primas
└── flujo_04_reportes.test.js          # Tests de visualización de reportes
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

## 4. Descripción de los Tests (12 Casos Funcionales)

### **Flujo 1: Autenticación (3 tests)**
- ✓ **1.1 - Login exitoso:** Credenciales válidas → Redirección a Dashboard
- ✓ **1.2 - Login fallido:** Credenciales inválidas → Mensaje de error en UI
- ✓ **1.3 - Restricción de rutas:** Trabajador intenta acceder a `/admin` → Sistema bloquea

### **Flujo 2: Asistencia (3 tests)**
- ✓ **2.1 - Marcar entrada:** DNI válido → Registro exitoso
- ✓ **2.2 - Intento de doble entrada:** Mismo DNI, mismo día → Sistema rechaza
- ✓ **2.3 - Auditoría de ajuste manual:** Admin modifica hora → Cambio registrado

### **Flujo 3: Inventario (3 tests)**
- ✓ **3.1 - Nuevo material:** Llenar todos los campos → Material creado
- ✓ **3.2 - Prevención de nulos:** Submit sin campos obligatorios → Rechazo validación
- ✓ **3.3 - Integridad de BD:** Egreso > stock actual → Sistema rechaza

### **Flujo 4: Reportes (3 tests)**
- ✓ **4.1 - Dashboard analítico:** Canvas de Chart.js renderizado
- ✓ **4.2 - Empty State:** Filtro sin datos → No colapsa
- ✓ **4.3 - Estrés de consulta:** Consulta masiva sin filtro → Completa correctamente

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

### 5.3 Permisos del Navegador

ChromeDriver requiere permisos para:
- Acceso a almacenamiento local
- Cookies
- Cambios de URL (redirecciones)

---

## 6. Interpretación de Resultados

### Salida de Ejemplo (Éxito)

```
  Autenticación
    1.1 Login exitoso
      ✓ Debe redirigir al layout después de login (1234ms)
    1.2 Login fallido
      ✓ Debe mostrar error por credenciales inválidas (567ms)
    1.3 Restricción de rutas
      ✓ Debe bloquear acceso a /admin para trabajador (890ms)

  Asistencia
    2.1 Marcar entrada
      ✓ Debe registrar entrada con DNI válido (456ms)
    ...

  Passing (12)
  Failing (0)
```

### Salida de Ejemplo (Fallo)

```
  1.1 Login exitoso
    1) Debe redirigir al layout después de login
    Error: Timeout de 30000ms excedido. Selector no encontrado: .dashboard-layout
```

---

## 7. Debugging

### Ver logs del navegador:

Descomenta en los archivos `.test.js` la línea:

```javascript
// const logs = await driver.manage().logs().get(webdriver.logging.Type.BROWSER);
// console.log('Browser logs:', logs);
```

### Pausar un test específico:

Usa `.only` en el test a debuguear:

```javascript
it.only('Debe redirigir al layout después de login', async function() {
  // Este será el único test ejecutado
});
```

### Screenshots en caso de error:

Agregado en cada test con:

```javascript
await driver.takeScreenshot().then(image => {
  require('fs').writeFileSync('./debug_screenshot.png', image, 'base64');
});
```

---

## 8. Mantenimiento de Selectores

**Importante:** Si el código React cambia y los selectores ya no funcionan:

1. Abre la aplicación en navegador
2. Abre DevTools (F12)
3. Inspecciona el elemento
4. Actualiza el selector en el archivo `.test.js`
5. Prueba el test nuevamente

---

## 9. Integración CI/CD

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

## 10. Contacto y Soporte

**Reporte de bugs de tests:**
- Incluir screenshot del error
- Incluir salida de consola
- Incluir versión de Node.js: `node --version`
- Incluir versión de Chrome: `google-chrome --version`

---

**Última actualización:** 2026-06-10  
**Autor:** QA Automation Senior  
**Estado:** Listo para Producción
