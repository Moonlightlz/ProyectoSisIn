// Servicio para manejar todas las operaciones de trabajadores en Firestore
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Worker, WorkerFormData, AttendanceRecord, Bonus, PayrollSettings } from '../types/payroll';

// Colecciones de Firestore
const WORKERS_COLLECTION = 'workers';
const ATTENDANCE_COLLECTION = 'attendance';
const BONUSES_COLLECTION = 'bonuses';
const PAYROLL_SETTINGS_COLLECTION = 'payrollSettings';

// ===============================
// OPERACIONES DE TRABAJADORES
// ===============================

export const workerService = {
  // Obtener todos los trabajadores activos
  async getAllWorkers(): Promise<Worker[]> {
    try {
      console.log('Intentando cargar trabajadores desde Firestore...');
      const workersRef = collection(db, WORKERS_COLLECTION);
      
      // Primero intentar obtener todos los documentos sin filtros complejos
      const snapshot = await getDocs(workersRef);
      console.log('Documentos encontrados:', snapshot.size);
      
      if (snapshot.empty) {
        console.log('No hay trabajadores en la base de datos. Retornando array vacío.');
        return [];
      }
      
      const allWorkers = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Datos del trabajador:', doc.id, data);
        console.log('currentSalary:', data.currentSalary);
        console.log('lastSalaryAdjustment:', data.lastSalaryAdjustment);
        
        // Procesar lastSalaryAdjustment si existe
        let lastSalaryAdjustment = undefined;
        if (data.lastSalaryAdjustment) {
          console.log('Procesando ajuste de sueldo...');
          lastSalaryAdjustment = {
            ...data.lastSalaryAdjustment,
            adjustedAt: data.lastSalaryAdjustment.adjustedAt?.toDate() || new Date()
          };
          console.log('Ajuste procesado:', lastSalaryAdjustment);
        }
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          hireDate: data.hireDate?.toDate() || data.createdAt?.toDate() || new Date(),
          lastSalaryAdjustment: lastSalaryAdjustment
        } as Worker;
      });
      
      const workers = allWorkers
        .filter(worker => worker.status !== 'inactive') // Filtrar en cliente
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('Trabajadores procesados:', workers.length);
      return workers;
    } catch (error) {
      console.error('Error detallado al cargar trabajadores:', error);
      // Si falla la carga, retornar datos de ejemplo para desarrollo
      console.log('Retornando datos de ejemplo...');
      return [
        {
          id: 'demo-1',
          name: 'Juan Pérez (Demo)',
          dni: '12345678',
          position: 'Operario',
          baseSalary: 1500,
          hireDate: new Date('2024-01-15'),
          status: 'active',
          createdAt: new Date()
        }
      ] as Worker[];
    }
  },

  // Obtener un trabajador por ID
  async getWorkerById(workerId: string): Promise<Worker | null> {
    try {
      const workerDoc = await getDoc(doc(db, WORKERS_COLLECTION, workerId));
      if (workerDoc.exists()) {
        const data = workerDoc.data();
        
        // Procesar lastSalaryAdjustment si existe
        let lastSalaryAdjustment = undefined;
        if (data.lastSalaryAdjustment) {
          lastSalaryAdjustment = {
            ...data.lastSalaryAdjustment,
            adjustedAt: data.lastSalaryAdjustment.adjustedAt?.toDate() || new Date()
          };
        }
        
        return {
          id: workerDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          hireDate: data.hireDate?.toDate() || data.createdAt?.toDate() || new Date(),
          lastSalaryAdjustment: lastSalaryAdjustment
        } as Worker;
      }
      return null;
    } catch (error) {
      console.error('Error fetching worker:', error);
      throw new Error('No se pudo cargar el trabajador');
    }
  },

  // Crear nuevo trabajador
  async createWorker(workerData: WorkerFormData, createdBy: string): Promise<string> {
    try {
      const newWorker = {
        ...workerData,
        status: 'active',
        createdAt: Timestamp.now(),
        createdBy,
        updatedAt: Timestamp.now(),
        updatedBy: createdBy
      };

      const docRef = await addDoc(collection(db, WORKERS_COLLECTION), newWorker);
      return docRef.id;
    } catch (error) {
      console.error('Error creating worker:', error);
      throw new Error('No se pudo crear el trabajador');
    }
  },

  // Actualizar trabajador
  async updateWorker(workerId: string, workerData: Partial<WorkerFormData>, updatedBy: string): Promise<void> {
    try {
      const updateData = {
        ...workerData,
        updatedAt: Timestamp.now(),
        updatedBy
      };

      await updateDoc(doc(db, WORKERS_COLLECTION, workerId), updateData);
    } catch (error) {
      console.error('Error updating worker:', error);
      throw new Error('No se pudo actualizar el trabajador');
    }
  },

  // Eliminar trabajador (soft delete)
  async deleteWorker(workerId: string, deletedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, WORKERS_COLLECTION, workerId), {
        status: 'inactive',
        deletedAt: Timestamp.now(),
        deletedBy,
        updatedAt: Timestamp.now(),
        updatedBy: deletedBy
      });
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw new Error('No se pudo eliminar el trabajador');
    }
  }
};

