import React from 'react';
import './UserProfile.css'; // Importamos el CSS para los estilos

// Datos de ejemplo del usuario. En una aplicación real, esto vendría de una API.
const userData = {
  name: 'Ana García',
  role: 'Administradora',
  email: 'ana.garcia@calzado.com',
  phone: '+52 55 1234 5678',
  address: 'Av. Siempre Viva 742, Springfield',
  joinDate: '15 de Enero, 2022',
  profilePicture: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' // Un avatar de ejemplo
};

function UserProfile({ onLogout }) { // Recibe onLogout como prop
  return (
    <div className="profile-page-container">
      <div className="profile-card">
        <div className="profile-header">
          <img 
            src={userData.profilePicture} 
            alt="Foto de perfil" 
            className="profile-picture" 
          />
          <div className="profile-header-info">
            <h1 className="profile-name">{userData.name}</h1>
            <p className="profile-role">{userData.role}</p>
          </div>
        </div>

        <div className="profile-details">
          <h3>Datos Personales</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Correo Electrónico:</span>
              <span className="detail-value">{userData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Teléfono:</span>
              <span className="detail-value">{userData.phone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dirección:</span>
              <span className="detail-value">{userData.address}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Miembro desde:</span>
              <span className="detail-value">{userData.joinDate}</span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-button primary" onClick={onLogout}>Cerrar Sesión</button> {/* Botón para cerrar sesión */}
          <button className="action-button secondary">Cambiar Contraseña</button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
