import React, { useState, useMemo } from 'react';
import { FaPlus, FaMinus, FaSync, FaFileAlt, FaWarehouse, FaChartBar, FaArrowLeft, FaPencilAlt, FaTrash, FaSlidersH, FaHistory, FaIdCard, FaFileExcel, FaFilePdf, FaCalendarAlt, FaSearch, FaFileInvoice, FaFileDownload } from 'react-icons/fa';
import './RawMaterialInventory.css';

// Mock data for raw materials
const mockRawMaterials = [
  { id: 'RM001', name: 'Cuero Genuino (Plancha)', category: 'Cueros', supplier: 'Curtidos del Norte', stock: 50, unit: 'planchas', lowStockThreshold: 20, cost: 85.50 },
  { id: 'RM002', name: 'Suela de Goma Eva', category: 'Suelas', supplier: 'Polímeros Andinos', stock: 150, unit: 'pares', lowStockThreshold: 50, cost: 12.00 },
  { id: 'RM003', name: 'Hilo de Nylon #40', category: 'Hilos', supplier: 'Hilos del Sur', stock: 15, unit: 'conos', lowStockThreshold: 10, cost: 5.20 },
  { id: 'RM004', name: 'Ojetillos Metálicos (Ciento)', category: 'Accesorios', supplier: 'Metales SAC', stock: 200, unit: 'cientos', lowStockThreshold: 50, cost: 3.00 },
  { id: 'RM005', name: 'Pegamento para Calzado (Galón)', category: 'Químicos', supplier: 'Química Industrial', stock: 8, unit: 'galones', lowStockThreshold: 5, cost: 45.00 },
  { id: 'RM006', name: 'Badana para forro (Metro)', category: 'Cueros', supplier: 'Curtidos del Norte', stock: 120, unit: 'metros', lowStockThreshold: 40, cost: 9.80 },
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
  DETAIL: 'detail'
};

const RawMaterialInventory = ({ onBack }) => {
  const [materials, setMaterials] = useState(mockRawMaterials);
  const [currentView, setCurrentView] = useState(VIEWS.LIST);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [valuationDate, setValuationDate] = useState(new Date().toISOString().split('T')[0]);

  const uniqueCategories = useMemo(() => [...new Set(mockRawMaterials.map(m => m.category))], []);
  const uniqueSuppliers = useMemo(() => [...new Set(mockRawMaterials.map(m => m.supplier))], []);

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const categoryMatch = filterCategory ? material.category === filterCategory : true;
      const supplierMatch = filterSupplier ? material.supplier === filterSupplier : true;
      return categoryMatch && supplierMatch;
    });
  }, [materials, filterCategory, filterSupplier]);

  const getStockIndicator = (stock, threshold) => {
    if (stock <= threshold) return 'low';
    if (stock <= threshold * 1.5) return 'medium';
    return 'high';
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
          <button className="btn btn-primary"><FaPlus /> Nuevo Material</button>
          <button className="btn btn-success"><FaPlus /> Registrar Entrada</button>
          <button className="btn btn-warning"><FaMinus /> Registrar Salida</button>
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
              <button className="btn btn-sm btn-secondary"><FaPencilAlt /> Editar Ficha Técnica</button>
              <button className="btn btn-sm btn-secondary"><FaIdCard /> Ver Proveedor</button>
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

        <div className="detail-section low-stock-alerts">
          <div className="detail-section-header">
            <h4>Alertas de Stock Bajo</h4>
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

        <div className="detail-section valuation-section">
          <div className="detail-section-header">
            <h4>Valorización de Inventario</h4>
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
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case VIEWS.REPORTS:
        return renderReportsView();
      case VIEWS.DETAIL:
        return renderDetailView();
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
    </div>
  );
};

export default RawMaterialInventory;