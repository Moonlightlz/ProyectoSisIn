import React, { useState, useEffect } from 'react';
import { Worker, PayrollAdjustmentRecord, PayrollCalculation } from '../types/payroll';
import WorkerPayrollService from '../services/workerPayrollService';
import { useAuth } from '../contexts/AuthContext';
import './PayrollAdjustmentModal.css';

interface PayrollAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  baseCalculation: PayrollCalculation;
  onAdjustmentSaved: (adjustment: PayrollAdjustmentRecord | null) => void;
}

const PayrollAdjustmentModal: React.FC<PayrollAdjustmentModalProps> = ({
  isOpen,
  onClose,
  worker,
  baseCalculation,
  onAdjustmentSaved
}) => {
  const { currentUser } = useAuth();
  const [existingAdjustment, setExistingAdjustment] = useState<PayrollAdjustmentRecord | null>(null);
  const [formData, setFormData] = useState({
    manualBonuses: 0,
    manualDeductions: 0,
    customHours: baseCalculation.workedHours,
    customDays: baseCalculation.workedDays,
    overrideInvalidInsurance: baseCalculation.invalidInsurance,
    overridePensionFund: baseCalculation.pensionFund,
    overrideEssaludDeduction: baseCalculation.essaludDeduction,
    adjustmentNotes: '',
    adjustmentReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && worker) {
      loadExistingAdjustment();
    }
  }, [isOpen, worker, baseCalculation.period]);

  const loadExistingAdjustment = async () => {
    try {
      setLoading(true);
      const adjustments = await WorkerPayrollService.getWorkerPayrollAdjustmentsByPeriod(
        worker.id,
        baseCalculation.period.startDate,
        baseCalculation.period.endDate
      );
      
      if (adjustments.length > 0) {
        const adjustment = adjustments[0];
        setExistingAdjustment(adjustment);
        setFormData({
          manualBonuses: adjustment.manualBonuses || 0,
          manualDeductions: adjustment.manualDeductions || 0,
          customHours: adjustment.customHours || baseCalculation.workedHours,
          customDays: adjustment.customDays || baseCalculation.workedDays,
          overrideInvalidInsurance: adjustment.overrideInvalidInsurance || baseCalculation.invalidInsurance,
          overridePensionFund: adjustment.overridePensionFund || baseCalculation.pensionFund,
          overrideEssaludDeduction: adjustment.overrideEssaludDeduction || baseCalculation.essaludDeduction,
          adjustmentNotes: adjustment.adjustmentNotes || '',
          adjustmentReason: adjustment.adjustmentReason || ''
        });
      } else {
        setExistingAdjustment(null);
        setFormData({
          manualBonuses: 0,
          manualDeductions: 0,
          customHours: baseCalculation.workedHours,
          customDays: baseCalculation.workedDays,
          overrideInvalidInsurance: baseCalculation.invalidInsurance,
          overridePensionFund: baseCalculation.pensionFund,
          overrideEssaludDeduction: baseCalculation.essaludDeduction,
          adjustmentNotes: '',
          adjustmentReason: ''
        });
      }
    } catch (err) {
      console.error('Error loading existing adjustment:', err);
      setError('Error al cargar ajustes existentes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      setError('Usuario no autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const adjustmentData = {
        period: baseCalculation.period,
        ...(formData.manualBonuses && { manualBonuses: formData.manualBonuses }),
        ...(formData.manualDeductions && { manualDeductions: formData.manualDeductions }),
        ...(formData.customHours !== baseCalculation.workedHours && { customHours: formData.customHours }),
        ...(formData.customDays !== baseCalculation.workedDays && { customDays: formData.customDays }),
        ...(formData.overrideInvalidInsurance !== baseCalculation.invalidInsurance && { overrideInvalidInsurance: formData.overrideInvalidInsurance }),
        ...(formData.overridePensionFund !== baseCalculation.pensionFund && { overridePensionFund: formData.overridePensionFund }),
        ...(formData.overrideEssaludDeduction !== baseCalculation.essaludDeduction && { overrideEssaludDeduction: formData.overrideEssaludDeduction }),
        ...(formData.adjustmentNotes && { adjustmentNotes: formData.adjustmentNotes }),
        ...(formData.adjustmentReason && { adjustmentReason: formData.adjustmentReason }),
        createdBy: currentUser.email || currentUser.uid
      };

      let savedAdjustment: PayrollAdjustmentRecord;

      if (existingAdjustment) {
        await WorkerPayrollService.updatePayrollAdjustment(worker.id, existingAdjustment.id, adjustmentData);
        savedAdjustment = { ...existingAdjustment, ...adjustmentData, updatedAt: new Date() };
      } else {
        const adjustmentId = await WorkerPayrollService.addPayrollAdjustment(worker.id, adjustmentData);
        savedAdjustment = { 
          id: adjustmentId, 
          ...adjustmentData, 
          createdAt: new Date() 
        };
      }

      onAdjustmentSaved(savedAdjustment);
      onClose();
    } catch (err) {
      console.error('Error saving adjustment:', err);
      setError('Error al guardar los ajustes');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      manualBonuses: 0,
      manualDeductions: 0,
      customHours: baseCalculation.workedHours,
      customDays: baseCalculation.workedDays,
      overrideInvalidInsurance: baseCalculation.invalidInsurance,
      overridePensionFund: baseCalculation.pensionFund,
      overrideEssaludDeduction: baseCalculation.essaludDeduction,
      adjustmentNotes: '',
      adjustmentReason: ''
    });
    onAdjustmentSaved(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payroll-adjustment-modal">
        <div className="modal-header">
          <h2>Ajustar Planilla - {worker.name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Cargando...</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="adjustment-section">
            <h3>Información Base</h3>
            <div className="base-info">
              <div className="info-item">
                <span>Período:</span>
                <span>{baseCalculation.period.startDate.toLocaleDateString()} - {baseCalculation.period.endDate.toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span>Días trabajados (base):</span>
                <span>{baseCalculation.workedDays}</span>
              </div>
              <div className="info-item">
                <span>Horas trabajadas (base):</span>
                <span>{baseCalculation.workedHours}</span>
              </div>
              <div className="info-item">
                <span>Neto base:</span>
                <span>S/ {baseCalculation.netPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="adjustment-section">
            <h3>Ajustes de Tiempo</h3>
            <div className="form-note">
              <p><strong>Nota:</strong> Las horas se calculan automáticamente como días × 8 horas. Si especifica ambos valores, las horas tendrán prioridad.</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Días Trabajados (Personalizado)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="1"
                  value={formData.customDays}
                  onChange={(e) => handleInputChange('customDays', Number(e.target.value))}
                />
                <small className="field-help">
                  {formData.customDays > 0 && `Equivale a ${formData.customDays * 8} horas`}
                </small>
              </div>
              <div className="form-group">
                <label>Horas Trabajadas (Personalizado)</label>
                <input
                  type="number"
                  min="0"
                  max="720"
                  step="0.5"
                  value={formData.customHours}
                  onChange={(e) => handleInputChange('customHours', Number(e.target.value))}
                />
                <small className="field-help">
                  {formData.customHours > 0 && `Equivale a ${(formData.customHours / 8).toFixed(1)} días`}
                </small>
              </div>
            </div>
          </div>

          <div className="adjustment-section">
            <h3>Bonos y Descuentos Adicionales</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Bonos Adicionales (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.manualBonuses}
                  onChange={(e) => handleInputChange('manualBonuses', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Descuentos Adicionales (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.manualDeductions}
                  onChange={(e) => handleInputChange('manualDeductions', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="adjustment-section">
            <h3>Descuentos Personalizados</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Invalidez (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.overrideInvalidInsurance}
                  onChange={(e) => handleInputChange('overrideInvalidInsurance', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Fondo de Pensión (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.overridePensionFund}
                  onChange={(e) => handleInputChange('overridePensionFund', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>EsSalud (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.overrideEssaludDeduction}
                  onChange={(e) => handleInputChange('overrideEssaludDeduction', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="adjustment-section">
            <h3>Notas y Justificación</h3>
            <div className="form-group">
              <label>Razón del Ajuste</label>
              <select
                value={formData.adjustmentReason}
                onChange={(e) => handleInputChange('adjustmentReason', e.target.value)}
              >
                <option value="">Seleccionar razón...</option>
                <option value="error_calculation">Error en cálculo automático</option>
                <option value="special_bonus">Bono especial</option>
                <option value="disciplinary_action">Acción disciplinaria</option>
                <option value="partial_month">Mes parcial</option>
                <option value="overtime_adjustment">Ajuste de horas extras</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notas Adicionales</label>
              <textarea
                rows={3}
                value={formData.adjustmentNotes}
                onChange={(e) => handleInputChange('adjustmentNotes', e.target.value)}
                placeholder="Describa el motivo del ajuste..."
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleReset}
            disabled={loading}
          >
            Resetear a Base
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (existingAdjustment ? 'Actualizar' : 'Guardar Ajustes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollAdjustmentModal;