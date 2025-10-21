import React, { useState } from 'react';
import './HomePage.css'; // Importamos los nuevos estilos
import { FaUser, FaStore, FaBoxOpen, FaDollarSign, FaEye } from 'react-icons/fa';

// Datos de ejemplo para las ventas. Más adelante, esto vendrá de tu API.
const salesData = [
  {
    id: 'VZ-0872',
    status: 'Entregado',
    distributor: { name: 'Carlos Mendoza', id: 'DIST-004' },
    client: { name: 'Zapatería El Gran Paso', id: 'CLI-032' },
    products: [
      { name: 'Bota de Cuero Clásica', type: 'Caballero', quantity: 12, price: 45.50 },
      { name: 'Sandalia Verano Fresh', type: 'Dama', quantity: 24, price: 25.00 },
      { name: 'Zapato Escolar Resistente', type: 'Niño', quantity: 20, price: 22.75 },
    ],
    get totalQuantity() { return this.products.reduce((sum, p) => sum + p.quantity, 0); },
    get totalCost() { return this.products.reduce((sum, p) => sum + (p.quantity * p.price), 0); }
  },
  {
    id: 'VZ-0873',
    status: 'Pendiente',
    distributor: { name: 'Ana García', id: 'DIST-002' },
    client: { name: 'Tiendas La Elegancia', id: 'CLI-015' },
    products: [
      { name: 'Zapatilla Deportiva Runner', type: 'Unisex', quantity: 30, price: 55.00 },
      { name: 'Mocasín de Oficina', type: 'Caballero', quantity: 15, price: 60.20 },
    ],
    get totalQuantity() { return this.products.reduce((sum, p) => sum + p.quantity, 0); },
    get totalCost() { return this.products.reduce((sum, p) => sum + (p.quantity * p.price), 0); }
  },
  {
    id: 'VZ-0874',
    status: 'Cancelado',
    distributor: { name: 'Luis Torres', id: 'DIST-007' },
    client: { name: 'Calzados Rápidos S.A.', id: 'CLI-088' },
    products: [
      { name: 'Bota de Lluvia Infantil', type: 'Niña', quantity: 50, price: 15.00 },
    ],
    get totalQuantity() { return this.products.reduce((sum, p) => sum + p.quantity, 0); },
    get totalCost() { return this.products.reduce((sum, p) => sum + (p.quantity * p.price), 0); }
  },
];

// Componente para mostrar los detalles de la venta debajo de la tabla
const SaleDetailsView = ({ sale, onClose }) => {
  if (!sale) return null;

  return (
    <div className="sale-details-container">
      <div className="sale-card-main">
        <div className="sale-details-header">
          <div className="modal-title-group">
            <h2>Detalle de Venta #{sale.id}</h2>
            <span className={`status-badge status-${sale.status.toLowerCase()}`}>{sale.status}</span>
          </div>
          <button className="close-details-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <h4><FaStore className="info-icon" /> Distribuidor</h4>
            <p>{sale.distributor.name}</p>
            <span>ID: {sale.distributor.id}</span>
          </div>
          <div className="info-card">
            <h4><FaUser className="info-icon" /> Cliente</h4>
            <p>{sale.client.name}</p>
            <span>ID: {sale.client.id}</span>
          </div>
        </div>

        <div className="products-section">
          <h3><FaBoxOpen className="info-icon" /> Productos Vendidos</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.products.map((product, index) => (
                <tr key={index}>
                  <td>{product.name}</td>
                  <td>{product.type}</td>
                  <td>{product.quantity}</td>
                  <td>S/ {product.price.toFixed(2)}</td>
                  <td>S/ {(product.quantity * product.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sale-summary">
          <h3><FaDollarSign className="info-icon" /> Resumen Total</h3>
          <div className="summary-details">
            <div className="summary-item"><span>Cantidad Total de Productos:</span> <strong>{sale.totalQuantity}</strong></div>
            <div className="summary-item total"><span>Costo Total:</span> <strong>S/ {sale.totalCost.toFixed(2)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const [selectedSale, setSelectedSale] = useState(null);

  // Maneja la selección de una venta. Si se hace clic en la misma, la deselecciona.
  const handleSelectSale = (sale) => {
    if (selectedSale && selectedSale.id === sale.id) {
      setSelectedSale(null); // Oculta los detalles si se hace clic en la misma venta
    } else {
      setSelectedSale(sale); // Muestra los detalles de la nueva venta
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard de Ventas</h1>
      
      <div className="sales-list">
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Cliente</th>
              <th>Distribuidor</th>
              <th>Monto Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map(sale => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{sale.client.name}</td>
                <td>{sale.distributor.name}</td>
                <td>S/ {sale.totalCost.toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${sale.status.toLowerCase()}`}>
                    {sale.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleSelectSale(sale)} className="view-details-btn">
                    <FaEye /> Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Renderiza la vista de detalles aquí, debajo de la tabla */}
      <SaleDetailsView sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
}

export default HomePage;