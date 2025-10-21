import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserListPage.css';

// Nombres amigables para los roles
const roleNames = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
};

// Nombres amigables para las "ventanas" (deben coincidir con UserForm)
const windowNames = {
  corte_materiales: 'Corte de Materiales',
  costura: 'Costura',
  montaje_sellado: 'Montaje y Sellado',
  acabado: 'Acabado',
  pruebas_calidad: 'Pruebas de Calidad',
  empaquetado: 'Empaquetado',
};

// Nombres amigables para las acciones (deben coincidir con UserForm)
const actionNames = {
  aprobado: 'Aprobado',
  reprocesamiento: 'Reprocesamiento',
  rechazado: 'Rechazado',
  retencion: 'Retención',
};

function UserListPage({ users }) {
  const navigate = useNavigate();

  const handleCreateUserClick = () => {
    navigate('/usuarios/crear');
  };

  // Función para renderizar los permisos de un supervisor
  const renderPermissions = (permissions) => {
    if (!permissions || Object.keys(permissions).length === 0) {
      return 'N/A';
    }
    return (
      <ul className="permission-list">
        {Object.entries(permissions).map(([windowKey, actions]) => {
          const enabledActions = Object.entries(actions)
            .filter(([, isEnabled]) => isEnabled)
            .map(([actionKey]) => actionNames[actionKey]);
          
          if (enabledActions.length > 0) {
            return (
              <li key={windowKey}>
                <strong>{windowNames[windowKey]}:</strong> {enabledActions.join(', ')}
              </li>
            );
          }
          return null; // No mostrar si no hay acciones habilitadas para esa ventana
        })}
      </ul>
    );
  };

  return (
    <div className="user-list-container">
      <div className="list-header">
        <h1>Gestión de Usuarios</h1>
        <button className="create-user-button" onClick={handleCreateUserClick}>
          Crear Nuevo Usuario
        </button>
      </div>

      {users.length === 0 ? (
        <p className="no-users-message">Aún no hay usuarios registrados. ¡Crea el primero!</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo Electrónico</th>
              <th>Rol</th>
              <th>Permisos (Supervisor)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{roleNames[user.role]}</td>
                <td>{user.role === 'supervisor' ? renderPermissions(user.permissions) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserListPage;