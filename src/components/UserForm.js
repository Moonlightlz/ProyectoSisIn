import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserForm.css';

// Definición inicial de permisos para un supervisor
const initialPermissions = {
  corte_materiales: { aprobado: false, reprocesamiento: false, rechazado: false, retencion: false },
  costura: { aprobado: false, reprocesamiento: false, rechazado: false, retencion: false },
  montaje_sellado: { aprobado: false, reprocesamiento: false, rechazado: false, retencion: false },
  acabado: { aprobado: false, reprocesamiento: false, rechazado: false, retencion: false },
  pruebas_calidad: { aprobado: false, reprocesamiento: false, rechazado: false, retencion: false },
  empaquetado: { aprobado: false, reprocesamiento: false, rechazado: false, retencion: false },
};

// Nombres amigables para las "ventanas"
const windowNames = {
  corte_materiales: 'Corte de Materiales',
  costura: 'Costura',
  montaje_sellado: 'Montaje y Sellado',
  acabado: 'Acabado',
  pruebas_calidad: 'Pruebas de Calidad',
  empaquetado: 'Empaquetado',
};

// Nombres amigables para las acciones
const actionNames = {
  aprobado: 'Aprobado (perfección)',
  reprocesamiento: 'Reprocesamiento (lotes con defectos menores)',
  rechazado: 'Rechazado (lotes con defectos graves)',
  retencion: 'Retención (lotes dudosos)',
};

function UserForm({ onAddUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('supervisor'); // Rol por defecto
  const [permissions, setPermissions] = useState(initialPermissions);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Maneja el cambio de estado de un permiso específico
  const handlePermissionChange = (windowKey, actionKey) => {
    setPermissions(prevPermissions => ({
      ...prevPermissions,
      [windowKey]: {
        ...prevPermissions[windowKey],
        [actionKey]: !prevPermissions[windowKey][actionKey],
      },
    }));
  };

  // Maneja el envío del formulario
  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Crea el nuevo objeto de usuario
    const newUser = {
      id: Date.now(), // ID único simple
      name,
      email,
      role,
      permissions: role === 'supervisor' ? permissions : {}, // Solo guarda permisos si es supervisor
    };

    console.log('Registrando usuario:', newUser);
    onAddUser(newUser); // Llama a la función para añadir el usuario al estado global

    setSuccessMessage('¡Usuario registrado exitosamente! Redirigiendo...');

    // Redirige al listado de usuarios después de un breve momento
    setTimeout(() => {
      navigate('/usuarios');
    }, 1500);
  };

  return (
    <div className="user-form-container">
      <form className="user-form" onSubmit={handleSubmit}>
        <h2>Crear Nuevo Usuario</h2>
        <p className="form-subtitle">Define los datos y permisos del usuario</p>

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="form-group">
          <label htmlFor="name">Nombre:</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre completo del usuario" />
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ejemplo@empresa.com" />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        <div className="form-group">
          <label htmlFor="role">Rol:</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="role-select">
            <option value="admin">Administrador</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>

        {role === 'supervisor' && ( // Muestra la sección de permisos solo si el rol es supervisor
          <div className="permissions-section">
            <h3>Permisos de Supervisor</h3>
            {Object.entries(windowNames).map(([windowKey, windowName]) => (
              <div key={windowKey} className="permission-window-group">
                <h4>{windowName}</h4>
                <div className="permission-actions">
                  {Object.entries(actionNames).map(([actionKey, actionName]) => (
                    <div key={actionKey} className="permission-checkbox">
                      <input type="checkbox" id={`${windowKey}-${actionKey}`} checked={permissions[windowKey][actionKey]} onChange={() => handlePermissionChange(windowKey, actionKey)} />
                      <label htmlFor={`${windowKey}-${actionKey}`}>{actionName}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-button">Crear Usuario</button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;