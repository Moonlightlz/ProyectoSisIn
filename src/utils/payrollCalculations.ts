import { 
  Worker, 
  AttendanceRecord, 
  Bonus, 
  OvertimeRecord, 
  PayrollCalculation, 
  PayrollSettings,
  PayrollAdjustmentRecord
} from '../types/payroll';

// Configuración por defecto
export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  baseSalary: 1500,
  workingDaysPerMonth: 26, // 6 días x 4.33 semanas promedio
  workingHoursPerDay: 8,
  overtimeMultiplier: 1.25,
  invalidInsuranceAmount: 28,
  pensionFundPercentage: 0.10,
  essaludAmount: 165,
  lateToleranceMinutes: 15,
  breakDurationMinutes: 60
};

// Calcular horas trabajadas en un día
export const calculateWorkedHours = (
  checkIn: Date,
  checkOut: Date,
  breakStart?: Date,
  breakEnd?: Date
): number => {
  if (!checkIn || !checkOut) return 0;
  
  const totalMinutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
  
  // Descontar tiempo de break si está registrado
  let breakMinutes = 0;
  if (breakStart && breakEnd) {
    breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
  } else {
    // Si no hay break registrado, asumir break estándar
    breakMinutes = DEFAULT_PAYROLL_SETTINGS.breakDurationMinutes || 60;
  }
  
  const workedMinutes = Math.max(0, totalMinutes - breakMinutes);
  return Math.round((workedMinutes / 60) * 100) / 100; // Redondear a 2 decimales
};

// Determinar si llegó tarde
export const isLate = (
  scheduledTime: Date,
  actualTime: Date,
  toleranceMinutes: number = DEFAULT_PAYROLL_SETTINGS.lateToleranceMinutes
): boolean => {
  const diffMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
  return diffMinutes > toleranceMinutes;
};

// Calcular horas extras
export const calculateOvertimeHours = (
  workedHours: number,
  standardHours: number = DEFAULT_PAYROLL_SETTINGS.workingHoursPerDay
): number => {
  return Math.max(0, workedHours - standardHours);
};

// Calcular minutos de tardanza
export const calculateLateMinutes = (
  scheduledStartTime: Date,
  actualCheckIn: Date,
  toleranceMinutes: number = DEFAULT_PAYROLL_SETTINGS.lateToleranceMinutes
): number => {
  const diffMinutes = (actualCheckIn.getTime() - scheduledStartTime.getTime()) / (1000 * 60);
  return Math.max(0, diffMinutes - toleranceMinutes);
};

// Calcular horas perdidas por tardanzas (tiempo no pagado)
export const calculateLostHoursDueToLateness = (
  attendanceRecords: AttendanceRecord[],
  settings: PayrollSettings = DEFAULT_PAYROLL_SETTINGS
): number => {
  let totalLostMinutes = 0;
  
  attendanceRecords.forEach(record => {
    if (record.status === 'late' && record.checkIn && record.scheduledStartTime) {
      const lateMinutes = calculateLateMinutes(
        record.scheduledStartTime,
        record.checkIn,
        settings.lateToleranceMinutes
      );
      totalLostMinutes += lateMinutes;
    }
  });
  
  return Math.round((totalLostMinutes / 60) * 100) / 100; // Convertir a horas
};

// Calcular tasas diarias y por hora
export const calculateRates = (baseSalary: number, settings: PayrollSettings = DEFAULT_PAYROLL_SETTINGS) => {
  const dailyRate = baseSalary / 30; // Base mensual dividido en 30 días
  const hourlyRate = dailyRate / settings.workingHoursPerDay;
  const overtimeRate = hourlyRate * settings.overtimeMultiplier;
  
  return {
    dailyRate: Math.round(dailyRate * 100) / 100,
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    overtimeRate: Math.round(overtimeRate * 100) / 100
  };
};

