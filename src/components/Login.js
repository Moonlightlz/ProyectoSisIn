import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Importamos el archivo CSS para los estilos
import { db } from '../firebase';
import Modal from './Modal';
import { useModal } from './useModal'; // Corregido para consistencia
import { workerService, attendanceService } from '../services/workerService'; // Importamos el servicio de trabajadores y asistencia
import { FaEnvelope, FaLock } from 'react-icons/fa'; // Importamos los iconos

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
  const { modalState, hideModal, showConfirm, showSuccess, showError } = useModal();

  // 2. Creamos el objeto de estilo para la imagen de fondo
  const imageSectionStyle = { 
    // Usamos process.env.PUBLIC_URL para obtener la ruta a la carpeta 'public'
    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/login-background.jpg)` 
  };

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

  // Cargar la lista de trabajadores desde Firebase cuando se entra al modo asistencia
  useEffect(() => {
    const fetchWorkers = async () => {
      if (isAsistenciaMode) {
        setLoading(true);
        try {
          console.log('Cargando trabajadores desde Firebase...');
          const workersData = await workerService.getAllWorkers();
          setWorkers(workersData);
          console.log('Trabajadores cargados exitosamente:', workersData.length);
        } catch (err) {
          console.error('Error al cargar trabajadores:', err);
          showError('Error de Carga', 'No se pudieron cargar los datos de los trabajadores. Por favor, intenta de nuevo.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchWorkers();
  }, [isAsistenciaMode]); // Se ejecuta solo cuando cambia el modo de asistencia

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
      async () => {
        try {
          await attendanceService.recordAttendance({
            workerId: foundUser.id,
            workerName: foundUser.name,
            type: 'break',
            timestamp: new Date(),
          });

          // El hideModal() se ejecuta primero desde useModal,
          // luego mostramos el mensaje de éxito.
          // El showSuccess ahora se cierra solo.
          setTimeout(() => showSuccess('Break Registrado', 'Se marcó tu break correctamente.'), 100);
        } catch (err) {
          console.error('Error al registrar el break:', err);
          showError('Error de Registro', 'No se pudo guardar el registro de break.');
        }
        // El hideModal() se ejecuta primero desde useModal,
        // luego mostramos el mensaje de éxito.
        // El showSuccess ahora se cierra solo.
      }
    );
  };

  const handleEntrada = () => {
    if (!foundUser) {
      setNotification({ type: 'error', message: 'Usuario no encontrado. Verifica el DNI.' });
      return;
    }
    showConfirm(
      'Confirmar Entrada',
      '¿Estás seguro que quieres marcar tu entrada?',
      async () => {
        try {
          await attendanceService.recordAttendance({
            workerId: foundUser.id,
            workerName: foundUser.name,
            type: 'entry',
            timestamp: new Date(),
          });
          // Usamos un timeout para asegurar que el modal de confirmación se cierre
          // antes de que aparezca el de éxito.
          setTimeout(() => {
            showSuccess('Entrada Registrada', 'Se marcó tu entrada correctamente.');
            setHasMarkedEntry(true);
          }, 100);
        } catch (err) {
          console.error('Error al registrar la entrada:', err);
          showError('Error de Registro', 'No se pudo guardar el registro de entrada.');
        }
      }
    );
  };

  const handleSalida = () => {
    if (!foundUser) {
      setNotification({ type: 'error', message: 'Usuario no encontrado. Verifica el DNI.' });
      return;
    }
    showConfirm(
      'Confirmar Salida',
      '¿Estás seguro que quieres marcar tu salida?',
      async () => {
        try {
          await attendanceService.recordAttendance({
            workerId: foundUser.id,
            workerName: foundUser.name,
            type: 'exit',
            timestamp: new Date(),
          });
          // Usamos un timeout para asegurar que el modal de confirmación se cierre
          // antes de que aparezca el de éxito.
          setTimeout(() => {
            showSuccess('Salida Registrada', 'Se marcó tu salida correctamente.');
            setHasMarkedEntry(false);
          }, 100);
        } catch (err) {
          console.error('Error al registrar la salida:', err);
          showError('Error de Registro', 'No se pudo guardar el registro de salida.');
        }
      }
    );
  };

  // Limpia la notificación después de unos segundos
  if (notification) {
    setTimeout(() => setNotification(''), 3000);
  }

  if (isAsistenciaMode) {
    return (
      <div className="login-split-container">
        <div className="login-image-section" style={imageSectionStyle}>
          {/* El fondo ahora se aplica vía style */}
        </div>
        <div className="login-form-section">
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

            <button type="button" className="asistencia-button-action entrada" onClick={handleEntrada}>
              Marcar Entrada
            </button>
            <button type="button" className="asistencia-button-action break" onClick={handleBreak}>
              Break
            </button>
            <button type="button" className="asistencia-button-action salida" onClick={handleSalida}>
              Marcar Salida
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
      </div>
    );
  }

  return (
    <div className="login-split-container">
      <div className="login-image-section" style={imageSectionStyle}>
        {/* El fondo ahora se aplica vía style */}
      </div>
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Iniciar Sesión</h2>
            <p className="form-subtitle">Gestión de Pagos e Historiales</p>
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico:</label>
              <div className="input-with-icon">
                <FaEnvelope className="icon" />
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@empresa.com" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <div className="input-with-icon">
                <FaLock className="icon" />
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
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
      </div>
    </div>
  );
}

export default Login;
