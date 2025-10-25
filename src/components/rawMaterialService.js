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

const seedCapelladaMaterials = async () => {
  const materialsToSeed = [
    // --- Materiales para el corte (parte superior o capellada) ---
    // Cuero Natural
    { name: 'Cuero Vacuno', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 10, cost: 95.50, stock: 15, createdAt: Timestamp.fromDate(new Date('2025-10-07')) },
    { name: 'Cuero Porcino', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 15, cost: 75.00, stock: 25, createdAt: Timestamp.fromDate(new Date('2025-10-08')) },
    { name: 'Cuero Caprino', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 20, cost: 60.00, stock: 18, createdAt: Timestamp.fromDate(new Date('2025-10-09')) },
    { name: 'Cuero Ovino', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 20, cost: 55.00, stock: 30, createdAt: Timestamp.fromDate(new Date('2025-10-10')) },
    { name: 'Nobuck', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 10, cost: 110.00, stock: 5, createdAt: Timestamp.fromDate(new Date('2025-10-11')) },
    { name: 'Gamuza', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'pieles', lowStockThreshold: 15, cost: 105.00, stock: 22, createdAt: Timestamp.fromDate(new Date('2025-10-12')) },
    { name: 'Charol', category: 'Cuero Natural', supplier: 'Pieles Finas S.A.', unit: 'planchas', lowStockThreshold: 8, cost: 120.00, stock: 10, createdAt: Timestamp.fromDate(new Date('2025-10-13')) },
    // Cuero Sintético
    { name: 'Cuero Sintético PU', category: 'Cuero Sintético', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 50, cost: 25.00, stock: 150, createdAt: Timestamp.fromDate(new Date('2025-10-14')) },
    { name: 'Cuero Sintético PVC', category: 'Cuero Sintético', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 50, cost: 20.00, stock: 80, createdAt: Timestamp.fromDate(new Date('2025-10-15')) },
    { name: 'Microfibra', category: 'Cuero Sintético', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 40, cost: 35.00, stock: 35, createdAt: Timestamp.fromDate(new Date('2025-10-16')) },
    // Tela
    { name: 'Lona', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 100, cost: 15.00, stock: 200, createdAt: Timestamp.fromDate(new Date('2025-10-17')) },
    { name: 'Algodón', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 120, cost: 12.50, stock: 250, createdAt: Timestamp.fromDate(new Date('2025-10-18')) },
    { name: 'Poliéster', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 150, cost: 10.00, stock: 300, createdAt: Timestamp.fromDate(new Date('2025-10-19')) },
    { name: 'Denim', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 80, cost: 18.50, stock: 50, createdAt: Timestamp.fromDate(new Date('2025-10-20')) },
    { name: 'Lona Encerada', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 60, cost: 22.00, stock: 70, createdAt: Timestamp.fromDate(new Date('2025-10-21')) },
    { name: 'Canvas', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 60, cost: 17.00, stock: 75, createdAt: Timestamp.fromDate(new Date('2025-10-22')) },
    // Malla
    { name: 'Malla Mesh', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 30, cost: 12.00, stock: 60, createdAt: Timestamp.fromDate(new Date('2025-10-23')) },
    { name: 'Malla Nylon', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 30, cost: 14.00, stock: 25, createdAt: Timestamp.fromDate(new Date('2025-10-24')) },
    { name: 'Malla Poliéster', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 40, cost: 13.00, stock: 80, createdAt: Timestamp.fromDate(new Date('2025-10-25')) },
    // Otros Materiales de Corte
    { name: 'Neopreno', category: 'Sintéticos Especiales', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 20, cost: 45.00, stock: 40, createdAt: Timestamp.fromDate(new Date('2025-10-26')) },
    { name: 'Fieltro', category: 'Textiles no Tejidos', supplier: 'Hilos del Sur', unit: 'planchas', lowStockThreshold: 50, cost: 8.00, stock: 100, createdAt: Timestamp.fromDate(new Date('2025-10-27')) },
    { name: 'Lycra / Elásticos', category: 'Elásticos', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 25, cost: 22.00, stock: 30, createdAt: Timestamp.fromDate(new Date('2025-10-28')) },
    { name: 'Sintéticos laminados o recubiertos', category: 'Sintéticos Especiales', supplier: 'Química Industrial', unit: 'metros', lowStockThreshold: 30, cost: 38.00, stock: 50, createdAt: Timestamp.fromDate(new Date('2025-10-29')) },
    { name: 'Foam laminado', category: 'Espumas', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 40, cost: 19.00, stock: 60, createdAt: Timestamp.fromDate(new Date('2025-10-30')) },
    { name: 'Tejidos técnicos (knit, flyknit, etc.)', category: 'Tejidos Técnicos', supplier: 'Importaciones Textiles', unit: 'pares', lowStockThreshold: 100, cost: 9.00, stock: 110, createdAt: Timestamp.fromDate(new Date('2025-10-31')) },
  ];

  const existingMaterialsSnapshot = await getDocs(rawMaterialsCollection);
  const existingMaterialNames = new Set(existingMaterialsSnapshot.docs.map(doc => doc.data().name));

  const promises = materialsToSeed
    .filter(material => !existingMaterialNames.has(material.name))
    .map(material => addDoc(rawMaterialsCollection, { ...material, status: 'active' }));

  if (promises.length === 0) {
    console.log("No hay nuevos materiales de corte que agregar. La base de datos ya los contiene.");
    return { success: true, count: 0, message: 'Todos los materiales de corte ya existen.' };
  }

  await Promise.all(promises);
  console.log(`${promises.length} materiales de corte han sido agregados exitosamente.`);
  return { success: true, count: promises.length };
};

