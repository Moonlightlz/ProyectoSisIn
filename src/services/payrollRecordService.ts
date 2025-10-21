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
import { PayrollCalculation } from '../types/payroll';

const COLLECTION_NAME = 'payroll_records';

// Interfaz para el registro de pago guardado
export interface PayrollRecord extends PayrollCalculation {
  id: string;
  paymentDate?: Date | undefined;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: 'cash' | 'bank_transfer' | 'check' | undefined;
  paymentReference?: string | undefined;
  notes?: string | undefined;
}

// Crear un nuevo registro de planilla
export const createPayrollRecord = async (
  calculation: PayrollCalculation,
  paymentInfo?: {
    paymentStatus?: PayrollRecord['paymentStatus'];
    paymentMethod?: PayrollRecord['paymentMethod'];
    paymentReference?: string;
    notes?: string;
  }
): Promise<PayrollRecord> => {
  try {
    console.log('Creating payroll record for worker:', calculation.workerId);
    
    // Crear objeto solo con campos definidos para evitar undefined en Firebase
    const recordData: any = {
      ...calculation,
      period: {
        ...calculation.period,
        startDate: Timestamp.fromDate(calculation.period.startDate),
        endDate: Timestamp.fromDate(calculation.period.endDate)
      },
      createdAt: Timestamp.fromDate(calculation.createdAt),
      paymentStatus: paymentInfo?.paymentStatus || 'pending'
    };

    // Solo agregar campos opcionales si tienen valor
    if (paymentInfo?.paymentMethod) {
      recordData.paymentMethod = paymentInfo.paymentMethod;
    }
    if (paymentInfo?.paymentReference) {
      recordData.paymentReference = paymentInfo.paymentReference;
    }
    if (paymentInfo?.notes) {
      recordData.notes = paymentInfo.notes;
    }
    if (paymentInfo?.paymentStatus === 'paid') {
      recordData.paymentDate = Timestamp.now();
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), recordData);
    
    // Crear el objeto de retorno con la misma lógica
    const newRecord: any = {
      id: docRef.id,
      ...calculation,
      paymentStatus: paymentInfo?.paymentStatus || 'pending'
    };

    // Solo agregar campos opcionales si tienen valor
    if (paymentInfo?.paymentMethod) {
      newRecord.paymentMethod = paymentInfo.paymentMethod;
    }
    if (paymentInfo?.paymentReference) {
      newRecord.paymentReference = paymentInfo.paymentReference;
    }
    if (paymentInfo?.notes) {
      newRecord.notes = paymentInfo.notes;
    }
    if (paymentInfo?.paymentStatus === 'paid') {
      newRecord.paymentDate = new Date();
    }

    console.log('Payroll record created successfully:', newRecord.id);
    return newRecord;
  } catch (error) {
    console.error('Error creating payroll record:', error);
    throw new Error(`Failed to create payroll record: ${error}`);
  }
};

// Obtener historial de pagos de un trabajador
export const getWorkerPayrollHistory = async (workerId: string): Promise<PayrollRecord[]> => {
  try {
    console.log('Getting payroll history for worker:', workerId);
    
    // Consulta simplificada sin orderBy para evitar requerir índice
    // TODO: Crear índice compuesto en Firebase y restaurar orderBy('createdAt', 'desc')
    const q = query(
      collection(db, COLLECTION_NAME),
      where('workerId', '==', workerId)
    );
    
    const querySnapshot = await getDocs(q);
    const records: PayrollRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        workerId: data.workerId,
        period: {
          startDate: data.period.startDate.toDate(),
          endDate: data.period.endDate.toDate(),
          type: data.period.type
        },
        scheduledHours: data.scheduledHours,
        workedHours: data.workedHours,
        overtimeHours: data.overtimeHours,
        lostHoursDueToLateness: data.lostHoursDueToLateness,
        scheduledDays: data.scheduledDays,
        workedDays: data.workedDays,
        absentDays: data.absentDays,
        lateDays: data.lateDays,
        baseSalary: data.baseSalary,
        dailyRate: data.dailyRate,
        hourlyRate: data.hourlyRate,
        regularPay: data.regularPay,
        overtimePay: data.overtimePay,
        bonuses: data.bonuses,
        lateDiscounts: data.lateDiscounts,
        absentDiscounts: data.absentDiscounts,
        invalidInsurance: data.invalidInsurance,
        pensionFund: data.pensionFund,
        essaludDeduction: data.essaludDeduction,
        essaludContribution: data.essaludContribution,
        grossPay: data.grossPay,
        totalDiscounts: data.totalDiscounts,
        netPay: data.netPay,
        hasManualAdjustments: data.hasManualAdjustments,
        manualAdjustments: data.manualAdjustments,
        createdAt: data.createdAt.toDate(),
        calculatedBy: data.calculatedBy,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        notes: data.notes,
        paymentDate: data.paymentDate?.toDate()
      });
    });
    
    // Ordenar por fecha de creación (más reciente primero) ya que no podemos usar orderBy sin índice
    records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`Found ${records.length} payroll records for worker ${workerId}`);
    return records;
  } catch (error) {
    console.error('Error getting worker payroll history:', error);
    throw new Error(`Failed to get payroll history: ${error}`);
  }
};

