// Archivo para probar la conexión a Firebase
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  console.log('🔥 Probando conexión a Firebase...');
  
  try {
    // Probar lectura de colección existente
    console.log('📖 Probando lectura de colección users...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    console.log('✅ Users collection:', usersSnapshot.size, 'documentos');
    
    // Probar lectura de colección workers
    console.log('📖 Probando lectura de colección workers...');
    const workersRef = collection(db, 'workers');
    const workersSnapshot = await getDocs(workersRef);
    console.log('✅ Workers collection:', workersSnapshot.size, 'documentos');
    
    // Si no hay workers, crear uno de prueba
    if (workersSnapshot.empty) {
      console.log('📝 Creando trabajador de prueba...');
      const testWorker = {
        name: 'Trabajador de Prueba',
        dni: '12345678',
        position: 'Operario',
        baseSalary: 1500,
        status: 'active',
        createdAt: new Date(),
        hireDate: new Date()
      };
      
      const docRef = await addDoc(workersRef, testWorker);
      console.log('✅ Trabajador de prueba creado con ID:', docRef.id);
    }
    
    // Probar lectura de configuración de planilla
    console.log('📖 Probando lectura de configuración de planilla...');
    const settingsRef = collection(db, 'payrollSettings');
    const settingsSnapshot = await getDocs(settingsRef);
    console.log('✅ PayrollSettings collection:', settingsSnapshot.size, 'documentos');
    
    console.log('🎉 Todas las pruebas de conexión pasaron exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error en prueba de Firebase:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        console.error('🚫 Error de permisos - Las reglas de Firestore deben ser actualizadas');
        console.log('💡 Reglas sugeridas para desarrollo:');
        console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
        `);
      } else if (error.message.includes('missing or insufficient permissions')) {
        console.error('🚫 Permisos insuficientes - Verificar reglas de Firestore');
      }
    }
    
    return false;
  }
};

// Llamar la función automáticamente cuando se importa
if (typeof window !== 'undefined') {
  // Solo ejecutar en el navegador
  window.testFirebaseConnection = testFirebaseConnection;
  console.log('🔧 Función testFirebaseConnection disponible en window.testFirebaseConnection()');
}