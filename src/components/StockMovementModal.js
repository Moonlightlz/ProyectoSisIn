import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import './StockMovementModal.css';

const StockMovementModal = ({ isOpen, onClose, onSave, movementType, materials, selectedMaterialId }) => {
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form and pre-select material if an ID is passed
      setMaterialId(selectedMaterialId || (materials.length > 0 ? materials[0].id : ''));
      setQuantity('');
      setNotes('');
      setError('');
    }
  }, [isOpen, selectedMaterialId, materials]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    const selectedMaterial = materials.find(m => m.id === materialId);

    if (!materialId || !quantity || parseFloat(quantity) <= 0) {
      setError('Por favor, selecciona un material y una cantidad válida mayor a cero.');
      return;
    }

    if (movementType === 'salida' && selectedMaterial && parseFloat(quantity) > selectedMaterial.stock) {
      setError(`No puedes registrar una salida de ${quantity} ${selectedMaterial.unit}. Stock actual: ${selectedMaterial.stock} ${selectedMaterial.unit}.`);
      return;
    }

    setError('');

    onSave({
      materialId,
      quantity: parseFloat(quantity),
      notes,
      type: movementType,
    });
  };

  const title = movementType === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida';
  const icon = movementType === 'entrada' ? <FaPlus /> : <FaMinus />;

  return (
    <div className="modal-overlay">
      <div className="modal-content stock-movement-modal">
        <div className="modal-header">
          <h3 className="modal-title">{icon} {title}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {error && <p className="error-message">{error}</p>}
          <div className="form-group-modal">
            <label htmlFor="materialId">Material</label>
            <select id="materialId" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-modal">
            <label htmlFor="quantity">Cantidad</label>
            <input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ej: 50" />
          </div>
          <div className="form-group-modal">
            <label htmlFor="notes">Notas (Opcional)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Compra a proveedor, devolución, etc." />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            <FaTimes /> Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <FaSave /> Guardar Movimiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockMovementModal;