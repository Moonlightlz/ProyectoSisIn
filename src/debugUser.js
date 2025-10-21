import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Función para debugging - verificar datos del usuario actual
export const debugCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('No hay usuario autenticado');
    return;
  }

  console.log('=== DEBUG USER INFO ===');
  console.log('User Email:', user.email);
  console.log('User UID:', user.uid);

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User Data from Firestore:', userData);
      console.log('User Role:', userData.role);
      console.log('User Role:', userData.role);
      console.log('User Permissions:', userData.permissions);
    } else {
      console.log('No document found for user in Firestore');
      console.log('Creating user document...');
      
      // Si no existe el documento, crearlo
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
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
      console.log('User document created');
    }
  } catch (error) {
    console.error('Error getting user data:', error);
  }
  console.log('=====================');
};

// Ejecutar automáticamente al cargar
// Función rápida para verificar rol en consola
window.checkUserRole = debugCurrentUser;
window.debugCurrentUser = debugCurrentUser;