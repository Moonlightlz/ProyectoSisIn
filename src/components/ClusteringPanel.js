import React, { useState } from 'react';
import { saleService } from '../services/saleService';
import { rawMaterialService } from './rawMaterialService';
import { Scatter } from 'react-chartjs-2';
import { unparse } from 'papaparse';
import './ReportsPage.css';

function euclideanDistance(point1, point2) {
  if (point1.length !== point2.length) {
      throw new Error("Points must have the same number of dimensions.");
  }
  let sumOfSquares = 0;
  for (let i = 0; i < point1.length; i++) {
      sumOfSquares += (point1[i] - point2[i]) ** 2;
  }
  return Math.sqrt(sumOfSquares);
}

function initializeCentroids(data, k) {
  const centroids = [];
  const dataIndices = Array.from({ length: data.length }, (_, i) => i);

  for (let i = dataIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dataIndices[i], dataIndices[j]] = [dataIndices[j], dataIndices[i]];
  }

  for (let i = 0; i < k; i++) {
      centroids.push([...data[dataIndices[i]]]);
  }
  return centroids;
}

function assignToCentroids(data, centroids) {
  const assignments = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
      let minDistance = Infinity;
      let closestCentroidIndex = -1;
      for (let j = 0; j < centroids.length; j++) {
          const distance = euclideanDistance(data[i], centroids[j]);
          if (distance < minDistance) {
              minDistance = distance;
              closestCentroidIndex = j;
          }
      }
      assignments[i] = closestCentroidIndex;
  }
  return assignments;
}

function updateCentroids(data, assignments, k) {
  const newCentroids = Array.from({ length: k }, () => Array(data[0].length).fill(0));
  const centroidCounts = new Array(k).fill(0);

  for (let i = 0; i < data.length; i++) {
      const centroidIndex = assignments[i];
      centroidCounts[centroidIndex]++;
      for (let j = 0; j < data[i].length; j++) {
          newCentroids[centroidIndex][j] += data[i][j];
      }
  }

  for (let i = 0; i < k; i++) {
      if (centroidCounts[i] > 0) {
          for (let j = 0; j < newCentroids[i].length; j++) {
              newCentroids[i][j] /= centroidCounts[i];
          }
      } else {
          const randomIndex = Math.floor(Math.random() * data.length);
          newCentroids[i] = [...data[randomIndex]];
      }
  }
  return newCentroids;
}

function kmeans(data, k, maxIterations = 100) {
  if (k <= 0 || k > data.length) {
      throw new Error("k must be a positive integer less than or equal to the number of data points.");
  }
  if (data.length === 0 || data[0].length === 0) {
      throw new Error("Data cannot be empty.");
  }

  let centroids = initializeCentroids(data, k);
  let labels = [];
  let oldAssignments = [];

  for (let iter = 0; iter < maxIterations; iter++) {
      labels = assignToCentroids(data, centroids);

      if (iter > 0 && labels.every((val, idx) => val === oldAssignments[idx])) {
          console.log(`K-means converged after ${iter} iterations.`);
          break;
      }

      oldAssignments = [...labels];
      centroids = updateCentroids(data, labels, k);
  }

  return { centroids, labels };
}

function calculateMean(arr) {
  if (arr.length === 0) {
      return 0;
  }
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

function calculateStandardDeviation(arr, mean) {
  if (arr.length === 0) {
      return 0;
  }
  const sumOfSquaredDifferences = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0);
  return Math.sqrt(sumOfSquaredDifferences / arr.length);
}

function zScoreNormalize(data2D) {
  if (data2D.length === 0) {
      return [];
  }

  const numFeatures = data2D[0].length;
  const normalizedData = Array.from({ length: data2D.length }, () => new Array(numFeatures));

  for (let j = 0; j < numFeatures; j++) {
      const featureColumn = data2D.map(row => row[j]);
      const mean = calculateMean(featureColumn);
      const stdDev = calculateStandardDeviation(featureColumn, mean);

      if (stdDev === 0) {
          for (let i = 0; i < data2D.length; i++) {
              normalizedData[i][j] = 0;
          }
      } else {
          for (let i = 0; i < data2D.length; i++) {
              normalizedData[i][j] = (data2D[i][j] - mean) / stdDev;
          }
      }
  }
  return normalizedData;
}

