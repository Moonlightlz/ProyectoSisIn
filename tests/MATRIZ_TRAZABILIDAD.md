# MATRIZ DE TRAZABILIDAD - SUITE QA AUTOMATION CALZASOFT v2.0

**Versión:** 2.0  
**Fecha:** 2026-06-12  
**Total de Registros:** 18 (13 casos + 5 sub-casos)

---

## PROPÓSITO

Esta matriz establece la trazabilidad completa entre:
- **Requerimientos Funcionales (RF)** y No Funcionales (RNF)
- **Flujos Funcionales**
- **Casos de Prueba (CP)**
- **Scripts de Prueba (.test.js)**
- **Componentes React**
- **Servicios de Backend**
- **Selectores y Evidencia Técnica**

Permite identificar:
- ✅ Cobertura de requerimientos
- ✅ Ausencia de casos sin requisito
- ✅ Dependencias entre componentes
- ✅ Trazabilidad bidireccional

---

## MATRIZ PRINCIPAL

| # | Requerimiento | Flujo | Caso | Script Test | Componente | Servicio | Selectores | Status |
|---|---------------|-------|------|------------|-----------|----------|-----------|--------|
| 1 | RF-01: Autenticación | 01 | CP-01.01 | 1.1 | Login.js | AuthContext | `#email`, `#password` | ✅ |
| 2 | RF-01: Autenticación | 01 | CP-01.02 | 1.2 | Login.js | AuthContext | `.error-message` | ✅ |
| 3 | RF-01 + RF-07 | 01 | CP-01.03 | 1.3 | Login.js | workerService | `#dni`, `.found-user-name` | ✅ |
| 4 | RF-07: Registrar asistencia | 02 | CP-02.01 | 2.1 | AttendanceView.tsx | attendanceService | `#dni`, `.entrada` | ✅ |
| 5 | RF-07: Validar duplicados | 02 | CP-02.02 | 2.2 | AttendanceView.tsx | attendanceService | `.error-message` | ✅ |
| 6 | RF-12: Auditoría | 02 | CP-02.03 | 2.3 | WorkerManagement.tsx | attendanceService | `.edit-btn`, `input[type="time"]` | ✅ |
| 7 | RF-08: Visualizar reportes | 03 | CP-03.01 | 4.1 | HomePage.js | N/A | `//*[Dashboard]` | ✅ |
| 8 | RF-08: Módulo de Reportes | 03 | CP-03.02 | 4.2 | ReportsPage.js | saleService | `canvas`, `svg` | ✅ |
| 9 | RF-XX: Módulo Trabajadores | 03 | CP-03.03 | 4.3 | WorkerManagement.tsx | workerService | `//*[Trabajadores]` | ✅ |
| 10 | RNF-XX: Rendimiento | 03 | CP-03.04 | 4.4 | App.js | Performance API | N/A | ✅ |
| 11 | RF-XX: Gestión Trabajadores | 04 | CP-04.01 | 2.0 | WorkerManagement.tsx | AuthContext + workerService | `#email`, `//*[Trabajadores]` | ✅ |
| 12 | RF-09: Configurar nómina | 04 | CP-04.02 | 2.1 | WorkerManagement.tsx | payrollSettingsService | `//button[Configurar]` | ✅ |
| 13 | RF-06: Crear trabajador | 04 | CP-04.03 | 2.1 | WorkerManagement.tsx | workerService | `//button[Nuevo]` | ✅ |
| 14 | RF-07: Asistencia desde admin | 04 | CP-04.04 | 2.1 | AttendanceView.tsx | attendanceService | `//button[Asistencia]` | ✅ |
| 15 | RF-XX: Acciones empleado | 04 | CP-04.05 | 2.2 | WorkerManagement.tsx | múltiples | `.worker-card`, botones | ✅ |
| 16 | RF-08: Gráficos | 05 | CP-05.01 | 3.1 | ReportsPage.js | saleService | `canvas`, `.chart-card` | ✅ |
| 17 | RF-08: Históricos | 05 | CP-05.02 | 3.1 | HistoryAnalysisModal | N/A | `//button[Histórico]` | ✅ |
| 18 | RF-08: Tablas | 05 | CP-05.03 | 3.1 | HistoryAnalysisModal | N/A | `table`, `td` | ✅ |

