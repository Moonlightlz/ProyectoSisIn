import React from 'react';
import { FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content confirmation-modal">
        <div className="modal-header">
          <h3 className="modal-title"><FaExclamationTriangle /> {title}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            <FaTimes /> Cancelar
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            <FaCheck /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;