const seedEnsamblajeMaterials = async () => {
  const materialsToSeed = [
    // --- Materiales de ensamblaje ---
    // Pegamentos
    { name: 'Cemento de Contacto', category: 'Pegamentos', supplier: 'Química Industrial', unit: 'galones', lowStockThreshold: 5, cost: 150.00, stock: 8, createdAt: Timestamp.fromDate(new Date('2025-11-01')) },
    { name: 'Pegamento PU', category: 'Pegamentos', supplier: 'Química Industrial', unit: 'galones', lowStockThreshold: 8, cost: 180.50, stock: 5, createdAt: Timestamp.fromDate(new Date('2025-11-02')) }, // Bajo stock
    { name: 'Pegamento Base Solvente', category: 'Pegamentos', supplier: 'Polímeros Andinos', unit: 'latas', lowStockThreshold: 20, cost: 45.00, stock: 30, createdAt: Timestamp.fromDate(new Date('2025-11-03')) },
    { name: 'Pegamento Base Agua', category: 'Pegamentos', supplier: 'Polímeros Andinos', unit: 'galones', lowStockThreshold: 10, cost: 120.00, stock: 12, createdAt: Timestamp.fromDate(new Date('2025-11-04')) },
    // Fijaciones
    { name: 'Clavos y Tachuelas', category: 'Fijaciones', supplier: 'Metales SAC', unit: 'cajas', lowStockThreshold: 50, cost: 15.00, stock: 35, createdAt: Timestamp.fromDate(new Date('2025-11-05')) }, // Bajo stock
    { name: 'Grapas Industriales', category: 'Fijaciones', supplier: 'Metales SAC', unit: 'cajas', lowStockThreshold: 100, cost: 25.00, stock: 150, createdAt: Timestamp.fromDate(new Date('2025-11-06')) },
    // Hilos y Agujas
    { name: 'Hilo de Poliéster', category: 'Hilos y Agujas', supplier: 'Hilos del Sur', unit: 'conos', lowStockThreshold: 40, cost: 18.00, stock: 60, createdAt: Timestamp.fromDate(new Date('2025-11-07')) },
    { name: 'Hilo de Nylon', category: 'Hilos y Agujas', supplier: 'Hilos del Sur', unit: 'conos', lowStockThreshold: 40, cost: 22.00, stock: 30, createdAt: Timestamp.fromDate(new Date('2025-11-08')) }, // Bajo stock
    { name: 'Agujas Industriales', category: 'Hilos y Agujas', supplier: 'Importaciones Textiles', unit: 'cajas', lowStockThreshold: 20, cost: 50.00, stock: 25, createdAt: Timestamp.fromDate(new Date('2025-11-09')) },
    // Componentes y Refuerzos
    { name: 'Cinta de Refuerzo', category: 'Refuerzos', supplier: 'Polímeros Andinos', unit: 'rollos', lowStockThreshold: 30, cost: 12.00, stock: 50, createdAt: Timestamp.fromDate(new Date('2025-11-10')) },
    { name: 'Cordones', category: 'Componentes', supplier: 'Hilos del Sur', unit: 'cientos', lowStockThreshold: 100, cost: 30.00, stock: 120, createdAt: Timestamp.fromDate(new Date('2025-11-11')) },
    { name: 'Ojales Metálicos', category: 'Componentes', supplier: 'Metales SAC', unit: 'millares', lowStockThreshold: 10, cost: 40.00, stock: 5, createdAt: Timestamp.fromDate(new Date('2025-11-12')) }, // Bajo stock
    { name: 'Remaches y Hebillas', category: 'Componentes', supplier: 'Metales SAC', unit: 'cientos', lowStockThreshold: 80, cost: 60.00, stock: 100, createdAt: Timestamp.fromDate(new Date('2025-11-13')) },
    { name: 'Cierres (Zippers)', category: 'Componentes', supplier: 'Importaciones Textiles', unit: 'cientos', lowStockThreshold: 50, cost: 75.00, stock: 60, createdAt: Timestamp.fromDate(new Date('2025-11-14')) },
  ];

  const existingMaterialsSnapshot = await getDocs(rawMaterialsCollection);
  const existingMaterialNames = new Set(existingMaterialsSnapshot.docs.map(doc => doc.data().name));

  const promises = materialsToSeed
    .filter(material => !existingMaterialNames.has(material.name))
    .map(material => addDoc(rawMaterialsCollection, { ...material, status: 'active' }));

  if (promises.length === 0) {
    return { success: true, count: 0, message: 'Todos los materiales de ensamblaje ya existen.' };
  }

  await Promise.all(promises);
  return { success: true, count: promises.length, message: `${promises.length} materiales de ensamblaje han sido agregados.` };
};

const seedSuelaMaterials = async () => {
  const materialsToSeed = [
    // --- Materiales para la suela ---
    { name: 'Caucho Natural', category: 'Cauchos', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 20, cost: 65.00, stock: 50, createdAt: Timestamp.fromDate(new Date('2025-11-15')) },
    { name: 'Caucho Sintético (SBR)', category: 'Cauchos', supplier: 'Polímeros Andinos', unit: 'planchas', lowStockThreshold: 30, cost: 55.50, stock: 70, createdAt: Timestamp.fromDate(new Date('2025-11-16')) },
    { name: 'EVA (Etileno-Vinil-Acetato)', category: 'Polímeros para Suela', supplier: 'Polímeros Andinos', unit: 'planchas', lowStockThreshold: 50, cost: 42.00, stock: 120, createdAt: Timestamp.fromDate(new Date('2025-11-17')) },
    { name: 'PU (Poliuretano expandido)', category: 'Polímeros para Suela', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 25, cost: 78.00, stock: 20, createdAt: Timestamp.fromDate(new Date('2025-11-18')) }, // Bajo stock
    { name: 'PVC (Policloruro de vinilo)', category: 'Polímeros para Suela', supplier: 'Polímeros Andinos', unit: 'planchas', lowStockThreshold: 60, cost: 38.00, stock: 100, createdAt: Timestamp.fromDate(new Date('2025-11-19')) },
    { name: 'TR (Termoplástico elastómero)', category: 'Polímeros para Suela', supplier: 'Polímeros Andinos', unit: 'planchas', lowStockThreshold: 40, cost: 68.50, stock: 80, createdAt: Timestamp.fromDate(new Date('2025-11-20')) },
    { name: 'TPU (Poliuretano termoplástico)', category: 'Polímeros para Suela', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 30, cost: 85.00, stock: 40, createdAt: Timestamp.fromDate(new Date('2025-11-21')) },
    { name: 'Neolite', category: 'Laminados para Suela', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 35, cost: 52.00, stock: 60, createdAt: Timestamp.fromDate(new Date('2025-11-22')) },
    { name: 'Cuero Suela', category: 'Naturales para Suela', supplier: 'Pieles del Sur', unit: 'planchas', lowStockThreshold: 10, cost: 135.00, stock: 12, createdAt: Timestamp.fromDate(new Date('2025-11-23')) }, // Bajo stock
    { name: 'Madera (zuecos)', category: 'Naturales para Suela', supplier: 'Maderas del Peru', unit: 'bloques', lowStockThreshold: 40, cost: 25.00, stock: 50, createdAt: Timestamp.fromDate(new Date('2025-11-24')) },
    { name: 'Corcho (sandalias)', category: 'Naturales para Suela', supplier: 'Importaciones Textiles', unit: 'planchas', lowStockThreshold: 30, cost: 32.00, stock: 25, createdAt: Timestamp.fromDate(new Date('2025-11-25')) }, // Bajo stock
  ];

  const existingMaterialsSnapshot = await getDocs(rawMaterialsCollection);
  const existingMaterialNames = new Set(existingMaterialsSnapshot.docs.map(doc => doc.data().name));

  const promises = materialsToSeed
    .filter(material => !existingMaterialNames.has(material.name))
    .map(material => addDoc(rawMaterialsCollection, { ...material, status: 'active' }));

  if (promises.length === 0) {
    return { success: true, count: 0, message: 'Todos los materiales de suela ya existen.' };
  }

  await Promise.all(promises);
  return { success: true, count: promises.length, message: `${promises.length} materiales de suela han sido agregados.` };
};

