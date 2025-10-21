// src/Login.js
import React, { useState } from 'react';
import axios from 'axios';

// Simula una función de login que obtendremos de un contexto
// En una app real, esto estaría en un AuthContext
async function loginUser(credentials) {
    return axios.post('http://127.0.0.1:8000/api/token/', credentials)
        .then(response => response.data);
}

export default function Login({ setToken }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const token = await loginUser({ username, password });
            setToken(token);
        } catch (err) {
            setError('Credenciales incorrectas. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="login-wrapper">
            <h1>Iniciar Sesión</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    <p>Usuario</p>
                    <input type="text" onChange={e => setUsername(e.target.value)} />
                </label>
                <label>
                    <p>Contraseña</p>
                    <input type="password" onChange={e => setPassword(e.target.value)} />
                </label>
                {error && <p className="error">{error}</p>}
                <div>
                    <button type="submit">Entrar</button>
                </div>
            </form>
        </div>
    );
}