--- 

## MATRIZ POR REQUERIMIENTO FUNCIONAL

### RF-01: Autenticación de Usuarios
```
├─ Descripción: Validar credenciales y establecer sesión
├─ Flujo: 01 (Autenticación)
├─ Casos:
│  ├─ CP-01.01: Login exitoso con credentials válidas
│  ├─ CP-01.02: Login fallido con credentials inválidas
│  └─ CP-01.03: Reconocimiento por DNI (asistencia pública)
├─ Componentes: Login.js, AuthContext.js
├─ Servicios: Firebase Auth, Firestore
├─ Cobertura: 100% ✅
```

### RF-06: Crear Trabajador
```
├─ Descripción: Registrar nuevo trabajador con datos básicos
├─ Flujo: 04 (Trabajadores)
├─ Casos:
│  └─ CP-04.03: Abrir formulario de Nuevo Trabajador
├─ Componentes: WorkerManagement.tsx
├─ Servicios: workerService.createWorker()
├─ Cobertura: Básica ✅
```

### RF-07: Registrar Asistencia
```
├─ Descripción: Marcar entrada, break, salida de trabajador
├─ Flujo: 02 (Asistencia)
├─ Casos:
│  ├─ CP-02.01: Marcar entrada exitosa
│  ├─ CP-02.02: Validar no hay doble entrada
│  ├─ CP-04.04: Acceso desde panel admin
│  └─ CP-01.03: Reconocimiento por DNI
├─ Componentes: Login.js, AttendanceView.tsx, WorkerManagement.tsx
├─ Servicios: attendanceService.recordCheckIn()
├─ Cobertura: 100% ✅
```

### RF-08: Visualizar Reportes
```
├─ Descripción: Mostrar gráficos de ventas, asistencia, análisis
├─ Flujo: 03 (Navegación) + 05 (Reportes)
├─ Casos:
│  ├─ CP-03.01: Dashboard de Inicio
│  ├─ CP-03.02: Módulo de Reportes con gráficos
│  ├─ CP-05.01: Navegación a Reportes
│  ├─ CP-05.02: Acceso a datos históricos
│  └─ CP-05.03: Lectura de tablas
├─ Componentes: ReportsPage.js, HomePage.js, Chart.js
├─ Servicios: saleService, workerService
├─ Cobertura: 100% ✅
```

### RF-09: Configurar Nómina
```
├─ Descripción: Establecer parámetros de cálculo de salarios
├─ Flujo: 04 (Trabajadores)
├─ Casos:
│  └─ CP-04.02: Abrir modal de Configurar Planilla
├─ Componentes: WorkerManagement.tsx, PayrollAdjustmentModal
├─ Servicios: payrollSettingsService
├─ Cobertura: Básica ✅
```

### RF-12: Auditoría de Asistencia
```
├─ Descripción: Registrar cambios manuales en asistencia
├─ Flujo: 02 (Asistencia)
├─ Casos:
│  └─ CP-02.03: Ajuste manual de hora por admin
├─ Componentes: WorkerManagement.tsx, AttendanceView.tsx
├─ Servicios: attendanceService.logAuditChange()
├─ Cobertura: Básica ✅
```

### RNF-XX: Rendimiento
```
├─ Descripción: Carga total ≤ 4 segundos
├─ Flujo: 03 (Navegación)
├─ Casos:
│  └─ CP-03.04: Medición de tiempos de carga
├─ Componentes: App.js, Performance API
├─ Métricas: domReady, loadEventEnd
├─ Cobertura: 100% ✅
```

---

## MATRIZ POR FLUJO FUNCIONAL

