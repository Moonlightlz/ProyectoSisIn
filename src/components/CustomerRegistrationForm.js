import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerRegistrationForm.css'; // Importamos el archivo CSS para los estilos

function CustomerRegistrationForm({ onAddCustomer }) {
  const [nombre, setNombre] = useState('');
  const navigate = useNavigate(); // Hook para la navegación

  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validación básica
    if (!nombre || !apellido || !dni || !direccion || !telefono) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    // Validación de DNI (solo números)
    if (!/^\d+$/.test(dni)) {
      setError('El DNI debe contener solo números.');
      return;
    }

    // Validación de teléfono (permite números, espacios, guiones y el signo + inicial)
    if (!/^\+?\d[\d\s-]+$/.test(telefono)) {
      setError('El formato del teléfono no es válido.');
      return;
    }

    const newCustomer = { nombre, apellido, dni, direccion, telefono };
    console.log('Registrando cliente con:', newCustomer);

    // Llamamos a la función del componente padre para añadir el cliente
    onAddCustomer(newCustomer);

    setSuccessMessage('¡Cliente registrado exitosamente! Redirigiendo...');

    // Redirigir al listado de clientes después de un breve momento
    setTimeout(() => {
      navigate('/clientes');
    }, 1500);
  };

  return (
    <div className="registration-container">
      <form className="registration-form" onSubmit={handleSubmit}>
        <h2>Registro de Cliente</h2>
        <p className="form-subtitle">Ingresa los datos del nuevo cliente</p>

        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="form-group">
          <label htmlFor="nombre">Nombre:</label>
          <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Nombre del cliente" />
        </div>

        <div className="form-group">
          <label htmlFor="apellido">Apellido:</label>
          <input type="text" id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required placeholder="Apellido del cliente" />
        </div>

        <div className="form-group">
          <label htmlFor="dni">DNI:</label>
          <input type="text" id="dni" value={dni} onChange={(e) => setDni(e.target.value)} required placeholder="Número de DNI" />
        </div>

        <div className="form-group">
          <label htmlFor="direccion">Dirección:</label>
          <input type="text" id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} required placeholder="Dirección completa" />
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono:</label>
          <input type="tel" id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required placeholder="+52 55 1234 5678" />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            Registrar Cliente
          </button>
        </div>
      </form>
    </div>
  );
}

export default CustomerRegistrationForm;