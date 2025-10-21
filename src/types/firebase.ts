// Tipos específicos para Firebase en nuestro proyecto
import { User as FirebaseUser } from 'firebase/auth';
import { DocumentData, Timestamp } from 'firebase/firestore';

// Extender el usuario de Firebase con nuestros datos
export interface CustomUser extends FirebaseUser {
  // Propiedades adicionales si las necesitamos
}

// Tipos para documentos de Firestore
export interface FirestoreUser extends DocumentData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor';
  permissions: {
    canManageUsers: boolean;
    canViewReports: boolean;
    canManagePayments: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;
  };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status?: 'active' | 'inactive';
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

// Tipos para configuración de Firebase
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Tipos para errores de Firebase
export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

// Tipos para operaciones CRUD
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'supervisor';
  permissions: FirestoreUser['permissions'];
}

export interface UpdateUserData extends Partial<Omit<FirestoreUser, 'id' | 'createdAt'>> {
  updatedAt: Timestamp;
  updatedBy: string;
}