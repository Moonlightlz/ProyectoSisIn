# CASOS DE PRUEBA - FLUJO 04: GESTIÓN DE TRABAJADORES

**Versión:** 2.0  
**Fecha de Actualización:** 2026-06-12  
**Estado:** ACTUALIZADO A PARTIR DE SCRIPTS REALES  
**Archivo de Pruebas:** `flujo_04_trabajadores.test.js`

---

## MAPEO DE REQUERIMIENTOS FUNCIONALES

| Requerimiento | Caso de Prueba | Script Test | Componente |
|---------------|----------------|------------|-----------|
| RF-XX: Gestión de Trabajadores | CP-04.01 | 2.1 - Login + Navegación | WorkerManagement.tsx |
| RF-XX: Interacción con botones | CP-04.02 | 2.1 - Configurar Planilla | PayrollAdjustmentModal.tsx |
| RF-XX: Nuevo Trabajador | CP-04.03 | 2.1 - Nuevo Trabajador | WorkerManagement.tsx |
| RF-XX: Asistencia desde Admin | CP-04.04 | 2.1 - Asistencia (botón) | AttendanceView.tsx |
| RF-XX: Acciones en tarjeta | CP-04.05 | 2.2 - Acciones de tarjeta | WorkerManagement.tsx |

---

## CASO DE PRUEBA 04.01: LOGIN E INGRESO AL MÓDULO DE TRABAJADORES

**ID del Caso:** CP-04.01  
**Nombre:** Autenticación y acceso al módulo de Gestión de Trabajadores  
**Flujo Asociado:** Flujo 04 - Trabajadores  
**Tipo de Prueba:** Funcional Integrativa  
**Requisito Asociado:** RF-XX: Acceso a gestión  
**Estado:** Activo  
**Prioridad:** Crítica

### Descripción
Valida que un usuario administrador pueda autenticarse y acceder correctamente al módulo de Gestión de Trabajadores, donde verá la interfaz completa con opciones de configuración.

### Precondiciones
- La aplicación está disponible en `http://localhost:3000`
- Firebase está operativa
- Usuario admin existe: `jvalenzuela884@calzado.com`

### Datos de Entrada
- **Email:** `jvalenzuela884@calzado.com`
- **Contraseña:** `DA0W6G`

### Pasos de Ejecución
1. Navegar a `http://localhost:3000`
2. Completar login exitoso (Ver CP-01.01)
3. Desde el Dashboard, hacer clic en "Trabajadores"
4. Esperar 3 segundos a que cargue la interfaz
5. Verificar que aparezca el título "Gestión de Trabajadores"

### Resultado Esperado
- ✅ Login exitoso
- ✅ Navegación a módulo de Trabajadores
- ✅ Se renderiza correctamente `WorkerManagement.tsx`
- ✅ Se muestra el título "Gestión de Trabajadores"
- ✅ La interfaz es completamente visible
- ✅ Todos los botones principales están presentes

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/Login.js` - Autenticación
- `src/components/WorkerManagement.tsx` - Módulo principal
- `src/contexts/AuthContext.js` - Control de sesión

**Selectores Utilizados:**
```javascript
By.id('email')  // Email field
By.id('password')  // Password field
By.xpath('//a[contains(text(), "Trabajadores")]')  // Workers nav link
By.xpath('//*[contains(text(), "Gestión de Trabajadores")]')  // Title
```

---

## CASO DE PRUEBA 04.02: ACCESO A CONFIGURAR PLANILLA

**ID del Caso:** CP-04.02  
**Nombre:** Abrir modal de Configurar Planilla  
**Flujo Asociado:** Flujo 04 - Trabajadores  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-09: Configurar nómina  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que el botón "Configurar Planilla" abra un modal con la configuración de salarios, deducibles y parámetros de cálculo de nómina.

### Precondiciones
- Usuario administrador está autenticado
- Está en el módulo de Trabajadores
- El modal de configuración está disponible

### Datos de Entrada
- Ninguno requerido para abrir

### Pasos de Ejecución
1. Desde el módulo de Trabajadores, localizar botón "Configurar Planilla"
   (XPath: `//button[contains(text(), "Configurar Planilla")]`)
2. Hacer clic en el botón
3. Esperar a que se abra el modal
4. Visualizar la configuración (4 segundos)
5. Cerrar el modal haciendo clic en "X" o "Cancelar"

