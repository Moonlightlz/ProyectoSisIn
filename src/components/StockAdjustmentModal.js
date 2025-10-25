import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaSlidersH } from 'react-icons/fa';
import './StockAdjustmentModal.css';

const StockAdjustmentModal = ({ isOpen, onClose, onSave, material }) => {
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewStock(material?.stock.toString() || '');
      setReason('');
      setError('');
    }
  }, [isOpen, material]);

  if (!isOpen || !material) {
    return null;
  }

  const handleSave = () => {
    const newStockValue = parseFloat(newStock);
    if (isNaN(newStockValue) || newStockValue < 0) {
      setError('La nueva cantidad de stock debe ser un número válido y no negativo.');
      return;
    }
    if (!reason.trim()) {
      setError('El motivo del ajuste es obligatorio.');
      return;
    }
    setError('');
    onSave({
      materialId: material.id,
      newStock: newStockValue,
      reason: reason.trim(),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content stock-adjustment-modal">
        <div className="modal-header">
          <h3 className="modal-title"><FaSlidersH /> Ajustar Stock</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {error && <p className="error-message">{error}</p>}
          <h4>{material.name}</h4>
          <p className="current-stock-info">Stock Actual: <strong>{material.stock} {material.unit}</strong></p>
          
          <div className="form-group-modal">
            <label htmlFor="newStock">Nueva Cantidad de Stock</label>
            <input id="newStock" type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="Ej: 150" autoFocus />
          </div>
          <div className="form-group-modal">
            <label htmlFor="reason">Motivo del Ajuste (Obligatorio)</label>
            <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Conteo físico, merma, corrección de error..." />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            <FaTimes /> Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <FaSave /> Guardar Ajuste
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;