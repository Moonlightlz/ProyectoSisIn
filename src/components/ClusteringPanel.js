import React, { useState, useMemo, useCallback } from 'react';
import { saleService } from '../services/saleService';
import { rawMaterialService } from './rawMaterialService';
import { Scatter } from 'react-chartjs-2';
import Papa from 'papaparse';
import { FaChartLine, FaPlay, FaDownload, FaInfoCircle, FaLightbulb, FaQuestionCircle } from 'react-icons/fa';
import './ClusteringPanel.css';

// ============= ALGORITMO K-MEANS =============

function euclideanDistance(point1, point2) {
  if (point1.length !== point2.length) {
    throw new Error("Los puntos deben tener la misma cantidad de dimensiones.");
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

  // Shuffle usando Fisher-Yates
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
      // Si un cluster está vacío, reinicializar con un punto aleatorio
      const randomIndex = Math.floor(Math.random() * data.length);
      newCentroids[i] = [...data[randomIndex]];
    }
  }
  return newCentroids;
}

function kmeans(data, k, maxIterations = 100) {
  if (k <= 0 || k > data.length) {
    throw new Error("K debe ser un número positivo menor o igual al número de datos.");
  }
  if (data.length === 0 || data[0].length === 0) {
    throw new Error("Los datos no pueden estar vacíos.");
  }

  let centroids = initializeCentroids(data, k);
  let labels = [];
  let oldAssignments = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    labels = assignToCentroids(data, centroids);

    if (iter > 0 && labels.every((val, idx) => val === oldAssignments[idx])) {
      console.log(`✓ K-means convergió después de ${iter} iteraciones.`);
      break;
    }

    oldAssignments = [...labels];
    centroids = updateCentroids(data, labels, k);
  }

  return { centroids, labels };
}

// ============= NORMALIZACIÓN =============

function calculateMean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((acc, val) => acc + val, 0) / arr.length;
}

function calculateStandardDeviation(arr, mean) {
  if (arr.length === 0) return 0;
  const sumOfSquaredDifferences = arr.reduce((acc, val) => acc + (val - mean) ** 2, 0);
  return Math.sqrt(sumOfSquaredDifferences / arr.length);
}

