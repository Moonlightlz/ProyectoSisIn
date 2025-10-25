import React, { useState, useMemo } from 'react';
import { FaPlus, FaMinus, FaSync, FaFileAlt, FaWarehouse, FaChartBar, FaArrowLeft, FaPencilAlt, FaTrash, FaSlidersH, FaHistory, FaIdCard, FaFileExcel, FaFilePdf, FaCalendarAlt, FaSearch, FaFileInvoice, FaFileDownload, FaExclamationTriangle } from 'react-icons/fa';
import './RawMaterialInventory.css';
import NewMaterialModal from './NewMaterialModal'; // Importar el modal
import StockMovementModal from './StockMovementModal'; // Importar el modal de movimiento
import SupplierDetailView from './SupplierDetailView'; // Importar la vista de detalle del proveedor

// Mock data for raw materials
const mockRawMaterials = [
  { id: 'RM001', name: 'Cuero Genuino (Plancha)', category: 'Cueros', supplier: 'Curtidos del Norte', stock: 50, unit: 'planchas', lowStockThreshold: 20, cost: 85.50 },
  { id: 'RM002', name: 'Suela de Goma Eva', category: 'Suelas', supplier: 'Polímeros Andinos', stock: 150, unit: 'pares', lowStockThreshold: 50, cost: 12.00 },
  { id: 'RM003', name: 'Hilo de Nylon #40', category: 'Hilos', supplier: 'Hilos del Sur', stock: 15, unit: 'conos', lowStockThreshold: 10, cost: 5.20 },
  { id: 'RM004', name: 'Ojetillos Metálicos (Ciento)', category: 'Accesorios', supplier: 'Metales SAC', stock: 200, unit: 'cientos', lowStockThreshold: 50, cost: 3.00 },
  { id: 'RM005', name: 'Pegamento para Calzado (Galón)', category: 'Químicos', supplier: 'Química Industrial', stock: 8, unit: 'galones', lowStockThreshold: 5, cost: 45.00 },
  { id: 'RM006', name: 'Badana para forro (Metro)', category: 'Cueros', supplier: 'Curtidos del Norte', stock: 120, unit: 'metros', lowStockThreshold: 40, cost: 9.80 },
];

// Mock data for suppliers
const mockSuppliers = [
  { id: 'SUP01', name: 'Curtidos del Norte', address: 'Av. Industrial 123, Trujillo', phone: '044-203040', email: 'ventas@curtidosnorte.com' },
  { id: 'SUP02', name: 'Polímeros Andinos', address: 'Calle Los Plásticos 500, Lima', phone: '01-555-6789', email: 'contacto@polimerosandinos.pe' },
  { id: 'SUP03', name: 'Hilos del Sur', address: 'Jr. Arequipa 456, Arequipa', phone: '054-302010', email: 'pedidos@hilosdelsur.com' },
  { id: 'SUP04', name: 'Metales SAC', address: 'Parque Industrial, Callao', phone: '01-450-8090', email: 'info@metalessac.com' },
  { id: 'SUP05', name: 'Química Industrial', address: 'Av. Argentina 789, Lima', phone: '01-334-5566', email: 'ventas@quimicaindustrial.com' },
];

// Mock data for movement history
const mockMovementHistory = [
    { id: 'MOV001', date: '2024-07-20', type: 'entrada', quantity: 50, user: 'admin', notes: 'Compra a proveedor' },
    { id: 'MOV002', date: '2024-07-21', type: 'salida', quantity: -10, user: 'produccion', notes: 'Orden de producción #123' },
    { id: 'MOV003', date: '2024-07-22', type: 'ajuste', quantity: -1, user: 'admin', notes: 'Ajuste por merma' },
    { id: 'MOV004', date: '2024-07-23', type: 'salida', quantity: -15, user: 'produccion', notes: 'Orden de producción #125' },
];

const VIEWS = {
  LIST: 'list',
  REPORTS: 'reports',
  DETAIL: 'detail',
  SUPPLIER_DETAIL: 'supplier_detail'
};

