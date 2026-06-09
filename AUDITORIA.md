# Auditoría Técnica y Funcional

## 1. Resumen Ejecutivo

- **Nombre del sistema:** CalzaSoft
- **Objetivo principal:** Plataforma administrativa para fábrica de calzado con control de usuarios, trabajadores, asistencia, ventas, inventario y reportes.
- **Problema que resuelve:** Centraliza la administración operativa, controla el acceso por roles y gestiona datos clave de producción y personal.
- **Usuarios involucrados:** super_admin, admin, supervisor y trabajador.
- **Alcance funcional identificado:** autenticación, roles, gestión de usuarios, gestión de trabajadores, asistencia, reportes, clustering, emergencia Super Admin, inventario de materias primas, ventas y nómina.
- **Resumen de arquitectura:** SPA React con Firebase Auth y Firestore como backend, ejecutado en escritorio con Electron.

## 2. Descripción General del Sistema

### Propósito del sistema
Controlar las operaciones administrativas de una industria de calzado, especialmente la gestión de personal, ventas, inventario y generación de reportes.

### Dominio de negocio
Sistema orientado a la industria manufacturera de calzado, con procesos de gestión de recursos humanos, asistencia y producción.

### Procesos principales
- Autenticación y autorización de usuarios.
- Gestión de usuarios y roles.
- Gestión de trabajadores y planilla.
- Registro de asistencia (entrada, break, salida).
- Generación de reportes analíticos.
- Recuperación de Super Admin en emergencia.

### Procesos secundarios
- Generación automática de credenciales.
- Auditoría de modificaciones de asistencia.
- Seed de materias primas.
- Cálculos de nómina con ajustes.

### Flujo operativo general
1. Usuario accede a `/login`.
2. AuthContext valida credenciales con Firebase Auth.
3. Si autenticación valida, el sistema carga `AppLayout` y rutas protegidas.
4. Admin/super_admin accede a módulos de usuarios, trabajadores, reportes y clustering.
5. Trabajadores pueden marcar asistencia desde la pantalla de login.
6. Firestore persiste los datos operativos.

### Entradas y salidas
- Entradas: credenciales, datos de usuarios, datos de trabajadores, DNI, registros de ventas, movimientos de stock.
- Salidas: dashboards, reportes, documentos Firestore actualizados, notificaciones UI.

### Dependencias externas
- Firebase Auth
- Firestore
- Electron
- Chart.js
- React Router

## 3. Arquitectura del Sistema

### Arquitectura utilizada
- SPA React con `react-router-dom`.
- Backend como servicio: Firebase Auth + Firestore.
- Desktop app con Electron.

### Patrón de diseño predominante
- Componentes React.
- Context API para autenticación.
- Servicios separados para acceso a Firestore.

### Componentes principales
- `src/App.js`
- `src/contexts/AuthContext.js`
- `src/components/Login.js`
- `src/components/UserManagement.js`
- `src/components/WorkerManagement.tsx`
- `src/components/ReportsPage.js`
- `src/components/EmergencySuperAdminSetup.js`
- `src/components/rawMaterialService.js`
- `src/services/saleService.ts`

### Frontend
- React 19
- Componentes con CSS por módulo
- Routes protegidas según estado de autenticación

### Backend
- Firebase Auth
- Firestore

### Base de datos
- Colecciones principales: `users`, `workers`, `attendance`, `sales`, `bonuses`, `rawMaterials`, `payrollSettings`, `attendance_logs`, `pendingUsers`

### APIs
- Firebase SDK (Auth, Firestore)
- No se identifican endpoints REST propios.

### Servicios externos
- Firebase
- Electron

### Middleware
- `AuthProvider` como capa de sesión y autorización.
- `BrowserRouter` y `Routes` en el frontend.

### Autenticación
- Email/password con Firebase Auth.
- `onAuthStateChanged` para cambios de sesión.

### Autorización
- `userRole` cargado desde Firestore.
- Rutas y vistas condicionadas en componentes.

### Interacción entre componentes
- `App` envuelve con `AuthProvider`.
- `AppContent` renderiza rutas protegidas.
- Componentes llaman servicios Firestore desde `service.ts`.

## 4. Inventario de Módulos

### Autenticación
- **Objetivo:** gestionar sesiones de usuarios.
- **Funcionalidades:** login, logout, creación de usuario adicional, carga de roles.
- **Archivos:** `src/contexts/AuthContext.js`, `src/firebase.js`

### Gestión de usuarios
- **Objetivo:** crear, editar, eliminar y administrar permisos.
- **Funcionalidades:** listado de usuarios, creación, edición, eliminación, generación de credenciales.
- **Archivos:** `src/components/UserManagement.js`, `src/utils/userGenerator.js`

### Gestión de trabajadores
- **Objetivo:** registrar y mantener datos de trabajadores.
- **Funcionalidades:** CRUD de trabajadores, carga de planillas, ajustes.
- **Archivos:** `src/components/WorkerManagement.tsx`, `src/services/workerService.ts`, `src/types/payroll.ts`

### Asistencia
- **Objetivo:** registrar eventos de entrada, break y salida.
- **Funcionalidades:** marcar asistencia, verificar registros del día.
- **Archivos:** `src/components/Login.js`, `src/services/workerService.ts`

### Reportes
- **Objetivo:** visualizar métricas de ventas y personal.
- **Funcionalidades:** gráficos de ventas por estado, análisis mensual, datos de asistencia.
- **Archivos:** `src/components/ReportsPage.js`

### Clustering
- **Objetivo:** análisis de agrupamiento.
- **Funcionalidades:** módulo de clustering presente, lógica no completamente visible.
- **Archivos:** `src/components/ClusteringPage.js`

### Emergencia Super Admin
- **Objetivo:** recuperar acceso de administrador.
- **Funcionalidades:** crear/reparar super admin, promover usuario existente.
- **Archivos:** `src/components/EmergencySuperAdminSetup.js`, `src/emergencyAuth.js`

### Inventario de materias primas
- **Objetivo:** administrar stock de materiales.
- **Funcionalidades:** listar, crear, actualizar, eliminar, movimientos con transacción.
- **Archivos:** `src/components/rawMaterialService.js`

### Ventas
- **Objetivo:** registrar ventas y consultar totales.
- **Funcionalidades:** crear venta, crear venta en fecha específica, obtener ventas por período.
- **Archivos:** `src/services/saleService.ts`

### Nómina / Planilla
- **Objetivo:** calcular sueldos y ajustes.
- **Funcionalidades:** cargar payroll settings, ajustar sueldos, calcular remuneraciones.
- **Archivos:** `src/services/workerService.ts`, `src/types/payroll.ts`, `src/components/WorkerManagement.tsx`

## 5. Requerimientos Funcionales Inferidos

- RF-01: Autenticación de usuarios.
- RF-02: Control de roles por `userRole`.
- RF-03: Crear nuevo usuario.
- RF-04: Editar usuario.
- RF-05: Eliminar usuario.
- RF-06: Crear trabajador.
- RF-07: Registrar asistencia.
- RF-08: Visualizar reportes.
- RF-09: Configurar nómina.
- RF-10: Recuperar Super Admin.
- RF-11: Gestionar materias primas.
- RF-12: Auditar cambios de asistencia.

## 6. Requerimientos No Funcionales Inferidos

- Seguridad: roles basados en UI, falta evidencia de reglas de Firestore.
- Rendimiento: consultas sin paginación y potencial carga pesada.
- Disponibilidad: dependiente de Firebase.
- Escalabilidad: uso de colecciones Firestore directo puede crecer sin optimización.
- Mantenibilidad: mezcla JS/TS y código de depuración.
- Usabilidad: mensajes UI detallados, pero lógica de asistencia está en login.
- Integridad de datos: transacciones para stock, pero validaciones limitadas.
- Compatibilidad: orientado a escritorio con Electron.
- Auditoría: existe logging de asistencia, `createdBy`/`updatedBy`.

## 7. Casos de Uso Detectados

- Iniciar sesión.
- Crear usuario.
- Editar usuario.
- Eliminar usuario.
- Crear trabajador.
- Marcar entrada, break y salida.
- Ver reportes de ventas.
- Crear o reparar Super Admin.
- Consultar inventario de materias primas.

