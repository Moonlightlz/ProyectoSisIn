import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Crea un usuario Super Admin en la base de datos
 * El Super Admin tiene permisos para crear administradores y supervisores
 */
export const createSuperAdmin = async (email, password, name = 'Super Administrador') => {
  try {
    console.log('Iniciando creación de Super Admin...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    console.log('Usuario creado en Firebase Auth:', uid);
    
    // Crear documento en Firestore con rol super_admin
    await setDoc(doc(db, 'users', uid), {
      email: email,
      name: name,
      role: 'super_admin',
      permissions: {
        // Permisos completos
        createAdmin: true,
        createSupervisor: true,
        createSuperAdmin: false, // Solo puede haberlo uno
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
      createdAt: new Date(),
      createdBy: 'system',
      isSuperAdmin: true
    });
    
    console.log('Documento de usuario creado en Firestore');
    
    // Cerrar sesión del super admin para mantener al usuario actual logueado
    await signOut(auth);
    
    return {
      success: true,
      message: 'Super Admin creado exitosamente',
      uid: uid,
      email: email,
      credentials: {
        email: email,
        password: password
      }
    };
  } catch (error) {
    console.error('Error al crear Super Admin:', error);
    throw {
      success: false,
      message: 'Error al crear Super Admin: ' + error.message,
      error: error
    };
  }
};

/**
 * Verifica si existe un super admin en la base de datos
 */
export const checkSuperAdminExists = async () => {
  try {
    // Esta es una verificación simple - en producción, usarías una query
    console.log('Verificando si existe Super Admin...');
    return false; // Placeholder
  } catch (error) {
    console.error('Error verificando super admin:', error);
    return false;
  }
};

/**
 * Función para ejecutar desde la consola del navegador
 * Uso: En la consola del navegador ejecuta:
 * await window.initSuperAdmin('super@calzado.com', 'SuperAdmin123')
 */
export const initSuperAdmin = createSuperAdmin;