const PERIODS = {
  MONTH: { days: 30, label: 'Mensual' },
  QUARTER: { days: 90, label: 'Trimestral' },
  SEMESTER: { days: 180, label: 'Semestral' }
};

const MATERIAL_GROUP_TYPES = {
  CATEGORY: 'Por Categoría',
  SUPPLIER: 'Por Proveedor',
  STOCK_LEVEL: 'Por Nivel de Stock',
  MOVEMENT: 'Por Rotación',
  COST: 'Por Costo'
};

function computeSalesFeature(sale) {
  // construye vector [log1p(totalAmount), totalQuantity]
  const totalAmount = sale.totalAmount || (sale.products ? sale.products.reduce((s, p) => s + (p.subtotal || (p.pricePerDozen ? p.pricePerDozen * (p.dozens || 0) : 0)), 0) : 0);
  const totalQuantity = sale.totalQuantity || (sale.products ? sale.products.reduce((s, p) => s + (p.quantity || 0), 0) : 0);
  return [Math.log1p(totalAmount), totalQuantity];
}

function computeMaterialFeature(mat, movements) {
  // Ahora retornamos un objeto con todas las características relevantes para diferentes tipos de agrupación
  const stock = Number(mat.stock || 0);
  const low = Number(mat.lowStockThreshold || 0);
  const cost = Number(mat.cost || 0);
  const movCount = Array.isArray(movements) ? movements.filter(m => m.type === 'salida').length : 0;
  const movValue = Array.isArray(movements) ? movements.reduce((sum, m) => {
    const qty = Number(m.quantity || 0);
    return sum + (m.type === 'salida' ? -qty : qty);
  }, 0) : 0;

  return {
    name: mat.name,
    category: mat.category,
    supplier: mat.supplier,
    stock,
    lowStockThreshold: low,
    cost,
    unit: mat.unit,
    movementCount: movCount,
    movementValue: movValue,
    rotacion: stock > 0 ? movCount / stock : 0
  };
}



