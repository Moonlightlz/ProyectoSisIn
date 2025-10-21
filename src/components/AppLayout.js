import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import './AppLayout.css';

function AppLayout({ onLogout }) {
  return (
    <div className="app-layout">
      <main className="app-content">
        <Outlet /> {/* Aquí se renderiza la página actual */}
      </main>
      <BottomNav onLogout={onLogout} />
    </div>
  );
}

export default AppLayout;