# CASOS DE PRUEBA - FLUJO 02: ASISTENCIA

**Versión:** 2.0  
**Fecha de Actualización:** 2026-06-12  
**Estado:** ACTUALIZADO A PARTIR DE SCRIPTS REALES  
**Archivo de Pruebas:** `flujo_02_asistencia.test.js`

---

## MAPEO DE REQUERIMIENTOS FUNCIONALES

| Requerimiento | Caso de Prueba | Script Test | Componente |
|---------------|----------------|------------|-----------|
| RF-07: Registrar asistencia (entrada) | CP-02.01 | 2.1 - Marcar entrada | Login.js, AttendanceView.tsx |
| RF-07: Validar duplicados de entrada | CP-02.02 | 2.2 - Límite lógico: doble entrada | Login.js, attendanceService |
| RF-12: Auditoría de cambios de asistencia | CP-02.03 | 2.3 - Auditoría: ajuste manual | WorkerManagement.tsx, attendanceService |

---

## CASO DE PRUEBA 02.01: MARCAR ENTRADA CON DNI VÁLIDO

**ID del Caso:** CP-02.01  
**Nombre:** Marcar entrada exitosamente con DNI válido  
**Flujo Asociado:** Flujo 02 - Asistencia  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-07: Registrar asistencia  
**Estado:** Activo  
**Prioridad:** Crítica

### Descripción
Valida que un trabajador pueda registrar su entrada de forma exitosa utilizando su DNI en la pantalla de Asistencia pública, generando un registro de entrada en la base de datos con timestamp actual.

### Precondiciones
- La aplicación está disponible en `http://localhost:3000`
- Firebase Firestore está operativa
- Existe trabajador con DNI válido: `25481579` (Alejandro Martín López)
- El trabajador NO tiene entrada registrada para el día actual
- No hay sesión activa de usuario
- Base de datos está limpia de registros duplicados del trabajador para hoy

### Datos de Entrada
- **DNI:** `25481579`
- **Tipo de registro:** Entrada (entry)
- **Timestamp:** Actual (sistema)

### Pasos de Ejecución
1. Navegar a `http://localhost:3000`
2. En la pantalla de Login, localizar botón "Asistencia" o similar (selector: `.asistencia-button-outside`)
3. Hacer clic en el botón de Asistencia
4. Esperar 2.5 segundos a que Firebase descargue los datos de trabajadores
5. Localizar el campo DNI (selector: `#dni`)
6. Ingresar el DNI: `25481579`
7. Esperar 1 segundo a que se busque el trabajador
8. Verificar que aparezca el nombre (selector: `.found-user-name`)
9. Localizar botón "Entrada" (selector: `.asistencia-button-action.entrada`)
10. Hacer clic en botón "Entrada"
11. Aparecerá un modal de confirmación
12. Localizar botón "Confirmar" o "Aceptar" en el modal
13. Hacer clic en el botón de confirmación
14. Esperar a que aparezca notificación de éxito

### Resultado Esperado
- ✅ El DNI es aceptado y validado
- ✅ Aparece el nombre del trabajador (Alejandro Martín López)
- ✅ El botón "Entrada" es visible y clickeable
- ✅ Aparece modal de confirmación
- ✅ Al confirmar, la entrada se registra exitosamente
- ✅ Aparece notificación verde/success (selector: `.notification-message`, `.success-message`)
- ✅ Se registra un documento en Firestore collection `attendance` con:
  - `workerId`: ID del trabajador
  - `type`: "entry"
  - `timestamp`: fecha/hora actual
  - `workerName`: "Alejandro Martín López"
