import React from 'react';
import { FaUserTie, FaMapMarkerAlt, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import './SupplierDetailView.css';

const SupplierDetailView = ({ supplier, onBack }) => {
  if (!supplier) {
    return (
      <div className="supplier-detail-container">
        <div className="page-header">
          <h2>Detalle del Proveedor</h2>
          <button className="btn" onClick={onBack}>
            <FaArrowLeft /> Volver
          </button>
        </div>
        <p>No se ha encontrado información para este proveedor.</p>
      </div>
    );
  }

  return (
    <div className="supplier-detail-container">
      <div className="page-header">
        <h2><FaUserTie /> {supplier.name}</h2>
        <button className="btn" onClick={onBack}>
          <FaArrowLeft /> Volver
        </button>
      </div>
      <div className="supplier-info-card">
        <p><FaMapMarkerAlt /> <strong>Dirección:</strong> {supplier.address}</p>
        <p><FaPhone /> <strong>Teléfono:</strong> {supplier.phone}</p>
        <p><FaEnvelope /> <strong>Email:</strong> {supplier.email}</p>
      </div>
      <div className="detail-section">
        <h4>Historial de Compras</h4>
        <div className="placeholder-content">
          <p>El historial de compras a este proveedor se mostrará aquí.</p>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailView;