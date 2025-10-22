import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Importamos el archivo CSS para los estilos
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Modal from './Modal';
import { useModal } from '../hooks/useModal';

function Login({ onLoginSuccess }) { // Recibe onLoginSuccess como prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(''); // Para notificaciones de éxito
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Estado para la interfaz de Asistencia
  const [isAsistenciaMode, setAsistenciaMode] = useState(false);
  const [dni, setDni] = useState('');
  const [hasMarkedEntry, setHasMarkedEntry] = useState(false);
  const [foundUser, setFoundUser] = useState(null); // Para guardar el usuario encontrado por DNI
  const [workers, setWorkers] = useState([]); // Para almacenar la lista de trabajadores

  // Hook para el modal de confirmación
  const { modalState, hideModal, showConfirm } = useModal();

  const handleSubmit = async (event) => {
    event.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError(''); // Limpiamos errores previos
    setLoading(true);

    // Validación básica
    if (!email || !password) {
      setError('🔒 Por favor, ingresa tu correo electrónico y contraseña para continuar.');
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      // La navegación se maneja automáticamente por React Router cuando currentUser cambia
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Error de login:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          setError('👤 No existe una cuenta registrada con este correo electrónico. Verifica que sea correcto.');
          break;
        case 'auth/wrong-password':
          setError('🔑 La contraseña ingresada es incorrecta. Inténtalo nuevamente.');
          break;
        case 'auth/invalid-email':
          setError('📧 El formato del correo electrónico no es válido. Ejemplo: usuario@empresa.com');
          break;
        case 'auth/user-disabled':
          setError('🚫 Esta cuenta ha sido deshabilitada por el administrador. Contacta soporte.');
          break;
        case 'auth/too-many-requests':
          setError('⏰ Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.');
          break;
        case 'auth/invalid-credential':
          setError('❌ Credenciales inválidas. Verifica tu correo y contraseña.');
          break;
        default:
          setError('⚠️ Error al iniciar sesión. Verifica tu conexión e inténtalo nuevamente.');
      }
    }
    setLoading(false);
  };

  // --- Lógica para la Interfaz de Asistencia ---

  // Cargar la lista de trabajadores una vez cuando se entra al modo asistencia
  useEffect(() => {
    // --- INICIO: Datos estáticos para prueba ---
    const staticWorkers = [
      { id: 'worker-1', name: 'Juan Perez', dni: '12345678' },
      { id: 'worker-2', name: 'Maria Garcia', dni: '87654321' },
      { id: 'worker-3', name: 'Pedro Ramirez', dni: '11223344' },
    ];

    if (isAsistenciaMode) {
      console.log('🧪 Usando datos estáticos de trabajadores para prueba.');
      setWorkers(staticWorkers);
    }
    // --- FIN: Datos estáticos para prueba ---

    // const fetchWorkers = async () => {
    //   if (isAsistenciaMode && workers.length === 0) {
    //     // ... código original para conectar a Firebase
    //   }
    // };
    // fetchWorkers();
  }, [isAsistenciaMode, workers.length]); // Agregado workers.length para evitar recargas innecesarias

  // Buscar al usuario cuando el DNI cambia
  useEffect(() => {
    if (dni.length === 8) {
      const user = workers.find(worker => worker.dni === dni);
      setFoundUser(user || null);
    } else {
      setFoundUser(null);
    }
  }, [dni, workers]);

  // --- Lógica para la Interfaz de Asistencia ---

  const handleBreak = () => {
    if (!foundUser) {
      setNotification({ type: 'error', message: 'Usuario no encontrado. Verifica el DNI.' });
      return;
    }
    showConfirm(
      'Confirmar Break',
      '¿Estás seguro que quieres marcar tu break?',
      () => {
        window.alert('Break registrado'); // Mantenemos el alert final por ahora
      }
    );
  };

  const handleEntradaSalida = () => {
    if (!foundUser) {
      setNotification({ type: 'error', message: 'Usuario no encontrado. Verifica el DNI.' });
      return;
    }

    const action = hasMarkedEntry ? 'salida' : 'entrada';
    showConfirm(
      `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `¿Estás seguro que quieres marcar tu ${action}?`,
      () => {
        if (hasMarkedEntry) {
          window.alert('Salida registrada');
          setHasMarkedEntry(false);
        } else {
          window.alert('Entrada registrada');
          setHasMarkedEntry(true);
        }
        // Aquí iría la lógica para registrar en la base de datos
      }
    );
  };

  // Limpia la notificación después de unos segundos
  if (notification) {
    setTimeout(() => setNotification(''), 3000);
  }

  if (isAsistenciaMode) {
    return (
      <div className="login-container">
        <div className="asistencia-form">
          <h2>Registro de Asistencia</h2>
          {notification && <p className={`notification-message ${notification.type}`}>{notification.message}</p>}
          <div className="form-group">
            <label htmlFor="dni">Número de DNI:</label>
            <input
              type="text"
              id="dni"
              value={dni}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Solo permite números
                setDni(value);
              }}
              placeholder="Ingresa tu DNI"
              maxLength="8"
            />
          </div>
          <div className="user-display-container">
            {foundUser && <p className="found-user-name">Hola, {foundUser.name}</p>}
            {dni.length === 8 && !foundUser && <p className="user-not-found-message">Usuario no encontrado</p>}
          </div>

          <button type="button" className="asistencia-button-action break" onClick={handleBreak}>
            Break
          </button>
          <button type="button" className={`asistencia-button-action ${hasMarkedEntry ? 'salida' : 'entrada'}`} onClick={handleEntradaSalida}>
            {hasMarkedEntry ? 'Marcar Salida' : 'Marcar Entrada'}
          </button>
          <button type="button" className="back-to-login-button" onClick={() => setAsistenciaMode(false)}>
            ‹ Volver al Login
          </button>
        </div>
        {/* Renderizamos el Modal aquí */}
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

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        <p className="form-subtitle">Gestión de Pagos e Historiales</p>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@empresa.com" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Entrar'}
        </button>
      </form>
      {/* Botón de Asistencia fuera del formulario */}
      <button type="button" className="login-button asistencia-button-outside" onClick={() => setAsistenciaMode(true)}>
        Asistencia
      </button>
    </div>
  );
}

export default Login;
