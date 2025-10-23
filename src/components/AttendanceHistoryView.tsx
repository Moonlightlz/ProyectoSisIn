import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaFileExport } from 'react-icons/fa';
import { attendanceService } from '../services/workerService';
import { Worker } from '../types/payroll';
import './AttendanceHistoryView.css';

interface AttendanceLog {
  id: string;
  action: 'delete' | 'update';
  reason: string;
  timestamp: Date;
  modifiedBy: string;
  workerId: string;
  workerName: string;
}

interface AttendanceHistoryViewProps {
  onBack: () => void;
  workers: Worker[];
}

const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({ onBack, workers }) => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar fechas al mes actual
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  const fetchLogs = async () => {
    if (!startDate || !endDate) {
      setError("Por favor, seleccione un rango de fechas válido.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const logData = await attendanceService.getAttendanceLogs(start, end);
      setLogs(logData);
    } catch (err) {
      setError('No se pudieron cargar los registros de auditoría.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []); // Carga inicial

  const handleSearch = () => {
    fetchLogs();
  };

  const getWorkerDni = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.dni || 'N/A';
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="attendance-history-view">
      <div className="header">
        <div className="header-title">
          <button className="btn btn-back" onClick={onBack}>
            <FaArrowLeft /> Volver a Asistencia
          </button>
          <h1>Historial de Cambios en Asistencia</h1>
        </div>
        <div className="header-actions">
          <label htmlFor="history-start-date">Desde:</label>
          <input
            type="date"
            id="history-start-date"
            className="period-selector"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label htmlFor="history-end-date">Hasta:</label>
          <input
            type="date"
            id="history-end-date"
            className="period-selector"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button className="btn btn-success">
            <FaFileExport /> Exportar
          </button>
        </div>
      </div>

      {loading && <div className="loading">Cargando historial...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && logs.length === 0 && <p className="no-data-message">No hay registros de auditoría para el rango de fechas seleccionado.</p>}

      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>DNI</th>
              <th>Fecha y Hora del Cambio</th>
              <th>Acción</th>
              <th>Motivo del Cambio</th>
              <th>Modificado por</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.workerName}</td>
                <td>{getWorkerDni(log.workerId)}</td>
                <td>{formatTimestamp(log.timestamp)}</td>
                <td><span className={`action-badge action-${log.action}`}>{log.action === 'delete' ? 'Eliminación' : 'Modificación'}</span></td>
                <td>{log.reason}</td>
                <td>{log.modifiedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistoryView;