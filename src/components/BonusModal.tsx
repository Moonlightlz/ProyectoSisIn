import React, { useState } from 'react';
import { Worker, Bonus } from '../types/payroll';
import { BonusService } from '../services/bonusService';
import { useAuth } from '../contexts/AuthContext';
import './BonusModal.css';

interface BonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  onBonusAdded: (bonus: Bonus) => void;
}

const BONUS_TYPES = [
  { value: 'performance', label: 'Rendimiento' },
  { value: 'extra_hours', label: 'Horas Extra' },
  { value: 'special', label: 'Especial' },
  { value: 'other', label: 'Otro' }
];

const BonusModal: React.FC<BonusModalProps> = ({
  isOpen,
  onClose,
  worker,
  onBonusAdded
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'performance' as const,
    date: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Usuario no autenticado');
      return;
    }

    if (!formData.amount || !formData.description.trim()) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bonusData = {
        workerId: worker.id,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        type: formData.type,
        createdBy: currentUser.email || currentUser.uid
      };

      const bonusId = await BonusService.createBonus(bonusData);
      
      const newBonus: Bonus = {
        id: bonusId,
        ...bonusData,
        createdAt: new Date()
      };

      onBonusAdded(newBonus);
      onClose();
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        type: 'performance',
        date: new Date().toISOString().split('T')[0]
      });
      
    } catch (err) {
      console.error('Error adding bonus:', err);
      setError('Error al agregar el bono');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setFormData({
        amount: '',
        description: '',
        type: 'performance',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content bonus-modal">
        <div className="modal-header">
          <h2>Agregar Bono - {worker.name}</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bonus-form">
          <div className="form-group">
            <label htmlFor="bonusAmount">
              Monto del Bono <span className="required">*</span>
            </label>
            <div className="input-group">
              <span className="input-prefix">S/</span>
              <input
                id="bonusAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bonusType">
              Tipo de Bono <span className="required">*</span>
            </label>
            <select
              id="bonusType"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={loading}
              required
            >
              {BONUS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bonusDescription">
              Descripción <span className="required">*</span>
            </label>
            <textarea
              id="bonusDescription"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe el motivo del bono..."
              disabled={loading}
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bonusDate">
              Fecha <span className="required">*</span>
            </label>
            <input
              id="bonusDate"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Agregando...
                </>
              ) : (
                '💰 Agregar Bono'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BonusModal;