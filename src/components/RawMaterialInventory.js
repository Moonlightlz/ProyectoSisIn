import React, { useState, useMemo } from 'react';
import { FaPlus, FaMinus, FaSync, FaFileAlt, FaWarehouse, FaChartBar, FaArrowLeft, FaPencilAlt, FaTrash, FaSlidersH } from 'react-icons/fa';
import './RawMaterialInventory.css';

// Mock data for raw materials
const mockRawMaterials = [
  { id: 'RM001', name: 'Cuero Genuino (Plancha)', category: 'Cueros', supplier: 'Curtidos del Norte', stock: 50, unit: 'planchas', lowStockThreshold: 20 },
  { id: 'RM002', name: 'Suela de Goma Eva', category: 'Suelas', supplier: 'Polímeros Andinos', stock: 150, unit: 'pares', lowStockThreshold: 50 },
  { id: 'RM003', name: 'Hilo de Nylon #40', category: 'Hilos', supplier: 'Hilos del Sur', stock: 15, unit: 'conos', lowStockThreshold: 10 },
  { id: 'RM004', name: 'Ojetillos Metálicos (Ciento)', category: 'Accesorios', supplier: 'Metales SAC', stock: 200, unit: 'cientos', lowStockThreshold: 50 },
  { id: 'RM005', name: 'Pegamento para Calzado (Galón)', category: 'Químicos', supplier: 'Química Industrial', stock: 8, unit: 'galones', lowStockThreshold: 5 },
  { id: 'RM006', name: 'Badana para forro (Metro)', category: 'Cueros', supplier: 'Curtidos del Norte', stock: 120, unit: 'metros', lowStockThreshold: 40 },
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
    <div className="placeholder-view">
      <h2><FaFileAlt /> Detalle de: {selectedMaterial.name}</h2>
      <p>Ficha técnica, historial de movimientos y opciones de edición irán aquí.</p>
      <button className="btn" onClick={() => setCurrentView(VIEWS.LIST)}>Volver al Listado</button>
    </div>
  );

  const renderReportsView = () => (
    <div className="placeholder-view">
      <h2><FaChartBar /> Reportes de Inventario</h2>
      <p>Aquí se mostrarán el Kardex, alertas de stock bajo y la valorización del inventario.</p>
      <button className="btn" onClick={() => setCurrentView(VIEWS.LIST)}>Volver al Listado</button>
    </div>
  );

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
        <button className="btn" onClick={onBack}>
          <FaArrowLeft /> Volver al Dashboard
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default RawMaterialInventory;