- ✅ No hay mensajes de error
- ✅ El trabajador puede continuar con más acciones

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/Login.js` - Modo Asistencia
- `src/services/workerService.ts` - Obtención de trabajadores
- `src/services/workerService.ts` (attendanceService) - Grabación de entrada

**Servicios Involucrados:**
- `attendanceService.recordCheckIn(workerId, timestamp)`
- `workerService.getAllWorkers()`
- Firestore: escribir a collection `attendance`

**Selectores Utilizados:**
```javascript
By.css('button.asistencia-button-outside')       // Asistencia button
By.id('dni')                                      // DNI input
By.css('.found-user-name')                       // Worker name display
By.css('button.entrada')                         // Entry button
By.xpath('//div[contains(@class, "modal")]//button[contains(text(), "Confirmar")]')  // Confirm
By.css('.success-message')                       // Success notification
```

**Validaciones en Firestore:**
- Campo `attendance` con estructura correcta
- `timestamp` en formato ISO
- `workerId` corresponde al trabajador buscado

**Criterios de Aceptación Técnica:**
- La escritura en Firestore es instantánea (< 1 segundo)
- No se genera error de validación
- El registro tiene todos los campos requeridos

---

## CASO DE PRUEBA 02.02: RECHAZO DE DOBLE ENTRADA EL MISMO DÍA

**ID del Caso:** CP-02.02  
**Nombre:** Sistema rechaza intento de segunda entrada el mismo día  
**Flujo Asociado:** Flujo 02 - Asistencia  
**Tipo de Prueba:** Funcional Negativa (Validación de Lógica)  
**Requisito Asociado:** RF-07: Validar duplicados de asistencia  
**Estado:** Activo  
**Prioridad:** Alta

### Descripción
Valida que el sistema prevenga múltiples entradas del mismo trabajador en el mismo día calendario, implementando una regla de negocio que evita duplicados. Esto asegura que la asistencia sea única y consistente.

### Precondiciones
- La aplicación está disponible en `http://localhost:3000`
- Firebase Firestore está operativa
- Ya existe una entrada registrada para el DNI `25481579` en el día de hoy
- El trabajador está nuevamente intentando marcar entrada
- No hay sesión de usuario activa

### Datos de Entrada
- **DNI:** `25481579` (mismo trabajador del caso anterior)
- **Intento:** Segunda entrada del mismo día

### Pasos de Ejecución
1. Navegar a `http://localhost:3000`
2. Hacer clic en botón "Asistencia"
3. Esperar 2.5 segundos
4. Ingresar el mismo DNI: `25481579`
5. Esperar 1 segundo
6. Hacer clic en botón "Entrada" nuevamente
7. Esperar respuesta del sistema

### Resultado Esperado
- ✅ El sistema detecta que ya hay entrada registrada
- ✅ Aparece un mensaje de error/advertencia (selector: `.error-message`)
- ✅ El mensaje es claro, ej: "Ya hay una entrada registrada para hoy"
- ✅ La segunda entrada NO se registra en Firestore
- ✅ No hay modal de confirmación que permita proceder
- ✅ El usuario puede intentar registrar "Break" o "Salida" en lugar de "Entrada"
- ✅ El estado del trabajador muestra que ya tiene entrada

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/Login.js` - Validación de duplicados
- `src/services/workerService.ts` - attendanceService
- `src/utils/attendanceValidation` o similar (lógica de validación)

**Servicios Involucrados:**
- `attendanceService.getAttendanceForDay(date)` - Obtiene registros del día
- Validación antes de `recordCheckIn()`

**Selectores Utilizados:**
```javascript
By.css('button.asistencia-button-outside')       // Asistencia button
By.id('dni')                                      // DNI input
By.css('button.entrada')                         // Entry button
By.css('.error-message')                         // Error message
```

**Flujo de Validación:**
1. Usuario ingresa DNI
2. Sistema busca registros de hoy para ese trabajador
3. Encuentra entrada existente
4. Bloquea acción y muestra error
5. Ofrece alternativas (Break, Salida)

**Criterios de Aceptación Técnica:**
- La consulta a Firestore es eficiente (query con date y type)
- Valida por calendario del día actual (no por timestamp exacto)
- Error es capturado antes de escribir en BD

---

## CASO DE PRUEBA 02.03: AUDITORÍA - AJUSTE MANUAL DE HORA DE ASISTENCIA

**ID del Caso:** CP-02.03  
**Nombre:** Auditoría de ajuste manual de hora de asistencia desde panel admin  
**Flujo Asociado:** Flujo 02 - Asistencia  
**Tipo de Prueba:** Funcional Integrativa  
**Requisito Asociado:** RF-12: Auditar cambios de asistencia  
**Estado:** Activo  
**Prioridad:** Media

### Descripción
Valida que un administrador pueda ajustar manualmente la hora de asistencia de un trabajador y que este cambio sea auditado correctamente, registrando quién lo hizo, cuándo, y cuál fue el cambio original.

### Precondiciones
- Usuario administrador está autenticado (`jvalenzuela884@calzado.com`)
- La aplicación está disponible en `http://localhost:3000`
- Existen registros de asistencia en Firestore para al menos un trabajador
- Se puede navegar a la vista de gestión de asistencia desde el panel admin
- Firebase Firestore está operativa

### Datos de Entrada
- **Credenciales Admin:** `jvalenzuela884@calzado.com` / `DA0W6G`
- **Nueva hora:** `09:30` (formato HH:MM)
- **Razón del cambio:** Auditoría de ajuste manual

