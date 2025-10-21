import React, { useState } from 'react'; // Importamos useState
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componentes y Páginas
import Login from './components/Login'; // Importamos el componente Login
import UserProfile from './components/UserProfile'; // Importamos el perfil
import HomePage from './components/HomePage'; // Importamos la página de inicio
import CustomerRegistrationForm from './components/CustomerRegistrationForm'; // Importamos el formulario de clientes
import CustomerListPage from './components/CustomerListPage'; // Importamos la nueva lista de clientes
import UserForm from './components/UserForm'; // Importamos el formulario de usuarios
import UserListPage from './components/UserListPage'; // Importamos la nueva lista de usuarios
import AppLayout from './components/AppLayout'; // Importamos el layout principal

import './App.css';

function App() {
  // Estado para controlar si el usuario ha iniciado sesión
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Lo dejamos en true para desarrollo
  // Estado para almacenar la lista de clientes
  const [customers, setCustomers] = useState([]);
  // Estado para almacenar la lista de usuarios
  const [users, setUsers] = useState([]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // Función para añadir un nuevo cliente a la lista
  const addCustomer = (customer) => {
    setCustomers(prevCustomers => [...prevCustomers, { ...customer, id: Date.now() }]);
  };

  // Función para añadir un nuevo usuario a la lista
  const addUser = (user) => {
    setUsers(prevUsers => [...prevUsers, { ...user, id: Date.now() }]);
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
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="profile" element={<UserProfile onLogout={handleLogout} />} />
                  <Route path="clientes" element={<CustomerListPage customers={customers} />} />
                  <Route path="clientes/registrar" element={<CustomerRegistrationForm onAddCustomer={addCustomer} />} />
                  <Route path="usuarios" element={<UserListPage users={users} />} />
                  <Route path="usuarios/crear" element={<UserForm onAddUser={addUser} />} />
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
