import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para registrar un nuevo usuario SIN cerrar sesión actual
  async function signup(email, password, userData) {
    try {
      // Crear una segunda instancia de Firebase Auth
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      
      // Configuración de Firebase (la misma que en firebase.js)
      const secondaryConfig = {
        apiKey: "AIzaSyDrqrF-vuH3JIVxaa51khjE_CNAht1tnL8",
        authDomain: "calzado-caabf.firebaseapp.com",
        projectId: "calzado-caabf",
        storageBucket: "calzado-caabf.firebasestorage.app",
        messagingSenderId: "452170673789",
        appId: "1:452170673789:web:ee384bdab480dfdae40b14",
        measurementId: "G-GRTF629QG2"
      };
      
      // Crear app secundaria
      const secondaryApp = initializeApp(secondaryConfig, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      // Crear usuario en la app secundaria
      const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      
      // Cerrar sesión en la app secundaria inmediatamente
      await signOut(secondaryAuth);
      
      // Guardar datos adicionales del usuario en Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions,
        createdAt: new Date(),
        createdBy: currentUser?.uid || 'system'
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Función para iniciar sesión
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Función para cerrar sesión
  function logout() {
    return signOut(auth);
  }

  // Función para obtener los datos del usuario desde Firestore
  async function getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Efecto para manejar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Usuario autenticado:', user.email);
        setCurrentUser(user);
        // Obtener el rol del usuario desde Firestore
        const userData = await getUserData(user.uid);
        console.log('Datos del usuario desde Firestore:', userData);
        const role = userData?.role || null;
        console.log('Rol asignado:', role);
        setUserRole(role);
      } else {
        console.log('Usuario no autenticado');
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Función alternativa para crear usuarios pendientes (más segura)
  async function createPendingUser(email, userData) {
    try {
      // Generar ID único para el usuario pendiente
      const userId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Guardar usuario pendiente en Firestore
      await setDoc(doc(db, 'pendingUsers', userId), {
        email: email,
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions,
        status: 'pending_activation',
        temporaryPassword: 'temp123456', // Contraseña temporal
        createdAt: new Date(),
        createdBy: currentUser?.uid || 'system',
        activationRequired: true
      });

      return { success: true, userId, temporaryPassword: 'temp123456' };
    } catch (error) {
      throw error;
    }
  }

  // Función para actualizar usuario
  async function updateUser(userId, updateData) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: currentUser?.uid || 'system'
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Función para eliminar usuario completamente
  async function deleteUser(userId) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    createPendingUser,
    updateUser,
    deleteUser,
    logout,
    getUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}