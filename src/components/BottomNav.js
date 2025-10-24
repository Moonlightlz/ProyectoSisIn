import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';
import { FaHome, FaUser, FaSignOutAlt, FaBoxes } from 'react-icons/fa';

function BottomNav({ onLogout }) {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <FaHome className="nav-icon" />
        <span>Inicio</span>
      </NavLink>
      <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <FaBoxes className="nav-icon" />
        <span>Inventario</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <FaUser className="nav-icon" />
        <span>Perfil</span>
      </NavLink>
      <button onClick={onLogout} className="nav-item logout">
        <FaSignOutAlt className="nav-icon" />
        <span>Salir</span>
      </button>
    </nav>
  );
}

export default BottomNav;