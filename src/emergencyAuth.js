// Función de emergencia para restaurar sesión de administrador
// Ejecutar en la consola del navegador cuando pierdas la sesión

export const emergencyAdminRestore = async (adminEmail = 'asd@calzado.com') => {
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('./firebase');
    
    // Intentar login con el email del admin original
    const password = prompt(`Ingresa la contraseña para ${adminEmail}:`);
    if (!password) return;
    
    await signInWithEmailAndPassword(auth, adminEmail, password);
    console.log('Sesión de administrador restaurada');
    window.location.reload();
  } catch (error) {
    console.error('Error restaurando sesión:', error);
    alert('Error: ' + error.message);
  }
};

// Función para logout forzado y volver al login
export const forceLogout = async () => {
  try {
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('./firebase');
    
    await signOut(auth);
    console.log('Sesión cerrada');
    window.location.reload();
  } catch (error) {
    console.error('Error cerrando sesión:', error);
  }
};

// Función para crear o reparar el Super Admin
export const createOrRepairSuperAdmin = async (email, password, name = 'Super Administrador') => {
  try {
    const { auth, db } = await import('./firebase');
    const { createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
    const { setDoc, doc, getDoc } = await import('firebase/firestore');
    
    console.log('🔧 Iniciando proceso de crear/reparar Super Admin...');
    
    let superAdminUid = null;
    
    try {
      // Intentar verificar si el usuario ya existe en Firestore
      const existingUsers = await import('firebase/firestore').then(m => 
        m.getDocs(m.collection(db, 'users'))
      );
      
      // Buscar si existe un super admin
      for (const userDoc of existingUsers.docs) {
        const userData = userDoc.data();
        if (userData.email === email || userData.role === 'super_admin') {
          superAdminUid = userDoc.id;
          console.log('✅ Super Admin encontrado en Firestore:', superAdminUid);
          break;
        }
      }
    } catch (readError) {
      console.log('⚠️ No se pudo leer la lista previa (normal si no hay sesión). Omitiendo paso...');
    }
    
    // Si no existe, crear nuevo
    if (!superAdminUid) {
      console.log('📝 Super Admin no existe, creando nuevo usuario...');
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        superAdminUid = result.user.uid;
        console.log('✅ Usuario creado en Firebase Auth:', superAdminUid);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('⚠️ Email ya existe en Firebase Auth, recuperando UID...');
          // El usuario existe, obtener su UID de otro modo
          // Por ahora, solicitamos al usuario
          const uid = prompt('El email ya existe. Ingresa el UID de Firebase (en Firebase Console → Autenticación → Usuarios):');
          if (!uid) throw new Error('UID requerido');
          superAdminUid = uid;
        } else {
          throw error;
        }
      }
    }
    
    // En este punto tenemos el UID, forzamos la creación del documento (la regla lo permite)
    // Crear o actualizar documento en Firestore
    console.log('💾 Creando/actualizando documento en Firestore...');
    await setDoc(doc(db, 'users', superAdminUid), {
      email: email,
      name: name,
      role: 'super_admin',
      permissions: {
        createAdmin: true,
        createSupervisor: true,
        createSuperAdmin: false,
        editUsers: true,
        deleteUsers: true,
        viewReports: true,
        manageInventory: true,
        viewSales: true,
        editSales: true,
        viewUsers: true,
        manageRoles: true,
        accessFirebase: true
      },
      status: 'active',
      isSuperAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'emergency_setup'
    });
    
    console.log('✅ Documento creado/actualizado en Firestore');
    
    // Cerrar sesión para no desconectar usuario actual
    try {
      await signOut(auth);
      console.log('✅ Sesión del super admin cerrada (seguridad)');
    } catch (e) {
      console.log('ℹ️ No hay sesión activa para cerrar');
    }
    
    console.log('✅✅✅ ¡SUPER ADMIN CREADO EXITOSAMENTE! ✅✅✅');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña: ' + password);
    console.log('🆔 UID:', superAdminUid);
    console.log('\n👉 Cierra sesión actual y prueba iniciar con estas credenciales');
    
    return {
      success: true,
      uid: superAdminUid,
      email: email,
      password: password,
      message: 'Super Admin creado exitosamente'
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    alert('❌ Error: ' + error.message);
    throw error;
  }
};

// Función para actualizar rol de usuario existente a super admin
export const promoteToSuperAdmin = async (email) => {
  try {
    const { db } = await import('./firebase');
    const { collection, getDocs, doc, updateDoc } = await import('firebase/firestore');
    
    console.log('🔧 Buscando usuario:', email);
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let found = false;
    for (const userDoc of snapshot.docs) {
      if (userDoc.data().email === email) {
        console.log('📝 Usuario encontrado, promoviendo a super admin...');
        await updateDoc(userDoc.ref, {
          role: 'super_admin',
          isSuperAdmin: true,
          permissions: {
            createAdmin: true,
            createSupervisor: true,
            createSuperAdmin: false,
            editUsers: true,
            deleteUsers: true,
            viewReports: true,
            manageInventory: true,
            viewSales: true,
            editSales: true,
            viewUsers: true,
            manageRoles: true,
            accessFirebase: true
          },
          updatedAt: new Date(),
          updatedBy: 'emergency_setup'
        });
        console.log('✅ Usuario promovido a super admin');
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error('Usuario no encontrado: ' + email);
    }
    
    return { success: true, message: 'Usuario promovido a super admin' };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    alert('❌ Error: ' + error.message);
    throw error;
  }
};

// Hacer funciones disponibles globalmente
window.emergencyAdminRestore = emergencyAdminRestore;
window.forceLogout = forceLogout;
window.createOrRepairSuperAdmin = createOrRepairSuperAdmin;
window.promoteToSuperAdmin = promoteToSuperAdmin;

console.log('🚨 Funciones de emergencia cargadas:');
console.log('- emergencyAdminRestore() - Restaurar sesión admin');
console.log('- forceLogout() - Cerrar sesión forzado');
console.log('- createOrRepairSuperAdmin(email, password, name) - Crear o reparar super admin');
console.log('- promoteToSuperAdmin(email) - Promover usuario existente a super admin');