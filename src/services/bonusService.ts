import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Bonus } from '../types/payroll';

/**
 * Servicio para manejar bonos de trabajadores
 */
export class BonusService {
  
  /**
   * Crear un nuevo bono para un trabajador
   */
  static async createBonus(bonusData: Omit<Bonus, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('📝 Creando bono:', bonusData);
      
      const bonusToSave = {
        ...bonusData,
        date: Timestamp.fromDate(bonusData.date),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'bonuses'), bonusToSave);
      console.log('✅ Bono creado con ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando bono:', error);
      throw new Error(`Error creando bono: ${error}`);
    }
  }

  /**
   * Obtener todos los bonos de un trabajador
   */
  static async getWorkerBonuses(workerId: string): Promise<Bonus[]> {
    try {
      console.log('🔍 Obteniendo bonos para worker:', workerId);
      
      const q = query(
        collection(db, 'bonuses'),
        where('workerId', '==', workerId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bonuses: Bonus[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bonuses.push({
          id: doc.id,
          workerId: data.workerId,
          date: data.date.toDate(),
          amount: data.amount,
          description: data.description,
          type: data.type,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate()
        });
      });

      console.log(`📊 Encontrados ${bonuses.length} bonos para ${workerId}`);
      return bonuses;
    } catch (error) {
      console.error('❌ Error obteniendo bonos:', error);
      return [];
    }
  }

  /**
   * Obtener bonos de un trabajador para un período específico
   */
  static async getWorkerBonusesByPeriod(
    workerId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Bonus[]> {
    try {
      console.log('🔍 Obteniendo bonos por período:', {
        workerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const q = query(
        collection(db, 'bonuses'),
        where('workerId', '==', workerId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bonuses: Bonus[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bonuses.push({
          id: doc.id,
          workerId: data.workerId,
          date: data.date.toDate(),
          amount: data.amount,
          description: data.description,
          type: data.type,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate()
        });
      });

      console.log(`📊 Encontrados ${bonuses.length} bonos para período`);
      return bonuses;
    } catch (error) {
      console.error('❌ Error obteniendo bonos por período:', error);
      return [];
    }
  }

  /**
   * Actualizar un bono existente
   */
  static async updateBonus(bonusId: string, updates: Partial<Omit<Bonus, 'id' | 'createdAt'>>): Promise<void> {
    try {
      console.log('📝 Actualizando bono:', bonusId, updates);
      
      const updateData: any = { ...updates };
      
      // Convertir fecha si se está actualizando
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      const bonusRef = doc(db, 'bonuses', bonusId);
      await updateDoc(bonusRef, updateData);
      
      console.log('✅ Bono actualizado:', bonusId);
    } catch (error) {
      console.error('❌ Error actualizando bono:', error);
      throw new Error(`Error actualizando bono: ${error}`);
    }
  }

  /**
   * Eliminar un bono
   */
  static async deleteBonus(bonusId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando bono:', bonusId);
      
      const bonusRef = doc(db, 'bonuses', bonusId);
      await deleteDoc(bonusRef);
      
      console.log('✅ Bono eliminado:', bonusId);
    } catch (error) {
      console.error('❌ Error eliminando bono:', error);
      throw new Error(`Error eliminando bono: ${error}`);
    }
  }

  /**
   * Obtener resumen de bonos por tipo para un trabajador
   */
  static async getWorkerBonusSummary(workerId: string, startDate: Date, endDate: Date): Promise<{
    totalAmount: number;
    bonusByType: Record<string, { count: number; total: number }>;
    bonuses: Bonus[];
  }> {
    try {
      const bonuses = await this.getWorkerBonusesByPeriod(workerId, startDate, endDate);
      
      const totalAmount = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      const bonusByType: Record<string, { count: number; total: number }> = {};
      
      bonuses.forEach(bonus => {
        if (!bonusByType[bonus.type]) {
          bonusByType[bonus.type] = { count: 0, total: 0 };
        }
        bonusByType[bonus.type].count++;
        bonusByType[bonus.type].total += bonus.amount;
      });

      return {
        totalAmount,
        bonusByType,
        bonuses
      };
    } catch (error) {
      console.error('❌ Error obteniendo resumen de bonos:', error);
      throw error;
    }
  }
}

export default BonusService;