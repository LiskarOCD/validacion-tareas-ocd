import React, { useState, useMemo, useEffect } from 'react';
import { TaskRecord, UserRole, FilterState, ImportBatch } from './types';
import { 
  loadStoredTasks, 
  loadStoredTasksAsync,
  saveStoredTasks, 
  loadStoredBatches, 
  saveStoredBatches, 
  resetToSampleData,
  clearAllStoredData
} from './utils/storage';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TaskFilters } from './components/TaskFilters';
import { TaskTable } from './components/TaskTable';
import { AppealModal } from './components/AppealModal';
import { ResolutionModal } from './components/ResolutionModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExportModal } from './components/ExportModal';
import { AnalyticsView } from './components/AnalyticsView';
import { BatchesHistoryView } from './components/BatchesHistoryView';
import { EmptyState } from './components/EmptyState';
import { OcdLogo } from './components/OcdLogo';
import { LoginPage } from './components/LoginPage';
import { supabase } from './lib/supabase';
import { ParseResult } from './utils/excelParser';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function App() {
  const [authLoading, setAuthLoading] = useState(true);
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
  let mounted = true;

  async function loadSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!mounted) return;

    setIsAuthenticated(Boolean(session));
    setAuthLoading(false);
  }

  loadSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!mounted) return;

    setIsAuthenticated(Boolean(session));
    setAuthLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
  const [tasks, setTasks] = useState<TaskRecord[]>(() => loadStoredTasks());
  const [batches, setBatches] = useState<ImportBatch[]>(() => loadStoredBatches());
  const [activeView, setActiveView] = useState<'tasks' | 'analytics' | 'batches'>('tasks');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Background hydration from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromStorage() {
      try {
        const idbTasks = await loadStoredTasksAsync();
        if (isMounted && idbTasks && Array.isArray(idbTasks)) {
          setTasks(idbTasks);
        }
      } catch (err) {
        console.warn('Hydration notice:', err);
      }
    }
    hydrateFromStorage();
    return () => {
      isMounted = false;
    };
  }, []);

  const [userRole, setUserRole] = useState<UserRole>({
    role: 'SUPERVISOR',
    name: 'Supervisor General OCD',
  });

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    vendedor: '',
    supervisor: '',
    ruta: '',
    categoria: '',
    estadoValidacion: '',
    estadoApelacion: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  // Modal States
  const [appealModalTask, setAppealModalTask] = useState<TaskRecord | null>(null);
  const [resolutionModalTask, setResolutionModalTask] = useState<TaskRecord | null>(null);
  const [imageViewerState, setImageViewerState] = useState<{
    task: TaskRecord | null;
    initialMode: 'original' | 'apelacion' | 'compare';
  }>({ task: null, initialMode: 'original' });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Distinct lists for dropdown filters
  const vendedoresList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => { if (t.vendedor) set.add(t.vendedor); });
    return Array.from(set).sort();
  }, [tasks]);

  const supervisoresList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => { if (t.supervisor) set.add(t.supervisor); });
    return Array.from(set).sort();
  }, [tasks]);

  const rutasList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => { if (t.ruta) set.add(t.ruta); });
    return Array.from(set).sort();
  }, [tasks]);

  const categoriasList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => { if (t.categoriaTarea) set.add(t.categoriaTarea); });
    return Array.from(set).sort();
  }, [tasks]);

  // Contextual tasks for the active role (if Vendedor role is active, filter to that vendedor)
  const roleScopedTasks = useMemo(() => {
    if (userRole.role === 'VENDEDOR' && userRole.selectedVendedor) {
      return tasks.filter((t) => t.vendedor === userRole.selectedVendedor);
    }
    return tasks;
  }, [tasks, userRole]);

  // Filtered tasks calculation
  const filteredTasks = useMemo(() => {
    return roleScopedTasks.filter((t) => {
      // Search term (PDV name, PDV code, Task name, Seller name, Reason)
      if (filters.searchTerm) {
        const query = filters.searchTerm.toLowerCase();
        const matches =
          t.nombrePDV.toLowerCase().includes(query) ||
          t.codigoPDV.toLowerCase().includes(query) ||
          t.nombreTarea.toLowerCase().includes(query) ||
          t.vendedor.toLowerCase().includes(query) ||
          (t.motivoInvalidacion && t.motivoInvalidacion.toLowerCase().includes(query)) ||
          (t.motivoApelacion && t.motivoApelacion.toLowerCase().includes(query)) ||
          (t.direccionPDV && t.direccionPDV.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Vendedor filter
      if (filters.vendedor && t.vendedor !== filters.vendedor) {
        return false;
      }

      // Supervisor filter
      if (filters.supervisor && t.supervisor !== filters.supervisor) {
        return false;
      }

      // Ruta filter
      if (filters.ruta && t.ruta !== filters.ruta) {
        return false;
      }

      // Categoria filter
      if (filters.categoria && t.categoriaTarea !== filters.categoria) {
        return false;
      }

      // Estado Validación
      if (filters.estadoValidacion && t.estadoValidacion !== filters.estadoValidacion) {
        return false;
      }

      // Estado Apelación
      if (filters.estadoApelacion && t.estadoApelacion !== filters.estadoApelacion) {
        return false;
      }

      return true;
    });
  }, [roleScopedTasks, filters]);

  // Counts for quick tabs based on current role scope
  const filterCounts = useMemo(() => {
    return {
      todas: roleScopedTasks.length,
      sinApelar: roleScopedTasks.filter(
        (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'SIN_APELAR'
      ).length,
      enRevision: roleScopedTasks.filter(
        (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'EN_REVISION'
      ).length,
      aprobadas: roleScopedTasks.filter(
        (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'APROBADA'
      ).length,
      rechazadas: roleScopedTasks.filter(
        (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'RECHAZADA'
      ).length,
      validadas: roleScopedTasks.filter((t) => t.estadoValidacion === 'VALIDADA').length,
    };
  }, [roleScopedTasks]);

  // Pending appeals count across whole system
  const pendingAppealsCount = useMemo(() => {
    return tasks.filter(
      (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'EN_REVISION'
    ).length;
  }, [tasks]);

  // Handlers
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    // Clear specific vendedor filter when switching role
    setFilters((prev) => ({ ...prev, vendedor: '' }));
  };

  const handleResetData = () => {
    const reset = resetToSampleData();
    setTasks(reset);
    setBatches(loadStoredBatches());
    setUserRole({ role: 'SUPERVISOR', name: 'Supervisor General OCD' });
    showToast('Se cargaron los datos de demostración de prueba OCD.');
  };

  const handleClearData = () => {
    clearAllStoredData();
    setTasks([]);
    setBatches([]);
    setUserRole({ role: 'SUPERVISOR', name: 'Supervisor General OCD' });
    showToast('Base de datos vaciada. Puedes cargar tu archivo Excel.', 'info');
  };

  const handleImportSuccess = (result: ParseResult) => {
    let updatedTasksList: TaskRecord[];
    let updatedBatches: ImportBatch[];

    if (result.mode === 'replace') {
      // Complete replacement with the new Excel content
      updatedTasksList = result.tasks;
      updatedBatches = [result.batch];
    } else {
      // Merge mode
      updatedTasksList = [...result.tasks];
      const newIds = new Set(result.tasks.map((t) => t.id));
      tasks.forEach((existing) => {
        if (!newIds.has(existing.id)) {
          updatedTasksList.push(existing);
        }
      });
      updatedBatches = [result.batch, ...batches];
    }

    setTasks(updatedTasksList);
    saveStoredTasks(updatedTasksList);

    setBatches(updatedBatches);
    saveStoredBatches(updatedBatches);

    // Reset filters and ensure role is valid
    setFilters({
      searchTerm: '',
      vendedor: '',
      supervisor: '',
      ruta: '',
      categoria: '',
      estadoValidacion: '',
      estadoApelacion: '',
      fechaDesde: '',
      fechaHasta: '',
    });

    const newSellers = new Set(updatedTasksList.map((t) => t.vendedor));
    if (userRole.role === 'VENDEDOR' && (!userRole.selectedVendedor || !newSellers.has(userRole.selectedVendedor))) {
      setUserRole({ role: 'SUPERVISOR', name: 'Supervisor General OCD' });
    }

    showToast(
      result.mode === 'replace'
        ? `Base actualizada con éxito: ${result.tasks.length} tareas cargadas desde "${result.batch.fileName}".`
        : `Lote fusionado: ${result.batch.insertedRows} nuevas, ${result.batch.updatedRows} actualizadas.`,
      'success'
    );
  };

  const handleSubmitAppeal = (
    taskId: string,
    motivoApelacion: string,
    comentarios: string,
    evidenciaUrl: string,
    evidenciaBase64?: string
  ) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          estadoApelacion: 'EN_REVISION' as const,
          fechaApelacion: new Date().toISOString(),
          motivoApelacion,
          comentariosVendedor: comentarios,
          evidenciaApelacionUrl: evidenciaUrl || t.evidenciaApelacionUrl,
          evidenciaApelacionBase64: evidenciaBase64 || t.evidenciaApelacionBase64,
        };
      }
      return t;
    });

    setTasks(updated);
    saveStoredTasks(updated);
    showToast('¡Apelación enviada con éxito! Queda en revisión por el supervisor.', 'success');
  };

  const handleSubmitResolution = (
    taskId: string,
    dictamen: 'APROBADA' | 'RECHAZADA',
    comentario: string,
    puntajeAjustado: number,
    supervisorName: string
  ) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          estadoApelacion: dictamen,
          fechaResolucion: new Date().toISOString(),
          supervisorResolutor: supervisorName,
          dictamenResolucion: dictamen,
          comentarioResolucion: comentario,
          puntajeAjustado: dictamen === 'APROBADA' ? puntajeAjustado : 0,
          puntajeObtenido: dictamen === 'APROBADA' ? puntajeAjustado : 0,
        };
      }
      return t;
    });

    setTasks(updated);
    saveStoredTasks(updated);
    showToast(`Dictamen registrado como ${dictamen}. Puntaje actualizado.`, 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-[#0B2F5B] font-semibold">
          Cargando sistema OCD...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-[#2B98BA] selection:text-white">
      
      {/* Global Header */}
      <Header
        userRole={userRole}
        onRoleChange={handleRoleChange}
        vendedoresList={vendedoresList}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        onResetData={handleResetData}
        onClearData={handleClearData}
        pendingAppealsCount={pendingAppealsCount}
        totalTasksCount={tasks.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#071D38] text-white shadow-lg border border-[#2B98BA]/40 flex items-center justify-between animate-fade-in text-xs">
            <div className="flex items-center gap-2.5">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-[#4AC3E7] shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* View Routing */}
        {tasks.length === 0 ? (
          <EmptyState
            onImportSuccess={handleImportSuccess}
            onLoadDemoData={handleResetData}
          />
        ) : (
          <>
            {activeView === 'tasks' && (
              <div>
                {/* KPI Metrics */}
                <MetricCards tasks={tasks} filteredTasks={filteredTasks} />

                {/* Search and Filters */}
                <TaskFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  vendedores={vendedoresList}
                  supervisores={supervisoresList}
                  rutas={rutasList}
                  categorias={categoriasList}
                  userRole={userRole}
                  counts={filterCounts}
                />

                {/* Tasks Audit Table */}
                <TaskTable
                  tasks={filteredTasks}
                  userRole={userRole}
                  onOpenAppeal={(task) => setAppealModalTask(task)}
                  onOpenResolution={(task) => setResolutionModalTask(task)}
                  onOpenImageViewer={(task, mode) =>
                    setImageViewerState({ task, initialMode: mode || 'original' })
                  }
                />
              </div>
            )}

            {activeView === 'analytics' && (
              <AnalyticsView tasks={roleScopedTasks} />
            )}

            {activeView === 'batches' && (
              <BatchesHistoryView
                batches={batches}
                tasks={tasks}
                onOpenImport={() => setIsImportModalOpen(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#D5E5ED] bg-white py-6 text-center text-xs text-[#0B2F5B]/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <OcdLogo variant="pill" className="h-6 opacity-90 scale-90 origin-left" />
          </div>
          <p className="font-medium text-[11px] text-slate-500">
            Oeste Centro de Distribución (OCD) · Sistema de Validación de Tareas Comerciales & Auditoría en Campo
          </p>
          <div className="text-[11px] font-mono text-[#2B98BA] font-bold">
            v1.2 · Canal Tradicional
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AppealModal
        task={appealModalTask}
        isOpen={Boolean(appealModalTask)}
        onClose={() => setAppealModalTask(null)}
        onSubmitAppeal={handleSubmitAppeal}
      />

      <ResolutionModal
        task={resolutionModalTask}
        isOpen={Boolean(resolutionModalTask)}
        onClose={() => setResolutionModalTask(null)}
        userRole={userRole}
        onSubmitResolution={handleSubmitResolution}
      />

      <ImageViewerModal
        task={imageViewerState.task}
        isOpen={Boolean(imageViewerState.task)}
        initialMode={imageViewerState.initialMode}
        onClose={() => setImageViewerState({ task: null, initialMode: 'original' })}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTasks={tasks}
        onImportSuccess={handleImportSuccess}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTasks={tasks}
        filteredTasks={filteredTasks}
      />

    </div>
  );
}

export default App;

