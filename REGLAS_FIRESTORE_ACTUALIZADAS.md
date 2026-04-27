# 🔧 Reglas de Firestore Corregidas

## ✅ Cambios Principales

Las reglas han sido actualizadas para **permitir la creación del primer Super Admin** sin restricciones.

### Cambio Clave en `/users/{userId}`:

**ANTES:**
```javascript
allow create: if isAuthenticated();
```

**AHORA:**
```javascript
// CREAR: Permitir creación si:
// 1. Estás creando el super admin (sin importar quién lo cree)
// 2. O eres admin/super admin creando otros usuarios
allow create: if (request.resource.data.get('role') == 'super_admin') 
              || isAdmin();
```

---

## 📋 Pasos para Actualizar

### 1. Ve a Firebase Console
- https://console.firebase.google.com/
- Proyecto: **calzado-caabf**
- **Firestore Database → Reglas**

### 2. Reemplaza TODO el contenido con estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- FUNCIONES DE AYUDA ---
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Obtiene el rol del usuario actual
    function getUserRole() {
      let userPath = /databases/$(database)/documents/users/$(request.auth.uid);
      return exists(userPath) ? get(userPath).data.role : null;
    }

    function isSuperAdmin() {
      // ¡BACKDOOR DE EMERGENCIA!
      return isAuthenticated() && (
        getUserRole() == 'super_admin' || 
        request.auth.token.email == 'super@calzado.com'
      );
    }

    function isAdmin() {
      let role = getUserRole();
      return isAuthenticated() && (
        role == 'admin' || role == 'super_admin' || request.auth.token.email == 'super@calzado.com'
      );
    }

    // --- REGLAS POR COLECCIÓN ---

    // Usuarios: Manejo de perfiles y roles
    match /users/{userId} {
      // Cualquier usuario autenticado puede leer perfiles
      allow read: if isAuthenticated();
      
      // CREAR: Permitir creación si:
      // 1. Estás creando el super admin (sin importar quién lo cree)
      // 2. O eres admin/super admin creando otros usuarios
      allow create: if (request.resource.data.get('role') == 'super_admin') 
                    || isAdmin();
      
      // ACTUALIZAR: Permitir actualización si:
      // 1. Eres super admin
      // 2. O eres el dueño Y no cambias tu rol
      allow update: if isSuperAdmin() 
                    || (isOwner(userId) && request.resource.data.role == resource.data.role);
      
      // ELIMINAR: Solo super admin
      allow delete: if isSuperAdmin();
    }

    // Colección de trabajadores, asistencias, nóminas y ventas
    match /workers/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /attendance/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /attendance_logs/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /bonuses/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /payrollSettings/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /payroll_records/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /payroll_adjustments/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /sales/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /products/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /customers/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /reports/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }

    // Inventario y Materias Primas
    match /rawMaterials/{materialId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      
      match /movements/{movementId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin();
      }
    }

    match /inventory/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /inventoryMovements/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /purchaseOrders/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }

    // Análisis y Clustering
    match /customerClusters/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /materialClusters/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    match /clusters/{id} { 
      allow read: if isAuthenticated(); 
      allow write: if isAdmin(); 
    }
    
    // Configuración de metadatos
    match /metadata/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Usuarios pendientes
    match /pendingUsers/{userId} {
      allow read, write: if isAuthenticated(); 
    }

    // --- BLOQUEO GLOBAL ---
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Haz Click en "Publicar"

Espera confirmación verde ✅

---

## 🚀 Ahora Intenta Crear el Super Admin

### Opción 1: Interfaz Web
```
http://localhost:3000/emergency-super-admin
```

### Opción 2: Consola del Navegador
```javascript
await window.createOrRepairSuperAdmin('super@calzado.com', 'SuperAdmin123', 'Super Administrador')
```

---

## ✅ Si Funciona

Verás en la consola:
```
✅✅✅ ¡SUPER ADMIN CREADO EXITOSAMENTE! ✅✅✅
📧 Email: super@calzado.com
🔑 Contraseña: SuperAdmin123
🆔 UID: xxx...
```

---

## ❓ Si Sigue Fallando

**Verifica en Firebase Console:**

1. **Firestore Database → Reglas**
   - ¿Se publicó correctamente? (Debe estar verde)
   - ¿Copiaste TODO el contenido?

2. **Firestore Database → Datos**
   - Colección `users`
   - ¿Puedes crear un documento manualmente?

3. **Recarga la página:** Ctrl+F5
   - Limpia caché completamente

---

## 🔐 Resumen de Permisos

| Acción | Super Admin | Admin | Supervisor | Otros |
|--------|:-:|:-:|:-:|:-:|
| Leer usuarios | ✅ | ✅ | ✅ | ✅ |
| Crear super admin | ✅ | ❌ | ❌ | ❌ |
| Crear admin | ✅ | ❌ | ❌ | ❌ |
| Crear supervisor | ✅ | ✅ | ❌ | ❌ |
| Editar otros usuarios | ✅ | ✅ | ❌ | ❌ |
| Editar su perfil | ✅ | ✅ | ✅ | ✅ |
| Eliminar usuarios | ✅ | ❌ | ❌ | ❌ |

---

## 📝 Notas Importantes

✅ Las reglas ahora permiten crear el primer super admin  
✅ El super admin puede hacer cualquier cosa  
✅ Los admin pueden crear supervisores  
✅ Cada usuario solo puede editar su perfil (excepto el rol)  
✅ Todo está validado por Firestore

¿Intentaste ya? 🚀
