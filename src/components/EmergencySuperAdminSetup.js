import React, { useState } from 'react';
import { createOrRepairSuperAdmin, promoteToSuperAdmin } from '../emergencyAuth';
import './EmergencySuperAdminSetup.css';

function EmergencySuperAdminSetup() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('super@calzado.com');
  const [password, setPassword] = useState('SuperAdmin123');
  const [name, setName] = useState('Super Administrador');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [promoteEmail, setPromoteEmail] = useState('');

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await createOrRepairSuperAdmin(email, password, name);
      setResult(res);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await promoteToSuperAdmin(promoteEmail);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-super-admin">
      <div className="emergency-container">
        <h1>🚨 Configuración de Emergencia - Super Admin</h1>
        <p className="subtitle">Esta herramienta crea o repara el usuario Super Admin</p>

        <div className="tabs">
          <button 
            className={`tab ${step === 1 ? 'active' : ''}`}
            onClick={() => setStep(1)}
          >
            Crear Super Admin
          </button>
          <button 
            className={`tab ${step === 2 ? 'active' : ''}`}
            onClick={() => setStep(2)}
          >
            Promover Existente
          </button>
        </div>

        {/* PASO 1: Crear Super Admin */}
        {step === 1 && (
          <div className="step-content">
            <h2>Paso 1: Crear o Reparar Super Admin</h2>
            <p>Esto creará un nuevo usuario super admin o reparará el existente.</p>

            <form onSubmit={handleCreateSuperAdmin}>
              <div className="form-group">
                <label htmlFor="email">Email del Super Admin:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña (mínimo 6 caracteres):</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Nombre Completo:</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ Creando...' : '✅ Crear Super Admin'}
              </button>
            </form>

            {error && <div className="alert alert-error">{error}</div>}
            {result && <div className="alert alert-success">
              <strong>✅ ¡Éxito!</strong><br/>
              Email: {result.email}<br/>
              Contraseña: {result.password}<br/>
              <small>⚠️ Guarda estas credenciales en lugar seguro</small>
            </div>}
          </div>
        )}

        {/* PASO 2: Promover Usuario Existente */}
        {step === 2 && (
          <div className="step-content">
            <h2>Paso 2: Promover Usuario Existente</h2>
            <p>Si ya existe el usuario "super@calzado.com" pero sin rol, usa esta opción.</p>

            <form onSubmit={handlePromote}>
              <div className="form-group">
                <label htmlFor="promoteEmail">Email del usuario a promover:</label>
                <input
                  type="email"
                  id="promoteEmail"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="super@calzado.com"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-warning"
                disabled={loading}
              >
                {loading ? '⏳ Promoviendo...' : '⬆️ Promover a Super Admin'}
              </button>
            </form>

            {error && <div className="alert alert-error">{error}</div>}
            {result && <div className="alert alert-success">
              <strong>✅ ¡Éxito!</strong><br/>
              {result.message}
            </div>}
          </div>
        )}

        {/* RESULTADO */}
        {result && (
          <div className="final-steps">
            <h3>✅ Próximos Pasos:</h3>
            <ol>
              <li>Cierra sesión actual (logout)</li>
              <li>Actualiza la página (F5)</li>
              <li>Inicia sesión con el Super Admin:
                <ul>
                  <li>Email: <code>{result.email || promoteEmail}</code></li>
                  <li>Contraseña: <code>{result.password}</code></li>
                </ul>
              </li>
              <li>Ve a "Gestión de Usuarios"</li>
              <li>¡Ahora puedes crear administradores!</li>
            </ol>

            <button 
              className="btn btn-info"
              onClick={() => window.location.reload()}
            >
              🔄 Recargar Página
            </button>
          </div>
        )}

        <div className="info-box">
          <h3>ℹ️ Información:</h3>
          <ul>
            <li>✅ Crea usuario en Firebase Auth</li>
            <li>✅ Crea documento en Firestore</li>
            <li>✅ Asigna permisos automáticamente</li>
            <li>✅ Repara usuarios incompletos</li>
            <li>⚠️ Requiere acceso a Firestore</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmergencySuperAdminSetup;