### Resultado Esperado
- ✅ El botón es visible y clickeable
- ✅ Se abre un modal de configuración
- ✅ El modal muestra campos como:
  - Sueldo base
  - Días trabajados por mes
  - Horas por día
  - Multiplicador de horas extra
  - Porcentaje ESSALUD
  - Porcentaje Fondo Pensión
  - Monto de seguro
  - Tolerancia de retrasos (minutos)
- ✅ El modal se cierra sin errores

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/WorkerManagement.tsx` - Botón
- `src/components/PayrollAdjustmentModal.tsx` o similar - Modal de configuración
- `src/services/payrollSettingsService.ts` - Obtención de datos

**Selectores Utilizados:**
```javascript
By.xpath('//button[contains(text(), "Configurar Planilla")]')  // Button
By.xpath('//button[contains(@class, "close") or contains(@class, "btn-close")]')  // Close button
By.xpath('//button[contains(text(), "Cancelar")]')  // Cancel button
By.css('input[type="number"]')  // Number inputs for config
```

---

## CASO DE PRUEBA 04.03: CREAR NUEVO TRABAJADOR

**ID del Caso:** CP-04.03  
**Nombre:** Abrir formulario de Nuevo Trabajador  
**Flujo Asociado:** Flujo 04 - Trabajadores  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-06: Crear trabajador  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que el botón "Nuevo Trabajador" abra un formulario donde el administrador pueda registrar un nuevo trabajador con sus datos básicos.

### Precondiciones
- Usuario administrador autenticado
- Está en el módulo de Trabajadores
- El formulario está disponible

### Datos de Entrada
- Ninguno requerido para abrir

### Pasos de Ejecución
1. Desde el módulo de Trabajadores, localizar botón "Nuevo Trabajador"
   (XPath: `//button[contains(text(), "Nuevo Trabajador")]`)
2. Hacer clic en el botón
3. Esperar a que se abra el modal/formulario
4. Visualizar los campos del formulario (4 segundos)
5. Cerrar el modal sin enviar

### Resultado Esperado
- ✅ El botón es visible y clickeable
- ✅ Se abre un formulario o modal
- ✅ El formulario contiene campos esperados:
  - Nombre
  - DNI
  - Posición/Cargo
  - Sueldo base (precompletado)
  - Botones: Guardar, Cancelar
- ✅ Los campos están vacíos (listos para ingreso)
- ✅ El formulario se cierra sin guardar

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/WorkerManagement.tsx` - Botón
- Formulario de creación de trabajador
- `src/services/workerService.ts` - Creación en BD

**Selectores Utilizados:**
```javascript
By.xpath('//button[contains(text(), "Nuevo Trabajador")]')  // Button
By.css('input#name')  // Name field
By.css('input#dni')   // DNI field
By.css('input#position')  // Position field
By.css('input[type="number"]')  // Salary field
```

---

## CASO DE PRUEBA 04.04: ACCESO A VISTA DE ASISTENCIA DESDE ADMIN

**ID del Caso:** CP-04.04  
**Nombre:** Abrir panel de Asistencia desde módulo de Trabajadores  
**Flujo Asociado:** Flujo 04 - Trabajadores  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-07: Gestionar asistencia  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que el botón rojo "Asistencia" en la esquina superior derecha del módulo de Trabajadores abra la vista de registros de asistencia del día actual.

### Precondiciones
- Usuario administrador autenticado
- Está en el módulo de Trabajadores
- Existen registros de asistencia en Firestore

### Datos de Entrada
- Ninguno requerido

### Pasos de Ejecución
1. Desde el módulo de Trabajadores, buscar botón rojo "Asistencia"
   (Ubicación: esquina superior derecha)
2. Hacer clic en el botón
3. Esperar a que cargue la lista de asistencia (2-3 segundos)
4. Visualizar los registros del día

### Resultado Esperado
- ✅ El botón rojo "Asistencia" es visible
- ✅ Al hacer clic, se carga la vista de asistencia
- ✅ Se muestra lista/tabla de registros del día
- ✅ Los registros contienen:
  - Nombre del trabajador
  - Hora de entrada
  - Hora de salida
  - Estado (presente, ausente, etc)
- ✅ No hay errores de carga

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/WorkerManagement.tsx` - Botón
- `src/components/AttendanceView.tsx` - Vista de asistencia
- `src/services/workerService.ts` (attendanceService) - Datos

**Selectores Utilizados:**
```javascript
By.xpath('//button[contains(text(), "Asistencia")]')  // Asistencia button
By.css('button[class*="bg-red"]')  // Red button (alternative)
By.css('table, .attendance-list')  // Attendance records display
```

---