// Calcular resumen de asistencia para un período
export const calculateAttendanceSummary = (
  attendanceRecords: AttendanceRecord[],
  period: { startDate: Date; endDate: Date }
): {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  daysWorked: number;
  daysAbsent: number;
  daysLate: number;
} => {
  let totalHours = 0;
  let overtimeHours = 0;
  let daysWorked = 0;
  let daysAbsent = 0;
  let daysLate = 0;
  
  // Calcular días hábiles en el período (lunes a sábado)
  const getWorkingDaysInPeriod = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Lunes (1) a Sábado (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };
  
  const totalWorkingDays = getWorkingDaysInPeriod(period.startDate, period.endDate);
  
  attendanceRecords.forEach(record => {
    if (record.status === 'absent') {
      daysAbsent++;
    } else {
      daysWorked++;
      
      if (record.checkIn && record.checkOut) {
        const hoursWorked = calculateWorkedHours(
          record.checkIn,
          record.checkOut,
          record.breakStart,
          record.breakEnd
        );
        
        totalHours += hoursWorked;
        
        const dailyOvertime = calculateOvertimeHours(hoursWorked);
        overtimeHours += dailyOvertime;
        
        if (record.status === 'late') {
          daysLate++;
        }
      }
    }
  });
  
  // Si faltan registros, contar como ausencias
  const recordedDays = attendanceRecords.length;
  if (recordedDays < totalWorkingDays) {
    daysAbsent += (totalWorkingDays - recordedDays);
  }
  
  const regularHours = totalHours - overtimeHours;
  
  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    daysWorked,
    daysAbsent,
    daysLate
  };
};

// Calcular planilla completa
export const calculatePayroll = (
  worker: Worker,
  attendanceRecords: AttendanceRecord[],
  bonuses: Bonus[],
  _overtimeRecords: OvertimeRecord[], // TODO: Implementar horas extras
  period: { startDate: Date; endDate: Date; type: 'weekly' | 'monthly' },
  settings: PayrollSettings = DEFAULT_PAYROLL_SETTINGS
): PayrollCalculation => {
  
  // Usar el sueldo actual si existe, sino el sueldo base
  const effectiveSalary = worker.currentSalary || worker.baseSalary;
  const rates = calculateRates(effectiveSalary, settings);
  const attendanceSummary = calculateAttendanceSummary(attendanceRecords, period);
  
  // Días programados para trabajar en el período
  const getScheduledDays = () => {
    if (period.type === 'weekly') return 6; // 6 días por semana
    if (period.type === 'monthly') return settings.workingDaysPerMonth;
    return 0;
  };
  
  const scheduledDays = getScheduledDays();
  const scheduledHours = scheduledDays * settings.workingHoursPerDay;
  
  // Cálculos básicos
  const regularPay = attendanceSummary.regularHours * rates.hourlyRate;
  const overtimePay = attendanceSummary.overtimeHours * rates.overtimeRate;
  
  // Sumar bonuses del período
  const totalBonuses = bonuses
    .filter(bonus => {
      const bonusDate = new Date(bonus.date);
      return bonusDate >= period.startDate && bonusDate <= period.endDate;
    })
    .reduce((sum, bonus) => sum + bonus.amount, 0);
  
  // Descuentos por ausencias
  const absentDiscounts = attendanceSummary.daysAbsent * rates.dailyRate;
  
  // Para tardanzas: calcular horas perdidas (tiempo no pagado)
  const lostHoursDueToLateness = calculateLostHoursDueToLateness(attendanceRecords, settings);
  const lateDiscounts = lostHoursDueToLateness * rates.hourlyRate;
  
  // Cálculo bruto
  const grossPay = regularPay + overtimePay + totalBonuses;
  
  // Descuentos obligatorios (proporcionales a días trabajados)
  // Para descuentos mensuales, usar 30 días del mes como base
  const daysInMonth = 30;
  const proportionWorked = attendanceSummary.daysWorked / daysInMonth;
  
  // Solo aplicar descuentos si hay días trabajados o pago bruto
  const invalidInsurance = proportionWorked > 0 ? settings.invalidInsuranceAmount * proportionWorked : 0;
  const pensionFund = grossPay > 0 ? grossPay * settings.pensionFundPercentage : 0;
  const essaludDeduction = proportionWorked > 0 ? settings.essaludAmount * proportionWorked : 0;
  
  // Los descuentos por ausencias y tardanzas solo se aplican si hubo trabajo
  const appliedAbsentDiscounts = grossPay > 0 ? absentDiscounts : 0;
  const appliedLateDiscounts = grossPay > 0 ? lateDiscounts : 0;
  
  const totalDiscounts = appliedAbsentDiscounts + appliedLateDiscounts + invalidInsurance + pensionFund + essaludDeduction;
  
  // Neto a pagar
  const netPay = grossPay - totalDiscounts;
  
  // Aporte del empleador (también proporcional)
  const essaludContribution = settings.essaludAmount * proportionWorked;
  
  return {
    workerId: worker.id,
    period,
    scheduledHours,
    workedHours: attendanceSummary.totalHours,
    overtimeHours: attendanceSummary.overtimeHours,
    lostHoursDueToLateness,
    scheduledDays,
    workedDays: attendanceSummary.daysWorked,
    absentDays: attendanceSummary.daysAbsent,
    lateDays: attendanceSummary.daysLate,
    baseSalary: worker.baseSalary,
    dailyRate: rates.dailyRate,
    hourlyRate: rates.hourlyRate,
    regularPay: Math.round(regularPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    bonuses: Math.round(totalBonuses * 100) / 100,
    lateDiscounts: Math.round(appliedLateDiscounts * 100) / 100,
    absentDiscounts: Math.round(appliedAbsentDiscounts * 100) / 100,
    invalidInsurance: Math.round(invalidInsurance * 100) / 100,
    pensionFund: Math.round(pensionFund * 100) / 100,
    essaludDeduction: Math.round(essaludDeduction * 100) / 100,
    essaludContribution: Math.round(essaludContribution * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    hasManualAdjustments: false,
    createdAt: new Date(),
    calculatedBy: 'system'
  };
};

// Calcular planilla con ajustes manuales
export const calculatePayrollWithAdjustments = (
  worker: Worker,
  attendanceRecords: AttendanceRecord[],
  bonuses: Bonus[],
  overtimeRecords: OvertimeRecord[],
  period: { startDate: Date; endDate: Date; type: 'weekly' | 'monthly' },
  settings: PayrollSettings = DEFAULT_PAYROLL_SETTINGS,
  adjustment?: PayrollAdjustmentRecord
): PayrollCalculation => {
  
  // Cálculo base
  const baseCalculation = calculatePayroll(
    worker, 
    attendanceRecords, 
    bonuses, 
    overtimeRecords, 
    period, 
    settings
  );
  
  // Si no hay ajustes, retornar cálculo base
  if (!adjustment) {
    return baseCalculation;
  }
  
  // Aplicar ajustes manuales
  let adjustedCalculation = { ...baseCalculation };
  
  // Aplicar horas y días personalizados (las horas tienen prioridad sobre los días)
  if (adjustment.customHours !== undefined) {
    // Usar horas personalizadas directamente
    const customRegularHours = Math.min(adjustment.customHours, settings.workingHoursPerDay * baseCalculation.scheduledDays);
    const customOvertimeHours = Math.max(0, adjustment.customHours - customRegularHours);
    
    adjustedCalculation.workedHours = adjustment.customHours;
    adjustedCalculation.overtimeHours = customOvertimeHours;
    adjustedCalculation.regularPay = customRegularHours * baseCalculation.hourlyRate;
    adjustedCalculation.overtimePay = customOvertimeHours * (baseCalculation.hourlyRate * settings.overtimeMultiplier);
    
    // Calcular días equivalentes para descuentos
    adjustedCalculation.workedDays = Math.round(adjustment.customHours / settings.workingHoursPerDay * 100) / 100;
    adjustedCalculation.absentDays = Math.max(0, baseCalculation.scheduledDays - adjustedCalculation.workedDays);
  } else if (adjustment.customDays !== undefined) {
    // Usar días personalizados para calcular horas
    adjustedCalculation.workedDays = adjustment.customDays;
    adjustedCalculation.absentDays = Math.max(0, baseCalculation.scheduledDays - adjustment.customDays);
    
    // Recalcular pago basado en días personalizados
    const customHours = adjustment.customDays * settings.workingHoursPerDay;
    const customRegularHours = Math.min(customHours, baseCalculation.scheduledHours);
    const customOvertimeHours = Math.max(0, customHours - baseCalculation.scheduledHours);
    
    adjustedCalculation.workedHours = customHours;
    adjustedCalculation.overtimeHours = customOvertimeHours;
    adjustedCalculation.regularPay = customRegularHours * baseCalculation.hourlyRate;
    adjustedCalculation.overtimePay = customOvertimeHours * (baseCalculation.hourlyRate * settings.overtimeMultiplier);
  }
  
  // Recalcular pago bruto con ajustes
  let adjustedGrossPay = adjustedCalculation.regularPay + adjustedCalculation.overtimePay + adjustedCalculation.bonuses;
  
  // Agregar bonos manuales
  if (adjustment.manualBonuses) {
    adjustedGrossPay += adjustment.manualBonuses;
    adjustedCalculation.bonuses += adjustment.manualBonuses;
  }
  
  // Aplicar descuentos personalizados o usar proporcionales
  const daysInMonth = 30;
  const adjustedProportionWorked = adjustedCalculation.workedDays / daysInMonth;
  
  // Solo aplicar descuentos si hay días trabajados o pago bruto
  const hasWorkOrPay = adjustedCalculation.workedDays > 0 || adjustedGrossPay > 0;
  
  const adjustedInvalidInsurance = adjustment.overrideInvalidInsurance ?? 
    (hasWorkOrPay && adjustedProportionWorked > 0 ? settings.invalidInsuranceAmount * adjustedProportionWorked : 0);
  
  const adjustedPensionFund = adjustment.overridePensionFund ?? 
    (adjustedGrossPay > 0 ? adjustedGrossPay * settings.pensionFundPercentage : 0);
  
  const adjustedEssaludDeduction = adjustment.overrideEssaludDeduction ?? 
    (hasWorkOrPay && adjustedProportionWorked > 0 ? settings.essaludAmount * adjustedProportionWorked : 0);
  
  // Los descuentos por ausencias y tardanzas solo se aplican si hubo trabajo
  const appliedAbsentDiscounts = hasWorkOrPay ? adjustedCalculation.absentDiscounts : 0;
  const appliedLateDiscounts = hasWorkOrPay ? adjustedCalculation.lateDiscounts : 0;
  
  // Calcular descuentos totales
  let adjustedTotalDiscounts = 
    appliedAbsentDiscounts + 
    appliedLateDiscounts + 
    adjustedInvalidInsurance + 
    adjustedPensionFund + 
    adjustedEssaludDeduction;
  
  // Agregar descuentos manuales
  if (adjustment.manualDeductions) {
    adjustedTotalDiscounts += adjustment.manualDeductions;
  }
  
  // Calcular neto final
  const adjustedNetPay = adjustedGrossPay - adjustedTotalDiscounts;
  
  // Actualizar valores en el cálculo
  adjustedCalculation.invalidInsurance = Math.round(adjustedInvalidInsurance * 100) / 100;
  adjustedCalculation.pensionFund = Math.round(adjustedPensionFund * 100) / 100;
  adjustedCalculation.essaludDeduction = Math.round(adjustedEssaludDeduction * 100) / 100;
  adjustedCalculation.grossPay = Math.round(adjustedGrossPay * 100) / 100;
  adjustedCalculation.totalDiscounts = Math.round(adjustedTotalDiscounts * 100) / 100;
  adjustedCalculation.netPay = Math.round(adjustedNetPay * 100) / 100;
  adjustedCalculation.hasManualAdjustments = true;
  
  // Agregar información de ajustes manuales
  adjustedCalculation.manualAdjustments = {
    bonuses: adjustment.manualBonuses || 0,
    deductions: adjustment.manualDeductions || 0,
    ...(adjustment.adjustmentNotes && { notes: adjustment.adjustmentNotes })
  };
  
  adjustedCalculation.calculatedBy = 'system_with_adjustments';
  
  return adjustedCalculation;
};

// Formatear moneda
export const formatCurrency = (amount: number): string => {
  return `S/ ${amount.toFixed(2)}`;
};

// Formatear horas
export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

// Validar horario de trabajo
export const validateWorkSchedule = (
  checkIn: Date,
  checkOut: Date,
  breakStart?: Date,
  breakEnd?: Date
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (checkOut <= checkIn) {
    errors.push('La hora de salida debe ser posterior a la hora de entrada');
  }
  
  if (breakStart && breakEnd) {
    if (breakEnd <= breakStart) {
      errors.push('El fin del break debe ser posterior al inicio');
    }
    
    if (breakStart <= checkIn || breakStart >= checkOut) {
      errors.push('El inicio del break debe estar dentro del horario de trabajo');
    }
    
    if (breakEnd <= checkIn || breakEnd >= checkOut) {
      errors.push('El fin del break debe estar dentro del horario de trabajo');
    }
  }
  
  const totalHours = calculateWorkedHours(checkIn, checkOut, breakStart, breakEnd);
  if (totalHours > 12) {
    errors.push('No se pueden registrar más de 12 horas de trabajo por día');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};