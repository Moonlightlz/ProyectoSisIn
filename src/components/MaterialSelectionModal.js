import React, { useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import './MaterialSelectionModal.css';

const MaterialSelectionModal = ({ isOpen, onClose, onSelect, materials }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) {
    return null;
  }

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (material) => {
    onSelect(material);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content material-selection-modal">
        <div className="modal-header">
          <h3 className="modal-title"><FaSearch /> Seleccionar Material</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="material-search-bar">
            <input
              type="text"
              placeholder="Buscar material por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="material-selection-list">
            {filteredMaterials.map(material => (
              <li key={material.id} onClick={() => handleSelect(material)}>
                {material.name}
                <span className="material-list-category">{material.category}</span>
              </li>
            ))}
            {filteredMaterials.length === 0 && <li className="no-results">No se encontraron materiales.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MaterialSelectionModal;