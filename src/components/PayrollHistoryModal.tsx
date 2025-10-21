import React, { useState, useEffect } from 'react';
import { Worker } from '../types/payroll';
import { PayrollRecord, getWorkerPayrollHistory, updatePaymentStatus } from '../services/payrollRecordService';
import { formatCurrency, formatHours } from '../utils/payrollCalculations';
import './PayrollHistoryModal.css';

interface PayrollHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}

const PayrollHistoryModal: React.FC<PayrollHistoryModalProps> = ({
  isOpen,
  onClose,
  worker
}) => {
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && worker) {
      loadPayrollHistory();
    }
  }, [isOpen, worker]);

  const loadPayrollHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getWorkerPayrollHistory(worker.id);
      setPayrollHistory(history);
    } catch (err) {
      console.error('Error loading payroll history:', err);
      setError('Error al cargar el historial de pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (
    recordId: string, 
    newStatus: PayrollRecord['paymentStatus'],
    paymentInfo?: {
      paymentMethod?: PayrollRecord['paymentMethod'];
      paymentReference?: string;
      notes?: string;
    }
  ) => {
    try {
      await updatePaymentStatus(recordId, newStatus, paymentInfo);
      await loadPayrollHistory(); // Recargar la lista
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError('Error al actualizar el estado de pago');
    }
  };

  const getStatusColor = (status: PayrollRecord['paymentStatus']) => {
    switch (status) {
      case 'paid': return '#28a745';
      case 'pending': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: PayrollRecord['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const showRecordDetails = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payroll-history-modal">
        <div className="modal-header">
          <h2>Historial de Pagos - {worker.name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Cargando historial...</div>}
          {error && <div className="error-message">{error}</div>}

          {!loading && !error && (
            <div className="history-content">
              <div className="history-summary">
                <div className="summary-item">
                  <span>Total de registros:</span>
                  <span>{payrollHistory.length}</span>
                </div>
                <div className="summary-item">
                  <span>Pagos realizados:</span>
                  <span>{payrollHistory.filter(r => r.paymentStatus === 'paid').length}</span>
                </div>
                <div className="summary-item">
                  <span>Total pagado:</span>
                  <span>{formatCurrency(
                    payrollHistory
                      .filter(r => r.paymentStatus === 'paid')
                      .reduce((sum, r) => sum + r.netPay, 0)
                  )}</span>
                </div>
              </div>

              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Días</th>
                      <th>Horas</th>
                      <th>Bruto</th>
                      <th>Descuentos</th>
                      <th>Neto</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollHistory.map((record) => (
                      <tr key={record.id} className={`status-${record.paymentStatus}`}>
                        <td>
                          <div className="period-info">
                            <div>{record.period.startDate.toLocaleDateString()}</div>
                            <div className="period-subtitle">
                              {record.period.endDate.toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td>{record.workedDays}</td>
                        <td>{formatHours(record.workedHours)}</td>
                        <td className="amount">{formatCurrency(record.grossPay)}</td>
                        <td className="negative">{formatCurrency(record.totalDiscounts)}</td>
                        <td className="amount net-pay">{formatCurrency(record.netPay)}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(record.paymentStatus) }}
                          >
                            {getStatusText(record.paymentStatus)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => showRecordDetails(record)}
                              title="Ver detalles"
                            >
                              👁️
                            </button>
                            {record.paymentStatus === 'pending' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleUpdatePaymentStatus(record.id, 'paid')}
                                title="Marcar como pagado"
                              >
                                ✅
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payrollHistory.length === 0 && !loading && (
                <div className="no-records">
                  <p>No hay registros de pagos para este trabajador.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de detalles del registro */}
      {showDetails && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content record-details-modal">
            <div className="modal-header">
              <h3>Detalle del Pago</h3>
              <button className="modal-close" onClick={() => setShowDetails(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h4>Información del Período</h4>
                  <div className="detail-item">
                    <span>Tipo:</span>
                    <span>{selectedRecord.period.type === 'monthly' ? 'Mensual' : 'Semanal'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Desde:</span>
                    <span>{selectedRecord.period.startDate.toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span>Hasta:</span>
                    <span>{selectedRecord.period.endDate.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Tiempo Trabajado</h4>
                  <div className="detail-item">
                    <span>Días programados:</span>
                    <span>{selectedRecord.scheduledDays}</span>
                  </div>
                  <div className="detail-item">
                    <span>Días trabajados:</span>
                    <span>{selectedRecord.workedDays}</span>
                  </div>
                  <div className="detail-item">
                    <span>Horas trabajadas:</span>
                    <span>{formatHours(selectedRecord.workedHours)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Horas extras:</span>
                    <span>{formatHours(selectedRecord.overtimeHours)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Ingresos</h4>
                  <div className="detail-item">
                    <span>Pago regular:</span>
                    <span>{formatCurrency(selectedRecord.regularPay)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Pago por horas extras:</span>
                    <span>{formatCurrency(selectedRecord.overtimePay)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Bonos:</span>
                    <span>{formatCurrency(selectedRecord.bonuses)}</span>
                  </div>
                  <div className="detail-item strong">
                    <span>Pago bruto:</span>
                    <span>{formatCurrency(selectedRecord.grossPay)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Descuentos</h4>
                  <div className="detail-item">
                    <span>Invalidez:</span>
                    <span>{formatCurrency(selectedRecord.invalidInsurance)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Fondo de pensión:</span>
                    <span>{formatCurrency(selectedRecord.pensionFund)}</span>
                  </div>
                  <div className="detail-item">
                    <span>EsSalud:</span>
                    <span>{formatCurrency(selectedRecord.essaludDeduction)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Tardanzas:</span>
                    <span>{formatCurrency(selectedRecord.lateDiscounts)}</span>
                  </div>
                  <div className="detail-item strong negative">
                    <span>Total descuentos:</span>
                    <span>{formatCurrency(selectedRecord.totalDiscounts)}</span>
                  </div>
                </div>

                <div className="detail-section highlight">
                  <h4>Resultado Final</h4>
                  <div className="detail-item large">
                    <span>Neto a pagar:</span>
                    <span className="amount">{formatCurrency(selectedRecord.netPay)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Estado:</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedRecord.paymentStatus) }}
                    >
                      {getStatusText(selectedRecord.paymentStatus)}
                    </span>
                  </div>
                  {selectedRecord.paymentDate && (
                    <div className="detail-item">
                      <span>Fecha de pago:</span>
                      <span>{selectedRecord.paymentDate.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {selectedRecord.hasManualAdjustments && (
                  <div className="detail-section warning">
                    <h4>⚙️ Ajustes Manuales</h4>
                    {selectedRecord.manualAdjustments && (
                      <>
                        <div className="detail-item">
                          <span>Bonos adicionales:</span>
                          <span>{formatCurrency(selectedRecord.manualAdjustments.bonuses)}</span>
                        </div>
                        <div className="detail-item">
                          <span>Descuentos adicionales:</span>
                          <span>{formatCurrency(selectedRecord.manualAdjustments.deductions)}</span>
                        </div>
                        {selectedRecord.manualAdjustments.notes && (
                          <div className="detail-item">
                            <span>Notas:</span>
                            <span>{selectedRecord.manualAdjustments.notes}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetails(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollHistoryModal;