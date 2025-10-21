// Tipos para el sistema de trabajadores y planillas
export interface Worker {
  id: string;
  name: string;
  dni: string;
  position: string;
  baseSalary: number; // Sueldo base original
  currentSalary?: number; // Sueldo actual (puede ser diferente por ajustes)
  lastSalaryAdjustment?: {
    amount: number;
    reason: string;
    adjustedBy: string;
    adjustedAt: Date;
  };
  hireDate: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

// Registro de asistencia diaria
export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: Date;
  scheduledStartTime?: Date; // Hora programada de entrada
  scheduledEndTime?: Date; // Hora programada de salida
  checkIn?: Date; // Hora de entrada real
  checkOut?: Date; // Hora de salida real
  breakStart?: Date; // Inicio de break
  breakEnd?: Date; // Fin de break
  status: 'present' | 'absent' | 'late' | 'partial';
  lateMinutes?: number; // Minutos de tardanza calculados
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Bono adicional
export interface Bonus {
  id: string;
  workerId: string;
  date: Date;
  amount: number;
  description: string;
  type: 'performance' | 'extra_hours' | 'special' | 'other';
  createdBy: string;
  createdAt: Date;
}

// Ajustes personalizados de planilla por trabajador
export interface WorkerPayrollAdjustment {
  id: string;
  workerId: string;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'weekly' | 'monthly';
  };
  // Ajustes manuales
  manualBonuses?: number | undefined; // Bonos adicionales manuales
  manualDeductions?: number | undefined; // Descuentos adicionales manuales
  customHours?: number | undefined; // Horas trabajadas personalizadas
  customDays?: number | undefined; // Días trabajados personalizados
  overrideInvalidInsurance?: number | undefined; // Sobrescribir descuento invalidez
  overridePensionFund?: number | undefined; // Sobrescribir descuento pensión
  overrideEssaludDeduction?: number | undefined; // Sobrescribir descuento EsSalud
  // Notas y justificación
  adjustmentNotes?: string | undefined;
  adjustmentReason?: string | undefined;
  // Campos de auditoría
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date | undefined;
}

// Horas extras
export interface OvertimeRecord {
  id: string;
  workerId: string;
  date: Date;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  description?: string;
  approved: boolean;
  approvedBy?: string;
  createdAt: Date;
}

// Cálculo de planilla
export interface PayrollCalculation {
  workerId: string;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'weekly' | 'monthly';
  };
  
  // Horas trabajadas
  scheduledHours: number; // Horas que debería trabajar
  workedHours: number; // Horas realmente trabajadas
  overtimeHours: number; // Horas extras
  lostHoursDueToLateness: number; // Horas perdidas por tardanzas
  
  // Días
  scheduledDays: number; // Días que debería trabajar
  workedDays: number; // Días realmente trabajados
  absentDays: number; // Días ausente
  lateDays: number; // Días con tardanza
  
  // Montos base
  baseSalary: number; // 1500
  dailyRate: number; // 1500/30 = 50
  hourlyRate: number; // (1500/30)/8 = 6.25
  
  // Cálculos de pago
  regularPay: number; // Pago por días/horas normales
  overtimePay: number; // Pago por horas extras
  bonuses: number; // Total de bonos
  
  // Descuentos
  lateDiscounts: number; // Descuentos por tardanzas
  absentDiscounts: number; // Descuentos por faltas
  invalidInsurance: number; // 28 soles (proporcional)
  pensionFund: number; // 10% del bruto
  essaludDeduction: number; // 165 soles (proporcional) - descuento al trabajador
  
  // Aportes del empleador
  essaludContribution: number; // 165 soles (proporcional) - aporte del empleador
  
  // Ajustes manuales aplicados
  manualAdjustments?: {
    bonuses: number;
    deductions: number;
    notes?: string;
  };
  
  // Totales
  grossPay: number; // Bruto antes de descuentos
  totalDiscounts: number; // Total de descuentos
  netPay: number; // Neto a pagar
  
  // Indicador si tiene ajustes manuales
  hasManualAdjustments: boolean;
  
  createdAt: Date;
  calculatedBy: string;
}

// Configuración de planilla
export interface PayrollSettings {
  baseSalary: number; // 1500
  workingDaysPerMonth: number; // 26 (6 días x 4.33 semanas)
  workingHoursPerDay: number; // 8
  overtimeMultiplier: number; // 1.25 (25% adicional)
  invalidInsuranceAmount: number; // 28 soles
  pensionFundPercentage: number; // 10%
  essaludAmount: number; // 165 soles
  lateToleranceMinutes: number; // Tolerancia para tardanza
  breakDurationMinutes?: number; // Duración del break
  // Campos de auditoria
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

// Resumen semanal/mensual
export interface WorkerSummary {
  workerId: string;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'weekly' | 'monthly';
  };
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  daysWorked: number;
  daysAbsent: number;
  daysLate: number;
  totalBonuses: number;
  estimatedPay: number;
}

// Tipos para formularios
export interface WorkerFormData {
  name: string;
  dni: string;
  position: string;
  baseSalary: number;
}

export interface AttendanceFormData {
  workerId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  breakStart: string;
  breakEnd: string;
  notes?: string;
}

export interface BonusFormData {
  workerId: string;
  date: string;
  amount: number;
  description: string;
  type: Bonus['type'];
}

export interface OvertimeFormData {
  workerId: string;
  date: string;
  hours: number;
  description?: string;
}

// Tipos para filtros y reportes
export interface PayrollFilters {
  workerId?: string;
  startDate?: Date;
  endDate?: Date;
  period?: 'weekly' | 'monthly';
  status?: AttendanceRecord['status'];
}

export interface PayrollReport {
  period: {
    startDate: Date;
    endDate: Date;
    type: 'weekly' | 'monthly';
  };
  workers: PayrollCalculation[];
  totals: {
    totalGrossPay: number;
    totalDiscounts: number;
    totalNetPay: number;
    totalBonuses: number;
    totalOvertimePay: number;
    totalEssaludContributions: number;
  };
  generatedAt: Date;
  generatedBy: string;
}