// Actualizar estado de pago
export const updatePaymentStatus = async (
  recordId: string,
  paymentStatus: PayrollRecord['paymentStatus'],
  paymentInfo?: {
    paymentMethod?: PayrollRecord['paymentMethod'];
    paymentReference?: string;
    notes?: string;
  }
): Promise<void> => {
  try {
    console.log('Updating payment status for record:', recordId, 'to:', paymentStatus);
    
    const updateData: any = {
      paymentStatus,
      ...paymentInfo,
      ...(paymentStatus === 'paid' && { paymentDate: Timestamp.now() })
    };

    const docRef = doc(db, COLLECTION_NAME, recordId);
    await updateDoc(docRef, updateData);
    
    console.log('Payment status updated successfully for record:', recordId);
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error(`Failed to update payment status: ${error}`);
  }
};

// Obtener registro de planilla por ID
export const getPayrollRecordById = async (id: string): Promise<PayrollRecord | null> => {
  try {
    console.log('Getting payroll record by ID:', id);
    
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('Payroll record not found:', id);
      return null;
    }
    
    const data = docSnap.data();
    const record: PayrollRecord = {
      id: docSnap.id,
      workerId: data.workerId,
      period: {
        startDate: data.period.startDate.toDate(),
        endDate: data.period.endDate.toDate(),
        type: data.period.type
      },
      scheduledHours: data.scheduledHours,
      workedHours: data.workedHours,
      overtimeHours: data.overtimeHours,
      lostHoursDueToLateness: data.lostHoursDueToLateness,
      scheduledDays: data.scheduledDays,
      workedDays: data.workedDays,
      absentDays: data.absentDays,
      lateDays: data.lateDays,
      baseSalary: data.baseSalary,
      dailyRate: data.dailyRate,
      hourlyRate: data.hourlyRate,
      regularPay: data.regularPay,
      overtimePay: data.overtimePay,
      bonuses: data.bonuses,
      lateDiscounts: data.lateDiscounts,
      absentDiscounts: data.absentDiscounts,
      invalidInsurance: data.invalidInsurance,
      pensionFund: data.pensionFund,
      essaludDeduction: data.essaludDeduction,
      essaludContribution: data.essaludContribution,
      grossPay: data.grossPay,
      totalDiscounts: data.totalDiscounts,
      netPay: data.netPay,
      hasManualAdjustments: data.hasManualAdjustments,
      manualAdjustments: data.manualAdjustments,
      createdAt: data.createdAt.toDate(),
      calculatedBy: data.calculatedBy,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      notes: data.notes,
      paymentDate: data.paymentDate?.toDate()
    };
    
    return record;
  } catch (error) {
    console.error('Error getting payroll record:', error);
    throw new Error(`Failed to get payroll record: ${error}`);
  }
};

// Eliminar registro de planilla
export const deletePayrollRecord = async (id: string): Promise<void> => {
  try {
    console.log('Deleting payroll record:', id);
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    console.log('Payroll record deleted successfully:', id);
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    throw new Error(`Failed to delete payroll record: ${error}`);
  }
};

// Obtener todos los registros de planilla (para reportes)
export const getAllPayrollRecords = async (
  filters?: {
    startDate?: Date;
    endDate?: Date;
    paymentStatus?: PayrollRecord['paymentStatus'];
  }
): Promise<PayrollRecord[]> => {
  try {
    console.log('Getting all payroll records with filters:', filters);
    
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    // TODO: Agregar filtros cuando Firebase lo permita
    // Por ahora obtenemos todos y filtramos en cliente
    
    const querySnapshot = await getDocs(q);
    let records: PayrollRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        workerId: data.workerId,
        period: {
          startDate: data.period.startDate.toDate(),
          endDate: data.period.endDate.toDate(),
          type: data.period.type
        },
        scheduledHours: data.scheduledHours,
        workedHours: data.workedHours,
        overtimeHours: data.overtimeHours,
        lostHoursDueToLateness: data.lostHoursDueToLateness,
        scheduledDays: data.scheduledDays,
        workedDays: data.workedDays,
        absentDays: data.absentDays,
        lateDays: data.lateDays,
        baseSalary: data.baseSalary,
        dailyRate: data.dailyRate,
        hourlyRate: data.hourlyRate,
        regularPay: data.regularPay,
        overtimePay: data.overtimePay,
        bonuses: data.bonuses,
        lateDiscounts: data.lateDiscounts,
        absentDiscounts: data.absentDiscounts,
        invalidInsurance: data.invalidInsurance,
        pensionFund: data.pensionFund,
        essaludDeduction: data.essaludDeduction,
        essaludContribution: data.essaludContribution,
        grossPay: data.grossPay,
        totalDiscounts: data.totalDiscounts,
        netPay: data.netPay,
        hasManualAdjustments: data.hasManualAdjustments,
        manualAdjustments: data.manualAdjustments,
        createdAt: data.createdAt.toDate(),
        calculatedBy: data.calculatedBy,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        notes: data.notes,
        paymentDate: data.paymentDate?.toDate()
      });
    });
    
    // Filtrar en cliente si es necesario
    if (filters) {
      if (filters.startDate) {
        records = records.filter(record => record.period.startDate >= filters.startDate!);
      }
      if (filters.endDate) {
        records = records.filter(record => record.period.endDate <= filters.endDate!);
      }
      if (filters.paymentStatus) {
        records = records.filter(record => record.paymentStatus === filters.paymentStatus);
      }
    }
    
    console.log(`Found ${records.length} payroll records`);
    return records;
  } catch (error) {
    console.error('Error getting all payroll records:', error);
    throw new Error(`Failed to get payroll records: ${error}`);
  }
};