const RawMaterialInventory = ({ onBack }) => {
  const [materials, setMaterials] = useState(mockRawMaterials);
  const [currentView, setCurrentView] = useState(VIEWS.LIST);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('kardex');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState('entrada');
  const [filterName, setFilterName] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  const uniqueCategories = useMemo(() => [...new Set(materials.map(m => m.category))], [materials]);
  const uniqueSuppliers = useMemo(() => [...new Set(mockRawMaterials.map(m => m.supplier))], []);

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const categoryMatch = filterCategory ? material.category === filterCategory : true;
      const supplierMatch = filterSupplier ? material.supplier === filterSupplier : true;
      const nameMatch = filterName 
        ? material.name.toLowerCase().includes(filterName.toLowerCase()) 
        : true;
      const lowStockMatch = filterLowStock 
        ? material.stock <= material.lowStockThreshold 
        : true;

      return categoryMatch && supplierMatch && nameMatch && lowStockMatch;
    });
  }, [materials, filterCategory, filterSupplier, filterName, filterLowStock]);

  const getStockIndicator = (stock, threshold) => {
    if (stock <= threshold) return 'low';
    if (stock <= threshold * 1.5) return 'medium';
    return 'high';
  };

  const handleSaveMaterial = (materialData) => {
    if (materialData.id) {
      // Lógica para ACTUALIZAR
      console.log("Actualizando material (frontend):", materialData);
      setMaterials(prev => prev.map(m => m.id === materialData.id ? materialData : m));
      // Si el material editado es el que está seleccionado, actualizamos la vista de detalle
      if (selectedMaterial && selectedMaterial.id === materialData.id) {
        setSelectedMaterial(materialData);
      }
    } else {
      // Lógica para CREAR
      console.log("Guardando nuevo material (frontend):", materialData);
      const newMaterial = { ...materialData, id: `RM${Date.now()}`, stock: 0 }; // Asignar ID y stock inicial
      setMaterials(prev => [...prev, newMaterial]);
    }

    // Cerrar modales
    setEditingMaterial(null);
    setIsNewMaterialModalOpen(false);
  };

  const handleSaveStockMovement = (movementData) => {
    console.log("Guardando movimiento de stock (frontend):", movementData);
    // Aquí irá la lógica para actualizar el stock en el backend
    // y registrar el movimiento en el historial.
    setIsMovementModalOpen(false);
  };

  const openMovementModal = (type) => {
    setMovementType(type);
    setIsMovementModalOpen(true);
  };

  const handleViewSupplier = (supplierName) => {
    const supplier = mockSuppliers.find(s => s.name === supplierName);
    setSelectedSupplier(supplier);
    setCurrentView(VIEWS.SUPPLIER_DETAIL);
  };


  const renderListView = () => (
    <>
      <div className="inventory-filters">
        <div className="filter-group">
          <label>Filtrar por Categoría:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Filtrar por Proveedor:</label>
          <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
            <option value="">Todos</option>
            {uniqueSuppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
          </select>
        </div>
      </div>

      <div className="inventory-actions">
        <div className="action-group-left">
          <button className="btn btn-primary" onClick={() => { setEditingMaterial(null); setIsNewMaterialModalOpen(true); }}><FaPlus /> Nuevo Material</button>
          <button className="btn btn-success" onClick={() => openMovementModal('entrada')}><FaPlus /> Registrar Entrada</button>
          <button className="btn btn-warning" onClick={() => openMovementModal('salida')}><FaMinus /> Registrar Salida</button>
          <button className="btn btn-info" onClick={() => setCurrentView(VIEWS.REPORTS)}><FaChartBar /> Ver Reportes</button>
        </div>
        <div className="action-group-right">
          {/* Por ahora, este botón no tiene lógica, pero está listo para conectarse */}
          <button className="btn btn-secondary"><FaSync /> Actualizar Lista</button>
        </div>
      </div>

      <div className="inventory-list">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Categoría</th>
              <th>Proveedor</th>
              <th>Stock Actual</th>
              <th>Nivel de Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(material => (
              <tr key={material.id}>
                <td>{material.name}</td>
                <td>{material.category}</td>
                <td>{material.supplier}</td>
                <td>{material.stock} {material.unit}</td>
                <td>
                  <span className={`stock-indicator ${getStockIndicator(material.stock, material.lowStockThreshold)}`}>
                    ●
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-table-action btn-details" 
                      onClick={() => { setSelectedMaterial(material); setCurrentView(VIEWS.DETAIL); }}
                    >
                      <FaFileAlt />
                    </button>
                    <button className="btn-table-action btn-edit">
                      <FaPencilAlt />
                    </button>
                    <button className="btn-table-action btn-delete">
                      <FaTrash />
                    </button>
                    <button className="btn-table-action btn-adjust">Ajustar Stock</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderDetailView = () => (
    <div className="material-detail-view">
      <div className="detail-header">
        <h3>{selectedMaterial.name}</h3>
        <button className="btn" onClick={() => setCurrentView(VIEWS.LIST)}>
          <FaArrowLeft /> Volver al Listado
        </button>
      </div>

      <div className="detail-actions">
        <button className="btn btn-primary"><FaPencilAlt /> Editar Material</button>
        <button className="btn btn-danger"><FaTrash /> Eliminar/Desactivar</button>
        <button className="btn btn-success"><FaPlus /> Registrar Entrada</button>
        <button className="btn btn-warning"><FaMinus /> Registrar Salida</button>
        <button className="btn btn-info"><FaHistory /> Ver Kardex</button>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <div className="detail-section-header">
            <h4>Ficha Técnica</h4>
            <div className="detail-section-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => { setEditingMaterial(selectedMaterial); setIsNewMaterialModalOpen(true); }}><FaPencilAlt /> Editar Ficha Técnica</button>
              <button className="btn btn-sm btn-secondary" onClick={() => handleViewSupplier(selectedMaterial.supplier)} disabled={!selectedMaterial.supplier}><FaIdCard /> Ver Proveedor</button>
            </div>
          </div>
          <div className="tech-specs-grid">
            <p><strong>ID:</strong> {selectedMaterial.id}</p>
            <p><strong>Categoría:</strong> {selectedMaterial.category}</p>
            <p><strong>Proveedor:</strong> {selectedMaterial.supplier}</p>
            <p><strong>Unidad:</strong> {selectedMaterial.unit}</p>
            <p><strong>Stock Actual:</strong> {selectedMaterial.stock}</p>
            <p><strong>Umbral Stock Bajo:</strong> {selectedMaterial.lowStockThreshold}</p>
          </div>
        </div>
        <div className="detail-section">
          <div className="detail-section-header">
            <h4>Historial de Movimientos</h4>
            <div className="detail-section-actions">
              <button className="btn btn-sm btn-success-outline"><FaFileExcel /> Exportar a Excel</button>
              <button className="btn btn-sm btn-danger-outline"><FaFilePdf /> Exportar a PDF</button>
            </div>
          </div>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Responsable</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockMovementHistory.map(mov => (
                  <tr key={mov.id}>
                    <td>{mov.date}</td>
                    <td><span className={`movement-badge ${mov.type}`}>{mov.type}</span></td>
                    <td>{mov.quantity}</td>
                    <td>{mov.user}</td>
                    <td>{mov.notes}</td>
                    <td><button className="btn btn-sm btn-secondary">Ver Detalle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsView = () => {
    const lowStockItems = materials.filter(
      (material) => material.stock <= material.lowStockThreshold
    );

    return (
      <div className="reports-view-container">
        <div className="reports-tabs">
          <button className={`tab-btn ${activeReportTab === 'kardex' ? 'active' : ''}`} onClick={() => setActiveReportTab('kardex')}>Kardex por Material</button>
          <button className={`tab-btn ${activeReportTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveReportTab('alerts')}>Alertas de Stock Bajo</button>
          <button className={`tab-btn ${activeReportTab === 'valuation' ? 'active' : ''}`} onClick={() => setActiveReportTab('valuation')}>Valorización de Inventario</button>
        </div>

        {activeReportTab === 'kardex' && (
          <div className="report-content">
            <div className="reports-header">
              <div className="reports-filters">
                <div className="filter-group">
                  <label><FaCalendarAlt /> Filtrar por Fechas</label>
                  <div className="date-range-inputs">
                    <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} />
                    <span>-</span>
                    <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} />
                  </div>
                </div>
                <div className="filter-group">
                  <label>Material</label>
                  <button className="btn btn-secondary"><FaSearch /> Seleccionar Material</button>
                </div>
              </div>
              <div className="reports-actions">
                <button className="btn btn-success-outline"><FaFileExcel /> Exportar Excel</button>
                <button className="btn btn-danger-outline"><FaFilePdf /> Exportar PDF</button>
              </div>
            </div>
            <div className="placeholder-view">
              <h2><FaHistory /> Kardex de Material</h2>
              <p>Selecciona un material y un rango de fechas para ver su historial detallado de movimientos.</p>
            </div>
          </div>
        )}

        {activeReportTab === 'alerts' && (
          <div className="report-content">
            <div className="detail-section low-stock-alerts">
              <div className="detail-section-header">
                <h4><FaExclamationTriangle /> Alertas de Stock Bajo</h4>
                <div className="detail-section-actions">
                  <button className="btn btn-sm btn-secondary"><FaSync /> Actualizar Alertas</button>
                  <button className="btn btn-sm btn-success"><FaFileInvoice /> Generar Orden de Compra</button>
                </div>
              </div>
              {lowStockItems.length > 0 ? (
                <ul className="low-stock-list">
                  {lowStockItems.map(item => (
                    <li key={item.id}>
                      <span>{item.name}</span>
                      <span className="low-stock-indicator">
                        {item.stock} / {item.lowStockThreshold} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-alerts-message">No hay materiales con stock bajo actualmente.</p>
              )}
            </div>
          </div>
        )}

        {activeReportTab === 'valuation' && (
          <div className="report-content">
            <div className="detail-section valuation-section">
              <div className="detail-section-header">
                <h4><FaChartBar /> Valorización de Inventario</h4>
              </div>
              <div className="valuation-controls">
                <div className="filter-group">
                  <label>Fecha de Corte:</label>
                  <input type="date" value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} />
                </div>
                <div className="filter-group">
                  <label>Categoría:</label>
                  <select><option value="">Todas</option>{uniqueCategories.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div className="filter-group">
                  <label>Proveedor:</label>
                  <select><option value="">Todos</option>{uniqueSuppliers.map(s => <option key={s}>{s}</option>)}</select>
                </div>
                <button className="btn btn-primary"><FaFileDownload /> Exportar Reporte</button>
              </div>
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Stock a la Fecha</th>
                      <th>Costo Unitario</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(m => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.stock} {m.unit}</td>
                        <td>S/ {m.cost.toFixed(2)}</td>
                        <td>S/ {(m.stock * m.cost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case VIEWS.REPORTS:
        return renderReportsView();
      case VIEWS.DETAIL:
        return renderDetailView();
      case VIEWS.SUPPLIER_DETAIL:
        return <SupplierDetailView supplier={selectedSupplier} onBack={() => setCurrentView(VIEWS.DETAIL)} />;
      case VIEWS.LIST:
      default:
        return renderListView();
    }
  };

  return (
    <div className="inventory-container">
      <div className="page-header">
        <h2><FaWarehouse /> Inventario de Materia Prima</h2>
        <button className="btn" onClick={currentView === VIEWS.LIST ? onBack : () => setCurrentView(VIEWS.LIST)}>
          <FaArrowLeft /> Volver al Dashboard
        </button>
      </div>
      {renderContent()}
      <NewMaterialModal 
        isOpen={isNewMaterialModalOpen || !!editingMaterial}
        onClose={() => { setIsNewMaterialModalOpen(false); setEditingMaterial(null); }}
        onSave={handleSaveMaterial}
        editingMaterial={editingMaterial}
      />
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSave={handleSaveStockMovement}
        movementType={movementType}
        materials={materials}
      />
    </div>
  );
};

export default RawMaterialInventory;