## CASO DE PRUEBA 04.05: ACCIONES EN TARJETA DE EMPLEADO

**ID del Caso:** CP-04.05  
**Nombre:** Ejecutar acciones disponibles en tarjeta de empleado (Demostración lenta)  
**Flujo Asociado:** Flujo 04 - Trabajadores  
**Tipo de Prueba:** Funcional Integrativa  
**Requisito Asociado:** RF-XX: Gestión completa de trabajadores  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que todas las acciones disponibles en la tarjeta de un empleado sean accesibles y funcionen correctamente. Incluye: Mostrar Planilla, Ajustar, Historial, Ajustar Sueldo, Agregar Bono.

### Precondiciones
- Usuario administrador autenticado
- Está en el módulo de Trabajadores
- Se ve al menos una tarjeta de empleado
- Existen trabajadores en la base de datos

### Datos de Entrada
- Se utiliza el primer trabajador disponible

### Pasos de Ejecución
1. Desde el módulo de Trabajadores, localizar primera tarjeta de empleado
   (Selector: `.worker-card` o similar)
2. Para cada acción disponible:
   - Localizar botón con la etiqueta de acción
   - Hacer clic en el botón
   - Esperar a que se abra modal/vista
   - Permitir 5 segundos de visualización
   - Cerrar el componente (con "X" o ESC)
3. Acciones a probar (en orden):
   - "Mostrar Planilla"
   - "Ajustar"
   - "Historial"
   - "Ajustar Sueldo"
   - "Agregar Bono"

### Resultado Esperado
- ✅ Cada botón de acción es clickeable
- ✅ Se abre un modal/vista para cada acción
- ✅ Los modales muestran información/formularios relevantes
- ✅ Los modales se cierran correctamente
- ✅ No hay errores durante la interacción
- ✅ Todas las 5 acciones funcionan sin problema
- ✅ La tarjeta permanece intacta después de cada acción

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/WorkerManagement.tsx` - Contenedor de tarjetas
- `src/components/PayrollHistoryModal.tsx` - Mostrar Planilla
- `src/components/PayrollAdjustmentModal.tsx` - Ajustar
- `src/components/HistoryAnalysisModal.tsx` - Historial
- Formulario de ajuste de sueldo
- `src/components/BonusModal.tsx` - Agregar Bono

**Selectores Utilizados:**
```javascript
By.css('.worker-card')                                    // Worker card
By.xpath('.//button[contains(text(), "Mostrar Planilla")]')  // Button 1
By.xpath('.//button[contains(text(), "Ajustar")]')        // Button 2
By.xpath('.//button[contains(text(), "Historial")]')      // Button 3
By.xpath('.//button[contains(text(), "Ajustar Sueldo")]')  // Button 4
By.xpath('.//button[contains(text(), "Agregar Bono")]')   // Button 5
By.css('button.close')                                    // Modal close button
By.key('Escape')                                          // ESC key
```

**Cierre de Modales:**
- Primera opción: Botón "X" en esquina del modal
- Segunda opción: Botón "Cancelar"
- Tercera opción: Tecla ESC
- Método: `driver.actions().sendKeys(Key.ESCAPE).perform()`

---

## MATRIZ DE COBERTURA - FLUJO 04

| Caso | Componente | RF Asociado | Status | Evidencia |
|------|-----------|-----------|--------|-----------|
| CP-04.01 | WorkerManagement.tsx | RF-XX | ✅ | Script 2.0 |
| CP-04.02 | PayrollAdjustmentModal.tsx | RF-09 | ✅ | Script 2.1 |
| CP-04.03 | WorkerManagement.tsx | RF-06 | ✅ | Script 2.1 |
| CP-04.04 | AttendanceView.tsx | RF-07 | ✅ | Script 2.1 |
| CP-04.05 | WorkerManagement.tsx | RF-XX | ✅ | Script 2.2 |

---

## NOTAS TÉCNICAS

### Sincronización y Timing
- Cada modal requiere 4-5 segundos de visualización
- Es un "modo demostración lenta" para permitir observación visual
- El navegador maximiza la ventana para mejor visibilidad

### Orden de Ejecución
CP-04.01 → CP-04.02 → CP-04.03 → CP-04.04 → CP-04.05

### Errores Comunes
- Los modales pueden tener selectors variables
- Usar `scrollIntoView()` para asegurar visibilidad
- Usar `executeScript()` para forzar click si hay interceptación

---

**Generado por:** Auditoría Técnica Automatizada  
**Basado en:** flujo_04_trabajadores.test.js  
**Última actualización:** 2026-06-12
