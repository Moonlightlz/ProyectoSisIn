import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { WorkerPayrollAdjustment } from '../types/payroll';

const COLLECTION_NAME = 'payroll_adjustments';

// Crear un nuevo ajuste de planilla
export const createPayrollAdjustment = async (
  adjustment: Omit<WorkerPayrollAdjustment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WorkerPayrollAdjustment> => {
  try {
    console.log('Creating payroll adjustment:', adjustment);
    
    const adjustmentData = {
      ...adjustment,
      period: {
        ...adjustment.period,
        startDate: Timestamp.fromDate(adjustment.period.startDate),
        endDate: Timestamp.fromDate(adjustment.period.endDate)
      },
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), adjustmentData);
    
    const newAdjustment: WorkerPayrollAdjustment = {
      id: docRef.id,
      ...adjustment,
      createdAt: new Date()
    };

    console.log('Payroll adjustment created successfully:', newAdjustment.id);
    return newAdjustment;
  } catch (error) {
    console.error('Error creating payroll adjustment:', error);
    throw new Error(`Failed to create payroll adjustment: ${error}`);
  }
};

// Obtener ajuste de planilla por ID
export const getPayrollAdjustmentById = async (id: string): Promise<WorkerPayrollAdjustment | null> => {
  try {
    console.log('Getting payroll adjustment by ID:', id);
    
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('Payroll adjustment not found:', id);
      return null;
    }
    
    const data = docSnap.data();
    const adjustment: WorkerPayrollAdjustment = {
      id: docSnap.id,
      workerId: data.workerId,
      period: {
        startDate: data.period.startDate.toDate(),
        endDate: data.period.endDate.toDate(),
        type: data.period.type
      },
      manualBonuses: data.manualBonuses,
      manualDeductions: data.manualDeductions,
      customHours: data.customHours,
      customDays: data.customDays,
      overrideInvalidInsurance: data.overrideInvalidInsurance,
      overridePensionFund: data.overridePensionFund,
      overrideEssaludDeduction: data.overrideEssaludDeduction,
      adjustmentNotes: data.adjustmentNotes,
      adjustmentReason: data.adjustmentReason,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
    
    return adjustment;
  } catch (error) {
    console.error('Error getting payroll adjustment:', error);
    throw new Error(`Failed to get payroll adjustment: ${error}`);
  }
};

// Obtener ajustes de planilla por trabajador y período
export const getPayrollAdjustmentsByWorkerAndPeriod = async (
  workerId: string,
  startDate: Date,
  endDate: Date
): Promise<WorkerPayrollAdjustment[]> => {
  try {
    console.log('Getting payroll adjustments for worker:', workerId, 'period:', startDate, 'to', endDate);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('workerId', '==', workerId),
      where('period.startDate', '>=', Timestamp.fromDate(startDate)),
      where('period.endDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('period.startDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const adjustments: WorkerPayrollAdjustment[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      adjustments.push({
        id: doc.id,
        workerId: data.workerId,
        period: {
          startDate: data.period.startDate.toDate(),
          endDate: data.period.endDate.toDate(),
          type: data.period.type
        },
        manualBonuses: data.manualBonuses,
        manualDeductions: data.manualDeductions,
        customHours: data.customHours,
        customDays: data.customDays,
        overrideInvalidInsurance: data.overrideInvalidInsurance,
        overridePensionFund: data.overridePensionFund,
        overrideEssaludDeduction: data.overrideEssaludDeduction,
        adjustmentNotes: data.adjustmentNotes,
        adjustmentReason: data.adjustmentReason,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });
    
    console.log(`Found ${adjustments.length} payroll adjustments for worker ${workerId}`);
    return adjustments;
  } catch (error) {
    console.error('Error getting payroll adjustments:', error);
    throw new Error(`Failed to get payroll adjustments: ${error}`);
  }
};

// Actualizar ajuste de planilla
export const updatePayrollAdjustment = async (
  id: string,
  updates: Partial<Omit<WorkerPayrollAdjustment, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    console.log('Updating payroll adjustment:', id, updates);
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Convert dates in period if provided
    if (updates.period) {
      updateData.period = {
        ...updates.period,
        startDate: Timestamp.fromDate(updates.period.startDate),
        endDate: Timestamp.fromDate(updates.period.endDate)
      };
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updateData);
    
    console.log('Payroll adjustment updated successfully:', id);
  } catch (error) {
    console.error('Error updating payroll adjustment:', error);
    throw new Error(`Failed to update payroll adjustment: ${error}`);
  }
};

// Eliminar ajuste de planilla
export const deletePayrollAdjustment = async (id: string): Promise<void> => {
  try {
    console.log('Deleting payroll adjustment:', id);
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    console.log('Payroll adjustment deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting payroll adjustment:', error);
    throw new Error(`Failed to delete payroll adjustment: ${error}`);
  }
};

// Obtener todos los ajustes de planilla de un trabajador
export const getAllPayrollAdjustmentsByWorker = async (workerId: string): Promise<WorkerPayrollAdjustment[]> => {
  try {
    console.log('Getting all payroll adjustments for worker:', workerId);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('workerId', '==', workerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const adjustments: WorkerPayrollAdjustment[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      adjustments.push({
        id: doc.id,
        workerId: data.workerId,
        period: {
          startDate: data.period.startDate.toDate(),
          endDate: data.period.endDate.toDate(),
          type: data.period.type
        },
        manualBonuses: data.manualBonuses,
        manualDeductions: data.manualDeductions,
        customHours: data.customHours,
        customDays: data.customDays,
        overrideInvalidInsurance: data.overrideInvalidInsurance,
        overridePensionFund: data.overridePensionFund,
        overrideEssaludDeduction: data.overrideEssaludDeduction,
        adjustmentNotes: data.adjustmentNotes,
        adjustmentReason: data.adjustmentReason,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });
    
    console.log(`Found ${adjustments.length} total payroll adjustments for worker ${workerId}`);
    return adjustments;
  } catch (error) {
    console.error('Error getting all payroll adjustments:', error);
    throw new Error(`Failed to get payroll adjustments: ${error}`);
  }
};