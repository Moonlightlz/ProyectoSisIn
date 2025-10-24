import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import ProductManagement from './ProductManagement';
import NewSaleForm from './NewSaleForm';
import RawMaterialInventory from './RawMaterialInventory'; // Importamos el nuevo componente
import './HomePage.css';
import { FaUser, FaStore, FaBoxOpen, FaDollarSign, FaEye, FaCog, FaChartLine, FaFileInvoiceDollar, FaWarehouse } from 'react-icons/fa';

// Estado de vista actual
const VIEWS = {
  DASHBOARD: 'dashboard',
  NEW_SALE: 'new_sale',
  PRODUCTS: 'products',
  RAW_MATERIAL_INVENTORY: 'raw_material_inventory'
};

// Componente para mostrar estadísticas resumidas
const SalesStats = ({ sales }) => {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);  
  // Corregido para no ser sensible a mayúsculas/minúsculas
  const pendingSales = sales.filter(sale => sale.status.toLowerCase() === 'pendiente').length;
  const completedSales = sales.filter(sale => sale.status.toLowerCase() === 'entregado').length;
  const inProcessSales = sales.filter(sale => sale.status.toLowerCase().replace('_', ' ') === 'en proceso').length;


  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">
          <FaChartLine />
        </div>
        <div className="stat-content">
          <h3>{totalSales}</h3>
          <p>Total Ventas</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon revenue">
          <FaDollarSign />
        </div>
        <div className="stat-content">
          <h3>S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p>Ingresos Totales</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon pending">
          <FaBoxOpen />
        </div>
        <div className="stat-content">
          <h3>{pendingSales + inProcessSales}</h3>
          <p>Ventas Pendientes</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon completed">
          <FaStore />
        </div>
        <div className="stat-content">
          <h3>{completedSales}</h3>
          <p>Ventas Entregadas</p>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar los detalles de la venta
