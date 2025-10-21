import React, { useState } from 'react';
import './Login.css'; // Importamos el archivo CSS para los estilos

function Login({ onLoginSuccess }) { // Recibe onLoginSuccess como prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError(''); // Limpiamos errores previos

    // Validación básica
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    // Aquí es donde normalmente integrarías tu lógica de autenticación
    // Por ejemplo, enviarías estos datos a un backend.
    console.log('Intentando iniciar sesión con:', { email, password });

    // Simulación de una llamada a API
    if (email === 'admin@calzado.com' && password === 'password123') {
      alert('¡Inicio de sesión exitoso!');
      onLoginSuccess(); // Llama a la función pasada por App.js
    } else {
      setError('Correo o contraseña incorrectos.');
    }
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
        <button type="submit" className="login-button">
          Entrar
        </button>
        <p className="forgot-password">
          <a href="#">¿Olvidaste tu contraseña?</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
