import React, { useState, useEffect } from 'react';
import { saleService } from '../services/saleService';
import { workerService, attendanceService } from '../services/workerService';
import WorkerPayrollService from '../services/workerPayrollService';
import { FaExclamationCircle, FaChartPie, FaChartBar, FaStar } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './ReportsPage.css';

// Utilidad: calcula horas trabajadas por día y totales por trabajador (mes actual)
function computeWorkerHoursData(attendanceData) {
  if (!attendanceData || attendanceData.length === 0) return [];

  // Agrupar por trabajador
  const byWorker = attendanceData.reduce((acc, record) => {
    if (!record || !record.timestamp || !record.workerId) {
      // Registro inválido o de esquema diferente, ignorar
      return acc;
    }
    if (!acc[record.workerId]) acc[record.workerId] = { id: record.workerId, name: record.workerName, records: [] };
    acc[record.workerId].records.push(record);
    return acc;
  }, {});

  const pad = (n) => String(n).padStart(2, '0');

  return Object.values(byWorker).map((workerData) => {
    // Agrupar por fecha local AAAA-MM-DD
    const byDay = {};
    (workerData.records || []).forEach((rec) => {
      if (!rec || !rec.timestamp) return;
      const d = rec.timestamp.toDate();
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(rec);
    });

    let totalHours = 0;
    let workedDays = 0;
    let overtimeHours = 0;

    Object.values(byDay).forEach((dayRecords) => {
      // Ordenar por tiempo
      const sorted = [...dayRecords].sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());

      let dayMillis = 0;
      let lastEntry = null;
      let hadBreak = false;

      sorted.forEach((r) => {
        const t = r.timestamp.toDate().getTime();
        if (r.type === 'entry') {
          // Considerar nueva entrada solo si no hay una abierta
          if (lastEntry === null) lastEntry = t;
        } else if (r.type === 'exit') {
          if (lastEntry !== null) {
            // Sumar tramo entry->exit
            dayMillis += Math.max(0, t - lastEntry);
            lastEntry = null;
          }
        } else if (r.type === 'break') {
          hadBreak = true;
        }
      });

      // Si hubo al menos un par entrada-salida, contamos el día
      if (dayMillis > 0) {
        if (hadBreak) {
          // Descontar 45 minutos solo si hay registro de break
          dayMillis = Math.max(0, dayMillis - 45 * 60 * 1000);
        }
        const dayHours = dayMillis / (1000 * 60 * 60);
        totalHours += dayHours;
        workedDays += 1;
        overtimeHours += Math.max(0, dayHours - 8);
      }
    });

    return {
      workerId: workerData.id,
      name: workerData.name,
      hours: totalHours,
      workedDays,
      avgHours: workedDays > 0 ? totalHours / workedDays : 0,
      overtimeHours,
    };
  }).sort((a, b) => b.hours - a.hours);
}

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
const WorkerHoursTable = ({ workerHoursData }) => {
  if (!workerHoursData || workerHoursData.length === 0) {
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

  // Ordenar por horas totales descendente (mayor a menor)
  const sorted = [...workerHoursData].sort((a, b) => {
    const aHours = Number(a.hours ?? 0);
    const bHours = Number(b.hours ?? 0);
    if (bHours !== aHours) return bHours - aHours; // Descendente por horas
    const aAvg = Number(a.avgHours ?? 0);
    const bAvg = Number(b.avgHours ?? 0);
    return bAvg - aAvg; // Descendente por promedio
  });

  // Asumimos 8 horas diarias como meta; robusto ante undefined/strings
  const hoursArray = sorted.map(w => Number(w.hours ?? 0));
  const maxHoursGoal = Math.max(8 * 22, ...hoursArray);

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
          {sorted.map(worker => {
            const safeHours = Number(worker.hours ?? 0);
            const safeAvg = Number(worker.avgHours ?? 0);
            const widthPct = maxHoursGoal > 0 ? (safeHours / maxHoursGoal) * 100 : 0;
            return (
            <tr key={worker.workerId || worker.name}>
              <td>{worker.name}</td>
              <td className="progress-cell">
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar ${safeAvg >= 8 ? 'good' : 'regular'}`}
                    style={{ width: `${widthPct}%` }}
                  ></div>
                </div>
                <span>{safeHours.toFixed(1)}h</span>
              </td>
              <td>{Number(worker.workedDays ?? 0)}</td>
              <td>{safeAvg.toFixed(1)}h</td>
            </tr>
            );
          })}
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

  // Mostrar solo quienes tienen horas extras (> 0) y mostrar SOLO las horas extra
  const candidates = workerHoursData
    .filter(worker => (worker.overtimeHours || 0) > 0)
    .sort((a, b) => (b.overtimeHours || 0) - (a.overtimeHours || 0));

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
            <span className="candidate-hours">{candidate.overtimeHours.toFixed(1)} horas extra</span>
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
        try {
          const countsByWorker = (attendanceData || []).reduce((acc, r) => {
            const id = r?.workerId || 'sin-id';
            acc[id] = (acc[id] || 0) + 1;
            return acc;
          }, {});
          console.log('Resumen asistencia por trabajador (conteo de registros):', countsByWorker);
        } catch (e) {
          console.warn('No se pudo resumir asistencia por trabajador:', e);
        }
        setSales(salesData);
        setWorkers(workersData);
        setAttendance(attendanceData);

        // Calcular workerHoursData con reglas corregidas (basado en asistencia)
        const baseHoursData = computeWorkerHoursData(attendanceData);
        console.log('Base de horas (por asistencia):', baseHoursData.map(x => ({ workerId: x.workerId, name: x.name, hours: Number(x.hours||0).toFixed(2), days: x.workedDays, avg: Number(x.avgHours||0).toFixed(2), extra: Number(x.overtimeHours||0).toFixed(2) })));

        // Traer ajustes de planilla por trabajador y período (para customDays/customHours)
        // Guardamos ambos valores si existen para poder recalcular horas/avg/extra
        const customMap = {};
        await Promise.all((workersData || []).map(async (w) => {
          try {
            const adjs = await WorkerPayrollService.getWorkerPayrollAdjustmentsByPeriod(w.id, startOfMonth, endOfMonth);
            if (!adjs || adjs.length === 0) return;
            // Tomar el más reciente
            const sorted = [...adjs].sort((a, b) => {
              const aTime = (a.updatedAt || a.createdAt || a.period.startDate).getTime();
              const bTime = (b.updatedAt || b.createdAt || b.period.startDate).getTime();
              return bTime - aTime;
            });
            const chosen = sorted[0];
            if (!chosen) return;
            // Si hay horas personalizadas, guardarlas; si hay días personalizados, guardarlos
            // Si solo hay horas, derivamos días (= horas / 8) como apoyo visual
            const customHours = (typeof chosen.customHours === 'number' && chosen.customHours >= 0) ? chosen.customHours : undefined;
            const customDays = (typeof chosen.customDays === 'number' && chosen.customDays >= 0)
              ? chosen.customDays
              : (typeof customHours === 'number' ? Math.round((customHours / 8) * 100) / 100 : undefined);
            customMap[w.id] = { customHours, customDays };
          } catch (err) {
            console.error('Error fetching adjustments for worker', w.id, err);
          }
        }));

        // Combinar: si hay customDays, sobreescribir workedDays y recalcular promedio
  const byId = {};
  baseHoursData.forEach(h => { if (h && h.workerId) byId[h.workerId] = h; });

        // Incluir también trabajadores sin asistencia pero con customDays
        const merged = (workersData || []).reduce((arr, w) => {
          const base = byId[w.id];
          const custom = customMap[w.id] || {};
          const hasCustomDays = typeof custom.customDays === 'number' && custom.customDays >= 0;
          const hasCustomHours = typeof custom.customHours === 'number' && custom.customHours >= 0;

          if (base) {
            const workedDays = hasCustomDays ? custom.customDays : base.workedDays;
            // Total horas: si hay customHours usarlo; si no, y hay customDays, usar 8h/día; si no, mantener base
            const hours = hasCustomHours
              ? custom.customHours
              : (hasCustomDays ? custom.customDays * 8 : base.hours);
            const avgHours = workedDays > 0 ? (hours / workedDays) : 0;
            const overtimeHours = Math.max(0, hours - workedDays * 8);
            arr.push({ ...base, hours, workedDays, avgHours, overtimeHours, name: w.name, workerId: w.id });
          } else if (hasCustomDays || hasCustomHours) {
            // Sin horas de asistencia pero con ajustes manuales
            const workedDays = hasCustomDays ? custom.customDays : 0;
            const hours = hasCustomHours ? custom.customHours : (hasCustomDays ? custom.customDays * 8 : 0);
            const avgHours = workedDays > 0 ? (hours / workedDays) : 0;
            const overtimeHours = Math.max(0, hours - workedDays * 8);
            arr.push({ workerId: w.id, name: w.name, hours, workedDays, avgHours, overtimeHours });
          }
          return arr;
        }, []);

        // Ordenar por horas descendente
        merged.sort((a, b) => b.hours - a.hours);

        console.log('Datos finales (tras ajustes y merge):', merged.map(x => ({ workerId: x.workerId, name: x.name, hours: Number(x.hours||0).toFixed(2), days: x.workedDays, avg: Number(x.avgHours||0).toFixed(2), extra: Number(x.overtimeHours||0).toFixed(2) })));

        setWorkerHoursData(merged);
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
        <WorkerHoursTable workerHoursData={workerHoursData} />
        <BonusCandidates workerHoursData={workerHoursData} />
      </div>
    </div>
  );
}

export default ReportsPage;