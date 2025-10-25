import React from 'react';
import { FaTimes, FaInfoCircle, FaCalendarAlt, FaUser, FaStickyNote, FaHashtag, FaBox } from 'react-icons/fa';
import './MovementDetailModal.css';

const MovementDetailModal = ({ isOpen, onClose, movement }) => {
  if (!isOpen || !movement) {
    return null;
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    // Simulating a full date for display purposes
    return new Date(`${dateString}T10:00:00`).toLocaleDateString('es-PE', options);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content movement-detail-modal">
        <div className="modal-header">
          <h3 className="modal-title"><FaInfoCircle /> Detalle del Movimiento</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <div className="movement-details-grid">
            <div className="detail-item"><FaHashtag /><span><strong>ID Movimiento:</strong> {movement.id}</span></div>
            <div className="detail-item"><FaCalendarAlt /><span><strong>Fecha y Hora:</strong> {formatDate(movement.date)}</span></div>
            <div className="detail-item"><FaBox /><span><strong>Tipo:</strong> <span className={`movement-badge ${movement.type}`}>{movement.type}</span></span></div>
            <div className="detail-item"><FaUser /><span><strong>Responsable:</strong> {movement.user}</span></div>
            <div className="detail-item full-width"><FaStickyNote /><span><strong>Notas / Documento:</strong> {movement.notes || 'Sin notas'}</span></div>
          </div>
          <div className="quantity-display">
            <span className="quantity-label">Cantidad:</span>
            <span className={`quantity-value ${movement.type}`}>
              {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovementDetailModal;