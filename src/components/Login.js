import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // Importamos el archivo CSS para los estilos

function Login({ onLoginSuccess }) { // Recibe onLoginSuccess como prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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



  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        <p className="form-subtitle">Gestión de Pagos e Historiales</p>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@empresa.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default Login;
