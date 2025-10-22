import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/workerService';
import { Worker } from '../types/payroll';
import { FaArrowLeft, FaEdit, FaHistory, FaFileExport, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import './AttendanceModal.css';
import Modal from './Modal'; // Importar el componente Modal
import { useModal } from '../hooks/useModal'; // Importar el hook para modales

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
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const { modalState, hideModal, showConfirm } = useModal();
  const [deleteReason, setDeleteReason] = useState('');

  // Estados para la edición en línea
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ entry: string; break: string; exit: string }>({
    entry: '', break: '', exit: ''
  });

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

  const handleSelectWorker = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedWorkers(filteredWorkers.map(w => w.id));
    } else {
      setSelectedWorkers([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedWorkers.length === 0) return;

    // Reiniciar el motivo al abrir el modal
    setDeleteReason('');

    const messageContent = (
      <div>
        <p>{`¿Estás seguro que deseas eliminar los registros de asistencia de ${selectedWorkers.length} trabajador(es) para el día ${formattedSelectedDate()}?`}</p>
        <p><strong>Esta acción no se puede deshacer.</strong></p>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label htmlFor="deleteReason">Motivo de la eliminación (obligatorio):</label>
          <input
            id="deleteReason"
            type="text"
            className="form-control"
            // El estado se actualiza directamente en el input del modal
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Ej: Registro duplicado, error de marcación..."
            autoFocus
          />
        </div>
      </div>
    );

    showConfirm(
      'Confirmar Eliminación',
      messageContent,
      async () => {
        setLoading(true);
        try {
          const recordIdsToDelete: string[] = [];
          selectedWorkers.forEach(workerId => {
            const workerAttendance = attendanceData[workerId];
            if (workerAttendance) {
              workerAttendance.records.forEach(record => {
                recordIdsToDelete.push(record.id);
              });
            }
          });
          
          // Pasamos el motivo al servicio
          await attendanceService.deleteAttendanceRecords(recordIdsToDelete, deleteReason);
          await fetchAttendance(selectedDate); // Recargar datos
          setSelectedWorkers([]); // Limpiar selección
        } catch (err) {
          setError('Error al eliminar los registros.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      {
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
        // Deshabilitar el botón de confirmación si no hay motivo
        isConfirmDisabled: !deleteReason.trim()
      }
    );
  };

  const handleDoubleClick = (workerId: string) => {
    if (loading || editingRowId) return; // No permitir edición si ya se está editando o cargando
    const workerAttendance = attendanceData[workerId];
    if (!workerAttendance) return; // No se puede editar un trabajador ausente

    setEditingRowId(workerId);
    setEditFormData({
      entry: getRecordTime(workerAttendance.records, 'entry').replace('---', ''),
      break: getRecordTime(workerAttendance.records, 'break').replace('---', ''),
      exit: getRecordTime(workerAttendance.records, 'exit').replace('---', ''),
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditFormData({ entry: '', break: '', exit: '' });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (!editingRowId) return;

    showConfirm(
      'Confirmar Modificación',
      '¿Estás seguro de realizar esta modificación en los registros de asistencia?',
      async () => {
        setLoading(true);
        try {
          const workerAttendance = attendanceData[editingRowId];
          if (!workerAttendance) throw new Error('No se encontraron datos de asistencia para guardar.');

          const updates: Promise<void>[] = [];
          const recordTypes: ('entry' | 'break' | 'exit')[] = ['entry', 'break', 'exit'];

          for (const type of recordTypes) {
            const record = workerAttendance.records.find(r => r.type === type);
            const newTime = editFormData[type];

            if (record && newTime) {
              const [hours, minutes] = newTime.split(':').map(Number);
              if (!isNaN(hours) && !isNaN(minutes)) {
                const newDate = record.timestamp.toDate();
                newDate.setHours(hours, minutes, 0, 0);
                updates.push(attendanceService.updateAttendanceRecord(record.id, newDate));
              }
            }
          }

          await Promise.all(updates);
          await fetchAttendance(selectedDate); // Recargar datos
          handleCancelEdit(); // Salir del modo edición
        } catch (err) {
          setError('Error al guardar las modificaciones.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      {
        confirmText: 'Sí, guardar',
        cancelText: 'Cancelar',
        type: 'primary'
      }
    );
  };

  const renderEditableCell = (value: string, name: 'entry' | 'break' | 'exit') => (
    <input
      type="time"
      name={name}
      value={value}
      onChange={handleEditFormChange}
      className="editable-cell-input"
    />
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
          <button
            className="btn btn-danger"
            onClick={handleDeleteSelected}
            disabled={selectedWorkers.length === 0 || loading}
          >
            <FaTrash /> Eliminar ({selectedWorkers.length})
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

      {/* Modal de confirmación */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />

      {loading && <div className="loading">Cargando asistencias...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && filteredWorkers.length === 0 && <p className="no-data-message">No se encontraron trabajadores con los filtros aplicados.</p>}

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredWorkers.length > 0 && selectedWorkers.length === filteredWorkers.length}
                />
              </th>
              <th>Empleado</th>
              <th>DNI</th>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Break Inicio</th>
              <th>Break Fin</th>
              <th>Salida</th>
              <th>Total de Horas</th>
              <th>Faltas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map((worker) => {
              const workerAttendance = attendanceData[worker.id];
              const isAbsent = !workerAttendance;

              return (
                <tr
                  key={worker.id}
                  className={`${isAbsent ? 'absent-row' : ''} ${editingRowId === worker.id ? 'editing-row' : ''}`}
                  onDoubleClick={() => handleDoubleClick(worker.id)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={() => handleSelectWorker(worker.id)}
                      disabled={isAbsent}
                    />
                  </td>
                  <td>{worker.name}</td>
                  <td>{worker.dni}</td>
                  <td>{formattedSelectedDate()}</td>
                  <td>
                    {editingRowId === worker.id
                      ? renderEditableCell(editFormData.entry, 'entry')
                      : (isAbsent ? '---' : getRecordTime(workerAttendance.records, 'entry'))}
                  </td>
                  <td>
                    {editingRowId === worker.id
                      ? renderEditableCell(editFormData.break, 'break')
                      : (isAbsent ? '---' : getRecordTime(workerAttendance.records, 'break'))}
                  </td>
                  <td>{isAbsent ? '---' : getBreakEndTime(workerAttendance.records)}</td>
                  <td>
                    {editingRowId === worker.id
                      ? renderEditableCell(editFormData.exit, 'exit')
                      : (isAbsent ? '---' : getRecordTime(workerAttendance.records, 'exit'))}
                  </td>
                  <td>{isAbsent ? '---' : calculateTotalHours(workerAttendance.records)}</td>
                  <td className={`absences-count ${isAbsent ? 'absent' : 'present'}`}>
                    {isAbsent ? 1 : 0}
                  </td>
                  <td className="actions-cell">
                    {editingRowId === worker.id && (
                      <div className="inline-actions">
                        <button className="btn-icon btn-save" onClick={handleSaveEdit} title="Guardar"><FaSave /></button>
                        <button className="btn-icon btn-cancel" onClick={handleCancelEdit} title="Cancelar"><FaTimes /></button>
                      </div>
                    )}
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