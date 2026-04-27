# 🔐 Crear Usuario Super Admin

## ¿Qué es un Super Admin?

El Super Admin es el usuario con **rango superior** que puede:
- ✅ Crear administradores
- ✅ Crear supervisores  
- ✅ Editar y eliminar usuarios
- ✅ Gestionar permisos y roles
- ✅ Acceder a todos los reportes

---

## Opción 1: Crear Super Admin desde Firebase Console (Recomendado)

### Pasos:

1. **Ve a [Firebase Console](https://console.firebase.google.com/)**
2. **Selecciona tu proyecto "calzado-caabf"**
3. **Ve a "Autenticación" → "Usuarios"**
4. **Haz clic en "Crear usuario"**
   - Email: `super@calzado.com` (o el que desees)
   - Contraseña: Crea una contraseña segura (mínimo 6 caracteres)
   - Copia el **UID** del usuario creado

5. **Ve a "Firestore Database"**
6. **Busca la colección "users"**
7. **Crea un documento con el UID copiado** y agrega estos datos:

```json
{
  "email": "super@calzado.com",
  "name": "Super Administrador",
  "role": "super_admin",
  "permissions": {
    "createAdmin": true,
    "createSupervisor": true,
    "createSuperAdmin": false,
    "editUsers": true,
    "deleteUsers": true,
    "viewReports": true,
    "manageInventory": true,
    "viewSales": true,
    "editSales": true,
    "viewUsers": true,
    "manageRoles": true,
    "accessFirebase": true
  },
  "status": "active",
  "isSuperAdmin": true,
  "createdAt": "2026-04-22T00:00:00.000Z",
  "createdBy": "system"
}
```

8. **¡Listo!** El Super Admin está creado.

---

## Opción 2: Crear Super Admin desde la Consola del Navegador

1. **Abre la aplicación** (`npm start`)
2. **Abre la consola del navegador** (F12 o Clic derecho → Inspeccionar)
3. **Ve a la pestaña "Console"**
4. **Ejecuta este comando:**

```javascript
// Primero importa la función
const { createSuperAdmin } = await import('./utils/createSuperAdmin.js');

// Luego crea el super admin
try {
  const result = await createSuperAdmin('super@calzado.com', 'SuperAdmin123', 'Super Administrador');
  console.log('✅ Resultado:', result);
} catch (error) {
  console.error('❌ Error:', error);
}
```

**Notas:**
- Cambia `'super@calzado.com'` por el email que desees
- Cambia `'SuperAdmin123'` por una contraseña segura
- Cambio `'Super Administrador'` por el nombre que desees

---

## Opción 3: Crear Super Admin desde Código

En `src/initializeApp.js` o en el componente `Login.js`, agrega al cargar la app:

```javascript
import { createSuperAdmin } from './utils/createSuperAdmin';

// Al montar la app (solo una vez)
useEffect(() => {
  // Verificar si existe super admin
  const initSuperAdminIfNeeded = async () => {
    try {
      // Solo ejecuta si es la primera vez
      const existing = localStorage.getItem('superadmin_initialized');
      if (!existing) {
        await createSuperAdmin('super@calzado.com', 'SuperAdmin123');
        localStorage.setItem('superadmin_initialized', 'true');
      }
    } catch (error) {
      console.log('Super admin ya existe o error:', error.message);
    }
  };
  
  initSuperAdminIfNeeded();
}, []);
```

---

## 🔑 Credenciales del Super Admin

Una vez creado, **guarda estas credenciales de forma segura:**

| Campo | Valor |
|-------|-------|
| **Email** | `super@calzado.com` |
| **Contraseña** | La que hayas establecido |
| **Rol** | super_admin |

---

## ✅ Verificar que el Super Admin Funciona

1. **Cierra sesión** de cualquier usuario
2. **Inicia sesión con el Super Admin:**
   - Email: `super@calzado.com`
   - Contraseña: La que creaste
3. **Ve a "Gestión de Usuarios"**
4. **Deberías poder:**
   - ✅ Ver todos los usuarios
   - ✅ Crear nuevos administradores
   - ✅ Crear supervisores
   - ✅ Editar y eliminar usuarios

---

## 🛠️ Actualización Necesaria del Código

Para que el Super Admin funcione completamente, también necesito actualizar:

1. **UserManagement.js** - Agregar opciones para crear admin
2. **UserForm.js** - Mostrar rol "super_admin" en el selector
3. **AppLayout.js** - Mostrar opciones según el rol

¿Deseas que haga estas actualizaciones ahora?

---

## ❓ Solución de Problemas

### "La contraseña es muy corta"
- Firebase requiere mínimo 6 caracteres

### "El email ya existe"
- Usa un email diferente o elimina el usuario en Firebase Console

### "Error de permisos"
- Verifica las reglas de seguridad de Firestore
- Asegúrate de tener acceso a escribir en la colección `users`

### "El Super Admin no aparece en la app"
- Recarga la página (Ctrl+F5)
- Limpia caché (Ctrl+Shift+Delete)
- Reinicia sesión

---

## 📋 Checklist

- [ ] Firebase Console accesible
- [ ] Proyecto "calzado-caabf" seleccionado
- [ ] Super Admin creado en Autenticación
- [ ] Documento en Firestore creado con rol "super_admin"
- [ ] Credenciales guardadas de forma segura
- [ ] Iniciaste sesión con el Super Admin
- [ ] Verificaste que ves la opción de crear usuarios

---

¿Cuál opción prefieres? **Opción 1** (Firebase Console) es la más directa y segura. 🔐