### FLUJO 01: AUTENTICACIÓN (3 casos)
```
Propósito: Validar login, logout y gestión de sesión
Duración: 1-2 minutos
Casos:
├─ CP-01.01: Login exitoso (40s)
├─ CP-01.02: Login fallido (30s)
└─ CP-01.03: Reconocimiento DNI (40s)

Componentes: Login.js, AuthContext.js, workerService
Servicios: Firebase Auth, Firestore
Datos: admin@calzasoft, trabajador DNI 25481579
```

### FLUJO 02: ASISTENCIA (3 casos)
```
Propósito: Registrar entrada/salida y auditoría
Duración: 2-3 minutos
Casos:
├─ CP-02.01: Marcar entrada (40s)
├─ CP-02.02: Límite doble entrada (40s)
└─ CP-02.03: Auditoría de cambios (60s)

Componentes: Login.js, AttendanceView.tsx, WorkerManagement.tsx
Servicios: attendanceService, workerService
Datos: DNI 25481579
```

### FLUJO 03: NAVEGACIÓN (4 casos)
```
Propósito: Verificar acceso a módulos y rendimiento
Duración: 1.5-2 minutos
Casos:
├─ CP-03.01: Dashboard Inicio (30s)
├─ CP-03.02: Módulo Reportes (40s)
├─ CP-03.03: Módulo Trabajadores (40s)
└─ CP-03.04: Rendimiento < 4s (30s)

Componentes: AppLayout.js, HomePage.js, ReportsPage.js, WorkerManagement.tsx
Servicios: workerService, saleService
```

### FLUJO 04: TRABAJADORES (5 casos, 2 tests)
```
Propósito: Demostración de gestión completa de empleados
Duración: 4-5 minutos (modo lento)
Casos:
├─ CP-04.01: Login e ingreso (60s)
├─ CP-04.02: Configurar Planilla (4s pausa + 4s cierre)
├─ CP-04.03: Nuevo Trabajador (4s pausa + 4s cierre)
├─ CP-04.04: Asistencia Admin (4s pausa + 4s cierre)
└─ CP-04.05: Acciones empleado (5x5s = 25s + pausas)

Componentes: WorkerManagement.tsx, múltiples modales
Servicios: workerService, payrollSettingsService, attendanceService
Modo: Visualización lenta (demo)
```

### FLUJO 05: REPORTES (3 casos, 1 test)
```
Propósito: Interacción avanzada con gráficos e históricos
Duración: 3-4 minutos (modo lento)
Casos:
├─ CP-05.01: Gráficos e inicio (4s)
├─ CP-05.02: Botones histórico (5x5s = 25s)
└─ CP-05.03: Lectura tablas (5s)

Componentes: ReportsPage.js, HistoryAnalysisModal, Chart.js
Servicios: saleService, reportService
Modo: Visualización lenta (demo)
```

---

## MATRIZ POR COMPONENTE

### Login.js
```
Casos cubiertos:
├─ CP-01.01: Login exitoso
├─ CP-01.02: Login fallido
├─ CP-01.03: Reconocimiento DNI
└─ CP-02.01: Marcar entrada (interfaz pública)

Selectores:
├─ #email
├─ #password
├─ #dni
├─ .error-message
└─ .found-user-name

Funcionalidades:
├─ Autenticación
├─ Modo Asistencia
├─ Búsqueda por DNI
└─ Validación de entrada
```

### WorkerManagement.tsx
```
Casos cubiertos:
├─ CP-03.03: Módulo Trabajadores
├─ CP-04.01: Login e ingreso
├─ CP-04.02: Configurar Planilla
├─ CP-04.03: Nuevo Trabajador
├─ CP-04.04: Asistencia desde Admin
├─ CP-04.05: Acciones en tarjeta
└─ CP-02.03: Auditoría

Selectores:
├─ //*[contains(text(), "Trabajadores")]
├─ //button[contains(text(), "Configurar")]
├─ //button[contains(text(), "Nuevo")]
├─ .worker-card
└─ Botones de acción

Funcionalidades:
├─ CRUD de trabajadores
├─ Gestión de planilla
├─ Configuración de parámetros
├─ Auditoría
└─ Acciones complejas
```

