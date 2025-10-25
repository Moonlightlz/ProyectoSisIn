import React, { useState, useMemo, useEffect } from 'react';
import { rawMaterialService } from './rawMaterialService';
import { FaPlus, FaMinus, FaSync, FaFileAlt, FaWarehouse, FaChartBar, FaArrowLeft, FaPencilAlt, FaTrash, FaSlidersH, FaHistory, FaIdCard, FaFileExcel, FaFilePdf, FaCalendarAlt, FaSearch, FaFileInvoice, FaFileDownload, FaExclamationTriangle, FaFlask } from 'react-icons/fa';
import './RawMaterialInventory.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import NewMaterialModal from './NewMaterialModal'; // Importar el modal
import StockMovementModal from './StockMovementModal'; // Importar el modal de movimiento
import SupplierDetailView from './SupplierDetailView'; // Importar la vista de detalle del proveedor
import MovementDetailModal from './MovementDetailModal'; // Importar el modal de detalle de movimiento
import MaterialSelectionModal from './MaterialSelectionModal'; // Importar modal de selección de material
import ConfirmationModal from './ConfirmationModal'; // Importar modal de confirmación
import PurchaseOrderModal from './PurchaseOrderModal'; // Importar modal de orden de compra
import StockAdjustmentModal from './StockAdjustmentModal'; // Importar modal de ajuste de stock

// Mock data for suppliers
const mockSuppliers = [
  { id: 'SUP01', name: 'Curtidos del Norte', address: 'Av. Industrial 123, Trujillo', phone: '044-203040', email: 'ventas@curtidosnorte.com' },
  { id: 'SUP02', name: 'Polímeros Andinos', address: 'Calle Los Plásticos 500, Lima', phone: '01-555-6789', email: 'contacto@polimerosandinos.pe' },
  { id: 'SUP03', name: 'Hilos del Sur', address: 'Jr. Arequipa 456, Arequipa', phone: '054-302010', email: 'pedidos@hilosdelsur.com' },
  { id: 'SUP04', name: 'Metales SAC', address: 'Parque Industrial, Callao', phone: '01-450-8090', email: 'info@metalessac.com' },
  { id: 'SUP05', name: 'Química Industrial', address: 'Av. Argentina 789, Lima', phone: '01-334-5566', email: 'ventas@quimicaindustrial.com' },
];

const VIEWS = {
  LIST: 'list',
  REPORTS: 'reports',
  DETAIL: 'detail',
  SUPPLIER_DETAIL: 'supplier_detail'
};

