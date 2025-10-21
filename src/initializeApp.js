// initializeApp.js - Script para crear el usuario administrador inicial
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export const createInitialAdmin = async () => {
  const adminEmail = 'admin@calzado.com';
  const adminPassword = 'admin123456';
  
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    // Crear documento del usuario en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      name: 'Administrador',
      role: 'admin',
      permissions: {
        viewSales: true,
        editSales: true,
        viewReports: true,
        manageInventory: true,
        viewUsers: true
      },
      createdAt: new Date(),
      createdBy: 'system'
    });
    
    console.log('Usuario administrador creado exitosamente');
    return { success: true, message: 'Administrador creado' };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('El usuario administrador ya existe');
      return { success: true, message: 'Admin ya existe' };
    }
    console.error('Error creando administrador:', error);
    return { success: false, error: error.message };
  }
};

// Función para verificar si existe un administrador
export const checkAdminExists = async () => {
  try {
    // Esta función se puede usar para verificar si ya existe un admin
    // Por ahora, simplemente intentamos crear uno
    return await createInitialAdmin();
  } catch (error) {
    console.error('Error verificando admin:', error);
    return { success: false, error: error.message };
  }
};