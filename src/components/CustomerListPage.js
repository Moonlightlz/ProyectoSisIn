import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerListPage.css';

function CustomerListPage({ customers }) {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/clientes/registrar');
  };

  return (
    <div className="customer-list-container">
      <div className="list-header">
        <h1>Listado de Clientes</h1>
        <button className="register-button" onClick={handleRegisterClick}>
          Registrar Nuevo Cliente
        </button>
      </div>

      {customers.length === 0 ? (
        <p className="no-customers-message">Aún no hay clientes registrados. ¡Añade el primero!</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Dirección</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.nombre}</td>
                <td>{customer.apellido}</td>
                <td>{customer.dni}</td>
                <td>{customer.direccion}</td>
                <td>{customer.telefono}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomerListPage;