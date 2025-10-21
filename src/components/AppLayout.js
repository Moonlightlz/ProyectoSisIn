import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AppLayout.css';

function AppLayout({ onLogout }) {
  const { userRole, currentUser } = useAuth();
  const isAdmin = userRole === 'admin';
  
  console.log('AppLayout - userRole:', userRole, 'isAdmin:', isAdmin);

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  return (
    <div className="app-container">
      <nav className="main-nav">
        <div className="nav-header">
          <h2>Sistema de Gestión</h2>
          <span className="user-info">
            {currentUser?.email} ({userRole === 'admin' ? 'Administrador' : userRole || 'Sin Rol'})
          </span>
        </div>
        <div className="nav-links">
          <NavLink to="/" end>Inicio</NavLink>
          {isAdmin && <NavLink to="/users">Usuarios</NavLink>}
          {isAdmin && <NavLink to="/workers">Trabajadores</NavLink>}
          {/* Temporal: Mostrar siempre para debugging */}
          {!isAdmin && <NavLink to="/workers" style={{opacity: 0.7}}>Trabajadores (Debug)</NavLink>}
          <NavLink to="/profile">Perfil</NavLink>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main className="content-area">
        <Outlet /> {/* Aquí se renderizarán las rutas hijas */}
      </main>
    </div>
  );
}

export default AppLayout;