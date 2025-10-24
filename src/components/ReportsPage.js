import React, { useState, useEffect } from 'react';
import { saleService } from '../services/saleService';
import { workerService, attendanceService } from '../services/workerService';
import { FaExclamationCircle, FaChartPie, FaChartBar } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './ReportsPage.css';

// Registrar los componentes de Chart.js que vamos a utilizar
ChartJS.register(ArcElement, Tooltip, Legend, Title, BarElement, CategoryScale, LinearScale);

// --- NUEVOS COMPONENTES DE GRÁFICOS ---

// Componente para el gráfico circular de ventas
const SalesChart = ({ sales }) => {
  if (!sales || sales.length === 0) {
    return (
      <div className="chart-card no-data-chart">
        <h3><FaChartPie /> Ventas por Estado</h3>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de ventas para mostrar.</p>
        </div>
      </div>
    );
  }

  const pendingSales = sales.filter(s => s.status.toLowerCase() === 'pendiente').length;
  const inProcessSales = sales.filter(s => s.status.toLowerCase().replace('_', ' ') === 'en proceso').length;
  const completedSales = sales.filter(s => s.status.toLowerCase() === 'entregado').length;

  const data = {
    labels: ['Pendientes', 'En Proceso', 'Entregadas'],
    datasets: [
      {
        label: 'Ventas',
        data: [pendingSales, inProcessSales, completedSales],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // Amarillo (Pendiente)
          'rgba(59, 130, 246, 0.8)',  // Azul (En Proceso)
          'rgba(16, 185, 129, 0.8)', // Verde (Entregado)
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
          '#ffffff',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: 'Distribución de Ventas por Estado',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155'
      },
    },
  };

  return (
    <div className="chart-card">
      <h3><FaChartPie /> Ventas por Estado</h3>
      <Pie data={data} options={options} />
    </div>
  );
};

// Componente para el gráfico circular de trabajadores
const WorkerChart = ({ workers }) => {
  if (!workers || workers.length === 0) {
    return (
      <div className="chart-card no-data-chart">
        <h3><FaChartPie /> Trabajadores por Estado</h3>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de trabajadores para mostrar.</p>
        </div>
      </div>
    );
  }

  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const inactiveWorkers = workers.length - activeWorkers;

  const data = {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        label: 'Trabajadores',
        data: [activeWorkers, inactiveWorkers],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // Verde (Activos)
          'rgba(100, 116, 139, 0.8)',   // Gris (Inactivos)
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: 'Distribución de Trabajadores por Estado',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155'
      },
    },
  };

  return (
    <div className="chart-card">
      <h3><FaChartPie /> Trabajadores por Estado</h3>
      <Pie data={data} options={options} />
    </div>
  );
};