const ClusteringPanel = () => {
  const [source, setSource] = useState('sales');
  const [k, setK] = useState(3);
  const [running, setRunning] = useState(false);
  const [clusterResult, setClusterResult] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('QUARTER');
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [materialGroupType, setMaterialGroupType] = useState('CATEGORY');
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState('');
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState('');

  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const runSales = async () => {
    try {
      setRunning(true);
      setInfoMessage('');
      const days = PERIODS[selectedPeriod].days;
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      
      const sales = await saleService.getSalesByPeriod(startDate, endDate);
      // cargar opciones disponibles si no existen
      if (availableProviders.length === 0 || availableProducts.length === 0 || availableSizes.length === 0) {
        const provs = [];
        const prods = new Map();
        const sizesSet = new Set();
        sales.forEach(s => {
          if (s.distributor?.name) provs.push(s.distributor.name);
          (s.products || []).forEach(p => {
            if (p.productId) prods.set(p.productId, p.productName || p.productId);
            if (p.sizes) {
              const parts = String(p.sizes).split(',').map(x => x.trim()).filter(Boolean);
              parts.forEach(sz => sizesSet.add(sz));
            }
          });
        });
        setAvailableProviders(Array.from(new Set(provs)));
        setAvailableProducts(Array.from(prods.entries()).map(([id, name]) => ({ id, name })));
        setAvailableSizes(Array.from(sizesSet));
        // seleccionar Todos por defecto
        setSelectedProviders('');
        setSelectedProducts('');
        setSelectedSizes('');
      }
      // aplicar filtros
      let filteredSales = sales;
      if (selectedProviders && selectedProviders !== '') {
        filteredSales = filteredSales.filter(s => selectedProviders === (s.distributor?.name || ''));
      }
      if (selectedProducts && selectedProducts !== '') {
        filteredSales = filteredSales.filter(s => (s.products || []).some(p => selectedProducts === p.productId));
     }
      if (selectedSizes && selectedSizes !== '') {
        filteredSales = filteredSales.filter(s => (s.products || []).some(p => {
          const parts = String(p.sizes || '').split(',').map(x => x.trim()).filter(Boolean);
          return parts.some(sz => selectedSizes === sz);
        }));
      }
  const vectors = filteredSales.map(s => computeSalesFeature(s));
  const MAX_SAMPLES = 1500;
  let usedSales = sales;
  let usedVectors = vectors;
  if (vectors.length > MAX_SAMPLES) {
        // muestreo aleatorio sin reemplazo
        const indices = Array.from({ length: vectors.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const selected = indices.slice(0, MAX_SAMPLES).sort((a,b) => a-b);
        usedSales = selected.map(i => sales[i]);
        usedVectors = selected.map(i => vectors[i]);
        setInfoMessage(`Se usaron ${usedVectors.length} de ${vectors.length} registros (máx ${MAX_SAMPLES}).`);
      }
  const effectiveK = Math.max(2, Math.min(k, Math.min(10, Math.max(2, usedVectors.length))));
  const normMatrix = zScoreNormalize(usedVectors);
  const { labels, centroids } = kmeans(normMatrix, effectiveK);
  const clusters = {};
  labels.forEach((lab, i) => { clusters[lab] = clusters[lab] || []; clusters[lab].push(usedSales[i]); });
{/* */}
  setClusterResult({ labels, clusters, totalItems: sales.length, usedItems: usedSales.length, effectiveK, usedVectors: normMatrix, centroids });
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  };

  const runMaterials = async () => {
    setRunning(true);
    setInfoMessage('');
    
    try {
      const days = PERIODS[selectedPeriod].days;
      console.log('Obteniendo materiales...');
      const mats = await rawMaterialService.getRawMaterials();
      console.log('Materiales obtenidos:', mats.length);
      const rows = [];
      
      console.log('Procesando movimientos...');
      for (const m of mats) {
          try {
            const movements = await rawMaterialService.getMaterialMovements(m.id, days);
            const materialFeatures = computeMaterialFeature(m, movements);
            rows.push({ mat: m, movements, features: materialFeatures });
          } catch (err) {
            console.error('Error al procesar material:', m.id, err);
            // Continuamos con el siguiente material
          }
      }
      console.log('Movimientos procesados:', rows.length);

      // cargar opciones si es necesario
      if (availableSuppliers.length === 0 || availableCategories.length === 0) {
        const supps = new Set();
        const cats = new Set();
        rows.forEach(r => {
          if (r.mat?.supplier) supps.add(r.mat.supplier);
          if (r.mat?.category) cats.add(r.mat.category);
        });
        setAvailableSuppliers(Array.from(supps));
        setAvailableCategories(Array.from(cats));
        setSelectedSuppliers('');
        setSelectedCategories('');
      }

      // aplicar filtros de materias primas
      let filteredRows = rows;
      if (selectedSuppliers && selectedSuppliers !== '') {
        filteredRows = filteredRows.filter(r => selectedSuppliers === (r.mat?.supplier || ''));
      }
      if (selectedCategories && selectedCategories !== '') {
        filteredRows = filteredRows.filter(r => selectedCategories === (r.mat?.category || ''));
      }

      // Asegurarse de que hay datos antes de procesar
      if (filteredRows.length === 0) {
        setInfoMessage('No hay datos suficientes para realizar el análisis en el período seleccionado.');
        setRunning(false);
        return;
      }

      // Agrupar materiales según el criterio seleccionado
      const groupedMaterials = {};

      switch (materialGroupType) {
        case 'CATEGORY':
          filteredRows.forEach(r => {
            const category = r.mat.category || 'Sin Categoría';
            groupedMaterials[category] = groupedMaterials[category] || [];
            groupedMaterials[category].push(r);
          });
          break;

        case 'SUPPLIER':
          filteredRows.forEach(r => {
            const supplier = r.mat.supplier || 'Sin Proveedor';
            groupedMaterials[supplier] = groupedMaterials[supplier] || [];
            groupedMaterials[supplier].push(r);
          });
          break;

        case 'STOCK_LEVEL':
          filteredRows.forEach(r => {
            let level = 'Normal';
            const stock = r.mat.stock || 0;
            const threshold = r.mat.lowStockThreshold || 0;
            
            if (stock <= threshold) {
              level = 'Stock Bajo';
            } else if (stock <= threshold * 1.5) {
              level = 'Stock Medio';
         } else {
              level = 'Stock Alto';
            }
            
            groupedMaterials[level] = groupedMaterials[level] || [];
            groupedMaterials[level].push(r);
          });
          break;

        case 'MOVEMENT':
          filteredRows.forEach(r => {
            const rotacion = r.features.rotacion;
            let nivel = 'Sin Movimiento';
            
            if (rotacion > 2) {
              nivel = 'Alta Rotación';
            } else if (rotacion > 0.5) {
              nivel = 'Rotación Media';
{/* */}
            } else if (rotacion > 0) {
              nivel = 'Baja Rotación';
            }
            
            groupedMaterials[nivel] = groupedMaterials[nivel] || [];
         groupedMaterials[nivel].push(r);
          });
          break;

        case 'COST':
          filteredRows.forEach(r => {
            const cost = r.mat.cost || 0;
            let rango = 'Sin Costo';
            
            if (cost > 100) {
              rango = 'Costo Alto (>S/100)';
            } else if (cost > 50) {
              rango = 'Costo Medio (S/50-100)';
            } else if (cost > 0) {
              rango = 'Costo Bajo (<S/50)';
            }
            
            groupedMaterials[rango] = groupedMaterials[rango] || [];
            groupedMaterials[rango].push(r);
          });
          break;
      }

      // Crear un "cluster" por cada grupo
      const clusters = {};
      Object.entries(groupedMaterials).forEach(([group, items], idx) => {
        clusters[idx] = items;
      });

      // Actualizar el resultado
      setClusterResult({
        labels: Object.keys(clusters).map(Number),
        clusters,
        totalItems: filteredRows.length,
        usedItems: filteredRows.length,
        effectiveK: Object.keys(clusters).length,
        groupNames: Object.keys(groupedMaterials)
      });
    } catch (e) {
      console.error(e);
      setInfoMessage('Error al procesar los datos: ' + e.message);
    }
    setRunning(false);
  };

  const onRun = async () => {
    console.log('Iniciando análisis...');
    setClusterResult(null);
    try {
      if (source === 'sales') {
        await runSales();
      } else {
        await runMaterials();
      }
    } catch (error) {
      console.error('Error al ejecutar clustering:', error);
      setInfoMessage('Error al procesar los datos: ' + error.message);
      setRunning(false);
    }
  };

  const clusterName = (idx) => {
    if (clusterResult?.groupNames && clusterResult.groupNames[idx]) {
      return clusterResult.groupNames[idx];
    }
    if (typeof idx !== 'number') return 'Grupo Inválido';
    if (idx < 26) return `Grupo ${String.fromCharCode(65 + idx)}`;
    return `Grupo ${idx + 1}`;
  };

  const exportCSV = () => {
    if (!clusterResult) return;
    const rows = [];
    if (source === 'sales') {
      Object.keys(clusterResult.clusters).forEach((lab) => {
        clusterResult.clusters[lab].forEach(sale => {
          rows.push({ id: sale.id, saleNumber: sale.saleNumber || '', date: sale.date ? sale.date.toString() : '', totalAmount: sale.totalAmount || 0, totalQuantity: sale.totalQuantity || 0, cluster: clusterName(Number(lab)) });
        });
      });
    } else {
      Object.keys(clusterResult.clusters).forEach((lab) => {
        clusterResult.clusters[lab].forEach(row => {
          const m = row.mat || {};
          rows.push({ id: m.id, name: m.name || '', stock: m.stock || 0, lowStockThreshold: m.lowStockThreshold || '', cluster: clusterName(Number(lab)) });
        });
      });
    }
    const csv = unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source}-clusters.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderResult = () => {
    if (!clusterResult) return null;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a78bfa', '#ef4444', '#84cc16'];

    let datasets;
    let clusterPoints;

    if (source === 'sales') {
      datasets = Object.entries(clusterResult.clusters).map(([idx, items]) => ({
        label: clusterName(Number(idx)),
        data: clusterResult.usedVectors
          .map((vec, i) => (clusterResult.labels[i] === Number(idx) ? { x: vec[0], y: vec[1] } : null))
          .filter(Boolean),
        backgroundColor: colors[Number(idx) % colors.length],
        pointRadius: 3,
        pointHoverRadius: 5,
      }));
      clusterPoints = Object.values(clusterResult.clusters);
    } else { // materials
      datasets = Object.entries(clusterResult.clusters).map(([idx, items]) => ({
        label: clusterName(Number(idx)),
        data: items.map(item => ({ x: item.mat?.stock || 0, y: item.mat?.lowStockThreshold || 0 })),
        backgroundColor: colors[Number(idx) % colors.length],
        pointRadius: 3,
        pointHoverRadius: 5,
      }));
      clusterPoints = Object.values(clusterResult.clusters);
    }

    const chartOptions = {
      scales: {
        x: { 
          title: { 
            display: true, 
            text: source === 'sales' ? 'Monto Total (log)' : 'Stock Actual'
          },
          beginAtZero: true
        },
        y: { 
          title: { 
            display: true, 
            text: source === 'sales' ? 'Cantidad Total' : 'Stock Mínimo'
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 10 } },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const item = clusterPoints[context.datasetIndex][context.dataIndex];
              if (source === 'sales') {
                return `${label}: Monto ${Math.exp(context.parsed.x).toFixed(0)}, Cantidad ${context.parsed.y.toFixed(0)}`;
              } else {
                return `${label}: ${item.mat?.name || 'Sin nombre'}\nStock: ${item.mat?.stock || 0}, Mínimo: ${item.mat?.lowStockThreshold || 0}\nProveedor: ${item.mat?.supplier || 'Sin proveedor'}`;
              }
            }
          },
        },
      }, 
      maintainAspectRatio: false,
      responsive: true,
      animation: false
    };

    return (
      <div className="chart-card clustering-card">
        <h3>Resultado</h3>
        <div style={{ height: '350px', position: 'relative', marginBottom: '20px' }}>
          <Scatter
            data={{ datasets }}
            options={chartOptions}
            redraw={false}
          />
        </div>
{infoMessage && <p style={{ marginTop: 8, color: '#475569' }}>{infoMessage}</p>}
        
        {/* --- INICIA CORRECCIÓN --- */}
        <p style={{ marginTop: 6, color: '#64748b' }}>
          K usado: {clusterResult.effectiveK} — registros totales: {clusterResult.totalItems} — registros usados: {clusterResult.usedItems}
        </p> 
        {/* --- FIN CORRECCIÓN --- */}

        <p style={{ marginTop: 4, color: '#64748b', fontSize: '0.85rem' }}>
          Nota: Los valores en el gráfico están normalizados para mejor comparación.
          {/* ... (el resto de tu código) ... */}
        </p>
        <table className="sales-table cluster-summary-table">
 <thead>
 <tr>
 <th>{source === 'sales' ? 'Cluster' : 'Grupo'}</th>
 <th className="text-right"># Elementos</th>
              {source === 'sales' ? (
 <>
 <th className="text-right">Monto Promedio</th>
 <th className="text-right">Cantidad Promedio</th>
 </>
              ) : (
                <><th className="text-right">Stock Promedio</th><th className="text-right">Umbral Promedio</th></>
              )}
 <th>{source === 'sales' ? 'Distribuidores Principales' : 'Proveedores Principales'}</th>
 </tr>
 </thead>
 <tbody>
            {Object.entries(clusterResult.clusters).map(([idx, items]) => {
              let avgAmount = 0;
              let avgQty = 0;
              if (source === 'sales' && items.length > 0) {
                const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
                const totalQty = items.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
                avgAmount = totalAmount / items.length;
                avgQty = totalQty / items.length;
              } else if (source === 'materials' && items.length > 0) {
                const totalStock = items.reduce((sum, item) => sum + (item.mat?.stock || 0), 0);
                const totalThreshold = items.reduce((sum, item) => sum + (item.mat?.lowStockThreshold || 0), 0);
                avgAmount = totalStock / items.length; // Reutilizamos avgAmount para stock promedio
                avgQty = totalThreshold / items.length; // Reutilizamos avgQty para umbral promedio
              }

              return (
 <tr key={idx}>
 <td><strong>{clusterName(Number(idx))}</strong></td>
 <td className="text-right">{items.length}</td>
                  {source === 'sales' ? (
 <>
 <td className="text-right">S/ {avgAmount.toFixed(2)}</td>
 <td className="text-right">{avgQty.toFixed(2)}</td>
 </>
                  ) : (
 <>
 <td className="text-right">{avgAmount.toFixed(0)}</td>
 <td className="text-right">{avgQty.toFixed(0)}</td>
 </>
                  )}
 <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {items.slice(0, 3).map(it => 
                      source === 'sales' 
                        ? (it.distributor?.name || 'Sin distribuidor') 
                        : (it.mat?.supplier || 'Sin proveedor')
                    ).join(', ')}
 </td>
 </tr>
              );
            })}
 </tbody>
 </table>
      </div>
    );
 };
 return (
 <div className="chart-card clustering-card">
 <div className="chart-header"><h3>Clustering</h3></div>

 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', alignItems: 'flex-end', marginBottom: 12 }}>
 <div className="filter-group">
 <label>Fuente:</label>
 <select value={source} onChange={e => setSource(e.target.value)}>
 <option value="sales">Ventas</option>
 <option value="materials">Materia Prima</option>
 </select>
 </div>

        {source === 'sales' ? (
 <>
 <div className="filter-group">
 <label>Período:</label>
 <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                {Object.entries(PERIODS).map(([key, { label }]) => (
 <option key={key} value={key}>{label}</option>
                ))}
 </select>
 </div>
 <div className="filter-group">
 <label>Distribuidores:</label>
 <select value={selectedProviders} onChange={e => setSelectedProviders(e.target.value)}>
 <option value="">Todos</option>
                {availableProviders.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 </div>
 <div className="filter-group">
 <label>Productos:</label>
 <select value={selectedProducts} onChange={e => setSelectedProducts(e.target.value)}>
 <option value="">Todos</option>
                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </div>
 <div className="filter-group">
 <label>Tallas:</label>
 <select value={selectedSizes} onChange={e => setSelectedSizes(e.target.value)}>
 <option value="">Todas</option>
                {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 </>
        ) : (
 <>
 <div className="filter-group">
 <label>Agrupar por:</label>
 <select value={materialGroupType} onChange={e => setMaterialGroupType(e.target.value)}>
                {Object.entries(MATERIAL_GROUP_TYPES).map(([key, label]) => (
 <option key={key} value={key}>{label}</option>
                ))}
 </select>
 </div>
 <div className="filter-group">
 <label>Período de Movimiento:</label>
 <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                {Object.entries(PERIODS).map(([key, { label }]) => (
 <option key={key} value={key}>{label}</option>
                ))}
 </select>
 </div>
 <div className="filter-group">
 <label>Proveedores:</label>
 <select value={selectedSuppliers} onChange={e => setSelectedSuppliers(e.target.value)}>
 <option value="">Todos</option>
                {availableSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 <div className="filter-group">
 <label>Categorías:</label>
 <select value={selectedCategories} onChange={e => setSelectedCategories(e.target.value)}>
 <option value="">Todas</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 </>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {source === 'sales' && (
 <div className="filter-group">
 <label>Clusters (K):</label>
 <input type="number" value={k} onChange={e => setK(Math.max(2, Number(e.target.value)))} min="2" max="10" style={{ width: 60 }} />
 </div>
          )}
 <button onClick={onRun} disabled={running} className="btn btn-primary">
            {running ? 'Analizando...' : 'Analizar'}
 </button>
          {clusterResult && (
 <button onClick={exportCSV} className="btn btn-secondary">
 Exportar CSV
 </button>
          )}
        </div>
 </div>

      {running && <div className="loading-overlay"><div className="spinner"></div></div>}
      {infoMessage && !clusterResult && <p style={{ marginTop: 12, color: '#475569' }}>{infoMessage}</p>}

      {renderResult()}
 </div>
  );
};

export default ClusteringPanel;