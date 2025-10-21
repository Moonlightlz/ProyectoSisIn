// Tipos para usuarios
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor';
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt?: Date;
  status?: 'active' | 'inactive';
}

// Tipos para permisos de usuario
export interface UserPermissions {
  canManageUsers: boolean;
  canViewReports: boolean;
  canManagePayments: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
}

// Tipos para autenticación
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

// Tipos para el contexto de autenticación
export interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<any>;
  updateUser: (userId: string, updateData: Partial<User>) => Promise<{ success: boolean }>;
  deleteUser: (userId: string) => Promise<{ success: boolean }>;
}

// Tipos para modales
export type ModalType = 'info' | 'success' | 'error' | 'warning' | 'confirm';

export interface ModalConfig {
  type?: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface ModalState extends ModalConfig {
  isOpen: boolean;
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'supervisor';
  permissions: UserPermissions;
}

// Tipos para componentes
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Tipos para credenciales generadas
export interface GeneratedCredentials {
  email: string;
  password: string;
  timestamp: Date;
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para hooks
export interface UseModalReturn {
  modalState: ModalState;
  showModal: (config: ModalConfig) => void;
  hideModal: () => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string }) => void;
}