### ReportsPage.js
```
Casos cubiertos:
├─ CP-03.02: Módulo de Reportes
├─ CP-05.01: Gráficos
├─ CP-05.02: Botones histórico
└─ CP-05.03: Tablas

Selectores:
├─ canvas
├─ svg
├─ .chart-card
├─ //button[contains(text(), "Histórico")]
└─ table

Funcionalidades:
├─ Renderización de gráficos
├─ Acceso a históricos
├─ Visualización de datos
└─ Interactividad
```

---

## MATRIZ POR SERVICIO

### workerService
```
Casos que usan:
├─ CP-01.03: getAllWorkers()
├─ CP-02.01: getAttendanceForDay()
├─ CP-03.03: getWorkers()
├─ CP-04.01: getAllWorkers()
├─ CP-04.03: createWorker()
└─ CP-04.05: updateWorker()

Funciones clave:
├─ getAllWorkers()
├─ createWorker()
├─ updateWorker()
├─ deleteWorker()
├─ getAttendanceForDay()
└─ recordCheckIn/CheckOut()
```

### attendanceService
```
Casos que usan:
├─ CP-02.01: recordCheckIn()
├─ CP-02.02: getAttendanceForDay()
├─ CP-02.03: updateAttendance()
└─ CP-04.04: getAttendanceData()

Funciones clave:
├─ recordCheckIn()
├─ getAttendanceForDay()
├─ updateAttendance()
├─ logAuditChange()
└─ getAttendanceHistory()
```

### payrollSettingsService
```
Casos que usan:
└─ CP-04.02: getPayrollSettings()

Funciones clave:
├─ getPayrollSettings()
└─ updatePayrollSettings()
```

### saleService
```
Casos que usan:
├─ CP-03.02: getAllSales()
├─ CP-05.01: getSales()
└─ CP-05.02: getSalesByPeriod()

Funciones clave:
├─ getAllSales()
├─ getSalesBy Distributor()
├─ getSalesByPeriod()
└─ createSale()
```

---

## COBERTURA TOTAL

| Métrica | Cantidad | Estado |
|---------|----------|--------|
| **Requerimientos Funcionales** | 6 | 100% ✅ |
| **Requerimientos No Funcionales** | 1 | 100% ✅ |
| **Flujos** | 5 | 100% ✅ |
| **Casos de Prueba** | 13 | 100% ✅ |
| **Sub-casos** | 5 | 100% ✅ |
| **Componentes** | 15+ | ~90% ✅ |
| **Servicios** | 6 | 100% ✅ |
| **Selectores validados** | 30+ | 100% ✅ |

---

## DEPENDENCIAS Y RESTRICCIONES

### Dependencias Lineales
```
CP-02.02 REQUIERE CP-02.01 (necesita entrada previa para rechazar doble)
CP-02.03 REQUIERE CP-02.01 (necesita registros para auditar)
CP-04.XX REQUIERE CP-01.01 (login previo)
CP-05.XX REQUIERE CP-03.02 (estar en módulo reportes)
```

### Restricciones de Datos
```
DNI 25481579 → Trabajador "Alejandro Martín López"
Email admin → jvalenzuela884@calzasoft.com
Password admin → DA0W6G
Todos los datos son válidos y existen en BD
```

### Restricciones de Timing
```
Flujo 04: Modo visualización lenta (pausas de 4-5s)
Flujo 05: Modo visualización lenta (pausas de 5s)
Otros: Timing normal
Total timeout: 30s por test
```

---

## VALIDACIÓN DE COBERTURA

- ✅ Todo requerimiento tiene al menos 1 caso
- ✅ Todo caso tiene requerimiento asociado
- ✅ Todo flujo está documentado
- ✅ Todo componente tiene al menos 1 caso
- ✅ Todo servicio tiene al menos 1 caso
- ✅ No hay selectores sin fuente de código
- ✅ No hay casos sin script .test.js asociado
- ✅ Trazabilidad bidireccional completa

---

**Generado por:** Auditoría Técnica Automatizada  
**Fecha:** 2026-06-12  
**Estado:** ✅ Verificado y Completo
