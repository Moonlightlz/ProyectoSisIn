import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componentes y Páginas
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import HomePage from './components/HomePage';
import UserManagement from './components/UserManagement';
import AppLayout from './components/AppLayout';

import './App.css';
import './debugUser'; // Importar herramientas de debugging
import './emergencyAuth'; // Importar funciones de emergencia

// Componente interno que usa el hook useAuth
function AppContent() {
  const { currentUser, logout } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/*"
          element={
            currentUser ? (
              <Routes>
                <Route element={<AppLayout onLogout={logout} />}>
                  <Route index element={<HomePage />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="users" element={<UserManagement />} />
                </Route>
              </Routes>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Componente principal que proporciona el contexto
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