### Pasos de Ejecución
1. Navegar a `http://localhost:3000` y autenticarse como admin
2. Ingresar credenciales válidas
3. Después del login, navegar a sección "Trabajadores"
4. Buscar sección de "Asistencia" en la barra roja superior
5. Hacer clic en botón rojo "Asistencia"
6. Esperar 3 segundos a que cargue la lista de asistencia
7. Localizar un registro de asistencia (puede ser una tabla o lista)
8. Buscar botón de "Editar" (selector: `.edit-btn`, `button[title*="Editar"]`)
9. Hacer clic en botón de editar para el primer registro
10. Aparecerá un modal/formulario de edición
11. Localizar campo de hora (selector: `input[type="time"]`)
12. Ingresar nueva hora: `0930` o `09:30`
13. Localizar botón "Guardar" o "Enviar" (selector: `.btn-primary`, `.save-btn`)
14. Hacer clic en botón de guardar
15. Esperar a que se confirme la operación

### Resultado Esperado
- ✅ El modal/formulario de edición se abre correctamente
- ✅ El campo de hora es editable (type="time")
- ✅ Se puede ingresar la nueva hora
- ✅ Al guardar, no hay error de validación
- ✅ Aparece confirmación de éxito
- ✅ El registro se actualiza visualmente
- ✅ En Firestore, se registra en collection `attendance_logs` o similar:
  - `action`: "modified" o "edited"
  - `reason`: Razón del cambio
  - `timestamp`: Cuándo se hizo el cambio
  - `modifiedBy`: UID del admin que lo hizo
  - `originalRecords`: { hora anterior, etc }
  - `workerId`: ID del trabajador
- ✅ El cambio es auditado y trazable
- ✅ El registro original se preserva (en audit log)

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/WorkerManagement.tsx` - Panel de admin
- `src/components/AttendanceView.tsx` - Vista de asistencia
- `src/services/workerService.ts` - attendanceService

**Servicios Involucrados:**
- `attendanceService.updateAttendance(id, updatedData)`
- `attendanceService.logAuditChange()` - Registro de auditoría
- Firestore: write a `attendance_logs` collection

**Selectores Utilizados:**
```javascript
By.xpath('//a[contains(text(), "Trabajadores")]')      // Workers nav
By.xpath('//button[contains(text(), "Asistencia")]')   // Asistencia button
By.xpath('//button[contains(text(), "Editar")]')       // Edit button
By.css('input[type="time"]')                           // Time input
By.css('.save-btn')                                    // Save button
By.css('input[type="submit"]')                         // Submit button
```

**Estructura de Auditoría Esperada:**
```javascript
{
  "action": "modified",
  "workerId": "worker-id-xxx",
  "originalRecords": {
    "checkIn": "2026-06-12T08:30:00Z",
    "type": "entry"
  },
  "updatedRecords": {
    "checkIn": "2026-06-12T09:30:00Z"
  },
  "reason": "Corrección manual por admin",
  "timestamp": "2026-06-12T14:22:00Z",
  "modifiedBy": "uid-admin"
}
```

**Criterios de Aceptación Técnica:**
- La escritura en `attendance_logs` es atómica
- Se preservan los valores originales
- Se registra la identidad del admin
- La operación es reversible (hay log completo)

---

## MATRIZ DE COBERTURA - FLUJO 02

| Caso | Componente | RF Asociado | Status | Evidencia |
|------|-----------|-----------|--------|-----------|
| CP-02.01 | Login.js, attendanceService | RF-07 | ✅ | Script 2.1 |
| CP-02.02 | Login.js, attendanceService | RF-07 | ✅ | Script 2.2 |
| CP-02.03 | WorkerManagement.tsx, attendanceService | RF-12 | ✅ | Script 2.3 |

---

## NOTAS TÉCNICAS

### Dependencias entre Casos
- CP-02.02 REQUIERE que CP-02.01 se ejecute primero (para generar la entrada a rechazar)
- CP-02.03 requiere autenticación previa (caso diferente)

### Orden de Ejecución Recomendado
1. CP-02.01 (marca la entrada)
2. CP-02.02 (intenta marcar segunda entrada, falla)
3. CP-02.03 (ajusta hora como admin)

### Datos de Prueba
- DNI `25481579` es trabajador real en BD
- Admin credentials son válidos en ambiente de desarrollo
- Los registros de asistencia se limpian entre corridas de test

### Performance esperado
- Búsqueda de trabajador: < 500ms
- Registro de entrada: < 1 segundo
- Validación de duplicados: < 300ms
- Edición de asistencia: < 500ms

---

**Generado por:** Auditoría Técnica Automatizada  
**Basado en:** flujo_02_asistencia.test.js  
**Última actualización:** 2026-06-12
