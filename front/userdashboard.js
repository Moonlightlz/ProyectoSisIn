// src/UserDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserDashboard({ token }) {
    const [productos, setProductos] = useState([]);
    // CÓDIGO CORREGIDO
useEffect(() => {
    // Asegurarse de que el token exista antes de hacer la llamada
    if (token && token.access) {
        axios.get('http://127.0.0.1:8000/api/productos/', {
            headers: {
                // Así es como se envía el token para la autenticación
                'Authorization': `Bearer ${token.access}` 
            }
        })
        .then(res => {
            setProductos(res.data);
        })
        .catch(err => {
            console.error("Error al obtener productos:", err);
        });
    }
}, [token]);
// Dentro del componente UserDashboard, antes del 'return'
const handleAdquirir = (productoId) => {
    console.log(`Creando pedido para el producto: ${productoId}`);
    axios.post('http://127.0.0.1:8000/api/pedidos/', 
        {
            producto: productoId, // Enviamos el ID del producto
            // El backend se encarga de asignar el cliente a partir del token
        }, 
        {
            headers: { 'Authorization': `Bearer ${token.access}` }
        }
    )
    .then(response => {
        alert('¡Pedido realizado con éxito!');
        console.log(response.data);
    })
    .catch(error => {
        alert('Hubo un error al realizar el pedido.');
        console.error('Error en el pedido:', error.response.data);
    });
};
    return (
        <div>
            <h1>Catálogo de Productos</h1>
            <div className="product-list">
                {productos.map(prod => (
                    <div key={prod.id} className="product-card">
                        <h2>{prod.nombre}</h2>
                        <p>{prod.descripcion}</p>
                        <p className="price">S/ {prod.precio}</p>
                        <button>Adquirir</button>
                    </div>
                ))}
            </div>
        </div>
    );
}