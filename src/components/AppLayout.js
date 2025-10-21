import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

function AppLayout() {
  return (
    <div className="app-container">
      <nav className="main-nav">
        <div className="nav-links">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/profile">Perfil</NavLink>
        </div>
      </nav>
      <main className="content-area">
        <Outlet /> {/* Aquí se renderizarán las rutas hijas */}
      </main>
    </div>
  );
}

export default AppLayout;