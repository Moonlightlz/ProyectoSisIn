# CASOS DE PRUEBA - FLUJO 01: AUTENTICACIÓN

**Versión:** 2.0  
**Fecha de Actualización:** 2026-06-12  
**Estado:** ACTUALIZADO A PARTIR DE SCRIPTS REALES  
**Archivo de Pruebas:** `flujo_01_autenticacion.test.js`

---

## MAPEO DE REQUERIMIENTOS FUNCIONALES

| Requerimiento | Caso de Prueba | Script Test | Componente |
|---------------|----------------|------------|-----------|
| RF-01: Autenticación de usuarios | CP-01.01 | 1.1 - Login exitoso | Login.js |
| RF-02: Control de roles por userRole | CP-01.02 | 1.2 - Login fallido | Login.js, AuthContext.js |
| RF-01: Autenticación con DNI (Asistencia) | CP-01.03 | 1.3 - Reconocimiento DNI | Login.js |

---

## CASO DE PRUEBA 01.01: LOGIN EXITOSO CON CREDENCIALES VÁLIDAS

**ID del Caso:** CP-01.01  
**Nombre:** Login exitoso con credenciales válidas  
**Flujo Asociado:** Flujo 01 - Autenticación  
**Tipo de Prueba:** Funcional Positiva  
**Requisito Asociado:** RF-01: Autenticación de usuarios  
**Estado:** Activo  
**Prioridad:** Crítica  

### Descripción
Valida que un usuario administrador con credenciales válidas pueda iniciar sesión exitosamente y sea redirigido a la interfaz principal del sistema.

### Precondiciones
- La aplicación está disponible en `http://localhost:3000`
- Base de datos Firebase está operativa
- El usuario administrador `jvalenzuela884@calzado.com` existe en Firebase Auth
- El navegador Chrome está disponible y es soportado

### Datos de Entrada
- **Email:** `jvalenzuela884@calzado.com`
- **Contraseña:** `DA0W6G`

### Pasos de Ejecución
1. Abrir navegador Chrome y navegar a `http://localhost:3000`
2. Esperar a que se cargue la página de Login
3. Localizar el campo Email (selector: `#email`)
4. Ingresar email: `jvalenzuela884@calzado.com`
5. Localizar el campo Contraseña (selector: `#password`)
6. Ingresar contraseña: `DA0W6G`
7. Presionar Enter o hacer clic en botón de login
8. Esperar redirección y carga de interfaz

### Resultado Esperado
- ✅ Las credenciales son aceptadas sin error
- ✅ La URL cambia de `/login` a una ruta protegida (`/`, `/home`, etc)
- ✅ La interfaz de administrador se carga correctamente
- ✅ Se muestra el Dashboard o layout principal
- ✅ No aparecen mensajes de error
- ✅ Tiempo de carga total ≤ 4 segundos

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/Login.js` - Componente de formulario de login
- `src/contexts/AuthContext.js` - Contexto de autenticación
- `src/firebase.js` - Configuración Firebase Auth

**Servicios Involucrados:**
- Firebase Authentication (`signInWithEmailAndPassword`)
- Firebase Firestore (carga de rol del usuario)

**Selectores Utilizados:**
```javascript
By.id('email')           // Email input
By.id('password')        // Password input
By.css('button.login-button')  // Submit button
```

**Criterios de Aceptación Técnica:**
- El token de sesión se almacena en localStorage
- El rol del usuario se carga desde Firestore
- No hay errores en la consola del navegador

---

## CASO DE PRUEBA 01.02: LOGIN FALLIDO CON CREDENCIALES INVÁLIDAS

**ID del Caso:** CP-01.02  
**Nombre:** Login fallido con credenciales inválidas  
**Flujo Asociado:** Flujo 01 - Autenticación  
**Tipo de Prueba:** Funcional Negativa  
**Requisito Asociado:** RF-01: Validación de credenciales  
**Estado:** Activo  
**Prioridad:** Crítica

### Descripción
Valida que el sistema rechace credenciales inválidas y muestre un mensaje de error claro al usuario, evitando que acceda a la aplicación.

### Precondiciones
- La aplicación está disponible en `http://localhost:3000`
- Base de datos Firebase está operativa
- El usuario está en la página de Login
- No hay sesión activa previar

### Datos de Entrada
- **Email:** `invalid@correo.com`
- **Contraseña:** `wrongpassword123`

### Pasos de Ejecución
1. Navegar a `http://localhost:3000/login` (o iniciar desde cero si está deslogueado)
2. Localizar el campo Email (selector: `#email`)
3. Ingresar email inválido: `invalid@correo.com`
4. Localizar el campo Contraseña (selector: `#password`)
5. Ingresar contraseña incorrecta: `wrongpassword123`
6. Presionar Enter o hacer clic en botón de login
7. Esperar a que el sistema valide las credenciales

