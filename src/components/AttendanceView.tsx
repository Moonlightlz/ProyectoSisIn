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
      // Usar new Date(`${date}T00:00:00`) para evitar problemas de zona horaria
      const records = await attendanceService.getAttendanceForDay(new Date(`${date}T00:00:00`));

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

  // Helper para encontrar un registro específico y formatear la hora
  const getRecordTime = (records: AttendanceRecord[], type: 'entry' | 'exit' | 'break'): string => {
    const record = records.find(r => r.type === type);
    return record ? record.timestamp.toDate().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '---';
  };

  // Helper para calcular el fin del break
  const getBreakEndTime = (records: AttendanceRecord[]): string => {
    const breakRecord = records.find(r => r.type === 'break');
    if (breakRecord) {
      const breakStartTime = breakRecord.timestamp.toDate();
      const breakEndTime = new Date(breakStartTime.getTime() + 45 * 60 * 1000);
      return breakEndTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    return '---';
  };

  // Helper para calcular el total de horas
  const calculateTotalHours = (records: AttendanceRecord[]): string => {
    const entryRecord = records.find(r => r.type === 'entry');
    const exitRecord = records.find(r => r.type === 'exit');
    const breakRecord = records.find(r => r.type === 'break');

    if (entryRecord && exitRecord) {
      const entryTime = entryRecord.timestamp.toDate().getTime();
      const exitTime = exitRecord.timestamp.toDate().getTime();
      
      let durationMillis = exitTime - entryTime;

      if (breakRecord) {
        durationMillis -= (45 * 60 * 1000); // Restar 45 minutos de break
      }

      const hours = durationMillis / (1000 * 60 * 60);
      return hours > 0 ? `${hours.toFixed(2)} hrs` : '0.00 hrs';
    }
    return '---';
  };

  // Filtrar la lista completa de trabajadores por DNI
  const filteredWorkers = workers.filter(worker =>
    worker.dni.startsWith(searchDni)
  );

  // Formatear la fecha seleccionada para mostrar en la tabla
  const formattedSelectedDate = () => {
    const [year, month, day] = selectedDate.split('-');
    return `${day}/${month}/${year}`;
  };

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
      {!loading && filteredWorkers.length === 0 && <p className="no-data-message">No se encontraron trabajadores con los filtros aplicados.</p>}

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>DNI</th>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Break Inicio</th>
              <th>Break Fin</th>
              <th>Salida</th>
              <th>Total de Horas</th>
              <th>Faltas</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map(worker => {
              const workerAttendance = attendanceData[worker.id];
              const isAbsent = !workerAttendance;

              return (
                <tr key={worker.id} className={isAbsent ? 'absent-row' : ''}>
                  <td>{worker.name}</td>
                  <td>{worker.dni}</td>
                  <td>{formattedSelectedDate()}</td>
                  <td>{isAbsent ? '---' : getRecordTime(workerAttendance.records, 'entry')}</td>
                  <td>{isAbsent ? '---' : getRecordTime(workerAttendance.records, 'break')}</td>
                  <td>{isAbsent ? '---' : getBreakEndTime(workerAttendance.records)}</td>
                  <td>{isAbsent ? '---' : getRecordTime(workerAttendance.records, 'exit')}</td>
                  <td>{isAbsent ? '---' : calculateTotalHours(workerAttendance.records)}</td>
                  <td className={`absences-count ${isAbsent ? 'absent' : 'present'}`}>
                    {isAbsent ? 1 : 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceView;