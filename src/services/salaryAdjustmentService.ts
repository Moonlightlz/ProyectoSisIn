// Servicio para manejar ajustes de sueldo de trabajadores
import { 
  doc, 
  updateDoc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Worker } from '../types/payroll';

const WORKERS_COLLECTION = 'workers';

export interface SalaryAdjustment {
  workerId: string;
  newSalary: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: Date;
  previousSalary: number;
}

export const salaryAdjustmentService = {
  // Ajustar sueldo de un trabajador
  async adjustWorkerSalary(
    workerId: string, 
    newSalary: number, 
    reason: string, 
    adjustedBy: string
  ): Promise<void> {
    try {
      // Primero obtener el trabajador actual para guardar el sueldo anterior
      const workerRef = doc(db, WORKERS_COLLECTION, workerId);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        throw new Error('Trabajador no encontrado');
      }
      
      const currentWorker = workerDoc.data() as Worker;
      const previousSalary = currentWorker.currentSalary || currentWorker.baseSalary;
      
      // Actualizar el trabajador con el nuevo sueldo
      await updateDoc(workerRef, {
        currentSalary: newSalary,
        lastSalaryAdjustment: {
          amount: newSalary,
          reason: reason,
          adjustedBy: adjustedBy,
          adjustedAt: Timestamp.fromDate(new Date())
        },
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      console.log(`Sueldo de trabajador ${workerId} ajustado de S/${previousSalary} a S/${newSalary}`);
      
    } catch (error) {
      console.error('Error ajustando sueldo:', error);
      throw new Error('No se pudo ajustar el sueldo del trabajador');
    }
  },

  // Obtener historial de ajustes de sueldo (se puede implementar más tarde con una colección separada)
  async getSalaryHistory(workerId: string): Promise<SalaryAdjustment[]> {
    try {
      // Por ahora solo retornamos el último ajuste del trabajador
      const workerRef = doc(db, WORKERS_COLLECTION, workerId);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        return [];
      }
      
      const worker = workerDoc.data() as Worker;
      
      if (worker.lastSalaryAdjustment) {
        return [{
          workerId: workerId,
          newSalary: worker.lastSalaryAdjustment.amount,
          reason: worker.lastSalaryAdjustment.reason,
          adjustedBy: worker.lastSalaryAdjustment.adjustedBy,
          adjustedAt: worker.lastSalaryAdjustment.adjustedAt instanceof Date ? 
            worker.lastSalaryAdjustment.adjustedAt : 
            (worker.lastSalaryAdjustment.adjustedAt as any).toDate(),
          previousSalary: worker.baseSalary // Simplificado por ahora
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo historial de sueldo:', error);
      return [];
    }
  },

  // Resetear sueldo al sueldo base original
  async resetToBaseSalary(workerId: string, adjustedBy: string): Promise<void> {
    try {
      const workerRef = doc(db, WORKERS_COLLECTION, workerId);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        throw new Error('Trabajador no encontrado');
      }
      
      const worker = workerDoc.data() as Worker;
      
      await updateDoc(workerRef, {
        currentSalary: worker.baseSalary,
        lastSalaryAdjustment: {
          amount: worker.baseSalary,
          reason: 'Reseteo a sueldo base',
          adjustedBy: adjustedBy,
          adjustedAt: Timestamp.fromDate(new Date())
        },
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      console.log(`Sueldo de trabajador ${workerId} reseteado a sueldo base: S/${worker.baseSalary}`);
      
    } catch (error) {
      console.error('Error reseteando sueldo:', error);
      throw new Error('No se pudo resetear el sueldo del trabajador');
    }
  }
};