import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/workerService';
import { Worker } from '../types/payroll';
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

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[]; // Pasamos la lista de trabajadores para obtener el DNI
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, workers }) => {
  const [attendanceData, setAttendanceData] = useState<GroupedAttendance>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
    if (isOpen) {
      fetchAttendance(selectedDate);
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

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

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>Registros de Asistencia</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="attendance-date">Seleccionar Fecha:</label>
            <input
              type="date"
              id="attendance-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          {loading && <div className="loading">Cargando asistencias...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && Object.keys(attendanceData).length === 0 && <p>No hay registros de asistencia para la fecha seleccionada.</p>}

          <div className="attendance-list">
            {Object.values(attendanceData).map(workerData => (
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
      </div>
    </div>
  );
};

export default AttendanceModal;