### Resultado Esperado
- ✅ El login se rechaza
- ✅ Aparece un mensaje de error visible (selector: `.error-message`)
- ✅ El usuario permanece en la página `/login`
- ✅ El mensaje de error es descriptivo (ej: "Credenciales inválidas", "Usuario no encontrado")
- ✅ No se realiza redirección
- ✅ No hay data almacenada en localStorage

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/Login.js` - Manejo de errores de login
- `src/contexts/AuthContext.js` - Validación de credenciales

**Servicios Involucrados:**
- Firebase Authentication (rechaza `signInWithEmailAndPassword`)

**Selectores Utilizados:**
```javascript
By.id('email')           // Email input
By.id('password')        // Password input
By.className('error-message')  // Error message display
```

**Mensajes de Error Esperados:**
- "👤 No existe una cuenta registrada con este correo electrónico"
- "❌ Credenciales inválidas"
- "⏰ Demasiados intentos fallidos"

**Criterios de Aceptación Técnica:**
- Firebase Auth devuelve error `auth/user-not-found` o `auth/wrong-password`
- El contexto no actualiza `currentUser`
- No se genera token de sesión

---

## CASO DE PRUEBA 01.03: RECONOCIMIENTO DE TRABAJADOR POR DNI (ASISTENCIA)

**ID del Caso:** CP-01.03  
**Nombre:** Reconocimiento de trabajador por DNI en modo Asistencia  
**Flujo Asociado:** Flujo 01 - Autenticación + Asistencia  
**Tipo de Prueba:** Funcional Integrativa  
**Requisito Asociado:** RF-01 + RF-07: Autenticación y Registro de Asistencia  
**Estado:** Activo  
**Prioridad:** Crítica

### Descripción
Valida que un trabajador pueda ser reconocido por el sistema a partir de su DNI en la pantalla de Asistencia, mostrando su nombre de forma automática. Este es el flujo típico para que trabajadores registren su entrada sin necesidad de usuario/contraseña.

### Precondiciones
- La aplicación está disponible en `http://localhost:3000`
- Firebase Firestore está operativa
- Existe un trabajador registrado con DNI `25481579` (Alejandro Martín López)
- El usuario está en la página de Login
- Se puede acceder al modo de Asistencia sin autenticación

### Datos de Entrada
- **DNI:** `25481579`
- **Nombre esperado del trabajador:** Alejandro Martín López

### Pasos de Ejecución
1. Navegar a `http://localhost:3000`
2. En la pantalla de Login, localizar botón "Asistencia Trabajador"
3. Hacer clic en el botón "Asistencia Trabajador"
4. Esperar 2.5 segundos a que Firebase cargue los datos de trabajadores
5. Localizar el campo DNI (selector: `#dni`)
6. Ingresar el DNI: `25481579`
7. Esperar 1 segundo a que React filtre y valide el usuario
8. Observar que aparece el saludo personalizadocon el nombre del trabajador

### Resultado Esperado
- ✅ El campo DNI acepta la entrada numérica
- ✅ Después de 1 segundo, el sistema muestra: "Hola, Alejandro Martín López"
- ✅ El nombre coincide exactamente con el registrado en Firestore
- ✅ Aparece elemento visual con la clase `.found-user-name`
- ✅ Se muestran botones de acciones (Entrada, Break, Salida)
- ✅ No hay mensajes de error
- ✅ La búsqueda es sensible al DNI ingresado

### Evidencia Técnica
**Componentes Involucrados:**
- `src/components/Login.js` - Modo Asistencia y búsqueda por DNI
- `src/services/workerService.ts` - Obtención de lista de trabajadores

**Servicios Involucrados:**
- `workerService.getAllWorkers()` - Carga desde Firestore
- Filtrado por DNI en React

**Selectores Utilizados:**
```javascript
By.xpath('//*[contains(text(), "Asistencia Trabajador")]')  // Button
By.id('dni')                                                 // DNI input
By.css('.found-user-name')                                  // User name display
By.xpath('//*[contains(text(), "Hola, Alejandro")]')       // Greeting
```

**Flujo de Datos:**
1. Usuario ingresa DNI en la UI
2. React effect hook detecta cambio (8 dígitos)
3. Se filtra en la lista de `workers` por DNI
4. Se actualiza estado `foundUser`
5. Se renderiza el saludo con `foundUser.name`

**Criterios de Aceptación Técnica:**
- La lista de trabajadores se carga correctamente desde Firestore
- El filtrado es case-insensitive pero exacto en DNI
- El nombre se renderiza dentro del intervalo de 1-2 segundos
- No hay lag o retrasos perceptibles

---

## MATRIZ DE COBERTURA - FLUJO 01

| Caso | Componente | RF Asociado | Status | Evidencia |
|------|-----------|-----------|--------|-----------|
| CP-01.01 | Login.js, AuthContext.js | RF-01 | ✅ | Script 1.1 |
| CP-01.02 | Login.js | RF-01 | ✅ | Script 1.2 |
| CP-01.03 | Login.js, workerService | RF-01, RF-07 | ✅ | Script 1.3 |

---

## NOTAS TÉCNICAS

### Selectores Reales del Código
Todos los selectores han sido extraídos directamente de:
- `src/components/Login.js` línea 8-20: inputs de email/password
- `src/services/workerService.ts`: métodos de obtención de trabajadores
- `src/contexts/AuthContext.js`: lógica de autenticación

### Dependencias de Ejecución
- Orden recomendado: CP-01.01 → CP-01.02 → CP-01.03
- CP-01.03 no requiere autenticación previa
- Cada caso es independiente (limpia localStorage entre tests)

### Datos de Prueba Reales
- Las credenciales de admin son reales y válidas en el entorno de desarrollo
- El DNI 25481579 es un trabajador existente en la BD de prueba
- Todos los datos están contenidos en el proyecto

---

**Generado por:** Auditoría Técnica Automatizada  
**Basado en:** flujo_01_autenticacion.test.js  
**Última actualización:** 2026-06-12
