import React, { useState, useEffect } from 'react';
import { saleService } from '../services/saleService';
import { workerService, attendanceService } from '../services/workerService';
import { rawMaterialService } from './rawMaterialService'; // Importar servicio de materia prima
import WorkerPayrollService from '../services/workerPayrollService';
import { FaExclamationCircle, FaChartPie, FaChartBar, FaStar, FaWarehouse, FaLayerGroup } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import './ReportsPage.css';
import HistoryAnalysisModal from './HistoryAnalysisModal'; // Importar el nuevo modal

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
ChartJS.register(ArcElement, Tooltip, Legend, Title, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler);

// --- NUEVOS COMPONENTES DE GRÁFICOS ---

// Utilidad: días del mes actual (labels y límites por día)
function getDaysInCurrentMonth() {
  const days = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const dayStart = new Date(year, month, d, 0, 0, 0, 0);
    const dayEnd = new Date(year, month, d, 23, 59, 59, 999);
    const label = String(d).padStart(2, '0');
    days.push({ label, start: dayStart, end: dayEnd });
  }
  return days;
}

// Utilidad: rango de fechas del mes actual
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// Componente para el gráfico circular de ventas
const SalesChart = ({ sales, onShowHistory }) => {
  if (!sales || sales.length === 0) {
    return (
      <div className="chart-card no-data-chart">
        <div className="chart-header">
          <h3><FaChartPie /> Ventas por Estado</h3>
        </div>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de ventas para mostrar.</p>
        </div>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const pendingSales = sales.filter(s => s.status.toLowerCase() === 'pendiente').length;
  const inProcessSales = sales.filter(s => s.status.toLowerCase().replace('_', ' ') === 'en proceso').length;
  const completedSales = sales.filter(s => s.status.toLowerCase() === 'entregado').length;

  const chartDataForHistory = {
    pendientes: pendingSales,
    en_proceso: inProcessSales,
    entregadas: completedSales,
  };

  const data = {
    labels: ['Pendientes', 'En Proceso', 'Entregadas'],
    datasets: [
      {
        label: 'Cantidad de Ventas',
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
    aspectRatio: 1.2, // <-- Ajusta la proporción para que sea más grande
    plugins: {
      legend: { display: false },
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
      <div className="chart-header">
        <h3><FaChartPie /> Ventas por Estado</h3>
      </div>
      <Pie data={data} options={options} />
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Ventas por Estado')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};

// Histórico mensual (mes actual, por día) de Ventas por Estado
const SalesHistoryChart = ({ sales }) => {
  if (!sales || sales.length === 0) return null;
  const days = getDaysInCurrentMonth();
  const toDate = (v) => (v instanceof Date ? v : v?.toDate ? v.toDate() : v ? new Date(v) : null);
  const countsByStatus = {
    pendiente: days.map(({ start, end }) => sales.filter(s => {
      const d = toDate(s.date) || toDate(s.createdAt) || null;
      if (!d) return false;
      return d >= start && d <= end && (s.status || '').toLowerCase() === 'pendiente';
    }).length),
    enproceso: days.map(({ start, end }) => sales.filter(s => {
      const d = toDate(s.date) || toDate(s.createdAt) || null;
      if (!d) return false;
      return d >= start && d <= end && (s.status || '').toLowerCase().replace('_', ' ') === 'en proceso';
    }).length),
    entregado: days.map(({ start, end }) => sales.filter(s => {
      const d = toDate(s.date) || toDate(s.createdAt) || null;
      if (!d) return false;
      return d >= start && d <= end && (s.status || '').toLowerCase() === 'entregado';
    }).length),
  };
  const data = {
    labels: days.map(m => m.label),
    datasets: [
      { label: 'Pendientes', data: countsByStatus.pendiente, borderColor: 'rgba(245, 158, 11, 1)', backgroundColor: 'rgba(245, 158, 11, 0.2)', fill: true, tension: 0.3, pointRadius: 2 },
      { label: 'En Proceso', data: countsByStatus.enproceso, borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, tension: 0.3, pointRadius: 2 },
      { label: 'Entregadas', data: countsByStatus.entregado, borderColor: 'rgba(16, 185, 129, 1)', backgroundColor: 'rgba(16, 185, 129, 0.2)', fill: true, tension: 0.3, pointRadius: 2 },
    ],
  };
  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Mes Actual - Ventas por Estado (por día)' } },
  };
  return (
    <div className="chart-card">
      <h3><FaChartBar /> Ventas por Estado (Mes)</h3>
      <Line data={data} options={options} />
    </div>
  );
};

// Componente para el gráfico circular de trabajadores
const WorkerChart = ({ workers, onShowHistory }) => {
  if (!workers || workers.length === 0) {
    return (
      <div className="chart-card no-data-chart">
        <div className="chart-header">
          <h3><FaChartPie /> Trabajadores por Estado</h3>
        </div>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de trabajadores para mostrar.</p>
        </div>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const inactiveWorkers = workers.length - activeWorkers;

  const chartDataForHistory = {
    activos: activeWorkers,
    inactivos: inactiveWorkers,
    total: workers.length,
  };

  const data = {
    labels: ['Activos', 'Inactivos'],
    datasets: [
      {
        label: 'Cantidad de Trabajadores',
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
    aspectRatio: 1.2, // <-- Ajusta la proporción para que sea más grande
    plugins: {
      legend: { display: false },
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
      <div className="chart-header">
        <h3><FaChartPie /> Trabajadores por Estado</h3>
      </div>
      <Pie data={data} options={options} />
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Trabajadores por Estado')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};
  
// Histórico mensual (mes actual, por día) de Trabajadores por Estado (aproximado con hireDate/deletedAt)
const WorkerHistoryChart = ({ workers }) => {
  if (!workers || workers.length === 0) return null;
  const days = getDaysInCurrentMonth();
  const toDate = (v) => (v instanceof Date ? v : v?.toDate ? v.toDate() : v ? new Date(v) : null);
  const counts = days.map(({ end }) => {
    const active = workers.filter(w => {
      const hire = toDate(w.hireDate) || toDate(w.createdAt) || new Date(0);
      const deletedAt = toDate(w.deletedAt);
      const wasHired = hire <= end;
      const notDeletedAtThatTime = !deletedAt || deletedAt > end;
      return wasHired && notDeletedAtThatTime && w.status === 'active';
    }).length;
    const totalAtTime = workers.filter(w => (toDate(w.hireDate) || toDate(w.createdAt) || new Date(0)) <= end).length;
    const inactive = Math.max(0, totalAtTime - active);
    return { active, inactive };
  });
  const data = {
    labels: days.map(m => m.label),
    datasets: [
      { label: 'Activos', data: counts.map(c => c.active), borderColor: 'rgba(34, 197, 94, 1)', backgroundColor: 'rgba(34, 197, 94, 0.2)', fill: true, tension: 0.3, pointRadius: 2 },
      { label: 'Inactivos', data: counts.map(c => c.inactive), borderColor: 'rgba(100, 116, 139, 1)', backgroundColor: 'rgba(100, 116, 139, 0.2)', fill: true, tension: 0.3, pointRadius: 2 },
    ],
  };
  const options = { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Mes Actual - Trabajadores por Estado (por día)' } } };
  return (
    <div className="chart-card">
      <h3><FaChartBar /> Ventas por Estado (Mes)</h3>
      <Line data={data} options={options} />
      <div className="chart-footer">
        <button className="btn btn-secondary btn-sm">Historico</button>
      </div>
    </div>
  );
};

// --- NUEVO GRÁFICO DE PRODUCTOS MÁS VENDIDOS ---
const BestSellingProductsChart = ({ sales, onShowHistory }) => {
  if (!sales || sales.length === 0) {
    // No mostramos nada si no hay ventas, el otro gráfico ya muestra el mensaje.
    return null;
  }

  const productQuantities = sales.reduce((acc, sale) => {
    (sale.products || []).forEach(product => {
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
        <div className="chart-header">
          <h3><FaChartBar /> Productos Más Vendidos</h3>
        </div>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de productos vendidos para mostrar.</p>
        </div>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const chartDataForHistory = sortedProducts.reduce((acc, p) => {
    // Usar una clave segura para el objeto
    const key = p.name.replace(/\s+/g, '_').toLowerCase();
    acc[key] = p.quantity;
    return acc;
  }, {});

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
          'rgba(148, 163, 184, 0.8)'
        ],
        borderColor: [
          'rgba(30, 41, 59, 1)',
          'rgba(51, 65, 85, 1)',
          'rgba(71, 85, 105, 1)',
          'rgba(100, 116, 139, 1)',
          'rgba(148, 163, 184, 1)'
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'x',
    responsive: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 5 Productos Más Vendidos (en Pares)',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155'
      },
    },
    scales: {
      x: {
        ticks: { display: false }
      }
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaChartBar /> Productos Más Vendidos</h3>
      </div>
      <Bar data={data} options={options} />
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Productos Más Vendidos')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};

// --- NUEVA TABLA DE HORAS TRABAJADAS POR EMPLEADO ---
const WorkerHoursTable = ({ workerHoursData, onShowHistory }) => {
  if (!workerHoursData || workerHoursData.length === 0) {
    return (
      <div className="worker-hours-card">
        <div className="chart-header">
          <h3><FaChartBar /> Rendimiento de Empleados (Mes Actual)</h3>
        </div>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay registros de asistencia para este mes.</p>
        </div>
        <div className="chart-footer">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onShowHistory({}, 'Rendimiento de Empleados')}
          >
            Historico
          </button>
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

  // Preparar datos para el histórico
  const chartDataForHistory = sorted.reduce((acc, worker) => {
    const key = worker.name.replace(/\s+/g, '_').toLowerCase();
    acc[key] = `${Number(worker.hours ?? 0).toFixed(1)} horas totales (${Number(worker.avgHours ?? 0).toFixed(1)}h promedio/día)`;
    return acc;
  }, {});

  return (
    <div className="worker-hours-card">
      <div className="chart-header">
        <h3><FaChartBar /> Rendimiento de Empleados (Mes Actual)</h3>
      </div>
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
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Rendimiento de Empleados')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};

// --- NUEVA LISTA DE CANDIDATOS A BONO ---
const BonusCandidates = ({ workerHoursData, onShowHistory }) => {
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
        <div className="chart-header">
          <h3><FaStar /> Candidatos a Bono por Horas Extra</h3>
        </div>
        <p className="no-candidates">Nadie ha superado las 48 horas este mes.</p>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const chartDataForHistory = candidates.reduce((acc, c) => {
    const key = c.name.replace(/\s+/g, '_').toLowerCase();
    acc[key] = `${c.overtimeHours.toFixed(1)} horas extra`;
    return acc;
  }, {});

  return (
    <div className="bonus-card">
      <div className="chart-header">
        <h3><FaStar /> Candidatos a Bono por Horas Extra</h3>
      </div>
      <ul className="candidates-list">
        {candidates.map(candidate => (
          <li key={candidate.name}>
            <span className="candidate-name">{candidate.name}</span>
            <span className="candidate-hours">{candidate.overtimeHours.toFixed(1)} horas extra</span>
          </li>
        ))}
      </ul>
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Candidatos a Bono')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};

// --- NUEVO GRÁFICO DE ALERTAS DE STOCK ---
const LowStockChart = ({ materials, onShowHistory }) => {
  if (!materials || materials.length === 0) {
    return (
      <div className="chart-card no-data-chart">
        <div className="chart-header">
          <h3><FaWarehouse /> Alertas de Stock Bajo</h3>
        </div>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de inventario para mostrar.</p>
        </div>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const lowStockItems = materials
    .filter(m => m.stock <= (m.lowStockThreshold || 20))
    .sort((a, b) => a.stock - b.stock) // Ordenar por el stock más bajo primero
    .slice(0, 5); // Mostrar los 5 más críticos

  if (lowStockItems.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3><FaWarehouse /> Alertas de Stock Bajo</h3>
        </div>
        <div className="no-data-message">
          <p>✅ No hay materiales con stock bajo actualmente.</p>
        </div>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const chartDataForHistory = lowStockItems.reduce((acc, item) => {
    const key = item.name.replace(/\s+/g, '_').toLowerCase();
    acc[key] = `Stock actual: ${item.stock} ${item.unit}`;
    return acc;
  }, {});

  const data = {
    labels: lowStockItems.map(p => `${p.name} (${p.stock} ${p.unit})`),
    datasets: [
      {
        label: 'Stock Actual',
        data: lowStockItems.map(p => p.stock),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Rojo
          'rgba(249, 115, 22, 0.8)',  // Naranja
          'rgba(245, 158, 11, 0.8)', // Ámbar
          'rgba(234, 179, 8, 0.8)',   // Amarillo
          'rgba(252, 211, 77, 0.8)', // Amarillo claro
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Top 5 Materiales con Stock Crítico',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155'
      },
    },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaWarehouse /> Alertas de Stock Bajo</h3>
      </div>
      <Pie data={data} options={options} />
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Alertas de Stock Bajo')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};

// --- NUEVO GRÁFICO DE CATEGORÍAS DE MATERIALES ---
const MaterialCategoryChart = ({ materials, onShowHistory }) => {
  if (!materials || materials.length === 0) {
    return (
      <div className="chart-card no-data-chart">
        <div className="chart-header">
          <h3><FaLayerGroup /> Materiales por Categoría</h3>
        </div>
        <div className="no-data-message">
          <FaExclamationCircle size={30} />
          <p>No hay datos de inventario para mostrar.</p>
        </div>
        <div className="chart-footer">
          <button className="btn btn-secondary btn-sm" disabled>Historico</button>
        </div>
      </div>
    );
  }

  const categoryCounts = materials.reduce((acc, material) => {
    const category = material.category || 'Sin Categoría';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a);

  const labels = sortedCategories.map(([category]) => category);
  const dataPoints = sortedCategories.map(([, count]) => count);

  const chartDataForHistory = sortedCategories.reduce((acc, [category, count]) => {
    const key = category.replace(/\s+/g, '_').toLowerCase();
    acc[key] = `${count} tipos de material`;
    return acc;
  }, {});

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Nº de Tipos de Material',
        data: dataPoints,
        backgroundColor: [
          'rgba(30, 64, 175, 0.8)',
          'rgba(37, 99, 235, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(96, 165, 250, 0.8)',
          'rgba(147, 197, 253, 0.8)',
          'rgba(191, 219, 254, 0.8)',
          'rgba(219, 234, 254, 0.8)',
          'rgba(100, 116, 139, 0.8)',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Distribución de Materiales por Categoría',
        font: { size: 16, family: "'Poppins', sans-serif" },
        color: '#334155'
      },
    },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaLayerGroup /> Materiales por Categoría</h3>
      </div>
      <Pie data={data} options={options} />
      <div className="chart-footer">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => onShowHistory(chartDataForHistory, 'Materiales por Categoría')}
        >
          Historico
        </button>
      </div>
    </div>
  );
};

// Histórico mensual (mes actual, por día) de Alertas de Stock Bajo (aprox.)
const LowStockHistoryChart = ({ materials }) => {
  if (!materials || materials.length === 0) return null;
  const days = getDaysInCurrentMonth();
  const toDate = (v) => (v instanceof Date ? v : v?.toDate ? v.toDate() : v ? new Date(v) : null);
  const counts = days.map(({ end }) => materials.filter(m => {
    const created = toDate(m.createdAt) || new Date(0);
    const threshold = typeof m.lowStockThreshold === 'number' ? m.lowStockThreshold : 20;
    return created <= end && Number(m.stock || 0) <= threshold;
  }).length);
  const data = {
    labels: days.map(m => m.label),
    datasets: [
      { label: 'Materiales con Stock Bajo (aprox.)', data: counts, backgroundColor: 'rgba(239, 68, 68, 0.6)' }
    ]
  };
  const options = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Mes Actual - Stock Bajo (aprox.) (por día)' } } };
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaChartBar /> Stock Bajo (Mes, aprox.)</h3>
      </div>
      <Bar data={data} options={options} />
      <div className="chart-footer">
        <button className="btn btn-secondary btn-sm">Historico</button>
      </div>
    </div>
  );
};

// Histórico mensual (mes actual, por día) de Materiales por Categoría (creados por día)
const MaterialCategoryHistoryChart = ({ materials }) => {
  if (!materials || materials.length === 0) return null;
  const days = getDaysInCurrentMonth();
  const toDate = (v) => (v instanceof Date ? v : v?.toDate ? v.toDate() : v ? new Date(v) : null);
  // reunir categorías
  const categories = Array.from(new Set(materials.map(m => m.category || 'Sin Categoría')));
  const topCategories = categories.slice(0, 4); // limitar a 4 para legibilidad
  const datasets = topCategories.map((cat, idx) => {
    const colorBase = [
      'rgba(30, 64, 175, 0.6)',
      'rgba(37, 99, 235, 0.6)',
      'rgba(59, 130, 246, 0.6)',
      'rgba(96, 165, 250, 0.6)'
    ][idx % 4];
    return {
      label: cat,
      data: days.map(({ start, end }) => materials.filter(m => (m.category || 'Sin Categoría') === cat && (() => { const c = toDate(m.createdAt) || new Date(0); return c >= start && c <= end; })()).length),
      backgroundColor: colorBase
    };
  });
  // Convert datasets to line style with fills
  const lineDatasets = datasets.map((ds) => ({
    ...ds,
    borderColor: ds.backgroundColor.replace('0.6', '1'),
    backgroundColor: ds.backgroundColor.replace('0.6', '0.2'),
    fill: true,
    tension: 0.3,
    pointRadius: 2,
  }));
  const data = { labels: days.map(m => m.label), datasets: lineDatasets };
  const options = { responsive: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Mes Actual - Materiales por Categoría (por día)' } } };
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaChartBar /> Ventas por Estado (Mes)</h3>
      </div>
      <Line data={data} options={options} />
      <div className="chart-footer">
        <button className="btn btn-secondary btn-sm">Historico</button>
      </div>
    </div>
  );
};
// --- FIN DE NUEVOS COMPONENTES ---

// Gráfico pastel: Ventas por Estado (Mes)
const SalesMonthlyPieChart = ({ sales }) => {
  if (!sales || sales.length === 0) return null;
  const { start, end } = getCurrentMonthRange();
  const toDate = (v) => (v instanceof Date ? v : v?.toDate ? v.toDate() : v ? new Date(v) : null);
  const inMonth = sales.filter(s => {
    const d = toDate(s.date) || toDate(s.createdAt) || null;
    return d && d >= start && d <= end;
  });
  const pending = inMonth.filter(s => (s.status || '').toLowerCase() === 'pendiente').length;
  const inProcess = inMonth.filter(s => (s.status || '').toLowerCase().replace('_', ' ') === 'en proceso').length;
  const delivered = inMonth.filter(s => (s.status || '').toLowerCase() === 'entregado').length;
  const total = pending + inProcess + delivered;
  if (total === 0) return null;
  const data = {
    labels: ['Pendientes', 'En Proceso', 'Entregadas'],
    datasets: [{
      label: 'Ventas',
      data: [pending, inProcess, delivered],
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)'
      ],
      borderColor: ['#ffffff', '#ffffff', '#ffffff'],
      borderWidth: 2,
    }]
  };
  const options = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Ventas por Estado (Mes)' } } };
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaChartPie /> Ventas por Estado (Mes)</h3>
      </div>
      <Pie data={data} options={options} />
      <div className="chart-footer">
        <button className="btn btn-secondary btn-sm">Historico</button>
      </div>
    </div>
  );
};

// Gráfico de barras horizontal: Materiales por Categoría (Mes) con "Otros"
const MaterialCategoryMonthlyBarChart = ({ materials }) => {
  if (!materials || materials.length === 0) return null;
  const { start, end } = getCurrentMonthRange();
  const toDate = (v) => (v instanceof Date ? v : v?.toDate ? v.toDate() : v ? new Date(v) : null);
  const inMonth = materials.filter(m => {
    const d = toDate(m.createdAt) || new Date(0);
    return d >= start && d <= end;
  });
  if (inMonth.length === 0) return null;
  const categoryCounts = inMonth.reduce((acc, m) => {
    const cat = m.category || 'Sin Categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  // Ordenar por cantidad y agregar "Otros" si excede el topN
  const entries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const topN = 8;
  const top = entries.slice(0, topN);
  const rest = entries.slice(topN);
  const othersSum = rest.reduce((sum, [, c]) => sum + c, 0);
  const labels = [...top.map(([k]) => k), ...(othersSum > 0 ? ['Otros'] : [])];
  const dataPoints = [...top.map(([, v]) => v), ...(othersSum > 0 ? [othersSum] : [])];
  const palette = [
    'rgba(30, 64, 175, 0.8)',
    'rgba(37, 99, 235, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(96, 165, 250, 0.8)',
    'rgba(147, 197, 253, 0.8)',
    'rgba(191, 219, 254, 0.8)',
    'rgba(219, 234, 254, 0.8)',
    'rgba(100, 116, 139, 0.8)',
    'rgba(148, 163, 184, 0.8)'
  ];
  const data = {
    labels,
    datasets: [{
      label: 'Materiales (creados este mes)',
      data: dataPoints,
      backgroundColor: labels.map((_, i) => palette[i % palette.length]),
      borderColor: '#ffffff',
      borderWidth: 1,
      borderRadius: 4,
    }]
  };
  const options = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { display: false }, title: { display: true, text: 'Materiales por Categoría (Mes)' } },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: { ticks: { autoSkip: false } }
    }
  };
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaChartBar /> Materiales por Categoría (Mes)</h3>
      </div>
      <Bar data={data} options={options} />
      <div className="chart-footer">
        <button className="btn btn-secondary btn-sm">Historico</button>
      </div>
    </div>
  );
};

function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerHoursData, setWorkerHoursData] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]); // Estado para materias primas

  // Estados para el modal de análisis de historial
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyAnalysis, setHistoryAnalysis] = useState('');
  const [historyTitle, setHistoryTitle] = useState('');
  const [historyData, setHistoryData] = useState(null); // <-- NUEVO: para pasar datos a la tabla
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        const [salesData, workersData, attendanceData, materialsData] = await Promise.all([
          saleService.getAllSales(),
          workerService.getAllWorkers(),
          attendanceService.getAttendanceForDateRange(startOfMonth, endOfMonth),
          rawMaterialService.getRawMaterials() // Cargar materias primas
        ]);
        console.log("Datos de ventas cargados:", salesData); // Log de depuración
        console.log("Datos de trabajadores cargados:", workersData); // Log de depuración
        console.log("Datos de inventario cargados:", materialsData); // Log de depuración
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
        setRawMaterials(materialsData); // Guardar materias primas en el estado

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

  useEffect(() => {
    // Establecer el título de la página
    document.title = "INDUSTRIA PROCESADORA DEL CALZADO S.A.C.";
  }, []);

  const handleShowHistory = async (chartData, chartTitle) => {
    setIsHistoryModalOpen(true);
    setIsAiLoading(true);
    setHistoryTitle(chartTitle);
    setHistoryData(chartData);
    setHistoryAnalysis(''); // Limpiar análisis anterior

    try {
      // Simular un pequeño delay para la UI
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Encontrar la clave y el valor más alto para una respuesta más inteligente
      let maxKey = '';
      let maxValue = -Infinity;
      Object.entries(chartData).forEach(([key, value]) => {
          // Asegurarse de que el valor es numérico para la comparación
          const numericValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
          if (!isNaN(numericValue) && numericValue > maxValue) {
              maxValue = numericValue;
              maxKey = key.replace(/_/g, ' ');
          }
      });

      let simulatedAnswer = `Análisis del reporte "${chartTitle}":\n\nEl enfoque principal se centra en '${maxKey}', que representa la categoría más significativa en este conjunto de datos. Se recomienda revisar este indicador para la toma de decisiones.`;
      if (!maxKey) { // Fallback si no se encuentran datos numéricos
        simulatedAnswer = `Análisis del reporte "${chartTitle}":\n\nSe han procesado los datos. Es importante revisar las cifras presentadas en la tabla para entender la distribución actual y tomar decisiones informadas.`;
      }
      setHistoryAnalysis(simulatedAnswer);
    } catch (error) {
      console.error("Error al generar análisis:", error);
      setHistoryAnalysis(null); // Indicar que hubo un error
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-overlay"><div className="spinner"></div><p>Cargando reportes...</p></div>;
  }

  return (
    <div className="reports-container">
      <h1>📈 Reportes y Estadísticas</h1>
      <div className="charts-grid">
        <SalesChart sales={sales} onShowHistory={handleShowHistory} />
        <WorkerChart workers={workers} onShowHistory={handleShowHistory} />
        <LowStockChart materials={rawMaterials} onShowHistory={handleShowHistory} />
        <MaterialCategoryChart materials={rawMaterials} onShowHistory={handleShowHistory} />
        <BestSellingProductsChart sales={sales} onShowHistory={handleShowHistory} />
        <WorkerHoursTable workerHoursData={workerHoursData} onShowHistory={handleShowHistory} />
        <BonusCandidates workerHoursData={workerHoursData} onShowHistory={handleShowHistory} />
      </div>
      <HistoryAnalysisModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={historyTitle}
        analysis={historyAnalysis}
        data={historyData} // <-- NUEVO: Pasar los datos al modal
        isLoading={isAiLoading}
      />
    </div>
  );
}

export default ReportsPage;