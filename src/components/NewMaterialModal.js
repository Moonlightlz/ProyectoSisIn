import React, { useState, useEffect } from 'react';
import { FaBoxes, FaSave, FaTimes } from 'react-icons/fa';
import './NewMaterialModal.css';

const NewMaterialModal = ({ isOpen, onClose, onSave, editingMaterial }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unit, setUnit] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingMaterial) {
        // Modo Edición: Llenar el formulario con los datos existentes
        setName(editingMaterial.name || '');
        setCategory(editingMaterial.category || '');
        setSupplier(editingMaterial.supplier || '');
        setUnit(editingMaterial.unit || '');
        setLowStockThreshold(editingMaterial.lowStockThreshold?.toString() || '');
        setCost(editingMaterial.cost?.toString() || '');
        setError('');
      } else {
        // Modo Creación: Resetear el formulario
        setName('');
        setCategory('');
        setSupplier('');
        setUnit('');
        setLowStockThreshold('');
        setCost('');
        setError('');
      }
    }
  }, [isOpen, editingMaterial]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (!name || !category || !unit || !lowStockThreshold) {
      setError('Los campos Nombre, Categoría, Unidad y Umbral de Stock son obligatorios.');
      return;
    }
    setError('');
    onSave({
      ...editingMaterial, // Incluye el ID si estamos editando
      name,
      category,
      supplier,
      unit,
      lowStockThreshold: parseFloat(lowStockThreshold) || 0,
      cost: parseFloat(cost) || 0,
    });
  };

  const isEditing = !!editingMaterial;
  const modalTitle = isEditing ? 'Editar Ficha Técnica' : 'Nuevo Material';
  const saveButtonText = isEditing ? 'Guardar Cambios' : 'Guardar Material';

  return (
    <div className="modal-overlay">
      <div className="modal-content new-material-modal">
        <div className="modal-header">
          <h3 className="modal-title"><FaBoxes /> {modalTitle}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {error && <p className="error-message">{error}</p>}
          <div className="form-grid-modal">
            <div className="form-group-modal full-width">
              <label htmlFor="name">Nombre del Material</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cuero Genuino (Plancha)" />
            </div>
            <div className="form-group-modal">
              <label htmlFor="category">Categoría</label>
              <input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Cueros" />
            </div>
            <div className="form-group-modal">
              <label htmlFor="supplier">Proveedor (Opcional)</label>
              <input id="supplier" type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ej: Curtidos del Norte" />
            </div>
            <div className="form-group-modal">
              <label htmlFor="unit">Unidad de Medida</label>
              <input id="unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: planchas, pares, conos" />
            </div>
            <div className="form-group-modal">
              <label htmlFor="lowStockThreshold">Umbral Stock Bajo</label>
              <input id="lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="Ej: 20" />
            </div>
            <div className="form-group-modal">
              <label htmlFor="cost">Costo Unitario (S/) (Opcional)</label>
              <input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Ej: 85.50" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            <FaTimes /> Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={!name || !category || !unit || !lowStockThreshold}>
            <FaSave /> {saveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMaterialModal;