// frontend/src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2'; // <-- Importa los gráficos
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AdminDashboard({ token }) {
    const [stats, setStats] = useState(null);
    // ... (los otros estados para clientes y pedidos)

    useEffect(() => {
        const authHeaders = { headers: { 'Authorization': `Bearer ${token.access}` } };
        
        // Petición para las estadísticas
        axios.get('http://127.0.0.1:8000/api/dashboard-stats/', authHeaders)
            .then(res => setStats(res.data))
            .catch(err => console.error("Error obteniendo estadísticas:", err));

        // ... (las otras peticiones para clientes y pedidos)
    }, [token]);

    // Prepara los datos para el gráfico de torta
    const pieData = {
        labels: stats?.clientes_segmentados.map(item => item.estado_pago),
        datasets: [{
            data: stats?.clientes_segmentados.map(item => item.conteo),
            backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
        }]
    };

    return (
        <div>
            <h1>Panel de Administrador</h1>
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Ingresos Totales</h3>
                        <p>S/ {stats.total_ingresos}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pedidos Totales</h3>
                        <p>{stats.total_pedidos}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Producto Estrella</h3>
                        <p>{stats.producto_top?.producto__nombre || 'N/A'}</p>
                    </div>
                    <div className="chart-card">
                        <h3>Segmentación de Clientes</h3>
                        <Pie data={pieData} />
                    </div>
                </div>
            )}
            {/* ... (Las listas de clientes y pedidos que ya tenías) ... */}
        </div>
    );
}