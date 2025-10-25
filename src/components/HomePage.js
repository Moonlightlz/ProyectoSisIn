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
  RAW_MATERIAL_INVENTORY: 'raw_material_inventory',
  ALL_SALES: 'all_sales'
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
  const [allSales, setAllSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allSalesSearchTerm, setAllSalesSearchTerm] = useState('');
  
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

  // Cargar todas las ventas cuando se entra a la vista de Ventas Totales
  useEffect(() => {
    const loadAllSales = async () => {
      if (currentView !== VIEWS.ALL_SALES) return;
      try {
        setLoading(true);
        const data = await saleService.getAllSales();
        setAllSales(data);
      } catch (error) {
        console.error('Error cargando ventas totales:', error);
        alert('Error al cargar las ventas totales');
      } finally {
        setLoading(false);
      }
    };
    loadAllSales();
  }, [currentView]);

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

  // Generar ventas de prueba entre 7 de octubre 2025 y hoy
  const handleSeedOctoberSales = async () => {
    if (!currentUser) return;

    const start = new Date(2025, 9, 7); // Mes base 0 => 9 = Octubre
    const today = new Date();

    const confirmed = window.confirm(`¿Generar entre 1 a 5 ventas diarias desde el ${start.toLocaleDateString()} hasta hoy?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const created = await saleService.seedSalesBetweenDates(start, today, currentUser.uid);
      await loadSales();
      alert(`Se generaron ${created} ventas de prueba.`);
    } catch (err) {
      console.error('Error al generar ventas de prueba:', err);
      alert('No se pudieron generar las ventas de prueba.');
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

      case VIEWS.ALL_SALES:
        return (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>📑 Ventas Totales</h1>
              <div className="dashboard-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentView(VIEWS.DASHBOARD)}
                  disabled={loading}
                >
                  ← Volver
                </button>
              </div>
            </div>

            {loading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Cargando ventas...</p>
              </div>
            )}

            {/* Resumen superior basado en TODAS las ventas */}
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
              <div className="stat-card">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <h3>{allSales.length}</h3>
                  <p>Ventas Totales</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon revenue">
                  <FaDollarSign />
                </div>
                <div className="stat-content">
                  <h3>
                    S/ {allSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p>Ingresos Totales</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending">
                  <FaBoxOpen />
                </div>
                <div className="stat-content">
                  <h3>{allSales.filter(s => (s.status || '').toLowerCase() === 'pendiente').length}</h3>
                  <p>Ventas Pendientes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completed">
                  <FaStore />
                </div>
                <div className="stat-content">
                  <h3>{allSales.filter(s => (s.status || '').toLowerCase() === 'entregado').length}</h3>
                  <p>Ventas Entregadas</p>
                </div>
              </div>
            </div>

            {/* Buscador por número de venta */}
            <div className="search-bar" style={{ margin: '1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label htmlFor="allSalesSearch" style={{ fontWeight: 600 }}>Buscar</label>
              <input
                id="allSalesSearch"
                type="text"
                className="search-input"
                placeholder="Buscar por número de venta (ej. VZ-...)"
                value={allSalesSearchTerm}
                onChange={(e) => setAllSalesSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 0.8rem' }}
              />
              {allSalesSearchTerm && (
                <button className="btn btn-secondary" onClick={() => setAllSalesSearchTerm('')}>
                  Limpiar
                </button>
              )}
            </div>

            <div className="sales-section">
              <h2>📊 Todas las Ventas</h2>
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
                    {allSales
                      .filter(s => {
                        const term = allSalesSearchTerm.trim().toLowerCase();
                        if (!term) return true;
                        return (s.saleNumber || '').toLowerCase().includes(term);
                      })
                      .map(sale => (
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

            {/* Vista de detalles reutilizada */}
            <SaleDetailsView 
              sale={selectedSale} 
              onClose={() => setSelectedSale(null)} 
            />
          </div>
        );

      
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
                  onClick={() => setCurrentView(VIEWS.ALL_SALES)}
                  disabled={loading}
                  title="Ver todas las ventas registradas"
                >
                  Ventas Totales
                </button>
                <button 
                  className="btn btn-debug"
                  onClick={handleSeedOctoberSales}
                  disabled={loading}
                  title="Genera ventas de prueba desde el 7/10/2025 hasta hoy"
                  style={{ backgroundColor: '#0ea5e9', color: 'white' }}
                >
                  🧪 Generar Ventas (Oct 7 → Hoy)
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