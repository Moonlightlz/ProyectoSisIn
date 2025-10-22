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
  const { modalState, hideModal, showConfirm, showError } = useModal();
  const [deleteReason, setDeleteReason] = useState('');
  const [editReason, setEditReason] = useState(''); // Estado para el motivo de la edición

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

  // Convertir los datos de asistencia agrupados en un array y filtrarlos por DNI
  const displayedAttendance = Object.entries(attendanceData)
    .map(([workerId, data]) => ({
      workerId,
      ...data,
    }))
    .filter(item => item.dni.startsWith(searchDni));
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
      setSelectedWorkers(displayedAttendance.map(item => item.workerId));
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

    // Reiniciar el motivo al abrir el modal
    setEditReason('');

    const messageContent = (
      <div>
        <p>¿Estás seguro de realizar esta modificación en los registros de asistencia?</p>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label htmlFor="editReason">Motivo de la modificación (obligatorio):</label>
          <input
            id="editReason"
            type="text"
            className="form-control"
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="Ej: Corrección de hora de salida, olvido de marcación..."
            autoFocus
          />
        </div>
      </div>
    );

    showConfirm(
      'Confirmar Modificación',
      messageContent,
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
                // Pasamos el motivo al servicio (aunque actualmente solo lo loguea)
                updates.push(attendanceService.updateAttendanceRecord(record.id, newDate, editReason));
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
        type: 'primary',
        isConfirmDisabled: !editReason.trim() // Deshabilitar si no hay motivo
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

  const handleEditClick = () => {
    if (selectedWorkers.length === 0) {
      showError('Ningún trabajador seleccionado', 'Por favor, selecciona un trabajador de la tabla para editar.');
      return;
    }

    if (selectedWorkers.length > 1) {
      showError('Demasiados trabajadores seleccionados', 'Solo puedes editar un trabajador a la vez.');
      return;
    }

    // Si hay exactamente un trabajador seleccionado, activa el modo de edición para él.
    handleDoubleClick(selectedWorkers[0]);
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
          <button className="btn btn-secondary" onClick={handleEditClick}>
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
      {!loading && displayedAttendance.length === 0 && <p className="no-data-message">No hay registros de asistencia para la fecha y filtros seleccionados.</p>}

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}                  checked={displayedAttendance.length > 0 && selectedWorkers.length === displayedAttendance.length}
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayedAttendance.map((attendanceItem) => {
              return (
                <tr
                  key={attendanceItem.workerId}
                  className={`${editingRowId === attendanceItem.workerId ? 'editing-row' : ''}`}
                  onDoubleClick={() => handleDoubleClick(attendanceItem.workerId)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(attendanceItem.workerId)}
                      onChange={() => handleSelectWorker(attendanceItem.workerId)}
                    />
                  </td>
                  <td>{attendanceItem.workerName}</td>
                  <td>{attendanceItem.dni}</td>
                  <td>{formattedSelectedDate()}</td>
                  <td>
                    {editingRowId === attendanceItem.workerId
                      ? renderEditableCell(editFormData.entry, 'entry')
                      : getRecordTime(attendanceItem.records, 'entry')}
                  </td>
                  <td>
                    {editingRowId === attendanceItem.workerId
                      ? renderEditableCell(editFormData.break, 'break')
                      : getRecordTime(attendanceItem.records, 'break')}
                  </td>
                  <td>{getBreakEndTime(attendanceItem.records)}</td>
                  <td>
                    {editingRowId === attendanceItem.workerId
                      ? renderEditableCell(editFormData.exit, 'exit')
                      : getRecordTime(attendanceItem.records, 'exit')}
                  </td>
                  <td>{calculateTotalHours(attendanceItem.records)}</td>
                  <td className="actions-cell">
                    {editingRowId === attendanceItem.workerId && (
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