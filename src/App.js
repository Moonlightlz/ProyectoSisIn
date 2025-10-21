import React, { useState } from 'react'; // Importamos useState
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componentes y Páginas
import Login from './components/Login'; // Importamos el componente Login
import UserProfile from './components/UserProfile';
import HomePage from './components/HomePage';
import AppLayout from './components/AppLayout';

import './App.css';

function App() {
  // Estado para controlar si el usuario ha iniciado sesión
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/*" // Cualquier otra ruta
          element={
            isLoggedIn ? (
              <Routes>
                <Route element={<AppLayout onLogout={handleLogout} />}>
                  <Route index element={<HomePage />} />
                  <Route path="profile" element={<UserProfile />} />
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

export default App;