function zScoreNormalize(data2D) {
  if (data2D.length === 0) return [];

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

// ============= CONFIGURACIÓN =============

const PERIODS = {
  MONTH: { days: 30, label: 'Último Mes (30 días)' },
  QUARTER: { days: 90, label: 'Último Trimestre (90 días)' },
  SEMESTER: { days: 180, label: 'Último Semestre (180 días)' }
};

const MATERIAL_GROUP_TYPES = {
  CATEGORY: { key: 'CATEGORY', label: 'Por Categoría', description: 'Agrupa materiales según su categoría' },
  SUPPLIER: { key: 'SUPPLIER', label: 'Por Proveedor', description: 'Agrupa materiales por proveedor' },
  STOCK_LEVEL: { key: 'STOCK_LEVEL', label: 'Por Nivel de Stock', description: 'Agrupa según stock bajo/medio/alto' },
  MOVEMENT: { key: 'MOVEMENT', label: 'Por Rotación', description: 'Agrupa según frecuencia de uso' },
  COST: { key: 'COST', label: 'Por Costo', description: 'Agrupa según rango de costos' }
};

// ============= FUNCIONES DE CARACTERÍSTICAS =============

function computeSalesFeature(sale) {
  const totalAmount = sale.totalAmount || (sale.products ? sale.products.reduce((s, p) => s + (p.subtotal || (p.pricePerDozen ? p.pricePerDozen * (p.dozens || 0) : 0)), 0) : 0);
  const totalQuantity = sale.totalQuantity || (sale.products ? sale.products.reduce((s, p) => s + (p.quantity || 0), 0) : 0);
  return [Math.log1p(totalAmount), totalQuantity];
}

function computeMaterialFeature(mat, movements) {
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

// ============= COMPONENTE PRINCIPAL =============

const ClusteringPanel = () => {
  // Estados
  const [source, setSource] = useState('sales');
  const [k, setK] = useState(3);
  const [running, setRunning] = useState(false);
  const [clusterResult, setClusterResult] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('QUARTER');
  
  // Filtros de ventas
  const [availableProviders, setAvailableProviders] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState('');
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState('');
  
  // Filtros de materiales
  const [materialGroupType, setMaterialGroupType] = useState('CATEGORY');
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState('');

  // ============= LÓGICA DE ANÁLISIS DE VENTAS =============

  const runSales = useCallback(async () => {
    try {
      setRunning(true);
      setInfoMessage('');
      
      const days = PERIODS[selectedPeriod].days;
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
      
      console.log(`📊 Cargando ventas de los últimos ${days} días...`);
      const sales = await saleService.getSalesByPeriod(startDate, endDate);
      
      if (sales.length === 0) {
        setInfoMessage('No se encontraron ventas en el período seleccionado.');
        setRunning(false);
        return;
      }

      // Cargar opciones disponibles para filtros
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
      }

      // Aplicar filtros
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

      if (filteredSales.length === 0) {
        setInfoMessage('No se encontraron ventas con los filtros aplicados.');
        setRunning(false);
        return;
      }

      // Construir vectores de características
      const vectors = filteredSales.map(s => computeSalesFeature(s));
      
      // Limitar a 1500 muestras para rendimiento
      const MAX_SAMPLES = 1500;
      let usedSales = filteredSales;
      let usedVectors = vectors;
      
      if (vectors.length > MAX_SAMPLES) {
        const indices = Array.from({ length: vectors.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const selected = indices.slice(0, MAX_SAMPLES).sort((a, b) => a - b);
        usedSales = selected.map(i => filteredSales[i]);
        usedVectors = selected.map(i => vectors[i]);
        setInfoMessage(`Se analizaron ${usedVectors.length} de ${vectors.length} registros (máximo ${MAX_SAMPLES} para optimizar el rendimiento).`);
      }

      // Ejecutar K-means
      const effectiveK = Math.max(2, Math.min(k, Math.min(10, usedVectors.length)));
      console.log(`🎯 Ejecutando K-means con K=${effectiveK}...`);
      
      const normMatrix = zScoreNormalize(usedVectors);
      const { labels, centroids } = kmeans(normMatrix, effectiveK);
      
      // Agrupar resultados
      const clusters = {};
      labels.forEach((lab, i) => {
        clusters[lab] = clusters[lab] || [];
        clusters[lab].push(usedSales[i]);
      });

      setClusterResult({
        labels,
        clusters,
        totalItems: filteredSales.length,
        usedItems: usedSales.length,
        effectiveK,
        usedVectors: normMatrix,
        centroids
      });
      
      console.log('✅ Análisis completado');
    } catch (e) {
      console.error('❌ Error en análisis de ventas:', e);
      setInfoMessage('Error al procesar los datos: ' + e.message);
    }
    setRunning(false);
  }, [selectedPeriod, selectedProviders, selectedProducts, selectedSizes, k, availableProviders.length, availableProducts.length, availableSizes.length]);

  // ============= LÓGICA DE ANÁLISIS DE MATERIALES =============

  const runMaterials = useCallback(async () => {
    setRunning(true);
    setInfoMessage('');
    
    try {
      const days = PERIODS[selectedPeriod].days;
      console.log('📦 Obteniendo materiales...');
      const mats = await rawMaterialService.getRawMaterials();
      console.log(`✓ ${mats.length} materiales obtenidos`);
      
      if (mats.length === 0) {
        setInfoMessage('No hay materiales registrados en el sistema.');
        setRunning(false);
        return;
      }

      const rows = [];
      
      console.log('📊 Procesando movimientos...');
      for (const m of mats) {
        try {
          const movements = await rawMaterialService.getMaterialMovements(m.id, days);
          const materialFeatures = computeMaterialFeature(m, movements);
          rows.push({ mat: m, movements, features: materialFeatures });
        } catch (err) {
          console.error(`⚠️ Error al procesar material ${m.id}:`, err);
        }
      }
      console.log(`✓ ${rows.length} materiales procesados`);

      // Cargar opciones para filtros
      if (availableSuppliers.length === 0 || availableCategories.length === 0) {
        const supps = new Set();
        const cats = new Set();
        rows.forEach(r => {
          if (r.mat?.supplier) supps.add(r.mat.supplier);
          if (r.mat?.category) cats.add(r.mat.category);
        });
        setAvailableSuppliers(Array.from(supps));
        setAvailableCategories(Array.from(cats));
      }

      // Aplicar filtros
      let filteredRows = rows;
      if (selectedSuppliers && selectedSuppliers !== '') {
        filteredRows = filteredRows.filter(r => selectedSuppliers === (r.mat?.supplier || ''));
      }
      if (selectedCategories && selectedCategories !== '') {
        filteredRows = filteredRows.filter(r => selectedCategories === (r.mat?.category || ''));
      }

      if (filteredRows.length === 0) {
        setInfoMessage('No hay datos suficientes con los filtros seleccionados.');
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
              level = 'Stock Crítico';
            } else if (stock <= threshold * 1.5) {
              level = 'Stock Bajo';
            } else if (stock <= threshold * 3) {
              level = 'Stock Normal';
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
            let rango = 'Sin Costo Definido';
            
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
        
        default:
          break;
      }

      // Crear resultado
      const clusters = {};
      Object.entries(groupedMaterials).forEach(([group, items], idx) => {
        clusters[idx] = items;
      });

      setClusterResult({
        labels: Object.keys(clusters).map(Number),
        clusters,
        totalItems: filteredRows.length,
        usedItems: filteredRows.length,
        effectiveK: Object.keys(clusters).length,
        groupNames: Object.keys(groupedMaterials)
      });
      
      console.log('✅ Agrupación completada');
    } catch (e) {
      console.error('❌ Error en análisis de materiales:', e);
      setInfoMessage('Error al procesar los datos: ' + e.message);
    }
    setRunning(false);
  }, [selectedPeriod, materialGroupType, selectedSuppliers, selectedCategories, availableSuppliers.length, availableCategories.length]);

  // ============= EJECUCIÓN PRINCIPAL =============

  const onRun = useCallback(async () => {
    console.log('🚀 Iniciando análisis de clustering...');
    setClusterResult(null);
    try {
      if (source === 'sales') {
        await runSales();
      } else {
        await runMaterials();
      }
    } catch (error) {
      console.error('❌ Error al ejecutar clustering:', error);
      setInfoMessage('Error al procesar los datos: ' + error.message);
      setRunning(false);
    }
  }, [source, runSales, runMaterials]);

  // ============= UTILIDADES =============

  const clusterName = useCallback((idx) => {
    if (clusterResult?.groupNames && clusterResult.groupNames[idx]) {
      return clusterResult.groupNames[idx];
    }
    if (typeof idx !== 'number') return 'Grupo Inválido';
    if (idx < 26) return `Grupo ${String.fromCharCode(65 + idx)}`;
    return `Grupo ${idx + 1}`;
  }, [clusterResult]);

  const exportCSV = useCallback(() => {
    if (!clusterResult) return;
    
    const rows = [];
    if (source === 'sales') {
      Object.keys(clusterResult.clusters).forEach((lab) => {
        clusterResult.clusters[lab].forEach(sale => {
          rows.push({
            id: sale.id,
            saleNumber: sale.saleNumber || '',
            date: sale.date ? sale.date.toString() : '',
            totalAmount: sale.totalAmount || 0,
            totalQuantity: sale.totalQuantity || 0,
            cluster: clusterName(Number(lab))
          });
        });
      });
    } else {
      Object.keys(clusterResult.clusters).forEach((lab) => {
        clusterResult.clusters[lab].forEach(row => {
          const m = row.mat || {};
          rows.push({
            id: m.id,
            name: m.name || '',
            stock: m.stock || 0,
            lowStockThreshold: m.lowStockThreshold || '',
            category: m.category || '',
            supplier: m.supplier || '',
            cluster: clusterName(Number(lab))
          });
        });
      });
    }
    
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clustering-${source}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('📥 Archivo CSV exportado');
  }, [clusterResult, source, clusterName]);

  // ============= RENDERIZADO DE RESULTADOS =============

  const chartData = useMemo(() => {
    if (!clusterResult) return null;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];

    let datasets;
    let clusterPoints;

    if (source === 'sales') {
      datasets = Object.entries(clusterResult.clusters).map(([idx, items]) => ({
        label: clusterName(Number(idx)),
        data: clusterResult.usedVectors
          .map((vec, i) => (clusterResult.labels[i] === Number(idx) ? { x: vec[0], y: vec[1] } : null))
          .filter(Boolean),
        backgroundColor: colors[Number(idx) % colors.length],
        pointRadius: 4,
        pointHoverRadius: 6,
      }));
      clusterPoints = Object.values(clusterResult.clusters);
    } else {
      datasets = Object.entries(clusterResult.clusters).map(([idx, items]) => ({
        label: clusterName(Number(idx)),
        data: items.map(item => ({ x: item.mat?.stock || 0, y: item.mat?.lowStockThreshold || 0 })),
        backgroundColor: colors[Number(idx) % colors.length],
        pointRadius: 4,
        pointHoverRadius: 6,
      }));
      clusterPoints = Object.values(clusterResult.clusters);
    }

    const chartOptions = {
      scales: {
        x: {
          title: {
            display: true,
            text: source === 'sales' ? 'Monto Total (escala logarítmica normalizada)' : 'Stock Actual',
            font: { size: 12, weight: '600' }
          },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        y: {
          title: {
            display: true,
            text: source === 'sales' ? 'Cantidad Total (normalizada)' : 'Umbral de Stock Mínimo',
            font: { size: 12, weight: '600' }
          },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const item = clusterPoints[context.datasetIndex][context.dataIndex];
              if (source === 'sales') {
                const amount = Math.exp(context.parsed.x) - 1;
                return `${label}: S/${amount.toFixed(2)} • ${context.parsed.y.toFixed(0)} unidades`;
              } else {
                return [
                  `${label}: ${item.mat?.name || 'Sin nombre'}`,
                  `Stock: ${item.mat?.stock || 0} • Mínimo: ${item.mat?.lowStockThreshold || 0}`,
                  `Proveedor: ${item.mat?.supplier || 'Sin proveedor'}`
                ];
              }
            }
          },
        },
      },
      maintainAspectRatio: false,
      responsive: true,
      animation: { duration: 800 }
    };

    return { datasets, chartOptions };
  }, [clusterResult, source, clusterName]);

  const renderResult = () => {
    if (!clusterResult || !chartData) return null;

    return (
      <div className="clustering-results">
        <div className="results-header">
          <h3><FaChartLine /> Resultados del Análisis</h3>
          <div className="results-meta">
            <div className="meta-item">
              <FaInfoCircle />
              <span>Grupos identificados: <strong>{clusterResult.effectiveK}</strong></span>
            </div>
            <div className="meta-item">
              <span>Total de registros: <strong>{clusterResult.totalItems}</strong></span>
            </div>
            <div className="meta-item">
              <span>Registros analizados: <strong>{clusterResult.usedItems}</strong></span>
            </div>
          </div>
        </div>

        {infoMessage && (
          <div className="info-message">
            <FaInfoCircle /> {infoMessage}
          </div>
        )}

        <div className="chart-container">
          <Scatter data={{ datasets: chartData.datasets }} options={chartData.chartOptions} />
        </div>

        <div className="chart-explanation">
          <strong><FaLightbulb /> ¿Cómo interpretar este gráfico?</strong>
          {source === 'sales' ? (
            <p>
              Cada punto representa una venta. Los puntos del mismo color pertenecen al mismo grupo (cluster).
              Los grupos se forman según la similitud en el monto y cantidad de productos vendidos.
              <strong> Grupos alejados entre sí representan patrones de venta muy diferentes.</strong>
            </p>
          ) : (
            <p>
              Cada punto representa un material. Los materiales se agrupan según el criterio seleccionado
              ({MATERIAL_GROUP_TYPES[materialGroupType]?.description}).
              <strong> Esto permite identificar rápidamente materiales con características similares.</strong>
            </p>
          )}
        </div>

        <div className="cluster-summary">
          <h4>📋 Resumen de Grupos</h4>
          <table className="cluster-table">
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
                  <>
                    <th className="text-right">Stock Promedio</th>
                    <th className="text-right">Umbral Promedio</th>
                  </>
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
                  avgAmount = totalStock / items.length;
                  avgQty = totalThreshold / items.length;
                }

                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];
                const color = colors[Number(idx) % colors.length];

                return (
                  <tr key={idx}>
                    <td>
                      <div className="cluster-name">
                        <span className="cluster-badge" style={{ backgroundColor: color }}></span>
                        <strong>{clusterName(Number(idx))}</strong>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="cluster-count">{items.length}</span>
                    </td>
                    {source === 'sales' ? (
                      <>
                        <td className="text-right">S/ {avgAmount.toFixed(2)}</td>
                        <td className="text-right">{avgQty.toFixed(1)}</td>
                      </>
                    ) : (
                      <>
                        <td className="text-right">{avgAmount.toFixed(0)}</td>
                        <td className="text-right">{avgQty.toFixed(0)}</td>
                      </>
                    )}
                    <td>
                      <span className="cluster-details">
                        {items.slice(0, 3).map(it =>
                          source === 'sales'
                            ? (it.distributor?.name || 'Sin distribuidor')
                            : (it.mat?.supplier || 'Sin proveedor')
                        ).join(', ')}
                        {items.length > 3 && ` (+${items.length - 3} más)`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============= RENDERIZADO PRINCIPAL =============

  return (
    <div className="clustering-container">
      <div className="clustering-header">
        <h2>
          <FaChartLine /> Análisis de Clustering
        </h2>
        <p className="clustering-subtitle">
          Agrupa automáticamente datos similares para identificar patrones y tendencias en ventas o inventario
        </p>
      </div>

      {/* Caja de información educativa */}
      <div className="info-box">
        <div className="info-box-header">
          <FaQuestionCircle />
          <h3>¿Qué es Clustering?</h3>
        </div>
        <div className="info-box-content">
          <p>
            <strong>Clustering</strong> es una técnica que agrupa datos similares automáticamente.
            En este sistema, te ayuda a:
          </p>
          <p>
            <strong>• Para Ventas:</strong> Identificar patrones de compra similares, segmentar clientes
            y encontrar oportunidades de venta cruzada.
          </p>
          <p>
            <strong>• Para Materiales:</strong> Organizar inventario por características comunes,
            optimizar compras y detectar materiales con comportamiento similar.
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="clustering-controls">
        <div className="controls-grid">
          <div className="control-group">
            <label>
              <FaInfoCircle className="tooltip-icon" title="Selecciona qué datos deseas analizar" />
              Fuente de Datos
            </label>
            <select value={source} onChange={e => setSource(e.target.value)}>
              <option value="sales">Ventas</option>
              <option value="materials">Materia Prima</option>
            </select>
          </div>

          {source === 'sales' ? (
            <>
              <div className="control-group">
                <label>Período de Análisis</label>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                  {Object.entries(PERIODS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>
                  <FaQuestionCircle className="tooltip-icon" title="Número de grupos a formar (2-10)" />
                  Número de Grupos (K)
                </label>
                <input
                  type="number"
                  value={k}
                  onChange={e => setK(Math.max(2, Math.min(10, Number(e.target.value))))}
                  min="2"
                  max="10"
                />
              </div>

              <div className="control-group">
                <label>Filtrar por Distribuidor</label>
                <select value={selectedProviders} onChange={e => setSelectedProviders(e.target.value)}>
                  <option value="">Todos los distribuidores</option>
                  {availableProviders.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="control-group">
                <label>Filtrar por Producto</label>
                <select value={selectedProducts} onChange={e => setSelectedProducts(e.target.value)}>
                  <option value="">Todos los productos</option>
                  {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="control-group">
                <label>Filtrar por Talla</label>
                <select value={selectedSizes} onChange={e => setSelectedSizes(e.target.value)}>
                  <option value="">Todas las tallas</option>
                  {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="control-group">
                <label>
                  <FaQuestionCircle className="tooltip-icon" title="Criterio para agrupar los materiales" />
                  Agrupar Por
                </label>
                <select value={materialGroupType} onChange={e => setMaterialGroupType(e.target.value)}>
                  {Object.entries(MATERIAL_GROUP_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Período de Movimientos</label>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                  {Object.entries(PERIODS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Filtrar por Proveedor</label>
                <select value={selectedSuppliers} onChange={e => setSelectedSuppliers(e.target.value)}>
                  <option value="">Todos los proveedores</option>
                  {availableSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="control-group">
                <label>Filtrar por Categoría</label>
                <select value={selectedCategories} onChange={e => setSelectedCategories(e.target.value)}>
                  <option value="">Todas las categorías</option>
                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="control-actions">
          <button onClick={onRun} disabled={running} className="btn-analyze">
            <FaPlay /> {running ? 'Analizando...' : 'Iniciar Análisis'}
          </button>
          {clusterResult && (
            <button onClick={exportCSV} className="btn-export">
              <FaDownload /> Exportar Resultados (CSV)
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {running && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">Procesando datos y ejecutando algoritmo...</div>
        </div>
      )}

      {/* Mensaje cuando no hay datos */}
      {infoMessage && !clusterResult && !running && (
        <div className="info-message">
          <FaInfoCircle /> {infoMessage}
        </div>
      )}

      {/* Resultados */}
      {renderResult()}

      {/* Estado vacío inicial */}
      {!clusterResult && !running && !infoMessage && (
        <div className="empty-state">
          <FaChartLine />
          <h4>Comienza tu análisis</h4>
          <p>Selecciona los parámetros deseados y haz clic en "Iniciar Análisis"</p>
        </div>
      )}
    </div>
  );
};

export default ClusteringPanel;