// ===============================
// OPERACIONES DE ASISTENCIA
// ===============================

export const attendanceService = {
  // Registrar asistencia (entrada/salida)
  async recordAttendance(attendanceData: { workerId: string; workerName: string; type: 'entry' | 'exit' | 'break'; timestamp: Date }): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
        ...attendanceData,
        timestamp: Timestamp.fromDate(attendanceData.timestamp),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw new Error('No se pudo registrar la asistencia');
    }
  },

  // Obtener asistencias por trabajador y rango de fechas
  async getAttendanceByWorker(
    workerId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AttendanceRecord[]> {
    try {
      const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
      const q = query(
        attendanceRef,
        where('workerId', '==', workerId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        checkIn: doc.data().checkIn?.toDate() || null,
        checkOut: doc.data().checkOut?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as AttendanceRecord[];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw new Error('No se pudieron cargar los registros de asistencia');
    }
  },

  // Actualizar registro de asistencia
  async updateAttendance(attendanceId: string, updateData: Partial<AttendanceRecord>): Promise<void> {
    try {
      const update: any = { ...updateData };
      if (update.date) update.date = Timestamp.fromDate(update.date);
      if (update.checkIn) update.checkIn = Timestamp.fromDate(update.checkIn);
      if (update.checkOut) update.checkOut = Timestamp.fromDate(update.checkOut);
      update.updatedAt = Timestamp.now();

      await updateDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId), update);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw new Error('No se pudo actualizar el registro de asistencia');
    }
  }
};

// ===============================
// OPERACIONES DE BONIFICACIONES
// ===============================

export const bonusService = {
  // Crear bonificación
  async createBonus(bonusData: Omit<Bonus, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, BONUSES_COLLECTION), {
        ...bonusData,
        date: Timestamp.fromDate(bonusData.date),
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating bonus:', error);
      throw new Error('No se pudo crear la bonificación');
    }
  },

  // Obtener bonificaciones por trabajador y rango de fechas
  async getBonusesByWorker(
    workerId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Bonus[]> {
    try {
      const bonusRef = collection(db, BONUSES_COLLECTION);
      const q = query(
        bonusRef,
        where('workerId', '==', workerId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Bonus[];
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      throw new Error('No se pudieron cargar las bonificaciones');
    }
  }
};

// ===============================
// OPERACIONES DE CONFIGURACIÓN DE PLANILLA
// ===============================

export const payrollSettingsService = {
  // Obtener configuración de planilla (siempre hay una sola configuración global)
  async getPayrollSettings(): Promise<PayrollSettings> {
    try {
      console.log('Cargando configuración de planilla desde Firestore...');
      const settingsDoc = await getDoc(doc(db, PAYROLL_SETTINGS_COLLECTION, 'global'));
      
      if (settingsDoc.exists()) {
        console.log('Configuración encontrada en Firestore');
        const data = settingsDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as PayrollSettings;
      } else {
        // Si no existe configuración, crear una por defecto
        console.log('No se encontró configuración, creando por defecto...');
        return await this.createDefaultSettings();
      }
    } catch (error) {
      console.error('Error detallado al cargar configuración de planilla:', error);
      // Si falla, retornar configuración por defecto sin guardar
      console.log('Retornando configuración por defecto local...');
      return {
        baseSalary: 1500,
        workingDaysPerMonth: 30,
        workingHoursPerDay: 8,
        overtimeMultiplier: 1.25,
        invalidInsuranceAmount: 28,
        pensionFundPercentage: 0.10,
        essaludAmount: 165,
        lateToleranceMinutes: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },

  // Crear configuración por defecto
  async createDefaultSettings(): Promise<PayrollSettings> {
    const defaultSettings = {
      baseSalary: 1500,
      workingDaysPerMonth: 30,
      workingHoursPerDay: 8,
      overtimeMultiplier: 1.25,
      invalidInsuranceAmount: 28,
      pensionFundPercentage: 0.10,
      essaludAmount: 165,
      lateToleranceMinutes: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(db, PAYROLL_SETTINGS_COLLECTION, 'global'), {
        ...defaultSettings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return defaultSettings as PayrollSettings;
    } catch (error) {
      console.error('Error creating default settings:', error);
      throw new Error('No se pudo crear la configuración por defecto');
    }
  },

  // Actualizar configuración de planilla
  async updatePayrollSettings(settings: Partial<PayrollSettings>, updatedBy: string): Promise<void> {
    try {
      const updateData = {
        ...settings,
        updatedAt: Timestamp.now(),
        updatedBy
      };

      await setDoc(doc(db, PAYROLL_SETTINGS_COLLECTION, 'global'), updateData, { merge: true });
    } catch (error) {
      console.error('Error updating payroll settings:', error);
      throw new Error('No se pudo actualizar la configuración de planilla');
    }
  }
};