const RawMaterialInventory = ({ onBack }) => {
  const [materials, setMaterials] = useState([]);
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
  const [isMovementDetailModalOpen, setIsMovementDetailModalOpen] = useState(false);
  const [isMaterialSelectionModalOpen, setIsMaterialSelectionModalOpen] = useState(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingMaterial, setAdjustingMaterial] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [reportSelectedMaterial, setReportSelectedMaterial] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [movementMaterialId, setMovementMaterialId] = useState(null);
  const [movementType, setMovementType] = useState('entrada');
  const [filterName, setFilterName] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [valuationCategory, setValuationCategory] = useState('');
  const [valuationSupplier, setValuationSupplier] = useState('');

  const uniqueCategories = useMemo(() => [...new Set(materials.map(m => m.category))], [materials]);
  const uniqueSuppliers = useMemo(() => [...new Set(materials.map(m => m.supplier))], [materials]);

  const lowStockItems = useMemo(() =>
    materials.filter(material => material.stock <= 20), // Stock bajo se considera <= 20
  [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const categoryMatch = filterCategory ? material.category === filterCategory : true;
      const nameMatch = filterName 
        ? material.name.toLowerCase().includes(filterName.toLowerCase()) 
        : true;
      const lowStockMatch = filterLowStock 
        ? material.stock <= 20 // Filtrar por stock bajo (<= 20)
        : true;
      const supplierMatch = filterSupplier ? material.supplier === filterSupplier : true;
      return categoryMatch && nameMatch && lowStockMatch && supplierMatch;
    });
  }, [materials, filterCategory, filterSupplier, filterName, filterLowStock]);

  const filteredValuationMaterials = useMemo(() => {
    return materials.filter(material => {
      const categoryMatch = valuationCategory ? material.category === valuationCategory : true;
      const supplierMatch = valuationSupplier ? material.supplier === valuationSupplier : true;
      return categoryMatch && supplierMatch;
    });
  }, [materials, valuationCategory, valuationSupplier]);

  const calculateStockAtDate = (material, date) => {
    const today = new Date();
    const valuationDateObj = new Date(date + 'T23:59:59'); // Considerar el día completo

    if (valuationDateObj >= today) {
      return material.stock; // Si es hoy o futuro, es el stock actual
    }

    // Filtrar movimientos que ocurrieron DESPUÉS de la fecha de corte
    const movementsAfterDate = movementHistory.filter(mov => {
      const movDate = mov.timestamp?.toDate() || new Date(mov.date + 'T00:00:00');
      return movDate > valuationDateObj;
    });

    // Para obtener el stock pasado, revertimos los movimientos futuros.
    // Sumamos las salidas y restamos las entradas.
    return movementsAfterDate.reduce((stock, mov) => stock - mov.quantity, material.stock);
  };

  const fetchRawMaterials = async () => {
    setLoadingMaterials(true);
    console.log("Refrescando datos de materiales...");
    try {
      const data = await rawMaterialService.getRawMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Error al cargar materias primas:", error);
      alert("No se pudieron cargar las materias primas.");
    }
    setLoadingMaterials(false);
    console.log("Datos de materiales actualizados.");
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchRawMaterials();
  }, []);


  const getStockIndicator = (stock, threshold) => {
    if (stock <= threshold) return 'low';
    if (stock <= threshold * 1.5) return 'medium';
    return 'high';
  };

  const handleSaveMaterial = async (materialData) => {
    if (materialData.id) {
      // Lógica para ACTUALIZAR
      console.log("Actualizando material:", materialData);
      await rawMaterialService.updateRawMaterial(materialData.id, materialData);
    } else {
      // Lógica para CREAR
      console.log("Guardando nuevo material:", materialData);
      await rawMaterialService.addRawMaterial(materialData);
    }

    // Cerrar modales
    setEditingMaterial(null);
    setIsNewMaterialModalOpen(false);
    fetchRawMaterials();
  };

  const handleSaveStockMovement = async (movementData) => {
    console.log("Guardando movimiento de stock (frontend):", movementData);    
    try {
      await rawMaterialService.addStockMovement(movementData.materialId, movementData);
      await fetchRawMaterials(); // Recargar lista de materiales para actualizar stock
      if (currentView === VIEWS.DETAIL) {
        await fetchMovementHistory(movementData.materialId); // Recargar historial si estamos en detalle
      }
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      alert(`Error: ${error.message}`);
    }
    setIsMovementModalOpen(false);
  };

  const openMovementModal = (type, materialId = null) => {
    setMovementType(type);
    setMovementMaterialId(materialId);
    setIsMovementModalOpen(true);
  };

  const handleViewSupplier = (supplierName) => {
    const supplier = mockSuppliers.find(s => s.name === supplierName);
    setSelectedSupplier(supplier);
    setCurrentView(VIEWS.SUPPLIER_DETAIL);
  };

  const handleDeleteClick = (material) => {
    setDeletingMaterial(material);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    console.log("Desactivando material:", deletingMaterial.id);
    await rawMaterialService.deleteRawMaterial(deletingMaterial.id);

    // Si estamos en la vista de detalle del material que se eliminó, volvemos a la lista.
    if (currentView === VIEWS.DETAIL && selectedMaterial?.id === deletingMaterial.id) {
      setCurrentView(VIEWS.LIST);
    }

    setDeletingMaterial(null);
    setIsConfirmDeleteModalOpen(false);
    fetchRawMaterials();
  };

  const handleSaveStockAdjustment = async ({ materialId, newStock, reason }) => {
    console.log("Guardando ajuste de stock (frontend):", { materialId, newStock, reason });
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const adjustmentQuantity = newStock - material.stock;

    try {
      await rawMaterialService.addStockMovement(materialId, {
        type: 'ajuste',
        quantity: adjustmentQuantity,
        notes: reason,
      });
      await fetchRawMaterials();
    } catch (error) {
      console.error("Error al ajustar stock:", error);
      alert(`Error: ${error.message}`);
    }
    setIsAdjustmentModalOpen(false);
  };

  const handleGeneratePurchaseOrder = (orderData) => {
    console.log("Generando Orden de Compra (frontend):", orderData);
    // Aquí iría la lógica para crear la orden de compra en el backend
    setIsPurchaseOrderModalOpen(false);
  };

  const handleViewKardex = () => {
    if (!selectedMaterial) return;
    setReportSelectedMaterial(selectedMaterial);
    setActiveReportTab('kardex');
    setCurrentView(VIEWS.REPORTS);
  };

  const handleRefreshAlerts = () => {
    console.log("Actualizando alertas...");
    fetchRawMaterials();
  };

  const handleSelectMaterialForReport = (material) => {
    setReportSelectedMaterial(material);
    setIsMaterialSelectionModalOpen(false);
  };

  const fetchMovementHistory = async (materialId) => {
    if (!materialId) return;
    try {
      const historyData = await rawMaterialService.getMaterialMovements(materialId);
      setMovementHistory(historyData);
    } catch (error) {
      console.error("Error al cargar historial de movimientos:", error);
      alert("No se pudo cargar el historial.");
      setMovementHistory([]);
    }
  };

  const handleExportValuationToExcel = () => {
    const dataToExport = filteredValuationMaterials;
    if (dataToExport.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const totalValue = dataToExport.reduce((sum, item) => sum + (calculateStockAtDate(item, valuationDate) * item.cost), 0);

    const headers = ['ID', 'Material', 'Categoría', 'Proveedor', 'Stock', 'Costo Unitario (S/)', 'Valor Total (S/)'];
    const data = dataToExport.map(item => [
      item.id, item.name, item.category, item.supplier, 
      calculateStockAtDate(item, valuationDate), item.cost.toFixed(2), 
      (calculateStockAtDate(item, valuationDate) * item.cost).toFixed(2)
    ]);

    const title = `Reporte de Valorización de Inventario a fecha ${valuationDate}`;
    const ws_data = [
      [title], [], headers, ...data, [], ['', '', '', '', '', 'VALOR TOTAL', totalValue.toFixed(2)]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    if (ws['A1']) ws['A1'].s = { font: { sz: 16, bold: true }, alignment: { horizontal: "center" } };
    
    const totalRow = data.length + 4;
    const totalLabelCellRef = `F${totalRow + 1}`;
    const totalValueCellRef = `G${totalRow + 1}`;

    // Asegurarse de que las celdas existan antes de aplicarles estilo
    if (!ws[totalLabelCellRef]) ws[totalLabelCellRef] = { t: 's', v: 'VALOR TOTAL' };
    if (!ws[totalValueCellRef]) ws[totalValueCellRef] = { t: 'n', v: totalValue };

    ws[totalLabelCellRef].s = { font: { bold: true } };
    ws[totalValueCellRef].s = { font: { bold: true }, numFmt: '"S/ "#,##0.00' };

    ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, "Valorizacion");
    XLSX.writeFile(wb, `Valorizacion_Inventario_${valuationDate}.xlsx`);
  };

  const handleExportValuationToPdf = () => {
    const dataToExport = filteredValuationMaterials;
    if (dataToExport.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const totalValue = dataToExport.reduce((sum, item) => sum + (calculateStockAtDate(item, valuationDate) * item.cost), 0);

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Valorización de Inventario', 14, 22);
    doc.setFontSize(10);
    doc.text(`Fecha de corte: ${valuationDate}`, 14, 30);

    const tableData = dataToExport.map(item => [
      item.name, 
      calculateStockAtDate(item, valuationDate), 
      `S/ ${item.cost.toFixed(2)}`, `S/ ${(calculateStockAtDate(item, valuationDate) * item.cost).toFixed(2)}`
    ]);

    // Add total row
    tableData.push(['', '', { content: 'VALOR TOTAL', styles: { fontStyle: 'bold', halign: 'right' } }, { content: `S/ ${totalValue.toFixed(2)}`, styles: { fontStyle: 'bold' } }]);

    autoTable(doc, {
      startY: 35,
      head: [['Material', 'Stock', 'Costo Unitario', 'Valor Total']],
      body: tableData,
    });

    doc.save(`Valorizacion_Inventario_${valuationDate}.pdf`);
  };

  const filteredMovementsForKardex = useMemo(() => {
    if (!reportStartDate && !reportEndDate) {
      return movementHistory; // Devuelve todos si no hay rango
    }
    return movementHistory.filter(mov => {
      // Se añade T00:00:00 para evitar problemas de zona horaria al comparar solo fechas
      const movDate = mov.timestamp?.toDate() || new Date(mov.date + 'T00:00:00');
      const startDate = reportStartDate ? new Date(reportStartDate + 'T00:00:00') : null;
      const endDate = reportEndDate ? new Date(reportEndDate + 'T00:00:00') : null;
      return (!startDate || movDate >= startDate) && (!endDate || movDate <= endDate);
    });
  }, [reportStartDate, reportEndDate]);

  const generateKardexData = (material, movements) => {
    if (!material) return [];
    
    let balance = material.stock; // Start with current stock and work backwards
    const kardex = movements.map(mov => ({...mov})).reverse().map(mov => {
      const newBalance = balance;
      balance -= mov.quantity;
      return {
        date: mov.timestamp?.toDate().toLocaleDateString('es-PE') || mov.date,
        type: mov.type,
        notes: mov.notes,
        entry: mov.quantity > 0 ? mov.quantity : '',
        exit: mov.quantity < 0 ? -mov.quantity : '',
        balance: newBalance,
      };
    }).reverse();

    // Add initial balance row
    kardex.unshift({
      date: '',
      type: 'saldo_inicial',
      notes: 'Saldo Inicial',
      entry: '',
      exit: '',
      balance: balance,
    });

    return kardex;
  };

  const handleExportKardexToExcel = () => {
    if (!reportSelectedMaterial) {
      alert('Por favor, selecciona un material para exportar el Kardex.');
      return;
    }
    const kardexData = generateKardexData(reportSelectedMaterial, filteredMovementsForKardex);
    const headers = ['Fecha', 'Detalle', 'Entrada', 'Salida', 'Saldo'];
    const data = kardexData.map(item => [item.date, item.notes, item.entry, item.exit, item.balance]);
    
    const title = `Kardex de Material: ${reportSelectedMaterial.name}`;
    const ws_data = [[title], [], headers, ...data];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    ws['A1'].s = { font: { sz: 18, bold: true }, alignment: { horizontal: "center" } };
    ws['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, "Kardex");
    XLSX.writeFile(wb, `Kardex_${reportSelectedMaterial.id}.xlsx`);
  };

  const handleExportKardexToPdf = () => {
    if (!reportSelectedMaterial) {
      alert('Por favor, selecciona un material para exportar el Kardex.');
      return;
    }
    const doc = new jsPDF();
    const kardexData = generateKardexData(reportSelectedMaterial, filteredMovementsForKardex);
    const tableData = kardexData.map(item => [item.date, item.notes, item.entry, item.exit, item.balance]);

    doc.setFontSize(18);
    doc.text(`Kardex de Material: ${reportSelectedMaterial.name}`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-PE')}`, 14, 30);

    autoTable(doc, {
      startY: 35,
      head: [['Fecha', 'Detalle', 'Entrada', 'Salida', 'Saldo']],
      body: tableData,
    });

    doc.save(`Kardex_${reportSelectedMaterial.id}.pdf`);
  };

  const handleExportHistoryToExcel = () => {
    if (movementHistory.length === 0) {
      alert('No hay datos de historial para exportar.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws_name = "Historial de Movimientos";

    const headers = ['Fecha', 'Tipo', 'Cantidad', 'Responsable', 'Notas'];
    const data = movementHistory.map(mov => [
      mov.timestamp?.toDate().toLocaleString('es-PE') || mov.date,
      mov.type,
      mov.quantity,
      mov.user,
      mov.notes,
    ]);

    const title = `Historial de Movimientos - ${selectedMaterial.name}`;
    const ws_data = [
      [title],
      [],
      headers,
      ...data
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Estilos y anchos de columna
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    ws['A1'].s = { font: { sz: 18, bold: true }, alignment: { horizontal: "center" } };
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 40 }];

    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `historial_${selectedMaterial.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportHistoryToPdf = () => {
    if (movementHistory.length === 0) {
      alert('No hay datos de historial para exportar.');
      return;
    }

    const doc = new jsPDF();
    const title = `Historial de Movimientos - ${selectedMaterial.name}`;
    const generationDate = new Date().toLocaleString('es-PE');

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${generationDate}`, 14, 30);

    const tableData = movementHistory.map(mov => [
      mov.timestamp?.toDate().toLocaleDateString('es-PE') || mov.date,
      mov.type,
      mov.quantity,
      mov.user,
      mov.notes,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Fecha', 'Tipo', 'Cantidad', 'Responsable', 'Notas']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
      },
    });

    doc.save(`historial_${selectedMaterial.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleCreateTestData = async () => {
    if (!window.confirm('¿Estás seguro de que deseas crear un gran volumen de datos de prueba para materias primas? Esta acción puede tardar unos momentos y no se puede deshacer fácilmente.')) {
      return;
    }

    setLoadingMaterials(true);
    try {
      const result = await rawMaterialService.createTestRawMaterials();
      if (result.success) {
        alert(`${result.count} materiales de prueba han sido creados exitosamente.`);
        await fetchRawMaterials();
      }
    } catch (error) {
      console.error("Error al crear datos de prueba:", error);
      alert("Ocurrió un error al generar los datos de prueba.");
    }
    setLoadingMaterials(false);
  };

  const renderListView = () => (
    <>
      <div className="inventory-filters">
        <div className="filter-group">
          <label><FaSearch /> Buscar por Nombre:</label>
          <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Ej: Cuero Napa..." />
        </div>
        <div className="filter-group">
          <label>Filtrar por Categoría:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        {/* Este filtro se movió a la sección de reportes para no sobrecargar la vista principal.
           Si se necesita aquí, se puede descomentar.
        
        <div className="filter-group"> 
          <label>Filtrar por Proveedor:</label>
          <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
            <option value="">Todos</option>
            {uniqueSuppliers.map(sup => <option key={sup} value={sup}>{sup}</option>)}
          </select>
        </div>
      </div>
        */}
        <div className="filter-group checkbox-filter">
          <input type="checkbox" id="lowStockFilter" checked={filterLowStock} onChange={(e) => setFilterLowStock(e.target.checked)} />
          <label htmlFor="lowStockFilter">Mostrar solo stock bajo</label>
        </div>
      </div>

      <div className="inventory-actions">
        <div className="action-group-left">
          <button className="btn btn-primary" onClick={() => { setEditingMaterial(null); setIsNewMaterialModalOpen(true); }}><FaPlus /> Nuevo Material</button>
          <button className="btn btn-success" onClick={() => openMovementModal('entrada')}><FaPlus /> Registrar Entrada</button>
          <button className="btn btn-warning" onClick={() => openMovementModal('salida')}><FaMinus /> Registrar Salida</button>
          <button className="btn btn-info" onClick={() => setCurrentView(VIEWS.REPORTS)}><FaChartBar /> Ver Reportes</button>
          {materials.length === 0 && !loadingMaterials && (
            <button className="btn btn-debug" onClick={handleCreateTestData}>
              <FaFlask /> Crear Datos de Prueba
            </button>
          )}
        </div>
        <div className="action-group-right">
          {/* Por ahora, este botón no tiene lógica, pero está listo para conectarse */}
          <button className="btn btn-secondary" onClick={fetchRawMaterials} disabled={loadingMaterials}><FaSync /> {loadingMaterials ? 'Actualizando...' : 'Actualizar Lista'}</button>
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
            {loadingMaterials ? (
              <tr><td colSpan="6" className="loading-cell">Cargando materiales...</td></tr>
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data-cell">No se encontraron materiales. Puedes crear uno nuevo o generar datos de prueba.</td>
              </tr>
            ) : (
              filteredMaterials.map(material => (
                <tr key={material.id}>
                  <td>{material.name}</td>
                  <td>{material.category}</td>
                  <td>{material.supplier}</td>
                  <td>{material.stock} {material.unit}</td>
                  <td>
                    <span className={`stock-indicator ${getStockIndicator(material.stock, 20)}`}> {/* Usar 20 como umbral fijo para el indicador */}
                      ●
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-table-action btn-details" onClick={() => { setSelectedMaterial(material); fetchMovementHistory(material.id); setCurrentView(VIEWS.DETAIL); }}><FaFileAlt /></button>                      <button className="btn-table-action btn-edit" onClick={() => { setEditingMaterial(material); setIsNewMaterialModalOpen(true); }}><FaPencilAlt /></button>
                      <button className="btn-table-action btn-delete" onClick={() => handleDeleteClick(material)}><FaTrash /></button>
                      <button className="btn-table-action btn-adjust" onClick={() => { setAdjustingMaterial(material); setIsAdjustmentModalOpen(true); }}>Ajustar Stock</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
        <button className="btn btn-primary" onClick={() => { setEditingMaterial(selectedMaterial); setIsNewMaterialModalOpen(true); }}><FaPencilAlt /> Editar Material</button>
        <button className="btn btn-danger" onClick={() => handleDeleteClick(selectedMaterial)}><FaTrash /> Eliminar/Desactivar</button>
        <button className="btn btn-success" onClick={() => openMovementModal('entrada', selectedMaterial.id)}><FaPlus /> Registrar Entrada</button>
        <button className="btn btn-warning" onClick={() => openMovementModal('salida', selectedMaterial.id)}><FaMinus /> Registrar Salida</button>
        <button className="btn btn-info" onClick={handleViewKardex}><FaHistory /> Ver Kardex</button>
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
              <button className="btn btn-sm btn-success-outline" onClick={handleExportHistoryToExcel}><FaFileExcel /> Exportar a Excel</button>
              <button className="btn btn-sm btn-danger-outline" onClick={handleExportHistoryToPdf}><FaFilePdf /> Exportar a PDF</button>
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
                {movementHistory.map(mov => (
                  <tr key={mov.id}>
                    <td>{mov.timestamp?.toDate().toLocaleDateString('es-PE')}</td>
                    <td><span className={`movement-badge ${mov.type}`}>{mov.type}</span></td>
                    <td>{mov.quantity}</td>
                    <td>{mov.user || 'N/A'}</td>
                    <td>{mov.notes}</td>
                    <td><button className="btn btn-sm btn-secondary" onClick={() => { setSelectedMovement(mov); setIsMovementDetailModalOpen(true); }}>Ver Detalle</button></td>
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
                  {reportSelectedMaterial ? (
                    <div className="selected-material-display">
                      <span>{reportSelectedMaterial.name}</span>
                      <button onClick={() => setIsMaterialSelectionModalOpen(true)}>Cambiar</button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => setIsMaterialSelectionModalOpen(true)}><FaSearch /> Seleccionar Material</button>
                  )}
                </div>
              </div>
              {reportSelectedMaterial && (
                <div className="reports-actions">
                  <button className="btn btn-success-outline" onClick={handleExportKardexToExcel}><FaFileExcel /> Exportar Excel</button>
                  <button className="btn btn-danger-outline" onClick={handleExportKardexToPdf}><FaFilePdf /> Exportar PDF</button>
                </div>
              )}
            </div>
            {reportSelectedMaterial ? (
              <div className="kardex-table-container">
                <table className="kardex-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Detalle</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateKardexData(reportSelectedMaterial, filteredMovementsForKardex).map((item, index) => (
                      <tr key={index}>
                        <td>{item.date}</td>
                        <td>{item.notes}</td>
                        <td>{item.entry}</td>
                        <td>{item.exit}</td>
                        <td><strong>{item.balance}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="placeholder-view">
                <h2><FaHistory /> Kardex de Material</h2>
                <p>Selecciona un material para ver su historial detallado de movimientos.</p>
              </div>
            )}
          </div>
        )}

        {activeReportTab === 'alerts' && (
          <div className="report-content">
            <div className="detail-section low-stock-alerts">
              <div className="detail-section-header">
                <h4><FaExclamationTriangle /> Alertas de Stock Bajo</h4>
                <div className="detail-section-actions">
                  <button className="btn btn-sm btn-secondary" onClick={handleRefreshAlerts} disabled={loadingMaterials}><FaSync /> {loadingMaterials ? 'Actualizando...' : 'Actualizar Alertas'}</button>
                  <button className="btn btn-sm btn-success" disabled={lowStockItems.length === 0} onClick={() => setIsPurchaseOrderModalOpen(true)}><FaFileInvoice /> Generar Orden de Compra</button>
                </div>
              </div>
              {lowStockItems.length > 0 ? (
                <ul className="low-stock-list">
                  {lowStockItems.map(item => (
                    <li key={item.id}>
                      <span>{item.name} (ID: {item.id})</span>
                      <span className="low-stock-indicator">
                        {item.stock} / 20 {item.unit} {/* Mostrar 20 como el umbral de stock bajo */}
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
              <select value={valuationCategory} onChange={(e) => setValuationCategory(e.target.value)}>
                <option value="">Todas</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
                </div>
                <div className="filter-group">
                  <label>Proveedor:</label>
              <select value={valuationSupplier} onChange={(e) => setValuationSupplier(e.target.value)}>
                <option value="">Todos</option>
                {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="valuation-export-buttons">
              <button className="btn btn-success-outline" onClick={handleExportValuationToExcel}><FaFileExcel /> Exportar Excel</button>
              <button className="btn btn-danger-outline" onClick={handleExportValuationToPdf}><FaFilePdf /> Exportar PDF</button>
            </div>
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
                {filteredValuationMaterials.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{calculateStockAtDate(m, valuationDate)} {m.unit}</td>
                    <td>S/ {m.cost.toFixed(2)}</td>
                    <td>S/ {(calculateStockAtDate(m, valuationDate) * m.cost).toFixed(2)}</td>
                  </tr>
                ))}
                  </tbody>
              <tfoot>
                <tr className="valuation-total-row">
                  <td colSpan="3">Valor Total del Inventario Filtrado</td>
                  <td>S/ {filteredValuationMaterials.reduce((sum, item) => sum + (calculateStockAtDate(item, valuationDate) * item.cost), 0).toFixed(2)}</td>
                </tr>
              </tfoot>
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
        selectedMaterialId={movementMaterialId}
      />
      <MovementDetailModal
        isOpen={isMovementDetailModalOpen}
        onClose={() => setIsMovementDetailModalOpen(false)}
        movement={selectedMovement}
      />
      <MaterialSelectionModal
        isOpen={isMaterialSelectionModalOpen}
        onClose={() => setIsMaterialSelectionModalOpen(false)}
        onSelect={handleSelectMaterialForReport}
        materials={materials}
      />
      <PurchaseOrderModal
        isOpen={isPurchaseOrderModalOpen}
        onClose={() => setIsPurchaseOrderModalOpen(false)}
        onGenerate={handleGeneratePurchaseOrder}
        lowStockItems={lowStockItems}
      />
      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
      >
        <p>
          ¿Estás seguro de que deseas eliminar el material <strong>{deletingMaterial?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </ConfirmationModal>
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSave={handleSaveStockAdjustment}
        material={adjustingMaterial}
      />
    </div>
  );
};

export default RawMaterialInventory;