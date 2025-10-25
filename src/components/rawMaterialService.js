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
  addStockMovement,
  getMaterialMovements,
};