// --- NUEVO GRÁFICO DE PRODUCTOS MÁS VENDIDOS ---
const BestSellingProductsChart = ({ sales }) => {
  if (!sales || sales.length === 0) {
    // No mostramos nada si no hay ventas, el otro gráfico ya muestra el mensaje.
    return null;
  }

  const productQuantities = sales.reduce((acc, sale) => {
    sale.products.forEach(product => {
      if (acc[product.productId]) {
        acc[product.productId].quantity += product.quantity;
      } else {
        acc[product.productId] = {
          name: product.productName,
          quantity: product.quantity,
        };
      }
    });
    return acc;
  }, {});

  const sortedProducts = Object.values(productQuantities)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Mostrar los 5 productos más vendidos

  if (sortedProducts.length === 0) {
    return (
      <div className="chart-card">
        <h3><FaChartBar /> Productos Más Vendidos</h3>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de productos vendidos para mostrar.</p>
        </div>
      </div>
    );
  }

  const data = {
    labels: sortedProducts.map(p => p.name),
    datasets: [
      {
        label: 'Cantidad Vendida (Pares)',
        data: sortedProducts.map(p => p.quantity),
        backgroundColor: [
          'rgba(30, 41, 59, 0.8)',
          'rgba(51, 65, 85, 0.8)',
          'rgba(71, 85, 105, 0.8)',
          'rgba(100, 116, 139, 0.8)',
          'rgba(148, 163, 184, 0.8)',
        ],
        borderColor: [
          'rgba(30, 41, 59, 1)',
          'rgba(51, 65, 85, 1)',
          'rgba(71, 85, 105, 1)',
          'rgba(100, 116, 139, 1)',
          'rgba(148, 163, 184, 1)',
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y', // <-- Esto crea el gráfico de barras horizontales
    responsive: true,
    plugins: {
      legend: { display: false }, // Ocultamos la leyenda para dar más espacio
      title: { 
        display: true, 
        text: 'Top 5 Productos Más Vendidos (en Pares)',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155'
      },
    },
  };

  return (
    <div className="chart-card">
      <h3><FaChartBar /> Productos Más Vendidos</h3>
      <Bar data={data} options={options} />
    </div>
  );
};

// --- NUEVO GRÁFICO DE HORAS TRABAJADAS POR TRABAJADOR ---
const WorkerHoursChart = ({ attendance, workers }) => {
  if (!attendance || attendance.length === 0) {
    return (
      <div className="chart-card">
        <h3><FaChartBar /> Horas Trabajadas por Empleado (Mes Actual)</h3>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay registros de asistencia para este mes.</p>
        </div>
      </div>
    );
  }

  // Agrupar registros por trabajador
  const hoursByWorker = attendance.reduce((acc, record) => {
    if (!acc[record.workerId]) {
      acc[record.workerId] = {
        name: record.workerName,
        records: [],
      };
    }
    acc[record.workerId].records.push(record);
    return acc;
  }, {});

  // Calcular horas totales por trabajador
  const workerHoursData = Object.values(hoursByWorker).map((workerData) => {
    const entry = workerData.records.find(r => r.type === 'entry');
    const exit = workerData.records.find(r => r.type === 'exit');
    let totalHours = 0;

    if (entry && exit) {
      const entryTime = entry.timestamp.toDate().getTime();
      const exitTime = exit.timestamp.toDate().getTime();
      let durationMillis = exitTime - entryTime;

      // Asumir un descanso de 45 minutos si hay registro de break
      if (workerData.records.some(r => r.type === 'break')) {
        durationMillis -= (45 * 60 * 1000);
      }

      totalHours = Math.max(0, durationMillis / (1000 * 60 * 60));
    }

    return {
      name: workerData.name,
      hours: totalHours,
    };
  }).sort((a, b) => b.hours - a.hours); // Ordenar de mayor a menor

  const data = {
    labels: workerHoursData.map(w => w.name),
    datasets: [
      {
        label: 'Horas Trabajadas',
        data: workerHoursData.map(w => w.hours.toFixed(2)),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Horas Trabajadas por Empleado (Mes Actual)',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Total de Horas'
        }
      }
    }
  };

  return (
    <div className="chart-card full-width-chart">
      <h3><FaChartBar /> Horas por Empleado</h3>
      <Bar data={data} options={options} />
    </div>
  );
};

// --- FIN DE NUEVOS COMPONENTES ---

function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        const [salesData, workersData, attendanceData] = await Promise.all([
          saleService.getAllSales(),
          workerService.getAllWorkers(),
          attendanceService.getAttendanceForDateRange(startOfMonth, endOfMonth)
        ]);
        console.log("Datos de ventas cargados:", salesData); // Log de depuración
        console.log("Datos de trabajadores cargados:", workersData); // Log de depuración
        console.log("Datos de asistencia cargados:", attendanceData); // Log de depuración
        setSales(salesData);
        setWorkers(workersData);
        setAttendance(attendanceData);
      } catch (error) {
        console.error("Error al cargar datos para reportes:", error);
        alert("No se pudieron cargar los datos para los reportes.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-overlay"><div className="spinner"></div><p>Cargando reportes...</p></div>;
  }

  return (
    <div className="reports-container">
      <h1>📈 Reportes y Estadísticas</h1>
      <div className="charts-grid">
        <SalesChart sales={sales} />
        <WorkerChart workers={workers} />
        <WorkerHoursChart attendance={attendance} workers={workers} />
        <BestSellingProductsChart sales={sales} />
      </div>
    </div>
  );
}

export default ReportsPage;