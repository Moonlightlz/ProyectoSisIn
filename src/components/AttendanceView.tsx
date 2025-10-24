import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/workerService';
import { Worker } from '../types/payroll';
import { FaArrowLeft, FaEdit, FaHistory, FaTrash, FaSave, FaTimes, FaUserClock, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import './AttendanceModal.css';
import Modal from './Modal'; // Importar el componente Modal
import { useModal } from '../hooks/useModal'; // Importar el hook para modales
import AttendanceHistoryView from './AttendanceHistoryView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx'; // Para exportar a Excel con formato
import { useAuth } from '../contexts/AuthContext';

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
  const { currentUser } = useAuth();
  const [attendanceData, setAttendanceData] = useState<GroupedAttendance>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchDni, setSearchDni] = useState(''); // Estado para el filtro por DNI

  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const { modalState, hideModal, showConfirm, showError, showSuccess } = useModal();
  const [deleteReasonError, setDeleteReasonError] = useState<string | null>(null);
  const [editReasonError, setEditReasonError] = useState<string | null>(null);

  // Estados para la edición en línea
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ entry: string; break: string; exit: string }>({
    entry: '', break: '', exit: ''
  });
  
  // Estado para controlar la vista actual (asistencia o historial)
  const [currentSubView, setCurrentSubView] = useState<'attendance' | 'history'>('attendance');

  const fetchAttendance = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      // Usar new Date(`${date}T00:00:00`) para evitar problemas de zona horaria
      const records = await attendanceService.getAttendanceForDay(new Date(`${date}T00:00:00`));

      // Agrupar registros por trabajador (presentes) y garantizar incluir TODOS los trabajadores activos (ausentes también)
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

      // Asegurar que todos los trabajadores activos aparezcan, aunque no tengan registros (marcarán ausencia)
      for (const w of workers) {
        if (!grouped[w.id]) {
          grouped[w.id] = {
            workerName: w.name,
            dni: w.dni,
            records: [], // sin registros -> ausente
          };
        }
      }

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

    // Limpiar el error anterior al abrir el modal
    setDeleteReasonError(null);

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
            onChange={() => {
              if (deleteReasonError) setDeleteReasonError(null); // Limpiar error al escribir
            }}
            placeholder="Ej: Registro duplicado, error de marcación..."
            autoFocus
          />
          {deleteReasonError && (
            <div style={{ color: 'red', marginTop: '5px', fontSize: '12px' }}>{deleteReasonError}</div>
          )}
        </div>
      </div>
    );

    showConfirm(
      'Confirmar Eliminación',
      messageContent,
      async () => {
        setLoading(true);
        // Obtener el motivo directamente del input en el DOM para evitar stale state
        const reasonInput = document.getElementById('deleteReason') as HTMLInputElement;
        const reason = reasonInput ? reasonInput.value : '';

        if (!reason.trim()) {
          setDeleteReasonError('Completar este campo');
          setLoading(false);
          return false; // No cerrar el modal
        }

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
          
          await attendanceService.deleteAttendanceRecords(recordIdsToDelete, reason, currentUser?.email || 'unknown');
          await fetchAttendance(selectedDate); // Recargar datos
          setSelectedWorkers([]); // Limpiar selección
          setLoading(false);
          return true; // Cerrar el modal
        } catch (err) {
          setError('Error al eliminar los registros.');
          console.error(err);
          setLoading(false);
          return false; // No cerrar el modal en caso de error
        }
      },
      {
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
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

    // Limpiar el error anterior al abrir el modal
    setEditReasonError(null);

    const messageContent = (
      <div>
        <p>¿Estás seguro de realizar esta modificación en los registros de asistencia?</p>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label htmlFor="editReason">Motivo de la modificación (obligatorio):</label>
          <input
            id="editReason"
            type="text"
            className="form-control"
            onChange={() => {
              if (editReasonError) setEditReasonError(null); // Limpiar error al escribir
            }}
            placeholder="Ej: Corrección de hora de salida, olvido de marcación..."
            autoFocus
          />
          {editReasonError && (
            <div style={{ color: 'red', marginTop: '5px', fontSize: '12px' }}>{editReasonError}</div>
          )}
        </div>
      </div>
    );

    showConfirm(
      'Confirmar Modificación',
      messageContent,
      async () => {
        setLoading(true);
        // Obtener el motivo directamente del input en el DOM para evitar stale state
        const reasonInput = document.getElementById('editReason') as HTMLInputElement;
        const reason = reasonInput ? reasonInput.value : '';

        if (!reason.trim()) {
          setEditReasonError('Por favor, completa este campo para continuar.');
          setLoading(false);
          // Devolvemos `false` para indicar al hook useModal que NO cierre el modal.
          return false; 
        }
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
                // Pasamos el motivo y el usuario al servicio
                updates.push(attendanceService.updateAttendanceRecord(record.id, newDate, reason, currentUser?.email || 'unknown'));
              }
            }
          }

          await Promise.all(updates);
          await fetchAttendance(selectedDate); // Recargar datos
          handleCancelEdit(); // Salir del modo edición
          setLoading(false);
          return true; // Indicar que la operación fue exitosa y el modal puede cerrarse
        } catch (err) {
          setError('Error al guardar las modificaciones.');
          console.error(err);
          setLoading(false);
          return false; // Indicar que hubo un error y el modal no debe cerrarse
        }
      },
      {
        confirmText: 'Sí, guardar',
        cancelText: 'Cancelar',
        type: 'primary',
        // La validación ahora se hace dentro del callback onConfirm,
        // por lo que no podemos deshabilitar el botón de antemano de forma sencilla.
        // Se podría implementar un estado local en el componente Modal si fuera crítico,
        // pero el chequeo al confirmar es suficiente y más simple.
        // isConfirmDisabled: !editReason.trim() // Ya no se puede usar
        // Para mantener la funcionalidad, podríamos hacer esto, pero es más complejo:
        // 1. Pasar un `onInputChange` al modal.
        // 2. El modal llama a esa función y actualiza un estado en `AttendanceView`.
        // 3. Usar ese estado para `isConfirmDisabled`.
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

  const handleExportToExcel = () => {
    setLoading(true);
    try {
      if (displayedAttendance.length === 0) {
        showError('Sin datos', 'No hay datos para exportar en la vista actual.');
        setLoading(false);
        return;
      }

      // 1. Crear el libro de trabajo y la hoja
      const wb = XLSX.utils.book_new();
      const ws_name = "Asistencia";

      // 2. Definir los datos y encabezados
      const headers = ['Empleado', 'DNI', 'Fecha', 'Entrada', 'Break Inicio', 'Break Fin', 'Salida', 'Total de Horas'];
      const data = displayedAttendance.map(item => [
        item.workerName,
        item.dni,
        formattedSelectedDate(),
        getRecordTime(item.records, 'entry'),
        getRecordTime(item.records, 'break'),
        getBreakEndTime(item.records),
        getRecordTime(item.records, 'exit'),
        calculateTotalHours(item.records),
      ]);

      // 3. Crear la hoja de cálculo con el título y los datos
      const ws_data = [
        ["Registros de Asistencia"], // Título
        [], // Fila vacía
        headers,
        ...data
      ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);

      // 4. Aplicar estilos y combinar celdas
      // Combinar celdas para el título
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

      // Estilo para el título (celda A1)
      ws['A1'].s = {
        font: { name: 'Calibri', sz: 18, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      // Estilo para los encabezados (fila 3)
      headers.forEach((_, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: colIndex });
        ws[cellAddress].s = {
          font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "000000" } },
        };
      });

      // Ajustar ancho de columnas
      ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];

      // 5. Añadir la hoja al libro y descargar
      XLSX.utils.book_append_sheet(wb, ws, ws_name);
      XLSX.writeFile(wb, `asistencia_${selectedDate}.xlsx`);

      showSuccess('Exportado', 'El archivo de asistencia se ha descargado como CSV.');
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      showError('Error de Exportación', 'No se pudo generar el archivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToPdf = () => {
    setLoading(true);
    try {
      if (displayedAttendance.length === 0) {
        showError('Sin datos', 'No hay datos para exportar en la vista actual.');
        setLoading(false);
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // 1. Título y subtítulos
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte de Asistencia', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const generationDate = new Date().toLocaleString('es-PE');
      doc.text(`Fecha del Reporte: ${formattedSelectedDate()}`, pageWidth / 2, 22, { align: 'center' });
      doc.text(`Generado el: ${generationDate}`, pageWidth / 2, 27, { align: 'center' });

      // 2. Datos para la tabla
      const tableData = displayedAttendance.map(item => [
        item.workerName,
        item.dni,
        getRecordTime(item.records, 'entry'),
        getRecordTime(item.records, 'exit'),
        calculateTotalHours(item.records),
      ]);

      // 3. Generar la tabla
      autoTable(doc, {
        startY: 35,
        head: [['Empleado', 'DNI', 'Entrada', 'Salida', 'Total Horas']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [22, 160, 133], // Un color verde azulado
          textColor: 255,
          fontStyle: 'bold',
        },
        didDrawPage: (data) => { // Usamos el parámetro 'data' que nos provee la librería
          // 4. Totales al final de la tabla
          const totalPresentes = displayedAttendance.length;
          const totalEmpleados = workers.length;
          const totalAusentes = totalEmpleados - totalPresentes;

          // Usamos el final de la tabla, o un valor por defecto si no está definido.
          // El operador '??' (Nullish Coalescing) asegura que finalY sea un número.
          const finalY = data.table.finalY ?? 60; 
          doc.setFontSize(10);
          doc.text(`Total de Empleados: ${totalEmpleados}`, 14, finalY + 10);
          doc.text(`Presentes: ${totalPresentes}`, 14, finalY + 15);
          doc.text(`Ausentes: ${totalAusentes}`, 14, finalY + 20);
        }
      });

      doc.save(`asistencia_${selectedDate}.pdf`);
      showSuccess('Exportado', 'El archivo de asistencia se ha descargado como PDF.');
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      showError('Error de Exportación', 'No se pudo generar el archivo PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Si la vista es 'history', renderizamos el componente de historial
  if (currentSubView === 'history') {
    return (
      <AttendanceHistoryView
        onBack={() => setCurrentSubView('attendance')}
        workers={workers}
      />
    );
  }
  return (
    <div className="attendance-view">
      <div className="header">
        <div className="header-title">
          <button className="btn btn-back" onClick={onBack}>
            <FaArrowLeft /> Volver a Trabajadores
          </button>
          <h1><FaUserClock /> Registros de Asistencia</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleEditClick}>
            <FaEdit /> Editar
          </button>
          <button className="btn btn-secondary" onClick={() => setCurrentSubView('history')}>
            <FaHistory /> Historial
          </button>
          <button
            className="btn btn-danger"
            onClick={handleExportToPdf}
            disabled={loading}
          >
            <FaFilePdf /> Exportar PDF
          </button>
          <button
            className="btn btn-success"
            onClick={handleExportToExcel}
            disabled={loading}
          >
            <FaFileExcel /> Exportar Excel
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