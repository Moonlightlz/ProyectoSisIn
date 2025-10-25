import React, { useState, useEffect, useMemo } from 'react';
import { FaFileInvoice, FaSave, FaTimes } from 'react-icons/fa';
import './PurchaseOrderModal.css';

const PurchaseOrderModal = ({ isOpen, onClose, onGenerate, lowStockItems }) => {
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const initialOrderItems = lowStockItems.map(item => ({
        ...item,
        // Sugerir una cantidad para llegar al 150% del umbral de stock bajo
        orderQuantity: Math.ceil(Math.max(0, (item.lowStockThreshold * 1.5) - item.stock)),
        included: true,
      }));
      setOrderItems(initialOrderItems);
    }
  }, [isOpen, lowStockItems]);

  const handleQuantityChange = (id, value) => {
    const newQuantity = parseInt(value, 10);
    setOrderItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, orderQuantity: isNaN(newQuantity) ? 0 : newQuantity } : item
      )
    );
  };

  const handleIncludeToggle = (id) => {
    setOrderItems(prev =>
      prev.map(item => (item.id === id ? { ...item, included: !item.included } : item))
    );
  };

  const handleGenerateClick = () => {
    const itemsToOrder = orderItems.filter(item => item.included && item.orderQuantity > 0);
    onGenerate(itemsToOrder);
  };

  const groupedBySupplier = useMemo(() => {
    return orderItems.reduce((acc, item) => {
      const supplier = item.supplier || 'Sin Proveedor';
      if (!acc[supplier]) {
        acc[supplier] = [];
      }
      acc[supplier].push(item);
      return acc;
    }, {});
  }, [orderItems]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content purchase-order-modal">
        <div className="modal-header">
          <h3 className="modal-title"><FaFileInvoice /> Generar Orden de Compra</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {Object.entries(groupedBySupplier).map(([supplier, items]) => (
            <div key={supplier} className="supplier-group">
              <h4>Proveedor: {supplier}</h4>
              <table className="po-table">
                <thead>
                  <tr>
                    <th>Incluir</th>
                    <th>Material</th>
                    <th>Stock Actual</th>
                    <th>Cant. a Pedir</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={item.included}
                          onChange={() => handleIncludeToggle(item.id)}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.stock} {item.unit}</td>
                      <td>
                        <input
                          type="number"
                          value={item.orderQuantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="quantity-input"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            <FaTimes /> Cancelar
          </button>
          <button onClick={handleGenerateClick} className="btn btn-primary">
            <FaSave /> Generar Orden
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;