import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Worker, WorkerFormData, PayrollSettings, PayrollAdjustmentRecord } from '../types/payroll';
import { calculatePayroll, calculatePayrollWithAdjustments, formatCurrency, formatHours, DEFAULT_PAYROLL_SETTINGS } from '../utils/payrollCalculations';
import { workerService, payrollSettingsService } from '../services/workerService';
import { createPayrollRecord } from '../services/payrollRecordService';
import { salaryAdjustmentService } from '../services/salaryAdjustmentService';
import WorkerPayrollService from '../services/workerPayrollService';
import Modal from './Modal';
import PayrollAdjustmentModal from './PayrollAdjustmentModal';
import PayrollHistoryModal from './PayrollHistoryModal';
import { useModal } from '../hooks/useModal';
import './WorkerManagement.css';

const WorkerManagement: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  
  // Estados base
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS);
  
  // Estados de formularios
  const [showCreateWorkerForm, setShowCreateWorkerForm] = useState(false);
  const [showPayrollSettings, setShowPayrollSettings] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('monthly');
  
  // Estados para ajustes de planilla
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedWorkerForAdjustment, setSelectedWorkerForAdjustment] = useState<Worker | null>(null);
  const [workerAdjustments, setWorkerAdjustments] = useState<Record<string, PayrollAdjustmentRecord | null>>({});
  
  // Estados para carga de planillas
  const [payrollLoading, setPayrollLoading] = useState<Record<string, boolean>>({});
  
  // Estados para historial de pagos
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWorkerForHistory, setSelectedWorkerForHistory] = useState<Worker | null>(null);
  
  // Estados para ajuste de sueldo
  const [showSalaryAdjustmentModal, setShowSalaryAdjustmentModal] = useState(false);
  const [selectedWorkerForSalaryAdjustment, setSelectedWorkerForSalaryAdjustment] = useState<Worker | null>(null);
  const [salaryAdjustmentForm, setSalaryAdjustmentForm] = useState({
    newSalary: 0,
    reason: ''
  });

  // Estados para controlar visibilidad de planillas
  const [visiblePayrolls, setVisiblePayrolls] = useState<Record<string, boolean>>({});
  const [payrollCalculations, setPayrollCalculations] = useState<Record<string, any>>({});
  
  // Formularios
  const [newWorker, setNewWorker] = useState<WorkerFormData>({
    name: '',
    dni: '',
    position: '',
    baseSalary: DEFAULT_PAYROLL_SETTINGS.baseSalary
  });



  // Cargar datos desde Firestore
  useEffect(() => {
    loadData();
  }, []);

  // Verificar permisos
  if (userRole !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>Solo los administradores pueden acceder a la gestión de trabajadores.</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Iniciando carga de datos...');
      
      // Cargar trabajadores desde Firestore
      console.log('Cargando trabajadores...');
      const workersData = await workerService.getAllWorkers();
      console.log('Trabajadores cargados:', workersData.length);
      setWorkers(workersData);
      
      // Cargar configuración de planilla
      console.log('Cargando configuración de planilla...');
      const settings = await payrollSettingsService.getPayrollSettings();
      console.log('Configuración cargada:', settings);
      setPayrollSettings(settings);
      
      // Cargar ajustes existentes para todos los trabajadores
      console.log('Cargando ajustes de planilla...');
      await loadWorkersAdjustments(workersData);
      
      console.log('Carga de datos completada exitosamente');
    } catch (error) {
      console.error('Error detallado al cargar datos:', error);
      showError('Error de carga', `No se pudieron cargar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar ajustes de planilla para todos los trabajadores
  const loadWorkersAdjustments = async (workers: Worker[]) => {
    try {
      console.log('🔍 Iniciando carga de ajustes para', workers.length, 'trabajadores');
      console.log('🗓️ Período seleccionado:', selectedPeriod);
      
      const now = new Date();
      const startDate = selectedPeriod === 'monthly' ? 
        new Date(now.getFullYear(), now.getMonth(), 1) :
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      
      const endDate = selectedPeriod === 'monthly' ?
        new Date(now.getFullYear(), now.getMonth() + 1, 0) :
        new Date();

      console.log('📅 Rango de fechas:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const adjustmentsMap: Record<string, PayrollAdjustmentRecord | null> = {};
      
      // Cargar ajustes para cada trabajador desde el documento del worker
      for (const worker of workers) {
        try {
          console.log(`🔎 Buscando ajustes para ${worker.name} (${worker.id})`);
          
          // Primero verificar si el worker tiene ajustes en su documento
          const allWorkerAdjustments = await WorkerPayrollService.getWorkerPayrollAdjustments(worker.id);
          console.log(`📝 ${worker.name} tiene ${allWorkerAdjustments.length} ajustes totales:`, allWorkerAdjustments);
          
          // Luego filtrar por período
          const workerAdjustments = await WorkerPayrollService.getWorkerPayrollAdjustmentsByPeriod(
            worker.id,
            startDate,
            endDate
          );
          
          if (workerAdjustments.length > 0) {
            adjustmentsMap[worker.id] = workerAdjustments[0]; // Más reciente
            console.log(`✅ Ajustes cargados para ${worker.name}:`, workerAdjustments[0]);
          } else {
            adjustmentsMap[worker.id] = null;
            console.log(`❌ No se encontraron ajustes para ${worker.name} en el período actual`);
          }
        } catch (error) {
          console.error(`💥 Error cargando ajustes para ${worker.name}:`, error);
          adjustmentsMap[worker.id] = null;
        }
      }
      
      setWorkerAdjustments(adjustmentsMap);
      console.log('🎯 Ajustes de trabajadores cargados finalmente:', adjustmentsMap);
    } catch (error) {
      console.error('💥 Error general cargando ajustes de trabajadores:', error);
    }
  };

  // Crear trabajador
  const handleCreateWorker = async () => {
    if (!newWorker.name.trim() || !newWorker.dni.trim()) {
      showError('Campos requeridos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      if (!currentUser) {
        showError('Error de sesión', 'No se pudo identificar el usuario actual');
        return;
      }
      
      // Crear trabajador en Firestore
      await workerService.createWorker(newWorker, currentUser.uid);
      
      // Refrescar la lista de trabajadores
      await loadData();
      
      // Limpiar formulario
      setNewWorker({
        name: '',
        dni: '',
        position: '',
        baseSalary: payrollSettings.baseSalary
      });
      setShowCreateWorkerForm(false);
      showSuccess('Trabajador creado', 'El trabajador ha sido registrado exitosamente');
    } catch (error) {
      console.error('Error creating worker:', error);
      showError('Error al crear', 'No se pudo crear el trabajador');
    }
  };

  // Actualizar configuración de planilla
  const handleUpdatePayrollSettings = async () => {
    try {
      if (!currentUser) {
        showError('Error de sesión', 'No se pudo identificar el usuario actual');
        return;
      }

      // Guardar configuración en Firestore
      await payrollSettingsService.updatePayrollSettings(payrollSettings, currentUser.uid);
      
      showSuccess('Configuración actualizada', 'Los parámetros de planilla han sido actualizados correctamente');
      setShowPayrollSettings(false);
    } catch (error) {
      console.error('Error updating payroll settings:', error);
      showError('Error al actualizar', 'No se pudieron guardar los cambios en la configuración');
    }
  };

  // TODO: Implementar funciones de asistencia y bonos
  // const handleRegisterAttendance = async () => { ... };
  // const handleAddBonus = async () => { ... };

  // Obtener el sueldo actual del trabajador (puede ser diferente del base por ajustes)
  const getCurrentSalary = (worker: Worker): number => {
    return worker.currentSalary || worker.baseSalary;
  };

  // Función para calcular planilla individual con ajustes opcionales
  const calculateWorkerPayroll = (worker: Worker) => {
    console.log('Calculando planilla para trabajador:', worker.name);
    
    const now = new Date();
    const startDate = selectedPeriod === 'monthly' ? 
      new Date(now.getFullYear(), now.getMonth(), 1) :
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    
    const endDate = selectedPeriod === 'monthly' ?
      new Date(now.getFullYear(), now.getMonth() + 1, 0) :
      new Date();

    // Sin datos de asistencia hasta que se implemente el módulo
    const mockAttendance: any[] = [];
    const mockBonuses: any[] = [];

    // Verificar si hay ajustes para este trabajador
    const adjustmentRecord = workerAdjustments[worker.id];
    
    // Convertir PayrollAdjustmentRecord a WorkerPayrollAdjustment para compatibilidad
    const adjustment = adjustmentRecord ? {
      ...adjustmentRecord,
      workerId: worker.id
    } : null;
    
    const calculation = adjustment ? 
      calculatePayrollWithAdjustments(
        worker,
        mockAttendance,
        mockBonuses,
        [], // overtime records - por implementar
        { startDate, endDate, type: selectedPeriod },
        payrollSettings,
        adjustment
      ) :
      calculatePayroll(
        worker,
        mockAttendance,
        mockBonuses,
        [], // overtime records - por implementar
        { startDate, endDate, type: selectedPeriod },
        payrollSettings
      );

    return calculation;
  };

  // Toggle planilla - mostrar/ocultar y calcular si es necesario
  const handleTogglePayroll = async (worker: Worker) => {
    const isCurrentlyVisible = visiblePayrolls[worker.id];
    
    if (isCurrentlyVisible) {
      // Si está visible, ocultarla
      setVisiblePayrolls(prev => ({
        ...prev,
        [worker.id]: false
      }));
    } else {
      // Si no está visible, mostrarla y calcular
      try {
        console.log(`Calculando planilla para ${worker.name}...`);
        console.log('Worker data:', worker);
        console.log('Selected period:', selectedPeriod);
        console.log('Payroll settings:', payrollSettings);
        
        // Iniciar estado de carga
        setPayrollLoading(prev => ({
          ...prev,
          [worker.id]: true
        }));
        
        // Mostrar que se está cargando (sin datos aún)
        setVisiblePayrolls(prev => ({
          ...prev,
          [worker.id]: true
        }));
        
        // Paso 1: Cargar ajustes desde Firebase
        console.log('Paso 1: Cargando ajustes desde Firebase...');
        const now = new Date();
        const startDate = selectedPeriod === 'monthly' ? 
          new Date(now.getFullYear(), now.getMonth(), 1) :
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        
        const endDate = selectedPeriod === 'monthly' ?
          new Date(now.getFullYear(), now.getMonth() + 1, 0) :
          new Date();

        let loadedAdjustments;
        try {
          console.log('🔍 DEBUGGING: Llamando getWorkerPayrollAdjustmentsByPeriod con:', {
            workerId: worker.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          });
          
          // Primero obtener TODOS los ajustes del worker para ver qué fechas tienen
          const allAdjustments = await WorkerPayrollService.getWorkerPayrollAdjustments(worker.id);
          console.log('🗂️ TODOS los ajustes del worker (sin filtrar):', allAdjustments.map(adj => ({
            id: adj.id,
            period: {
              startDate: adj.period.startDate,
              endDate: adj.period.endDate
            }
          })));
          
          loadedAdjustments = await WorkerPayrollService.getWorkerPayrollAdjustmentsByPeriod(
            worker.id, 
            startDate, 
            endDate
          );
          console.log('✅ Ajustes cargados desde Firebase (después del filtro):', loadedAdjustments);
          
          // TEMPORAL: Usar el primer ajuste sin importar el período para debugging
          const allWorkerAdjustments = await WorkerPayrollService.getWorkerPayrollAdjustments(worker.id);
          
          // Actualizar el estado local con los ajustes cargados
          if (loadedAdjustments.length > 0) {
            const latestAdjustment = loadedAdjustments[0]; // Más reciente
            setWorkerAdjustments(prev => ({
              ...prev,
              [worker.id]: latestAdjustment
            }));
            console.log('✅ Ajuste aplicado al trabajador (del filtro):', latestAdjustment);
          } else if (allWorkerAdjustments.length > 0) {
            // TEMPORAL: Si el filtro no funciona, usar cualquier ajuste para verificar que la funcionalidad básica sirve
            const anyAdjustment = allWorkerAdjustments[0];
            setWorkerAdjustments(prev => ({
              ...prev,
              [worker.id]: anyAdjustment
            }));
            console.log('⚠️ TEMPORAL: Usando ajuste sin filtrar para testing:', anyAdjustment);
          } else {
            console.log('❌ No hay ajustes disponibles para este worker');
          }
        } catch (adjustmentError) {
          console.error('Error cargando ajustes:', adjustmentError);
          // Continuar sin ajustes si hay error
        }

        // Paso 2: Calcular planilla
        console.log('Paso 2: Iniciando cálculo...');
        let calculation;
        
        try {
          calculation = calculateWorkerPayroll(worker);
          console.log('Paso 3: Cálculo completado:', calculation);
        } catch (calcError) {
          console.error('Error en calculateWorkerPayroll:', calcError);
          throw new Error('Error en el cálculo de planilla: ' + (calcError instanceof Error ? calcError.message : String(calcError)));
        }
        
        // Guardar el cálculo en el estado
        setPayrollCalculations(prev => ({
          ...prev,
          [worker.id]: calculation
        }));
        console.log('Paso 4: Cálculo guardado en estado');
        
        // Opcional: Guardar el registro en la base de datos
        try {
          console.log('Paso 5: Guardando en base de datos...');
          await createPayrollRecord(calculation, {
            paymentStatus: 'pending',
            notes: `Planilla ${selectedPeriod} generada automáticamente`
          });
          console.log('Paso 6: Guardado en base de datos exitoso');
        } catch (dbError) {
          console.error('Error al guardar en base de datos:', dbError);
          // No fallar si solo es el guardado en DB, mostrar warning
          console.warn('Planilla calculada pero no pudo guardarse en BD');
        }
        
        console.log('Planilla calculada exitosamente');
        
        // Finalizar estado de carga (éxito)
        setPayrollLoading(prev => ({
          ...prev,
          [worker.id]: false
        }));
        
      } catch (error) {
        console.error('Error detallado calculating payroll:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        showError('Error al calcular la planilla', error instanceof Error ? error.message : 'Error desconocido');
        
        // Si hay error, ocultar la planilla y finalizar carga
        setVisiblePayrolls(prev => ({
          ...prev,
          [worker.id]: false
        }));
        
        setPayrollLoading(prev => ({
          ...prev,
          [worker.id]: false
        }));
      }
    }
  };

  // Manejar ajustes de planilla
  const handleAdjustPayroll = (worker: Worker) => {
    setSelectedWorkerForAdjustment(worker);
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentSaved = (adjustment: PayrollAdjustmentRecord | null) => {
    if (selectedWorkerForAdjustment) {
      setWorkerAdjustments(prev => ({
        ...prev,
        [selectedWorkerForAdjustment.id]: adjustment
      }));
    }
  };

  const handleCloseAdjustmentModal = () => {
    setShowAdjustmentModal(false);
    setSelectedWorkerForAdjustment(null);
  };

  // Manejar historial de pagos
  const handleShowHistory = (worker: Worker) => {
    setSelectedWorkerForHistory(worker);
    setShowHistoryModal(true);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedWorkerForHistory(null);
  };

  // Abrir modal de ajuste de sueldo
  const handleShowSalaryAdjustment = (worker: Worker) => {
    setSelectedWorkerForSalaryAdjustment(worker);
    setSalaryAdjustmentForm({
      newSalary: getCurrentSalary(worker),
      reason: ''
    });
    setShowSalaryAdjustmentModal(true);
  };

  // Aplicar ajuste de sueldo
  const handleApplySalaryAdjustment = async () => {
    if (!selectedWorkerForSalaryAdjustment || !currentUser) {
      showError('Error', 'No se puede procesar el ajuste de sueldo');
      return;
    }

    if (salaryAdjustmentForm.newSalary <= 0) {
      showError('Error', 'El nuevo sueldo debe ser mayor a 0');
      return;
    }

    if (!salaryAdjustmentForm.reason.trim()) {
      showError('Error', 'Debe especificar la razón del ajuste');
      return;
    }

    try {
      console.log('Aplicando ajuste de sueldo:', {
        workerId: selectedWorkerForSalaryAdjustment.id,
        newSalary: salaryAdjustmentForm.newSalary,
        reason: salaryAdjustmentForm.reason,
        adjustedBy: currentUser.uid
      });

      await salaryAdjustmentService.adjustWorkerSalary(
        selectedWorkerForSalaryAdjustment.id,
        salaryAdjustmentForm.newSalary,
        salaryAdjustmentForm.reason,
        currentUser.uid
      );

      console.log('Ajuste de sueldo completado, recargando datos...');

      // Recargar datos para mostrar el cambio
      await loadData();

      setShowSalaryAdjustmentModal(false);
      showSuccess('Sueldo ajustado', 'El sueldo del trabajador ha sido actualizado exitosamente');
    } catch (error) {
      console.error('Error adjusting salary:', error);
      showError('Error', 'No se pudo ajustar el sueldo del trabajador');
    }
  };

  if (loading) {
    return <div className="loading">Cargando datos de trabajadores...</div>;
  }

  return (
    <div className="worker-management">
      <div className="header">
        <h1>Gestión de Trabajadores</h1>
        <div className="header-actions">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as 'weekly' | 'monthly')}
            className="period-selector"
          >
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowPayrollSettings(true)}
          >
            ⚙️ Configurar Planilla
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={async () => {
              console.log('🔧 Ejecutando pruebas de Firebase...');
              if ((window as any).testFirebaseConnection) {
                await (window as any).testFirebaseConnection();
              } else {
                console.error('testFirebaseConnection no disponible');
              }
            }}
          >
            🔧 Probar Firebase
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateWorkerForm(true)}
          >
            Nuevo Trabajador
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => alert('Función por implementar')}
          >
            Registrar Asistencia
          </button>
        </div>
      </div>

      {/* Lista de trabajadores */}
      <div className="workers-grid">
        {workers.map(worker => {
          const isPayrollVisible = visiblePayrolls[worker.id];
          const calculation = payrollCalculations[worker.id];
          
          return (
            <div key={worker.id} className="worker-card">
              <div className="worker-info">
                <h3>{worker.name}</h3>
                <p>DNI: {worker.dni}</p>
                <p>Cargo: {worker.position}</p>
                <p>Sueldo Base: {formatCurrency(worker.baseSalary)}</p>
                {/* Debug info */}
                <small style={{color: '#666', fontSize: '10px'}}>
                  Debug: currentSalary={worker.currentSalary || 'undefined'}, 
                  hasAdjustment={worker.lastSalaryAdjustment ? 'yes' : 'no'}
                </small>
                {worker.currentSalary && worker.currentSalary !== worker.baseSalary && (
                  <div className="salary-adjustment-info">
                    <p className="current-salary">
                      <strong>Sueldo Actual: {formatCurrency(worker.currentSalary)}</strong>
                    </p>
                    {worker.lastSalaryAdjustment && (
                      <small className="adjustment-details">
                        Ajustado: {worker.lastSalaryAdjustment.reason}
                        <br />
                        Fecha: {new Date(worker.lastSalaryAdjustment.adjustedAt).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                )}
              </div>
              
              {isPayrollVisible && (
                <div className="payroll-summary">
                  {payrollLoading[worker.id] ? (
                    <div className="loading-message">
                      <span className="spinner"></span>
                      <h4>Cargando planilla desde Firebase...</h4>
                      <p>Por favor espere mientras se cargan los ajustes y se calculan los datos</p>
                    </div>
                  ) : calculation ? (
                    <>
                      <h4>Planilla {selectedPeriod === 'monthly' ? 'Mensual' : 'Semanal'}</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span> Horas Trabajadas:</span>
                      <span>{formatHours(calculation.workedHours)}</span>
                    </div>
                    <div className="summary-item">
                      <span> Horas Extras:</span>
                      <span>{formatHours(calculation.overtimeHours)}</span>
                    </div>
                    <div className="summary-item">
                      <span> Días Trabajados:</span>
                      <span>{calculation.workedDays}</span>
                    </div>
                    <div className="summary-item">
                      <span> Pago Regular:</span>
                      <span>{formatCurrency(calculation.regularPay)}</span>
                    </div>
                    <div className="summary-item">
                      <span> Pago Horas Extras:</span>
                      <span>{formatCurrency(calculation.overtimePay)}</span>
                    </div>
                    <div className="summary-item">
                      <span> Bonos:</span>
                      <span>{formatCurrency(calculation.bonuses)}</span>
                    </div>
                      <div className="summary-item">
                        <span> Total Descuentos:</span>
                        <span className="negative">{formatCurrency(calculation.totalDiscounts)}</span>
                      </div>
                      <div className="summary-item total">
                        <span> Neto a Pagar:</span>
                        <span className="amount">{formatCurrency(calculation.netPay)}</span>
                      </div>
                    </div>
                    </>
                  ) : (
                    <div className="no-data-message">
                      <p>No hay datos de planilla disponibles</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="worker-actions">
                <button 
                  className={`btn ${isPayrollVisible ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleTogglePayroll(worker)}
                  disabled={payrollLoading[worker.id]}
                >
                  {payrollLoading[worker.id] ? (
                    <>
                      <span className="spinner"></span>
                      Cargando...
                    </>
                  ) : (
                    isPayrollVisible ? '📊 Ocultar Planilla' : '📊 Mostrar Planilla'
                  )}
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => handleAdjustPayroll(worker)}
                  title="Ajustar planilla manualmente"
                >
                  📝 Ajustar
                </button>
                <button 
                  className="btn btn-info"
                  onClick={() => handleShowHistory(worker)}
                  title="Ver historial de pagos"
                >
                  📊 Historial
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleShowSalaryAdjustment(worker)}
                  title="Ajustar sueldo del trabajador"
                >
                  💰 Ajustar Sueldo
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => alert('Función por implementar')}
                >
                  Agregar Bono
                </button>
                {workerAdjustments[worker.id] && (
                  <span className="adjustment-indicator" title="Este trabajador tiene ajustes manuales">
                    ⚙️ Ajustado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formulario Nuevo Trabajador */}
      {showCreateWorkerForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nuevo Trabajador</h3>
              <button onClick={() => setShowCreateWorkerForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del trabajador"
                />
              </div>
              <div className="form-group">
                <label>DNI *</label>
                <input
                  type="text"
                  value={newWorker.dni}
                  onChange={(e) => setNewWorker(prev => ({ ...prev, dni: e.target.value }))}
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>
              <div className="form-group">
                <label>Cargo</label>
                <input
                  type="text"
                  value={newWorker.position}
                  onChange={(e) => setNewWorker(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Ej: Operario, Supervisor"
                />
              </div>
              <div className="form-group">
                <label>Sueldo Base</label>
                <input
                  type="number"
                  value={newWorker.baseSalary}
                  onChange={(e) => setNewWorker(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateWorkerForm(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleCreateWorker}>
                Crear Trabajador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Configuración de Planilla */}
      {showPayrollSettings && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>⚙️ Configuración de Planilla</h3>
              <button onClick={() => setShowPayrollSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="settings-grid">
                <div className="form-group">
                  <label>Sueldo Base Mensual (S/)</label>
                  <input
                    type="number"
                    value={payrollSettings.baseSalary}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Días Laborables por Mes</label>
                  <input
                    type="number"
                    value={payrollSettings.workingDaysPerMonth}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, workingDaysPerMonth: Number(e.target.value) }))}
                    min="1"
                    max="31"
                  />
                </div>
                
                <div className="form-group">
                  <label>Horas de Trabajo por Día</label>
                  <input
                    type="number"
                    value={payrollSettings.workingHoursPerDay}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, workingHoursPerDay: Number(e.target.value) }))}
                    min="1"
                    max="12"
                  />
                </div>
                
                <div className="form-group">
                  <label>Multiplicador de Horas Extras</label>
                  <input
                    type="number"
                    value={payrollSettings.overtimeMultiplier}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, overtimeMultiplier: Number(e.target.value) }))}
                    min="1"
                    max="3"
                    step="0.01"
                  />
                  <small>Ejemplo: 1.25 = 25% adicional</small>
                </div>
                
                <div className="form-group">
                  <label>Seguro de Invalidez (S/)</label>
                  <input
                    type="number"
                    value={payrollSettings.invalidInsuranceAmount}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, invalidInsuranceAmount: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Fondo de Pensión (%)</label>
                  <input
                    type="number"
                    value={payrollSettings.pensionFundPercentage * 100}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, pensionFundPercentage: Number(e.target.value) / 100 }))}
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <small>Porcentaje del sueldo bruto</small>
                </div>
                
                <div className="form-group">
                  <label>EsSalud - Aporte Empleador (S/)</label>
                  <input
                    type="number"
                    value={payrollSettings.essaludAmount}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, essaludAmount: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tolerancia Tardanza (minutos)</label>
                  <input
                    type="number"
                    value={payrollSettings.lateToleranceMinutes}
                    onChange={(e) => setPayrollSettings(prev => ({ ...prev, lateToleranceMinutes: Number(e.target.value) }))}
                    min="0"
                    max="60"
                  />
                </div>
              </div>
              
              <div className="calculation-preview">
                <h4>📊 Vista Previa de Cálculos</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span>Tarifa Diaria:</span>
                    <span>S/ {(payrollSettings.baseSalary / 30).toFixed(2)}</span>
                  </div>
                  <div className="preview-item">
                    <span>Tarifa por Hora:</span>
                    <span>S/ {((payrollSettings.baseSalary / 30) / payrollSettings.workingHoursPerDay).toFixed(2)}</span>
                  </div>
                  <div className="preview-item">
                    <span>Tarifa Hora Extra:</span>
                    <span>S/ {(((payrollSettings.baseSalary / 30) / payrollSettings.workingHoursPerDay) * payrollSettings.overtimeMultiplier).toFixed(2)}</span>
                  </div>
                  <div className="preview-item">
                    <span>Descuento Total Fijo:</span>
                    <span>S/ {(payrollSettings.invalidInsuranceAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPayrollSettings(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleUpdatePayrollSettings}>
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sistema */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />

      {/* Modal de ajustes de planilla */}
      {selectedWorkerForAdjustment && (
        <PayrollAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={handleCloseAdjustmentModal}
          worker={selectedWorkerForAdjustment}
          baseCalculation={calculateWorkerPayroll(selectedWorkerForAdjustment)}
          onAdjustmentSaved={handleAdjustmentSaved}
        />
      )}

      {/* Modal de historial de pagos */}
      {selectedWorkerForHistory && (
        <PayrollHistoryModal
          isOpen={showHistoryModal}
          onClose={handleCloseHistoryModal}
          worker={selectedWorkerForHistory}
        />
      )}

      {/* Modal de ajuste de sueldo */}
      {showSalaryAdjustmentModal && selectedWorkerForSalaryAdjustment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Ajustar Sueldo - {selectedWorkerForSalaryAdjustment.name}</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowSalaryAdjustmentModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="salary-adjustment-form">
                <div className="current-salary-info">
                  <p><strong>Sueldo Base:</strong> {formatCurrency(selectedWorkerForSalaryAdjustment.baseSalary)}</p>
                  <p><strong>Sueldo Actual:</strong> {formatCurrency(getCurrentSalary(selectedWorkerForSalaryAdjustment))}</p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="newSalary">Nuevo Sueldo (S/)</label>
                  <input
                    id="newSalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salaryAdjustmentForm.newSalary}
                    onChange={(e) => setSalaryAdjustmentForm(prev => ({
                      ...prev,
                      newSalary: parseFloat(e.target.value) || 0
                    }))}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="reason">Razón del Ajuste</label>
                  <select
                    id="reason"
                    value={salaryAdjustmentForm.reason}
                    onChange={(e) => setSalaryAdjustmentForm(prev => ({
                      ...prev,
                      reason: e.target.value
                    }))}
                    className="form-control"
                  >
                    <option value="">Seleccionar razón...</option>
                    <option value="Aumento por desempeño">Aumento por desempeño</option>
                    <option value="Ajuste por inflación">Ajuste por inflación</option>
                    <option value="Promoción">Promoción</option>
                    <option value="Corrección salarial">Corrección salarial</option>
                    <option value="Bonificación permanente">Bonificación permanente</option>
                    <option value="Reducción temporal">Reducción temporal</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                {salaryAdjustmentForm.reason === 'Otro' && (
                  <div className="form-group">
                    <label htmlFor="customReason">Especificar razón:</label>
                    <input
                      id="customReason"
                      type="text"
                      placeholder="Especificar la razón del ajuste..."
                      onChange={(e) => setSalaryAdjustmentForm(prev => ({
                        ...prev,
                        reason: e.target.value
                      }))}
                      className="form-control"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowSalaryAdjustmentModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleApplySalaryAdjustment}
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManagement;