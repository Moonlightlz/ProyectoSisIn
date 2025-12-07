import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saleService } from '../services/saleService';
import { productService } from '../services/productService';
import ProductManagement from './ProductManagement';
import NewSaleForm from './NewSaleForm';
import RawMaterialInventory from './RawMaterialInventory'; // Importamos el nuevo componente
import './HomePage.css';
import { FaUser, FaStore, FaBoxOpen, FaDollarSign, FaEye, FaCog, FaChartLine, FaFileInvoiceDollar, FaWarehouse, FaFilePdf, FaFileExcel, FaExclamationTriangle } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Componente de confirmación personalizado
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">
          <FaExclamationTriangle />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onClose}>{cancelText}</button>
          <button className="btn-confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

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
  const inProcessSales = sales.filter(sale => sale.status.toLowerCase() === 'en_proceso').length;


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
const SaleDetailsView = ({ sale, onClose, onStatusChange }) => {
  const { currentUser } = useAuth();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(sale?.status || '');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!sale) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === sale.status) {
      alert('Selecciona un estado diferente');
      return;
    }

    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    setShowConfirm(false);
    setIsChangingStatus(true);
    try {
      await saleService.updateSaleStatus(sale.id, newStatus, currentUser.email);
      alert('Estado actualizado correctamente');
      onStatusChange(); // Recargar las ventas
      onClose();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado: ' + error.message);
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmStatusChange}
        title="Confirmar Cambio de Estado"
        message={`¿Estás seguro de cambiar el estado a "${newStatus.replace(/_/g, ' ')}"?`}
      />
      <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="sale-card-main">
        <div className="sale-details-header">
          <div className="modal-title-group">
            <h2>Detalle de Venta #{sale.saleNumber}</h2>
            <span className={`status-badge status-${sale.status.toLowerCase().replace('_', '-')}`}>
              {sale.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Sección para cambiar estado */}
        <div className="status-change-section">
          <h4><FaCog className="info-icon" /> Cambiar Estado</h4>
          <div className="status-change-controls">
            <select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={isChangingStatus}
              className="status-select"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="ENTREGADO">Entregado</option>
            </select>
            <button 
              onClick={handleStatusChange}
              disabled={isChangingStatus || newStatus === sale.status}
              className="btn-update-status"
            >
              {isChangingStatus ? 'Actualizando...' : 'Actualizar Estado'}
            </button>
          </div>
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
    </>
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
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');


  // Exportar TODAS las ventas a Excel
  const handleExportAllSalesToExcel = () => {
    try {
      const data = allSales
        .filter(s => {
          const term = allSalesSearchTerm.trim().toLowerCase();
          if (!term) return true;
          return (s.saleNumber || '').toLowerCase().includes(term);
        })
        .map(s => ([
          s.saleNumber,
          s.date ? s.date.toLocaleDateString() : '',
          s.client?.name || '',
          s.distributor?.name || '',
          (s.status || '').replace(/_/g, ' '),
        ]));

      if (data.length === 0) {
        alert('No hay datos para exportar.');
        return;
      }

      const header = ['Número de Venta', 'Fecha', 'Cliente', 'Distribuidor', 'Monto Total', 'Estado'];
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      // Formatear la columna de monto como número con 2 decimales en Excel
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let r = 1; r <= range.e.r; r++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c: 4 });
        if (ws[cellAddr] && typeof ws[cellAddr].v === 'number') {
          ws[cellAddr].t = 'n';
          ws[cellAddr].z = '#,##0.00';
        }
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
      const today = new Date();
      const file = `ventas_totales_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}.xlsx`;
      XLSX.writeFile(wb, file);
    } catch (err) {
      console.error('Error exportando a Excel:', err);
      alert('No se pudo exportar a Excel.');
    }
  };

  // Exportar TODAS las ventas a PDF
  const handleExportAllSalesToPDF = () => {
    try {
      const rows = allSales
        .filter(s => {
          const term = allSalesSearchTerm.trim().toLowerCase();
          if (!term) return true;
          return (s.saleNumber || '').toLowerCase().includes(term);
        })
        .map(s => ([
          s.saleNumber,
          s.date ? s.date.toLocaleDateString() : '',
          s.client?.name || '',
          s.distributor?.name || '',
          `S/ ${(s.totalAmount ?? 0).toFixed(2)}`,
          (s.status || '').replace(/_/g, ' '),
        ]));

      if (rows.length === 0) {
        alert('No hay datos para exportar.');
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape' });
      // Encabezado con info de empresa
      doc.setFontSize(12);
      doc.text('INDUSTRIA PROCESADORA DEL CALZADO S.A.C.', 14, 12);
      doc.text('RUC: 20601875692', 14, 18);
      doc.text('JR. PANAMA NRO. 191 LIMA - LIMA - COMAS', 14, 24);
      doc.setFontSize(14);
      doc.text('Ventas Totales', 14, 34);
      autoTable(doc, {
        head: [['Número de Venta', 'Fecha', 'Cliente', 'Distribuidor', 'Monto Total', 'Estado']],
        body: rows,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
      });
      const today = new Date();
      const file = `ventas_totales_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}.pdf`;
      doc.save(file);
    } catch (err) {
      console.error('Error exportando a PDF:', err);
      alert('No se pudo exportar a PDF.');
    }
  };
  
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

      case VIEWS.ALL_SALES: {
        const filteredSales = allSales.filter(s => {
          // Filtro por término de búsqueda
          const term = allSalesSearchTerm.trim().toLowerCase();
          if (term && !(s.saleNumber || '').toLowerCase().includes(term)) {
            return false;
          }
          
          // Filtro por fecha de inicio
          if (dateFilterStart) {
            const saleDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
            const startDate = new Date(dateFilterStart);
            startDate.setHours(0, 0, 0, 0);
            if (saleDate < startDate) {
              return false;
            }
          }
          
          // Filtro por fecha de fin
          if (dateFilterEnd) {
            const saleDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
            const endDate = new Date(dateFilterEnd);
            endDate.setHours(23, 59, 59, 999);
            if (saleDate > endDate) {
              return false;
            }
          }
          
          return true;
        });
        const totalFilteredAmount = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
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
                <button
                  className="btn btn-secondary"
                  onClick={handleExportAllSalesToExcel}
                  disabled={loading || allSales.length === 0}
                  title="Exportar a Excel"
                >
                  <FaFileExcel /> Exportar Excel
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportAllSalesToPDF}
                  disabled={loading || allSales.length === 0}
                  title="Exportar a PDF"
                >
                  <FaFilePdf /> Exportar PDF
                </button>
              </div>
            </div>

            {/* Información de la empresa */}
            <div className="company-info" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>INDUSTRIA PROCESADORA DEL CALZADO S.A.C.</div>
              <div>RUC: 20601875692</div>
              <div>JR. PANAMA NRO. 191 LIMA - LIMA - COMAS</div>
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

            {/* Buscador y filtros de fecha */}
            <div className="filters-container" style={{ margin: '1rem 0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label htmlFor="allSalesSearch" style={{ fontWeight: 600 }}>Buscar:</label>
                <input
                  id="allSalesSearch"
                  type="text"
                  className="search-input"
                  placeholder="Buscar por número de venta (ej. VZ-...)"
                  value={allSalesSearchTerm}
                  onChange={(e) => setAllSalesSearchTerm(e.target.value)}
                  style={{ flex: 1, padding: '0.6rem 0.8rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label htmlFor="dateStart" style={{ fontWeight: 600 }}>Desde:</label>
                <input
                  id="dateStart"
                  type="date"
                  className="date-input"
                  value={dateFilterStart}
                  onChange={(e) => setDateFilterStart(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label htmlFor="dateEnd" style={{ fontWeight: 600 }}>Hasta:</label>
                <input
                  id="dateEnd"
                  type="date"
                  className="date-input"
                  value={dateFilterEnd}
                  onChange={(e) => setDateFilterEnd(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem' }}
                />
              </div>
              
              {(allSalesSearchTerm || dateFilterStart || dateFilterEnd) && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setAllSalesSearchTerm('');
                    setDateFilterStart('');
                    setDateFilterEnd('');
                  }}
                >
                  Limpiar Filtros
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
                    {filteredSales.map(sale => (
                      <tr key={sale.id}>
                        <td>{sale.saleNumber}</td>
                        <td>{sale.date.toLocaleDateString()}</td>
                        <td>{sale.client.name}</td>
                        <td>{sale.distributor.name}</td>
                        <td>S/ {sale.totalAmount.toFixed(2)}</td>
                        <td>
                          <span className={`status-badge status-${sale.status.toLowerCase().replace('_', '-')}`}>
                            {sale.status.replace(/_/g, ' ')}
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
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                      <td style={{ fontWeight: 700 }}>S/ {totalFilteredAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Vista de detalles reutilizada */}
            <SaleDetailsView 
              sale={selectedSale} 
              onClose={() => setSelectedSale(null)}
              onStatusChange={loadSales}
            />
          </div>
        );
      }

      
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
                                {sale.status.replace(/_/g, ' ')}
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
                  onStatusChange={loadSales}
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