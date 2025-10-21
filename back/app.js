// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// URL de tu API de Django
const API_URL = 'http://127.0.0.1:8000/api/clientes/';

function App() {
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        axios.get(API_URL)
            .then(response => {
                setClientes(response.data);
            })
            .catch(error => {
                console.error("Hubo un error al obtener los datos de los clientes", error);
            });
    }, []);

    return (
        <div className="container">
            <header>
                <h1>Dashboard de Administrador</h1>
                <p>Gestión de Clientes y Pagos</p>
            </header>
            
            <div className="grid-container">
                {clientes.map(cliente => (
                    <div key={cliente.id} className="card">
                        <h2>{cliente.nombre_completo}</h2>
                        <p><strong>Empresa:</strong> {cliente.empresa}</p>
                        <p className={`status status-${cliente.estado_pago.toLowerCase()}`}>
                            <strong>Estado:</strong> {cliente.estado_pago}
                        </p>
                        <div className="pagos-section">
                            <h3>Historial de Pagos</h3>
                            {cliente.pagos.length > 0 ? (
                                <ul>
                                    {cliente.pagos.map(pago => (
                                        <li key={pago.id} className={`pago-item status-pago-${pago.estado.toLowerCase()}`}>
                                            <span>Fecha Vencimiento: {pago.fecha_vencimiento}</span>
                                            <span>S/ {pago.monto}</span>
                                            <span>{pago.estado}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No hay pagos registrados.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;