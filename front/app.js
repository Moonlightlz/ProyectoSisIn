// src/App.js
import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Instala con: npm install jwt-decode
import './App.css'; 

import Login from './login';
import AdminDashboard from './admindashboard';
import UserDashboard from './userdashboard';

// src/App.js

// ... (importaciones y el resto del código)

function App() {
    const [token, setToken] = useState(null);

    // Función para cerrar la sesión
    const handleLogout = () => {
        setToken(null); // Simplemente borramos el token del estado
    };

    if (!token) {
        return <Login setToken={setToken} />;
    }

    const decodedToken = jwtDecode(token.access);
    const isAdmin = decodedToken.user_id === 1;

    return (
        <div className="App">
            {/* Contenedor para el botón de logout */}
            <div className="header">
                <h1>Mi Sistema Inteligente</h1>
                <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
            </div>

            {/* Renderiza el dashboard correspondiente */}
            {isAdmin 
                ? <AdminDashboard token={token} /> 
                : <UserDashboard token={token} />
            }
        </div>
    );
}

export default App;