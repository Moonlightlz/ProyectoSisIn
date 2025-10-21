import { 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { PayrollAdjustmentRecord, Worker } from '../types/payroll';

/**
 * Servicio para manejar ajustes de planilla integrados en documentos de workers
 * Reemplaza la funcionalidad de payrollAdjustmentService
 */
export class WorkerPayrollService {
  
  /**
   * Agrega un nuevo ajuste de planilla al documento del trabajador
   */
  static async addPayrollAdjustment(
    workerId: string, 
    adjustment: Omit<PayrollAdjustmentRecord, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const adjustmentId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullAdjustment: PayrollAdjustmentRecord = {
        ...adjustment,
        id: adjustmentId,
        createdAt: new Date(),
        period: {
          ...adjustment.period,
          startDate: adjustment.period.startDate,
          endDate: adjustment.period.endDate
        }
      };

      const workerRef = doc(db, 'workers', workerId);
      
      await updateDoc(workerRef, {
        payrollAdjustments: arrayUnion(fullAdjustment),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Ajuste de planilla agregado al worker:', adjustmentId);
      return adjustmentId;
    } catch (error) {
      console.error('❌ Error agregando ajuste de planilla al worker:', error);
      throw new Error(`Error agregando ajuste de planilla: ${error}`);
    }
  }

  /**
   * Actualiza un ajuste de planilla existente en el documento del trabajador
   */
  static async updatePayrollAdjustment(
    workerId: string, 
    adjustmentId: string, 
    updatedFields: Partial<Omit<PayrollAdjustmentRecord, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      // Primero obtenemos el documento del worker
      const workerRef = doc(db, 'workers', workerId);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        throw new Error(`Worker con ID ${workerId} no encontrado`);
      }

      const workerData = workerDoc.data() as Worker;
      const adjustments = workerData.payrollAdjustments || [];
      
      // Buscamos el ajuste a actualizar
      const adjustmentIndex = adjustments.findIndex(adj => adj.id === adjustmentId);
      
      if (adjustmentIndex === -1) {
        throw new Error(`Ajuste con ID ${adjustmentId} no encontrado`);
      }

      // Actualizamos el ajuste
      const updatedAdjustment: PayrollAdjustmentRecord = {
        ...adjustments[adjustmentIndex],
        ...updatedFields,
        updatedAt: new Date()
      };

      // Reemplazamos el array completo con la actualización
      const updatedAdjustments = [...adjustments];
      updatedAdjustments[adjustmentIndex] = updatedAdjustment;

      await updateDoc(workerRef, {
        payrollAdjustments: updatedAdjustments,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Ajuste de planilla actualizado:', adjustmentId);
    } catch (error) {
      console.error('❌ Error actualizando ajuste de planilla:', error);
      throw new Error(`Error actualizando ajuste de planilla: ${error}`);
    }
  }

  /**
   * Elimina un ajuste de planilla del documento del trabajador
   */
  static async removePayrollAdjustment(workerId: string, adjustmentId: string): Promise<void> {
    try {
      // Primero obtenemos el documento del worker
      const workerRef = doc(db, 'workers', workerId);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        throw new Error(`Worker con ID ${workerId} no encontrado`);
      }

      const workerData = workerDoc.data() as Worker;
      const adjustments = workerData.payrollAdjustments || [];
      
      // Filtramos el ajuste a eliminar
      const updatedAdjustments = adjustments.filter(adj => adj.id !== adjustmentId);

      await updateDoc(workerRef, {
        payrollAdjustments: updatedAdjustments,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Ajuste de planilla eliminado:', adjustmentId);
    } catch (error) {
      console.error('❌ Error eliminando ajuste de planilla:', error);
      throw new Error(`Error eliminando ajuste de planilla: ${error}`);
    }
  }

  /**
   * Obtiene todos los ajustes de planilla de un trabajador
   */
  static async getWorkerPayrollAdjustments(workerId: string): Promise<PayrollAdjustmentRecord[]> {
    try {
      console.log(`🔍 Buscando ajustes para worker: ${workerId}`);
      const workerRef = doc(db, 'workers', workerId);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        console.warn(`❌ Worker con ID ${workerId} no encontrado en Firebase`);
        return [];
      }

      const workerData = workerDoc.data() as Worker;
      const adjustments = workerData.payrollAdjustments || [];
      console.log(`📊 Worker ${workerId} tiene ${adjustments.length} ajustes:`, adjustments);
      
      return adjustments;
    } catch (error) {
      console.error('❌ Error obteniendo ajustes de planilla del worker:', error);
      return [];
    }
  }

  /**
   * Obtiene ajustes de planilla de un trabajador para un período específico
   */
  static async getWorkerPayrollAdjustmentsByPeriod(
    workerId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<PayrollAdjustmentRecord[]> {
    try {
      console.log(`🔍 getWorkerPayrollAdjustmentsByPeriod para ${workerId}`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const allAdjustments = await this.getWorkerPayrollAdjustments(workerId);
      console.log(`📊 Ajustes encontrados para filtrar: ${allAdjustments.length}`, allAdjustments);
      
      // Filtramos por período - convertir fechas correctamente
      const filteredAdjustments = allAdjustments.filter(adjustment => {
        try {
          // Convertir fechas de Firebase (Timestamp o Date) a Date
          const adjStart = adjustment.period.startDate instanceof Date ? 
            adjustment.period.startDate : 
            (adjustment.period.startDate as any).toDate ? 
              (adjustment.period.startDate as any).toDate() : 
              new Date(adjustment.period.startDate);
              
          const adjEnd = adjustment.period.endDate instanceof Date ? 
            adjustment.period.endDate : 
            (adjustment.period.endDate as any).toDate ? 
              (adjustment.period.endDate as any).toDate() : 
              new Date(adjustment.period.endDate);
          
          console.log(`📅 Comparando períodos:`, {
            adjustmentId: adjustment.id,
            adjStart: adjStart.toISOString(),
            adjEnd: adjEnd.toISOString(),
            searchStart: startDate.toISOString(),
            searchEnd: endDate.toISOString()
          });
          
          // Verificamos si hay superposición de períodos
          const overlaps = (adjStart <= endDate && adjEnd >= startDate);
          console.log(`🎯 Ajuste ${adjustment.id} ${overlaps ? 'INCLUIDO' : 'EXCLUIDO'}`);
          
          return overlaps;
        } catch (dateError) {
          console.error('❌ Error procesando fechas del ajuste:', dateError, adjustment);
          return false;
        }
      });
      
      console.log(`✅ Ajustes filtrados para ${workerId}:`, filteredAdjustments.length, filteredAdjustments);
      return filteredAdjustments;
    } catch (error) {
      console.error('❌ Error obteniendo ajustes por período:', error);
      return [];
    }
  }

  /**
   * Limpia todos los ajustes de planilla de un trabajador
   */
  static async clearAllPayrollAdjustments(workerId: string): Promise<void> {
    try {
      const workerRef = doc(db, 'workers', workerId);
      
      await updateDoc(workerRef, {
        payrollAdjustments: [],
        updatedAt: Timestamp.now()
      });

      console.log('✅ Todos los ajustes de planilla eliminados del worker:', workerId);
    } catch (error) {
      console.error('❌ Error limpiando ajustes de planilla:', error);
      throw new Error(`Error limpiando ajustes de planilla: ${error}`);
    }
  }
}

export default WorkerPayrollService;