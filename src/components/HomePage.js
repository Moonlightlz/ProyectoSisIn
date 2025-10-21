import React from 'react';
import './HomePage.css'; // Importamos los nuevos estilos
import { FaUser, FaStore, FaBoxOpen, FaDollarSign } from 'react-icons/fa';

// Datos de ejemplo para una venta. Más adelante, esto vendrá de tu API.
const saleData = {
  id: 'VZ-0872',
  status: 'Entregado',
  distributor: {
    name: 'Carlos Mendoza',
    id: 'DIST-004',
  },
  client: {
    name: 'Zapatería El Gran Paso',
    id: 'CLI-032',
  },
  products: [
    { name: 'Bota de Cuero Clásica', type: 'Caballero', quantity: 12, price: 45.50 },
    { name: 'Sandalia Verano Fresh', type: 'Dama', quantity: 24, price: 25.00 },
    { name: 'Zapato Escolar Resistente', type: 'Niño', quantity: 20, price: 22.75 },
  ],
  get totalQuantity() {
    return this.products.reduce((sum, product) => sum + product.quantity, 0);
  },
  get totalCost() {
    return this.products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
  }
};

function HomePage() {
  return (
    <div className="dashboard-container">
      <h1>Dashboard de Ventas</h1>
      <div className="sale-card-main">
        <div className="sale-header">
          <h2>Venta #{saleData.id}</h2>
          <span className={`status-badge status-${saleData.status.toLowerCase()}`}>
            {saleData.status}
          </span>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <h4><FaStore className="info-icon" /> Distribuidor</h4>
            <p>{saleData.distributor.name}</p>
            <span>ID: {saleData.distributor.id}</span>
          </div>
          <div className="info-card">
            <h4><FaUser className="info-icon" /> Cliente</h4>
            <p>{saleData.client.name}</p>
            <span>ID: {saleData.client.id}</span>
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
              {saleData.products.map((product, index) => (
                <tr key={index}>
                  <td>{product.name}</td>
                  <td>{product.type}</td>
                  <td>{product.quantity}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>${(product.quantity * product.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sale-summary">
          <h3><FaDollarSign className="info-icon" /> Resumen Total</h3>
          <div className="summary-item"><span>Cantidad Total de Productos:</span> <strong>{saleData.totalQuantity}</strong></div>
          <div className="summary-item total"><span>Costo Total:</span> <strong>${saleData.totalCost.toFixed(2)}</strong></div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;