const seedArmadoMaterials = async () => {
  const materialsToSeed = [
    // --- Materiales de armado y componentes ---
    { name: 'Contrafuerte Termoformable', category: 'Componentes de Armado', supplier: 'Polímeros Andinos', unit: 'pares', lowStockThreshold: 100, cost: 2.50, stock: 150, createdAt: Timestamp.fromDate(new Date('2025-11-26')) },
    { name: 'Contrafuerte de Fibra', category: 'Componentes de Armado', supplier: 'Importaciones Textiles', unit: 'pares', lowStockThreshold: 120, cost: 2.20, stock: 80, createdAt: Timestamp.fromDate(new Date('2025-11-27')) }, // Bajo stock
    { name: 'Puntera Termoplástica', category: 'Componentes de Armado', supplier: 'Polímeros Andinos', unit: 'pares', lowStockThreshold: 100, cost: 2.80, stock: 200, createdAt: Timestamp.fromDate(new Date('2025-11-28')) },
    { name: 'Cambrillón de Acero', category: 'Componentes Estructurales', supplier: 'Metales SAC', unit: 'pares', lowStockThreshold: 200, cost: 1.80, stock: 300, createdAt: Timestamp.fromDate(new Date('2025-11-29')) },
    { name: 'Cambrillón de Plástico', category: 'Componentes Estructurales', supplier: 'Polímeros Andinos', unit: 'pares', lowStockThreshold: 250, cost: 1.50, stock: 180, createdAt: Timestamp.fromDate(new Date('2025-11-30')) }, // Bajo stock
    { name: 'Plantilla Base de Celulosa', category: 'Plantillas y Espumas', supplier: 'Hilos del Sur', unit: 'planchas', lowStockThreshold: 80, cost: 15.00, stock: 100, createdAt: Timestamp.fromDate(new Date('2025-12-01')) },
    { name: 'Plantilla Base de EVA', category: 'Plantillas y Espumas', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 60, cost: 25.00, stock: 75, createdAt: Timestamp.fromDate(new Date('2025-12-02')) },
    { name: 'Espuma de Relleno PU', category: 'Plantillas y Espumas', supplier: 'Química Industrial', unit: 'metros', lowStockThreshold: 50, cost: 18.00, stock: 40, createdAt: Timestamp.fromDate(new Date('2025-12-03')) }, // Bajo stock
    { name: 'Refuerzo Textil Adhesivo', category: 'Refuerzos', supplier: 'Importaciones Textiles', unit: 'rollos', lowStockThreshold: 40, cost: 28.00, stock: 60, createdAt: Timestamp.fromDate(new Date('2025-12-04')) },
  ];

  const existingMaterialsSnapshot = await getDocs(rawMaterialsCollection);
  const existingMaterialNames = new Set(existingMaterialsSnapshot.docs.map(doc => doc.data().name));

  const promises = materialsToSeed
    .filter(material => !existingMaterialNames.has(material.name))
    .map(material => addDoc(rawMaterialsCollection, { ...material, status: 'active' }));

  if (promises.length === 0) {
    return { success: true, count: 0, message: 'Todos los materiales de armado ya existen.' };
  }

  await Promise.all(promises);
  return { success: true, count: promises.length, message: `${promises.length} materiales de armado han sido agregados.` };
};

