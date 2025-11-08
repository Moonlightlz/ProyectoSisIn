import React from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';
import './ClusterDetailModal.css';

const ClusterDetailModal = ({ isOpen, onClose, cluster, items, source }) => {
  if (!isOpen || !items) return null;

  const renderMaterialDetails = (items) => (
    <table className="cluster-items-table">
      <thead>
        <tr>
          <th>Material</th>
          <th>Stock</th>
          <th>Umbral</th>
          <th>Movimientos</th>
          <th>Categoría</th>
          <th>Proveedor</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.mat.id}>
            <td>{item.mat.name}</td>
            <td>{item.mat.stock} {item.mat.unit}</td>
            <td>{item.mat.lowStockThreshold} {item.mat.unit}</td>
            <td>{item.movements?.length || 0}</td>
            <td>{item.mat.category}</td>
            <td>{item.mat.supplier}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSalesDetails = (items) => (
    <table className="cluster-items-table">
      <thead>
        <tr>
          <th>Número</th>
          <th>Cliente</th>
          <th>Distribuidor</th>
          <th>Total</th>
          <th>Cantidad</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {items.map(sale => (
          <tr key={sale.id}>
            <td>{sale.saleNumber}</td>
            <td>{sale.client?.name}</td>
            <td>{sale.distributor?.name}</td>
            <td>S/ {sale.totalAmount?.toFixed(2)}</td>
            <td>{sale.totalQuantity}</td>
            <td>{sale.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content cluster-detail-modal">
        <div className="modal-header">
          <h3><FaInfoCircle /> Detalles del {cluster}</h3>
          <button onClick={onClose} className="close-button"><FaTimes /></button>
        </div>
        <div className="modal-body">
          <div className="cluster-stats">
            <div className="stat-item">
              <label>Cantidad de elementos:</label>
              <span>{items.length}</span>
            </div>
          </div>
          <div className="cluster-items">
            {source === 'materials' ? renderMaterialDetails(items) : renderSalesDetails(items)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterDetailModal;