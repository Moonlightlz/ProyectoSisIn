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

// Hacer funciones disponibles globalmente
window.emergencyAdminRestore = emergencyAdminRestore;
window.forceLogout = forceLogout;

console.log('🚨 Funciones de emergencia cargadas:');
console.log('- emergencyAdminRestore() - Restaurar sesión admin');
console.log('- forceLogout() - Cerrar sesión forzado');