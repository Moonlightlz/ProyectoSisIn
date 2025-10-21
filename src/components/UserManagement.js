import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateUserData } from '../utils/userGenerator';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';
import './UserManagement.css';

function UserManagement() {
  const { signup, updateUser, deleteUser, userRole, currentUser } = useAuth();
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  
  // Debug info
  console.log('UserManagement - userRole:', userRole);
  console.log('UserManagement - currentUser:', currentUser?.email);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'supervisor',
    permissions: {
      viewSales: true,
      editSales: false,
      viewReports: true,
      manageInventory: false,
      viewUsers: false
    }
  });

  // Verificar si el usuario actual es administrador
  const isAdmin = userRole === 'admin';
  console.log('isAdmin check:', isAdmin, 'userRole:', userRole);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(user => user.status !== 'inactive'); // Filtrar usuarios eliminados
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar credenciales automáticamente
  const handleGenerateCredentials = async () => {
    if (!newUser.name.trim()) {
      showError('Campo requerido', 'Primero ingresa el nombre del usuario para generar las credenciales automáticamente.');
      return;
    }

    try {
      const generatedData = await generateUserData(newUser.name, users);
      setNewUser(prev => ({
        ...prev,
        email: generatedData.email,
        password: generatedData.password
      }));
      
      setGeneratedCredentials(generatedData);
      setShowPassword(true);
    } catch (error) {
      console.error('Error generating credentials:', error);
      showError('Error de generación', 'No se pudieron generar las credenciales automáticamente. Intenta nuevamente.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // Usar la función que mantiene la sesión actual
      const result = await signup(newUser.email, newUser.password, {
        name: newUser.name,
        role: newUser.role,
        permissions: newUser.permissions
      });
      
      // Resetear formulario
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'supervisor',
        permissions: {
          viewSales: true,
          editSales: false,
          viewReports: true,
          manageInventory: false,
          viewUsers: false
        }
      });
      
      setShowCreateForm(false);
      fetchUsers(); // Actualizar lista de usuarios
      showSuccess(
        'Usuario creado exitosamente', 
        `El nuevo usuario ha sido registrado correctamente.\n\n📧 Email: ${newUser.email}\n🔑 Contraseña: ${newUser.password}\n\n✅ El usuario puede iniciar sesión inmediatamente con estas credenciales.`
      );
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Error al crear usuario', `No se pudo crear el usuario:\n${error.message}`);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin',
        permissions: {
          viewSales: true,
          editSales: true,
          viewReports: true,
          manageInventory: true,
          viewUsers: true
        }
      });
      
      alert('Usuario convertido a administrador. Recarga la página para ver los cambios.');
      window.location.reload();
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Error al convertir usuario: ' + error.message);
    }
  };

  // Función para editar usuario
  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      originalId: user.id
    });
    setShowCreateForm(true);
  };

  // Función para guardar cambios de usuario editado
  const handleSaveEditedUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateUser(editingUser.originalId, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        permissions: editingUser.permissions
      });

      setEditingUser(null);
      setShowCreateForm(false);
      fetchUsers();
      showSuccess('Usuario actualizado', 'La información del usuario ha sido actualizada correctamente.');
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Error al actualizar', `No se pudo actualizar el usuario:\n${error.message}`);
    }
  };

  // Función para eliminar usuario
  const handleDeleteUser = async (userId, userName) => {
    showConfirm(
      'Eliminación Permanente',
      `¿Estás seguro de que quieres eliminar completamente al usuario "${userName}"?\n\nEsta acción eliminará todos los datos del usuario de forma PERMANENTE y NO SE PUEDE DESHACER.\n\n⚠️ Esta acción es irreversible.`,
      async () => {
        try {
          await deleteUser(userId);
          fetchUsers();
          showSuccess('Usuario eliminado', 'El usuario ha sido eliminado permanentemente de la base de datos.');
        } catch (error) {
          console.error('Error deleting user:', error);
          showError('Error al eliminar', `No se pudo eliminar el usuario:\n${error.message}`);
        }
      },
      {
        confirmText: 'Eliminar permanentemente',
        cancelText: 'Cancelar'
      }
    );
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'supervisor',
      permissions: {
        viewSales: true,
        editSales: false,
        viewReports: true,
        manageInventory: false,
        viewUsers: false
      }
    });
    setGeneratedCredentials(null);
    setShowPassword(false);
  };

  const handlePermissionChange = (permission) => {
    if (editingUser) {
      setEditingUser(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: !prev.permissions[permission]
        }
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: !prev.permissions[permission]
        }
      }));
    }
  };

  const updateUserPermissions = async (userId, newPermissions) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        permissions: newPermissions
      });
      fetchUsers(); // Actualizar lista
      alert('Permisos actualizados');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Error al actualizar permisos');
    }
  };

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <div style={{marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '5px'}}>
          <h3>Debug Info:</h3>
          <p>User Email: {currentUser?.email || 'No user'}</p>
          <p>User Role: {userRole || 'No role detected'}</p>
          <p>Is Admin: {isAdmin ? 'true' : 'false'}</p>
          <p>User UID: {currentUser?.uid || 'No UID'}</p>
          
          {userRole === 'supervisor' && (
            <button 
              onClick={handlePromoteToAdmin}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🚨 Convertir a Administrador
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="user-management">
      <div className="header">
        <h1>Gestión de Usuarios</h1>
        <button 
          className="create-user-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancelar' : 'Crear Usuario'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-user-form">
          <h3>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
          <form onSubmit={editingUser ? handleSaveEditedUser : handleCreateUser}>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={editingUser ? editingUser.name : newUser.name}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser(prev => ({...prev, name: e.target.value}));
                  } else {
                    setNewUser(prev => ({...prev, name: e.target.value}));
                  }
                }}
                required
              />
            </div>

            {!editingUser && (
              <div className="credentials-generator">
                <button 
                  type="button" 
                  onClick={handleGenerateCredentials}
                  className="generate-btn"
                  disabled={!newUser.name.trim()}
                >
                  🎲 Generar Email y Contraseña Automáticamente
                </button>
              </div>
            )}
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={editingUser ? editingUser.email : newUser.email}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser(prev => ({...prev, email: e.target.value}));
                  } else {
                    setNewUser(prev => ({...prev, email: e.target.value}));
                  }
                }}
                required
                readOnly={editingUser} // Email no editable en modo edición
              />
            </div>
            
            {!editingUser && (
              <div className="form-group">
                <label>Contraseña:</label>
                <div className="password-input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                    required
                    minLength="5"
                    maxLength="8"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {generatedCredentials && (
                  <div className="generated-credentials">
                    <h4>🔑 Credenciales Generadas:</h4>
                    <p><strong>Email:</strong> {generatedCredentials.email}</p>
                    <p><strong>Contraseña:</strong> {generatedCredentials.password}</p>
                    <small>⚠️ Guarda estas credenciales, el usuario las necesitará para iniciar sesión</small>
                  </div>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label>Rol:</label>
              <select
                value={editingUser ? editingUser.role : newUser.role}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser(prev => ({...prev, role: e.target.value}));
                  } else {
                    setNewUser(prev => ({...prev, role: e.target.value}));
                  }
                }}
              >
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="permissions-section">
              <h4>Permisos:</h4>
              <div className="permissions-grid">
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser ? editingUser.permissions.viewSales : newUser.permissions.viewSales}
                    onChange={() => handlePermissionChange('viewSales')}
                  />
                  Ver Ventas
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser ? editingUser.permissions.editSales : newUser.permissions.editSales}
                    onChange={() => handlePermissionChange('editSales')}
                  />
                  Editar Ventas
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser ? editingUser.permissions.viewReports : newUser.permissions.viewReports}
                    onChange={() => handlePermissionChange('viewReports')}
                  />
                  Ver Reportes
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser ? editingUser.permissions.manageInventory : newUser.permissions.manageInventory}
                    onChange={() => handlePermissionChange('manageInventory')}
                  />
                  Gestionar Inventario
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editingUser ? editingUser.permissions.viewUsers : newUser.permissions.viewUsers}
                    onChange={() => handlePermissionChange('viewUsers')}
                  />
                  Ver Usuarios
                </label>
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="submit-btn">
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
              {editingUser && (
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="users-list">
        <h3>Usuarios Registrados</h3>
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha Creación</th>
              <th>Permisos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Administrador' : 'Supervisor'}
                  </span>
                </td>
                <td>
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <div className="permissions-summary">
                    {Object.entries(user.permissions || {}).map(([key, value]) => (
                      value && <span key={key} className="permission-tag">{key}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditUser(user)}
                      title="Editar usuario"
                    >
                      ✏️
                    </button>
                    {user.id !== currentUser?.uid && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        title="Eliminar usuario"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}

export default UserManagement;