## 8. Flujo de Datos

- Usuario ingresa datos en UI.
- Firebase Auth autentica y devuelve usuario.
- AuthContext carga rol desde Firestore.
- Servicios Firestore leen/escriben en colecciones.
- Los datos pasan de componentes a servicios y se visualizan en dashboards.

## 9. Base de Datos

### Colecciones principales identificadas
- `users`
- `workers`
- `attendance`
- `sales`
- `bonuses`
- `rawMaterials`
- `attendance_logs`
- `payrollSettings`
- `pendingUsers`

### Modelo lógico descriptivo
- `users`: id, email, name, role, permissions, status, createdAt, updatedAt, createdBy.
- `workers`: id, name, dni, position, baseSalary, currentSalary, payrollAdjustments, hireDate, status, createdAt, updatedAt.
- `attendance`: id, workerId, workerName, type, timestamp.
- `sales`: id, saleNumber, date, status, distributor, client, products, totalAmount, createdBy.
- `rawMaterials`: id, name, category, supplier, unit, lowStockThreshold, cost, stock, status, createdAt.
- `attendance_logs`: action, reason, timestamp, modifiedBy, workerId, originalRecords.
- `payrollSettings`: baseSalary, workingDaysPerMonth, workingHoursPerDay, overtimeMultiplier, invalidInsuranceAmount, pensionFundPercentage, essaludAmount, lateToleranceMinutes.

## 10. Seguridad

### Criticidad
- Crítico: creación/promoción de `super_admin` desde cliente; autorización basada en frontend.
- Alto: eliminación permanente de usuarios; gestión de sesiones y roles frágil; `prompt()` para UID.
- Medio: Firebase config expuesta en frontend, debug logs en producción.
- Bajo: funciones de emergencia globales cargadas en `window`.

## 11. Identificación de Riesgos

- Escalada de privilegios.
- Pérdida de datos por eliminación irreversible.
- Consistencia de asistencia mal gestionada.
- Consultas masivas sin paginado.
- Dependencia de reglas de seguridad no visibles.

## 12. Escenarios de Prueba Recomendados

- Validar login con credenciales válidas e inválidas.
- Verificar restricciones de acceso a rutas por rol.
- Probar creación, edición y eliminación de usuarios.
- Registrar asistencia y manejar duplicados.
- Generar reportes con y sin datos.
- Ejecutar flujo de emergencia Super Admin.
- Probar movimientos de stock y validación de stock negativo.

## 13. Recomendaciones para QA

- Priorizar pruebas de autenticación y autorización.
- Evaluar el módulo de emergencia Super Admin con rigor de seguridad.
- Verificar la integridad de registros de asistencia y auditoría.
- Usar Firebase Emulator Suite para pruebas de integración.
- Preparar datos de prueba: usuarios con roles, trabajadores, ventas y materias primas.

## 14. Evidencias Técnicas

- `src/App.js`: rutas protegidas y carga de módulos.
- `src/contexts/AuthContext.js`: lógica de sesión, rol y creación de usuario.
- `src/components/UserManagement.js`: gestión administrativa de usuarios.
- `src/components/Login.js`: asistencia y login.
- `src/components/EmergencySuperAdminSetup.js` y `src/emergencyAuth.js`: recuperación de Super Admin.
- `src/services/workerService.ts`: operaciones de asistencia y audit logs.
- `src/services/saleService.ts`: manejo de ventas.
- `src/components/rawMaterialService.js`: stock y transacciones.

## 15. Conclusión de Auditoría

- El sistema es funcional y cubre un conjunto amplio de necesidades de gestión para la fábrica de calzado.
- Presenta un nivel de complejidad medio-alto por la mezcla de dominios de negocio y el uso de Firebase.
- Existe evidencia de trabajo sustancial, pero el sistema requiere mejoras de seguridad, validación y mantenimiento.
- Para pruebas, el sistema está en un punto viable, aunque es necesario reforzar reglas de Firestore y limpiar código de emergencia/debug.
- Los hallazgos críticos deben abordarse antes de considerar al sistema listo para producción.
