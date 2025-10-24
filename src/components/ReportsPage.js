import React, { useState, useEffect } from 'react';
import { saleService } from '../services/saleService';
import { workerService, attendanceService } from '../services/workerService';
import { FaExclamationCircle, FaChartPie, FaChartBar, FaStar } from 'react-icons/fa';
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

// --- NUEVA TABLA DE HORAS TRABAJADAS POR EMPLEADO ---
const WorkerHoursTable = ({ attendance, workers }) => {
  if (!attendance || attendance.length === 0) {
    return (
      <div className="worker-hours-card">
        <h3><FaChartBar /> Rendimiento de Empleados (Mes Actual)</h3>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay registros de asistencia para este mes.</p>
        </div>
      </div>
    );
  }

  const hoursByWorker = attendance.reduce((acc, record) => {
    if (!acc[record.workerId]) acc[record.workerId] = { name: record.workerName, records: [] };
    acc[record.workerId].records.push(record);
    return acc;
  }, {});

  const workerHoursData = Object.values(hoursByWorker).map(workerData => {
    let totalHours = 0;
    const dailyRecords = {};

    (workerData.records || []).forEach(record => {
      const dateStr = record.timestamp.toDate().toISOString().split('T')[0];
      if (!dailyRecords[dateStr]) dailyRecords[dateStr] = [];
      dailyRecords[dateStr].push(record);
    });

    Object.values(dailyRecords).forEach((dayRecords) => {
      const entry = dayRecords.find(r => r.type === 'entry');
      const exit = dayRecords.find(r => r.type === 'exit');
      if (entry && exit) {
        const entryTime = entry.timestamp.toDate().getTime();
        const exitTime = exit.timestamp.toDate().getTime();
        let durationMillis = exitTime - entryTime;
        if (dayRecords.some(r => r.type === 'break')) {
          durationMillis -= (45 * 60 * 1000);
        }
        totalHours += Math.max(0, durationMillis / (1000 * 60 * 60));
      }
    });
    const workedDays = Object.keys(dailyRecords).length;
    return {
      name: workerData.name,
      hours: totalHours,
      workedDays: workedDays,
      avgHours: workedDays > 0 ? totalHours / workedDays : 0,
    };
  }).sort((a, b) => b.hours - a.hours);

  // Asumimos 8 horas diarias como meta
  const maxHoursGoal = Math.max(...workerHoursData.map(w => w.hours), 8 * 22);

  return (
    <div className="worker-hours-card">
      <h3><FaChartBar /> Rendimiento de Empleados (Mes Actual)</h3>
      <table className="worker-hours-table">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Horas Totales</th>
            <th>Días Trab.</th>
            <th>Promedio Diario</th>
          </tr>
        </thead>
        <tbody>
          {workerHoursData.map(worker => (
            <tr key={worker.name}>
              <td>{worker.name}</td>
              <td className="progress-cell">
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar ${worker.avgHours >= 8 ? 'good' : 'regular'}`}
                    style={{ width: `${(worker.hours / maxHoursGoal) * 100}%` }}
                  ></div>
                </div>
                <span>{worker.hours.toFixed(1)}h</span>
              </td>
              <td>{worker.workedDays}</td>
              <td>{worker.avgHours.toFixed(1)}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- NUEVA LISTA DE CANDIDATOS A BONO ---
const BonusCandidates = ({ workerHoursData }) => {
  if (!workerHoursData || workerHoursData.length === 0) {
    return null;
  }

  const candidates = workerHoursData.filter(worker => worker.hours > 48);

  if (candidates.length === 0) {
    return (
      <div className="bonus-card">
        <h3><FaStar /> Candidatos a Bono por Horas Extra</h3>
        <p className="no-candidates">Nadie ha superado las 48 horas este mes.</p>
      </div>
    );
  }

  return (
    <div className="bonus-card">
      <h3><FaStar /> Candidatos a Bono por Horas Extra</h3>
      <ul className="candidates-list">
        {candidates.map(candidate => (
          <li key={candidate.name}>
            <span className="candidate-name">{candidate.name}</span>
            <span className="candidate-hours">{candidate.hours.toFixed(1)} horas</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// --- FIN DE NUEVOS COMPONENTES ---

function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerHoursData, setWorkerHoursData] = useState([]);

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

        // --- RE-CALCULATE workerHoursData here to pass to BonusCandidates ---
        const hoursByWorker = attendanceData.reduce((acc, record) => {
          if (!acc[record.workerId]) {
            acc[record.workerId] = { name: record.workerName, records: [] };
          }
          acc[record.workerId].records.push(record);
          return acc;
        }, {});

        const calculatedHoursData = Object.values(hoursByWorker).map(workerData => {
          let totalHours = 0;
          const dailyRecords = {};
          (workerData.records || []).forEach(record => {
            const dateStr = record.timestamp.toDate().toISOString().split('T')[0];
            if (!dailyRecords[dateStr]) dailyRecords[dateStr] = [];
            dailyRecords[dateStr].push(record);
          });

          Object.values(dailyRecords).forEach((dayRecords) => {
            const entry = dayRecords.find(r => r.type === 'entry');
            const exit = dayRecords.find(r => r.type === 'exit');
            if (entry && exit) {
              let durationMillis = exit.timestamp.toDate().getTime() - entry.timestamp.toDate().getTime();
              if (dayRecords.some(r => r.type === 'break')) {
                durationMillis -= (45 * 60 * 1000);
              }
              totalHours += Math.max(0, durationMillis / (1000 * 60 * 60));
            }
          });

          return {
            name: workerData.name,
            hours: totalHours,
            workedDays: Object.keys(dailyRecords).length,
          };
        });
        setWorkerHoursData(calculatedHoursData);
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
        <BestSellingProductsChart sales={sales} />
        <WorkerHoursTable attendance={attendance} workers={workers} />
        <BonusCandidates workerHoursData={workerHoursData} />
      </div>
    </div>
  );
}

export default ReportsPage;