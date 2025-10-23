import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { attendanceService } from '../services/workerService';
import { Worker } from '../types/payroll';
import './AttendanceHistoryView.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useModal } from '../hooks/useModal';

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
  const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useModal();
  
  // Inicializar fechas al mes actual
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);
  const [searchDni, setSearchDni] = useState(''); // Estado para el filtro por DNI

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
  }, []); // Carga inicial solo una vez

  // Filtrar logs cuando cambie el DNI o los logs cargados
  useEffect(() => {
    if (searchDni.trim() === '') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => getWorkerDni(log.workerId).startsWith(searchDni)));
    }
  }, [searchDni, logs, workers]);

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

  const handleExportToExcel = () => {
    if (logs.length === 0) {
      showError('Sin datos', 'No hay registros para exportar.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws_name = "Historial de Cambios";

    const headers = ['Empleado', 'DNI', 'Fecha y Hora del Cambio', 'Acción', 'Motivo del Cambio', 'Modificado por'];
    const data = logs.map(log => [
      log.workerName,
      getWorkerDni(log.workerId),
      formatTimestamp(log.timestamp),
      log.action === 'delete' ? 'Eliminación' : 'Modificación',
      log.reason,
      log.modifiedBy,
    ]);

    const ws_data = [
      ["Historial de Cambios en Asistencia"],
      [],
      headers,
      ...data
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    ws['A1'].s = {
      font: { name: 'Calibri', sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    headers.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: colIndex });
      ws[cellAddress].s = {
        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "000000" } },
      };
    });

    ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 40 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `historial_asistencia_${startDate}_a_${endDate}.xlsx`);
    showSuccess('Exportado', 'El historial se ha descargado como archivo Excel.');
  };

  const handleExportToPdf = () => {
    if (logs.length === 0) {
      showError('Sin datos', 'No hay registros para exportar.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const tableData = logs.map(log => [
      log.workerName,
      getWorkerDni(log.workerId),
      formatTimestamp(log.timestamp),
      log.action === 'delete' ? 'Eliminación' : 'Modificación',
      log.reason,
      log.modifiedBy,
    ]);

    const head = [['Empleado', 'DNI', 'Fecha y Hora', 'Acción', 'Motivo', 'Modificado por']];

    // Título centrado y en negrita
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial de Cambios en Asistencia', pageWidth / 2, 15, { align: 'center' });

    // Subtítulo (rango de fechas)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periodo: ${startDate} al ${endDate}`, pageWidth / 2, 22, { align: 'center' });

    autoTable(doc, {
      head: head,
      body: tableData,
      startY: 28,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    doc.save(`historial_asistencia_${startDate}_a_${endDate}.pdf`);
    showSuccess('Exportado', 'El historial se ha descargado como archivo PDF.');
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
          {/* Filtro por DNI */}
          <input
            type="text"
            placeholder="Filtrar por DNI..."
            className="search-input"
            value={searchDni}
            onChange={(e) => setSearchDni(e.target.value.replace(/\D/g, ''))}
            maxLength={8}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleExportToPdf}
          >
            <FaFilePdf /> Exportar PDF
          </button>
          <button 
            className="btn btn-success"
            onClick={handleExportToExcel}
          >
            <FaFileExcel /> Exportar Excel
          </button>
        </div>
      </div>

      {loading && <div className="loading">Cargando historial...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && logs.length > 0 && filteredLogs.length === 0 && <p className="no-data-message">No se encontraron registros con el DNI proporcionado.</p>}
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
            {filteredLogs.map(log => (
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