const seedInitialMaterials = async () => {
  const materialsToSeed = [
    // --- Materiales para el corte (parte superior o capellada) ---
    // Cuero Natural
    { name: 'Cuero Vacuno', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 10, cost: 95.50, stock: 15 },
    { name: 'Cuero Porcino', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'planchas', lowStockThreshold: 15, cost: 75.00, stock: 25 },
    { name: 'Cuero Caprino', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 20, cost: 60.00, stock: 18 },
    { name: 'Cuero Ovino', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 20, cost: 55.00, stock: 30 },
    { name: 'Nobuck', category: 'Cuero Natural', supplier: 'Pieles del Sur', unit: 'pieles', lowStockThreshold: 10, cost: 110.00, stock: 5 },
    { name: 'Gamuza', category: 'Cuero Natural', supplier: 'Curtidos del Norte', unit: 'pieles', lowStockThreshold: 15, cost: 105.00, stock: 22 },
    { name: 'Charol', category: 'Cuero Natural', supplier: 'Pieles Finas S.A.', unit: 'planchas', lowStockThreshold: 8, cost: 120.00, stock: 10 },

    // Cuero Sintético
    { name: 'Cuero Sintético PU', category: 'Cuero Sintético', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 50, cost: 25.00, stock: 150 },
    { name: 'Cuero Sintético PVC', category: 'Cuero Sintético', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 50, cost: 20.00, stock: 80 },
    { name: 'Microfibra', category: 'Cuero Sintético', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 40, cost: 35.00, stock: 35 },

    // Tela
    { name: 'Lona', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 100, cost: 15.00, stock: 200 },
    { name: 'Algodón', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 120, cost: 12.50, stock: 250 },
    { name: 'Poliéster', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 150, cost: 10.00, stock: 300 },
    { name: 'Denim', category: 'Tela', supplier: 'Hilos del Sur', unit: 'metros', lowStockThreshold: 80, cost: 18.50, stock: 50 },
    { name: 'Lona Encerada', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 60, cost: 22.00, stock: 70 },
    { name: 'Canvas', category: 'Tela', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 60, cost: 17.00, stock: 75 },

    // Malla
    { name: 'Malla Mesh', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 30, cost: 12.00, stock: 60 },
    { name: 'Malla Nylon', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 30, cost: 14.00, stock: 25 },
    { name: 'Malla Poliéster', category: 'Malla', supplier: 'Polímeros Andinos', unit: 'metros', lowStockThreshold: 40, cost: 13.00, stock: 80 },

    // Otros Materiales de Corte
    { name: 'Neopreno', category: 'Sintéticos Especiales', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 20, cost: 45.00, stock: 40 },
    { name: 'Fieltro', category: 'Textiles no Tejidos', supplier: 'Hilos del Sur', unit: 'planchas', lowStockThreshold: 50, cost: 8.00, stock: 100 },
    { name: 'Lycra / Elásticos', category: 'Elásticos', supplier: 'Importaciones Textiles', unit: 'metros', lowStockThreshold: 25, cost: 22.00, stock: 30 },
    { name: 'Sintético Laminado', category: 'Sintéticos Especiales', supplier: 'Química Industrial', unit: 'metros', lowStockThreshold: 30, cost: 38.00, stock: 50 },
    { name: 'Foam Laminado', category: 'Espumas', supplier: 'Química Industrial', unit: 'planchas', lowStockThreshold: 40, cost: 19.00, stock: 60 },
    { name: 'Tejido Knit', category: 'Tejidos Técnicos', supplier: 'Importaciones Textiles', unit: 'pares', lowStockThreshold: 100, cost: 9.00, stock: 110 },
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
  seedCapelladaMaterials, // Exportamos la nueva función
  seedEnsamblajeMaterials, // Exportamos la nueva función de ensamblaje
  seedSuelaMaterials, // Exportamos la nueva función de suelas
  seedArmadoMaterials, // Exportamos la nueva función de armado
  enableSeederInWindow, // Exportamos el habilitador
};