const SaleDetailsView = ({ sale, onClose }) => {
  if (!sale) return null;

  return (
    <div className="sale-details-container">
      <div className="sale-card-main">
        <div className="sale-details-header">
          <div className="modal-title-group">
            <h2>Detalle de Venta #{sale.saleNumber}</h2>
            <span className={`status-badge status-${sale.status.toLowerCase().replace('_', '-')}`}>
              {sale.status.replace('_', ' ')}
            </span>
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
            {sale.client.address && <span>Dirección: {sale.client.address}</span>}
            {sale.client.phone && <span>Teléfono: {sale.client.phone}</span>}
          </div>
        </div>

        <div className="products-section">
          <h3><FaBoxOpen className="info-icon" /> Productos Vendidos</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Tallas</th>
                <th>Cantidad (Pares)</th>
                <th>Docenas</th>
                <th>Precio/Docena</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.products.map((product, index) => (
                <tr key={index}>
                  <td>{product.productName}</td>
                  <td>{product.productType}</td>
                  <td>{product.sizes}</td>
                  <td>{product.quantity}</td>
                  <td>{product.dozens}</td>
                  <td>S/ {product.pricePerDozen.toFixed(2)}</td>
                  <td>S/ {product.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sale-summary">
          <h3><FaDollarSign className="info-icon" /> Resumen Total</h3>
          <div className="summary-details">
                      {sale.notes && (
            <div className="sale-notes">
              <h4>Notas: {sale.notes}</h4>
            </div>
          )}
            <div className="summary-item">
              <span>Total Pares:</span> 
              <strong>{sale.totalQuantity}</strong>
            </div>
            <div className="summary-item">
              <span>Total Docenas:</span> 
              <strong>{sale.totalDozens}</strong>
            </div>
            <div className="summary-item total">
              <span>Monto Total:</span> 
              <strong>S/ {sale.totalAmount.toFixed(2)}</strong>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

function HomePage() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Cargar ventas
  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await saleService.getRecentSales();
      setSales(salesData);

    } catch (error) {
      console.error('Error cargando ventas:', error);
      alert('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Manejar selección de venta
  const handleSelectSale = (sale) => {
    if (selectedSale && selectedSale.id === sale.id) {
      setSelectedSale(null);
    } else {
      setSelectedSale(sale);
    }
  };

  // Crear datos de prueba
  const handleCreateTestData = async () => {
    if (!currentUser) return;
    
    if (!window.confirm('¿Crear datos de prueba del último mes? (ventas y productos)')) {
      return;
    }

    try {
      setLoading(true);
      
      // Crear productos por defecto primero
      await productService.createDefaultProducts(currentUser.uid);
      
      // Luego crear ventas de prueba
      await saleService.createTestSalesData(currentUser.uid);
      
      // Recargar ventas
      await loadSales();
      
      alert('Datos de prueba creados exitosamente');
    } catch (error) {
      console.error('Error creando datos de prueba:', error);
      alert('Error al crear datos de prueba');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar vista actual
  const renderCurrentView = () => {
    switch (currentView) {
      case VIEWS.PRODUCTS:
        return <ProductManagement onBack={() => setCurrentView(VIEWS.DASHBOARD)} />;
      
      case VIEWS.NEW_SALE:
        // Renderizamos el componente del formulario directamente
        return ( <NewSaleForm 
            onBack={() => setCurrentView(VIEWS.DASHBOARD)}
            onSaleCreated={() => { 
              setCurrentView(VIEWS.DASHBOARD); 
              loadSales(); 
            }}
          /> );
      case VIEWS.RAW_MATERIAL_INVENTORY:
        return <RawMaterialInventory onBack={() => setCurrentView(VIEWS.DASHBOARD)} />;

      
      default: // VIEWS.DASHBOARD
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>💼 Dashboard de Ventas</h1>
              <div className="dashboard-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView(VIEWS.NEW_SALE)}
                >
                  <FaFileInvoiceDollar /> Nueva Venta
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentView(VIEWS.PRODUCTS)}
                  disabled={loading}
                >
                  <FaCog /> Gestionar Productos
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setCurrentView(VIEWS.RAW_MATERIAL_INVENTORY)}
                  disabled={loading}
                >
                  <FaWarehouse /> Inventario de Materia Prima
                </button>
                {sales.length === 0 && (
                  <button 
                    className="btn btn-debug"
                    onClick={handleCreateTestData}
                    disabled={loading}
                    style={{ backgroundColor: '#ff6b6b', color: 'white' }}
                  >
                    🧪 Crear Datos de Prueba
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Cargando datos...</p>
              </div>
            )}

            {/* Estadísticas resumidas */}
            <SalesStats sales={sales} />

            {sales.length > 0 ? (
              <>
                <div className="sales-section">
                  <h2>📊 Ventas Recientes</h2>
                  <div className="sales-list">
                    <table className="sales-table">
                      <thead>
                        <tr>
                          <th>Número de Venta</th>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Distribuidor</th>
                          <th>Monto Total</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map(sale => (
                          <tr key={sale.id}>
                            <td>{sale.saleNumber}</td>
                            <td>{sale.date.toLocaleDateString()}</td>
                            <td>{sale.client.name}</td>
                            <td>{sale.distributor.name}</td>
                            <td>S/ {sale.totalAmount.toFixed(2)}</td>
                            <td>
                              <span className={`status-badge status-${sale.status.toLowerCase().replace('_', '-')}`}>
                                {sale.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <button 
                                onClick={() => handleSelectSale(sale)} 
                                className="view-details-btn"
                                disabled={loading}
                              >
                                <FaEye /> Ver Detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista de detalles */}
                <SaleDetailsView 
                  sale={selectedSale} 
                  onClose={() => setSelectedSale(null)} 
                />
              </>
            ) : !loading && (
              <div className="empty-state">
                <FaBoxOpen size={64} />
                <h3>No hay ventas registradas</h3>
                <p>Comienza creando productos y registrando tu primera venta</p>
                <div className="empty-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setCurrentView(VIEWS.PRODUCTS)}
                  >
                    <FaCog /> Gestionar Productos
                  </button>
                  <button 
                    className="btn btn-debug"
                    onClick={handleCreateTestData}
                    style={{ backgroundColor: '#ff6b6b', color: 'white' }}
                  >
                    🧪 Crear Datos de Prueba
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return renderCurrentView();
}

export default HomePage;