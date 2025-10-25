import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const rawMaterialsCollection = collection(db, 'rawMaterials');

const getRawMaterials = async () => {
  const q = query(rawMaterialsCollection, where('status', '!=', 'inactive'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const addRawMaterial = async (materialData) => {
  return await addDoc(rawMaterialsCollection, {
    ...materialData,
    stock: 0, // El stock inicial siempre es 0
    status: 'active',
    createdAt: serverTimestamp(),
  });
};

const updateRawMaterial = async (materialId, materialData) => {
  const materialDoc = doc(db, 'rawMaterials', materialId);
  // Evitar sobreescribir el ID dentro del documento
  const { id, ...dataToUpdate } = materialData;
  return await updateDoc(materialDoc, {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  });
};

// Desactivación lógica (soft delete)
const deleteRawMaterial = async (materialId) => {
  const materialDoc = doc(db, 'rawMaterials', materialId);
  return await updateDoc(materialDoc, {
    status: 'inactive',
  });
};

const addStockMovement = async (materialId, movementData) => {
  const materialDocRef = doc(db, 'rawMaterials', materialId);
  const movementsCollectionRef = collection(materialDocRef, 'movements');

  await runTransaction(db, async (transaction) => {
    const materialDoc = await transaction.get(materialDocRef);
    if (!materialDoc.exists()) {
      throw new Error("¡El material no existe!");
    }

    const currentStock = materialDoc.data().stock;
    let quantityChange = 0;
    let newStock = 0;

    if (movementData.type === 'ajuste') {
      quantityChange = movementData.quantity; // La cantidad ya viene calculada (positiva o negativa)
      newStock = currentStock + quantityChange;
    } else { // 'entrada' o 'salida'
      quantityChange = movementData.type === 'entrada' ? movementData.quantity : -movementData.quantity;
      newStock = currentStock + quantityChange;
    }

    if (newStock < 0) {
      throw new Error("¡El stock no puede ser negativo!");
    }

    // 1. Actualizar el stock en el documento del material
    transaction.update(materialDocRef, { stock: newStock });

    // 2. Añadir el registro de movimiento en la sub-colección
    const movementRecord = {
      ...movementData,
      quantity: quantityChange, // Guardar la cantidad con su signo
      timestamp: serverTimestamp(),
      user: 'admin' // Simulado, reemplazar con el usuario actual
    };
    transaction.set(doc(movementsCollectionRef), movementRecord);
  });
};

const seedInitialMaterials = async () => {
  const materialsToSeed = [
    // Cuero Natural
    { name: 'Cuero Vacuno (Plancha)', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 10, cost: 95.50, stock: 15 },
    { name: 'Cuero Porcino (Plancha)', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 15, cost: 75.00, stock: 25 },
    { name: 'Cuero Caprino (Piel)', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 20, cost: 60.00, stock: 18 }, // Stock bajo
    { name: 'Nobuck (Piel)', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 10, cost: 110.00, stock: 5 }, // Stock bajo
    { name: 'Gamuza (Piel)', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'pieles', lowStockThreshold: 15, cost: 105.00, stock: 22 },
    { name: 'Charol (Plancha)', category: 'Cuero Natural', supplier: 'Pieles Finas S.A.', unit: 'planchas', lowStockThreshold: 8, cost: 120.00, stock: 10 },

    // Cuero Sintético
    { name: 'Cuero Sintético PU (Rollo)', category: 'Cuero Sintético', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 50, cost: 25.00, stock: 150 },
    { name: 'Cuero Sintético PVC (Rollo)', category: 'Cuero Sintético', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 50, cost: 20.00, stock: 80 },
    { name: 'Microfibra (Rollo)', category: 'Cuero Sintético', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 40, cost: 35.00, stock: 35 }, // Stock bajo

    // Tela
    { name: 'Lona (Rollo)', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 100, cost: 15.00, stock: 200 },
    { name: 'Denim (Rollo)', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 80, cost: 18.50, stock: 50 }, // Stock bajo
    { name: 'Canvas (Rollo)', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 60, cost: 17.00, stock: 75 },

    // Malla
    { name: 'Malla Mesh (Rollo)', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 30, cost: 12.00, stock: 60 },
    { name: 'Malla Nylon (Rollo)', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 30, cost: 14.00, stock: 25 }, // Stock bajo

    // Otros
    { name: 'Neopreno (Plancha)', category: 'Sintéticos Especiales', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 20, cost: 45.00, stock: 40 },
    { name: 'Fieltro (Plancha)', category: 'Textiles no Tejidos', supplier: 'Hilos del Sur', unit: 'planchas', lowStockThreshold: 50, cost: 8.00, stock: 100 },
    { name: 'Lycra (Rollo)', category: 'Elásticos', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 25, cost: 22.00, stock: 30 },
    { name: 'Foam Laminado (Plancha)', category: 'Espumas', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 40, cost: 19.00, stock: 60 },
    { name: 'Tejido Knit (Par)', category: 'Tejidos Técnicos', supplier: 'Importaciones Textiles', unit: 'pares', lowStockThreshold: 100, cost: 9.00, stock: 110 },
  ];

  // Usamos un Set para no agregar materiales que ya existen por el nombre
  const existingMaterialsSnapshot = await getDocs(rawMaterialsCollection);
  const existingMaterialNames = new Set(existingMaterialsSnapshot.docs.map(doc => doc.data().name));

  const promises = [];
  for (const material of materialsToSeed) {
    if (!existingMaterialNames.has(material.name)) {
      console.log(`Agregando material: ${material.name}`);
      const materialData = {
        ...material,
        status: 'active',
        createdAt: serverTimestamp(),
      };
      promises.push(addDoc(rawMaterialsCollection, materialData));
    } else {
      console.log(`El material "${material.name}" ya existe. Omitiendo.`);
    }
  }

  if (promises.length === 0) {
    console.log("No hay nuevos materiales que agregar. La base de datos ya está actualizada.");
    return { added: 0, total: materialsToSeed.length };
  }

  await Promise.all(promises);
  console.log(`${promises.length} materiales han sido agregados exitosamente.`);
  return { added: promises.length, total: materialsToSeed.length };
};

const createTestRawMaterials = async () => {
  console.log("Iniciando la creación de datos de prueba para materias primas...");

  const suppliers = {
    'Cuero': 'Curtidos del Norte',
    'Sintético': 'Polímeros Andinos',
    'Tela': 'Hilos del Sur',
    'Suela': 'Química Industrial',
    'Accesorio': 'Metales SAC',
  };

  const materialTemplates = [
    { name: 'Cuero Napa', category: 'Cuero', unit: 'planchas', baseCost: 90 },
    { name: 'Forro de cerdo', category: 'Cuero', unit: 'planchas', baseCost: 45 },
    { name: 'Suela de Goma TR', category: 'Suela', unit: 'pares', baseCost: 12 },
    { name: 'Suela de Caucho', category: 'Suela', unit: 'pares', baseCost: 15 },
    { name: 'Lona de Algodón', category: 'Tela', unit: 'metros', baseCost: 25 },
    { name: 'Malla Deportiva', category: 'Tela', unit: 'metros', baseCost: 18 },
    { name: 'Poliuretano (PU)', category: 'Sintético', unit: 'metros', baseCost: 35 },
    { name: 'Ojetillos Metálicos', category: 'Accesorio', unit: 'cientos', baseCost: 5 },
    { name: 'Pasadores de Algodón', category: 'Accesorio', unit: 'cientos', baseCost: 10 },
    { name: 'Plantillas de Eva', category: 'Suela', unit: 'pares', baseCost: 3 },
  ];

  const startDate = new Date('2023-10-07'); // Corregido a una fecha pasada para generar historial
  const endDate = new Date();
  let currentDate = new Date(startDate);
  let materialsAddedCount = 0;

  const batch = [];

  while (currentDate <= endDate) {
    const numMaterialsToday = Math.floor(Math.random() * 5) + 1; // 1 a 5 materiales por día

    for (let i = 0; i < numMaterialsToday; i++) {
      const template = materialTemplates[Math.floor(Math.random() * materialTemplates.length)];
      
      const stock = Math.floor(Math.random() * 200) + 10; // Stock entre 10 y 210
      const cost = template.baseCost * (0.9 + Math.random() * 0.2); // +/- 10% del costo base

      const newMaterial = {
        name: `${template.name} Lote #${Math.floor(Math.random() * 1000)}`,
        category: template.category,
        supplier: suppliers[template.category] || 'Proveedor Genérico',
        unit: template.unit,
        cost: parseFloat(cost.toFixed(2)),
        stock: stock,
        lowStockThreshold: Math.floor(stock * 0.2), // 20% del stock inicial
        status: 'active',
        createdAt: Timestamp.fromDate(new Date(currentDate)), // Fecha de ingreso del lote
      };
      
      batch.push(addDoc(rawMaterialsCollection, newMaterial));
      materialsAddedCount++;
    }

    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  try {
    await Promise.all(batch);
    console.log(`${materialsAddedCount} materiales de prueba creados exitosamente.`);
    return { success: true, count: materialsAddedCount };
  } catch (error) {
    console.error("Error masivo al crear materiales de prueba:", error);
    return { success: false, error };
  }
};

/**
 * Función para ejecutar el seeder desde la consola del navegador.
 * Abre la consola (F12), ve a la pestaña "Console" y escribe:
 * window.seedRawMaterials()
 * Presiona Enter.
 */
const enableSeederInWindow = () => {
  if (process.env.NODE_ENV === 'development') {
    window.seedRawMaterials = async () => {
      console.log("Iniciando la siembra de materiales...");
      const result = await seedInitialMaterials();
      console.log(`Siembra completada. ${result.added} de ${result.total} materiales fueron agregados.`);
    };
  }
};

const getMaterialMovements = async (materialId) => {
    const movementsCollectionRef = collection(db, 'rawMaterials', materialId, 'movements');
    const q = query(movementsCollectionRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const rawMaterialService = {
  getRawMaterials,
  addRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  createTestRawMaterials,
  addStockMovement,
  getMaterialMovements,
  seedInitialMaterials, // Exportamos la función
  enableSeederInWindow, // Exportamos el habilitador
};