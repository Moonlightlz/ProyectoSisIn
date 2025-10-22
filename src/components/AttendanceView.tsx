import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/workerService';
import { Worker } from '../types/payroll';
import { FaArrowLeft, FaEdit, FaHistory, FaFileExport } from 'react-icons/fa';
import './AttendanceModal.css';

interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  type: 'entry' | 'exit' | 'break';
  timestamp: {
    toDate: () => Date;
  };
}

interface GroupedAttendance {
  [workerId: string]: {
    workerName: string;
    dni: string;
    records: AttendanceRecord[];
  };
}

interface AttendanceViewProps {
  onBack: () => void;
  workers: Worker[]; // Pasamos la lista de trabajadores para obtener el DNI
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ onBack, workers }) => {
  const [attendanceData, setAttendanceData] = useState<GroupedAttendance>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchDni, setSearchDni] = useState(''); // Estado para el filtro por DNI

  const fetchAttendance = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const records = await attendanceService.getAttendanceForDay(new Date(date));

      // Agrupar registros por trabajador
      const grouped: GroupedAttendance = records.reduce((acc, record) => {
        const worker = workers.find(w => w.id === record.workerId);
        if (!acc[record.workerId]) {
          acc[record.workerId] = {
            workerName: record.workerName,
            dni: worker?.dni || 'N/A',
            records: [],
          };
        }
        acc[record.workerId].records.push(record);
        return acc;
      }, {} as GroupedAttendance);

      // Ordenar los registros de cada trabajador por hora
      Object.values(grouped).forEach(workerGroup => {
        workerGroup.records.sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());
      });

      setAttendanceData(grouped);
    } catch (err) {
      setError('No se pudieron cargar los registros de asistencia.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // Filtrar los datos de asistencia basados en el DNI de búsqueda
  const filteredAttendance = Object.values(attendanceData).filter(workerData =>
    workerData.dni.startsWith(searchDni)
  );

  return (
    <div className="attendance-view">
      <div className="header">
        <div className="header-title">
          <button className="btn btn-back" onClick={onBack}>
            <FaArrowLeft /> Volver a Trabajadores
          </button>
          <h1>Registros de Asistencia</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <FaEdit /> Editar
          </button>
          <button className="btn btn-secondary">
            <FaHistory /> Historial
          </button>
          <button className="btn btn-secondary">
            <FaFileExport /> Exportar
          </button>
          <input
            type="text"
            placeholder="Buscar por DNI..."
            className="search-input"
            value={searchDni}
            onChange={(e) => setSearchDni(e.target.value.replace(/\D/g, ''))} // Solo números
            maxLength={8}
          />
          <input
            type="date"
            id="attendance-date"
            className="period-selector"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <div className="loading">Cargando asistencias...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && filteredAttendance.length === 0 && <p className="no-data-message">No se encontraron registros con los filtros aplicados.</p>}

      <div className="attendance-list">
        {filteredAttendance.map(workerData => (
          <div key={workerData.dni} className="attendance-worker-card">
            <h4>{workerData.workerName} - DNI: {workerData.dni}</h4>
            <ul>
              {workerData.records.map(record => (
                <li key={record.id}>
                  <span className={`record-type ${record.type}`}>{record.type.charAt(0).toUpperCase() + record.type.slice(1)}:</span>
                  <span className="record-time">{formatTimestamp(record.timestamp.toDate())}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceView;