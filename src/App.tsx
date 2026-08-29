import React, { useState, useMemo, useEffect } from 'react';
import {
  TaskRecord,
  UserRole,
  UserProfile,
  FilterState,
  ImportBatch
} from './types';
import { supabase } from './lib/supabase';
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
import { ParseResult } from './utils/excelParser';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function App() {
  const [authLoading, setAuthLoading] = useState(true);
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [profile, setProfile] = useState<UserProfile | null>(null);
const [profileLoading, setProfileLoading] = useState(true);
useEffect(() => {
  let mounted = true;

  async function loadUserData() {
    setAuthLoading(true);
    setProfileLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!mounted) return;

      if (!session?.user) {
        setIsAuthenticated(false);
        setProfile(null);
        return;
      }

      setIsAuthenticated(true);

      const { data: userProfile, error: profileError } =
        await supabase
          .from('profiles')
          .select(
            'id, email, nombre, role, vendedor, supervisor, activo'
          )
          .eq('id', session.user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (!mounted) return;

      setProfile(userProfile as UserProfile);
    } catch (error) {
      console.error(
        'Error cargando sesión/perfil:',
        error
      );

      if (mounted) {
        setProfile(null);
      }
    } finally {
      if (mounted) {
        setAuthLoading(false);
        setProfileLoading(false);
      }
    }
  }

  loadUserData();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!mounted) return;

      if (!session) {
        setIsAuthenticated(false);
        setProfile(null);
        setAuthLoading(false);
        setProfileLoading(false);
        return;
      }

      setIsAuthenticated(true);
      loadUserData();
    }
  );

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>(() => loadStoredBatches());
  const [activeView, setActiveView] = useState<'tasks' | 'analytics' | 'batches'>('tasks');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

// Cargar tareas compartidas desde Supabase
useEffect(() => {
  let isMounted = true;

  async function loadTasksFromSupabase() {
    if (!isAuthenticated || !profile) return;

    try {
      const allRows: any[] = [];
      const pageSize = 1000;
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('fecha_tarea', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          break;
        }

        allRows.push(...data);

        if (data.length < pageSize) {
          break;
        }

        from += pageSize;
      }

     if (!isMounted) return;

/*
 * Cargar las revisiones realizadas por vendedores.
 */
const reviewRows: any[] = [];
let reviewFrom = 0;

while (true) {
  const { data: reviewsPage, error: reviewsError } =
    await supabase
      .from('task_vendor_reviews')
      .select('task_id, user_id, decision, updated_at')
      .order('updated_at', { ascending: false })
      .range(reviewFrom, reviewFrom + pageSize - 1);

  if (reviewsError) {
    throw reviewsError;
  }

  if (!reviewsPage || reviewsPage.length === 0) {
    break;
  }

  reviewRows.push(...reviewsPage);

  if (reviewsPage.length < pageSize) {
    break;
  }

  reviewFrom += pageSize;
}

const reviewMap = new Map<string, any>();

reviewRows.forEach((review) => {
  if (!reviewMap.has(review.task_id)) {
    reviewMap.set(review.task_id, review);
  }
});

const mappedTasks: TaskRecord[] = allRows.map((row) => {
  const review = reviewMap.get(row.id);

  return ({
        id: row.id,

        importBatchId: row.import_batch_id ?? undefined,
        importDate: row.import_date ?? '',

        fechaTarea: row.fecha_tarea ?? '',

        vendedor: row.vendedor ?? '',
        codigoVendedor: row.codigo_vendedor ?? undefined,

        supervisor: row.supervisor ?? '',

        ruta: row.ruta ?? '',

        codigoPDV: row.codigo_pdv ?? '',
        nombrePDV: row.nombre_pdv ?? '',
        direccionPDV: row.direccion_pdv ?? undefined,

        categoriaTarea: row.categoria_tarea ?? '',
        nombreTarea: row.nombre_tarea ?? '',

        estadoValidacion:
          (row.estado_validacion ??
            'VALIDADA') as TaskRecord['estadoValidacion'],

        completada: Boolean(row.completada),
        justificada: Boolean(row.justificada),
        visitaValida:
          row.visita_valida === null || row.visita_valida === undefined
            ? undefined
            : Boolean(row.visita_valida),

        motivoInvalidacion: row.motivo_invalidacion ?? undefined,
        detalleInvalidacion: row.detalle_invalidacion ?? undefined,

        urlFotoOriginal: row.url_foto_original ?? undefined,

        puntajeBase: Number(row.puntaje_base ?? 20),
        puntajeObtenido: Number(row.puntaje_obtenido ?? 0),

        estadoApelacion:
          (row.estado_apelacion ??
            'SIN_APELAR') as TaskRecord['estadoApelacion'],

        fechaApelacion: row.fecha_apelacion ?? undefined,
        motivoApelacion: row.motivo_apelacion ?? undefined,

        evidenciaApelacionUrl:
          row.evidencia_apelacion_url ?? undefined,

        comentariosVendedor:
          row.comentarios_vendedor ?? undefined,

        fechaResolucion: row.fecha_resolucion ?? undefined,
        supervisorResolutor:
          row.supervisor_resolutor ?? undefined,

        dictamenResolucion:
          row.dictamen_resolucion ?? undefined,

        comentarioResolucion:
          row.comentario_resolucion ?? undefined,

        puntajeAjustado:
          row.puntaje_ajustado === null ||
          row.puntaje_ajustado === undefined
            ? undefined
            : Number(row.puntaje_ajustado),

      revisionVendedor:
  review?.decision === 'VALIDA' ||
  review?.decision === 'INVALIDA'
    ? review.decision
    : undefined,

revisionVendedorFecha:
  review?.updated_at ?? undefined,

revisionVendedorUserId:
  review?.user_id ?? undefined,

updatedAt:
  row.updated_at ?? undefined,
  });
});

    // Cargar dictámenes finales de supervisores
const supervisorReviewRows: any[] = [];
let supervisorReviewFrom = 0;
const supervisorReviewPageSize = 1000;

while (true) {
  const { data: reviewData, error: reviewError } =
    await supabase
      .from('task_supervisor_reviews')
      .select('task_id, user_id, decision, updated_at')
      .range(
        supervisorReviewFrom,
        supervisorReviewFrom + supervisorReviewPageSize - 1
      );

  if (reviewError) {
    throw reviewError;
  }

  if (!reviewData || reviewData.length === 0) {
    break;
  }

  supervisorReviewRows.push(...reviewData);

  if (reviewData.length < supervisorReviewPageSize) {
    break;
  }

  supervisorReviewFrom += supervisorReviewPageSize;
}

// Relacionar cada dictamen con su tarea
const supervisorReviewByTask = new Map(
  supervisorReviewRows.map((review) => [
    review.task_id,
    review,
  ])
);

const tasksWithSupervisorReviews = mappedTasks.map(
  (task) => {
    const review =
      supervisorReviewByTask.get(task.id);

    if (!review) {
      return task;
    }

    return {
      ...task,
      dictamenSupervisor:
        review.decision as 'VALIDA' | 'INVALIDA',
      dictamenSupervisorFecha:
        review.updated_at ?? undefined,
      dictamenSupervisorUserId:
        review.user_id ?? undefined,
    };
  }
);

setTasks(tasksWithSupervisorReviews);

console.log(
  `✅ ${tasksWithSupervisorReviews.length} tareas cargadas desde Supabase`
);

  loadTasksFromSupabase();

  return () => {
    isMounted = false;
  };
}, [isAuthenticated, profile]);

const [userRole, setUserRole] = useState<UserRole>({
  role: 'ADMIN',
  name: 'Administrador OCD',
});

useEffect(() => {
  if (!profile) return;

  setUserRole({
    role: profile.role,
    name: profile.nombre,
    selectedVendedor:
      profile.role === 'VENDEDOR'
        ? profile.vendedor
        : undefined,
  });
}, [profile]);
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
  // VENDEDOR: solo ve sus propias tareas
  if (
    userRole.role === 'VENDEDOR' &&
    profile?.vendedor
  ) {
    return tasks.filter(
      (t) => t.vendedor === profile.vendedor
    );
  }

  // SUPERVISOR: solo ve las tareas de su equipo
  if (
    userRole.role === 'SUPERVISOR' &&
    profile?.supervisor
  ) {
    return tasks.filter(
      (t) => String(t.supervisor) === String(profile.supervisor)
    );
  }

  // ADMIN: ve todas las tareas
  return tasks;
}, [tasks, userRole, profile]);

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
  const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setIsAuthenticated(false);
    setProfile(null);

    showToast(
      'Sesión cerrada correctamente.',
      'success'
    );
  } catch (error: any) {
    console.error(
      'Error cerrando sesión:',
      error
    );

    showToast(
      `No se pudo cerrar la sesión: ${
        error?.message || 'Error desconocido'
      }`,
      'error'
    );
  }
};
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
const handleVendorReview = async (
  taskId: string,
  decision: 'VALIDA' | 'INVALIDA'
) => {
  try {
    /*
     * Solo un usuario con perfil VENDEDOR
     * puede registrar esta decisión.
     */
    if (!profile || profile.role !== 'VENDEDOR') {
      showToast(
        'Solo un vendedor puede registrar esta revisión.',
        'error'
      );
      return;
    }

    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task) {
      showToast(
        'No se encontró la tarea seleccionada.',
        'error'
      );
      return;
    }

    /*
     * Verificar que la tarea pertenezca realmente
     * al vendedor autenticado.
     */
    if (
      profile.vendedor &&
      task.vendedor !== profile.vendedor
    ) {
      showToast(
        'Esta tarea no corresponde al vendedor autenticado.',
        'error'
      );
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        'No hay un usuario autenticado.'
      );
    }

    const now = new Date().toISOString();

    /*
     * Si ya existe revisión para esta tarea,
     * la actualiza. Si no existe, la crea.
     */
    const { error } = await supabase
      .from('task_vendor_reviews')
      .upsert(
        {
          task_id: taskId,
          user_id: user.id,
          decision,
          updated_at: now,
        },
        {
          onConflict: 'task_id',
        }
      );

    if (error) {
      throw error;
    }

    /*
     * Actualizar inmediatamente React.
     * No hace falta recargar la página.
     */
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              revisionVendedor: decision,
              revisionVendedorFecha: now,
              revisionVendedorUserId: user.id,
            }
          : item
      )
    );

    showToast(
      decision === 'VALIDA'
        ? 'Revisión guardada como Válida.'
        : 'Revisión guardada como No válida.',
      'success'
    );
  } catch (error: any) {
    console.error(
      'Error guardando revisión del vendedor:',
      error
    );

    showToast(
      `No se pudo guardar la revisión: ${
        error?.message || 'Error desconocido'
      }`,
      'error'
    );
  }
};
  const handleSupervisorReview = async (
  taskId: string,
  decision: 'VALIDA' | 'INVALIDA'
) => {
  try {
    // Solo un SUPERVISOR puede emitir el dictamen final
    if (!profile || profile.role !== 'SUPERVISOR') {
      showToast(
        'Solo un supervisor puede registrar el dictamen final.',
        'error'
      );
      return;
    }

    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task) {
      showToast(
        'No se encontró la tarea seleccionada.',
        'error'
      );
      return;
    }

    // El supervisor solo puede dictaminar tareas de su propio equipo
    if (
      profile.supervisor &&
      String(task.supervisor) !== String(profile.supervisor)
    ) {
      showToast(
        'Esta tarea no corresponde a tu equipo.',
        'error'
      );
      return;
    }

    // Primero debe existir la revisión del vendedor
    if (!task.revisionVendedor) {
      showToast(
        'El vendedor todavía no ha realizado su revisión.',
        'error'
      );
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        'No hay un usuario autenticado.'
      );
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('task_supervisor_reviews')
      .upsert(
        {
          task_id: taskId,
          user_id: user.id,
          decision,
          updated_at: now,
        },
        {
          onConflict: 'task_id',
        }
      );

    if (error) {
      throw error;
    }

    // Actualiza la pantalla inmediatamente
    setTasks((prev) =>
      prev.map((item) =>
        item.id === taskId
          ? {
              ...item,
              dictamenSupervisor: decision,
              dictamenSupervisorFecha: now,
              dictamenSupervisorUserId: user.id,
            }
          : item
      )
    );

    showToast(
      decision === 'VALIDA'
        ? 'Dictamen final guardado como Válida.'
        : 'Dictamen final guardado como No válida.',
      'success'
    );
  } catch (error: any) {
    console.error(
      'Error guardando dictamen del supervisor:',
      error
    );

    showToast(
      `No se pudo guardar el dictamen: ${
        error?.message || 'Error desconocido'
      }`,
      'error'
    );
  }
};
  const handleImportSuccess = async (result: ParseResult) => {
  try {
    showToast(
      `Importando ${result.tasks.length.toLocaleString()} tareas a Supabase...`,
      'info'
    );

    // 1. Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    // 2. Crear lote de importación
    const { data: createdBatch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        file_name: result.batch.fileName,
        total_rows: result.tasks.length,
        inserted_rows: 0,
        updated_rows: 0,
        skipped_rows: result.batch.skippedRows ?? 0,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (batchError) {
      throw new Error(
        `No se pudo crear el lote: ${batchError.message}`
      );
    }

    if (!createdBatch) {
      throw new Error('Supabase no devolvió el lote creado.');
    }

    console.log('✅ Lote creado:', createdBatch.id);

    // 3. Si es replace, borrar tareas anteriores
    if (result.mode === 'replace') {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .not('id', 'is', null);

      if (deleteError) {
        throw new Error(
          `No se pudieron borrar las tareas anteriores: ${deleteError.message}`
        );
      }
    }

    // 4. Convertir TaskRecord al formato de Supabase
    const rowsToInsert = result.tasks.map((task) => ({
      id: task.id,

      import_batch_id: createdBatch.id,
      import_date: createdBatch.import_date,

      fecha_tarea: task.fechaTarea,

      vendedor: task.vendedor || '',
      codigo_vendedor: task.codigoVendedor || null,

      supervisor: task.supervisor || '',

      ruta: task.ruta || null,

      codigo_pdv: task.codigoPDV || null,
      nombre_pdv: task.nombrePDV || null,
      direccion_pdv: task.direccionPDV || null,

      categoria_tarea: task.categoriaTarea || null,
      nombre_tarea: task.nombreTarea || null,

      completada: Boolean(task.completada),

      invalidada:
        task.estadoValidacion === 'INVALIDADA',

      justificada: Boolean(task.justificada),

      visita_valida:
        task.visitaValida === undefined
          ? null
          : Boolean(task.visitaValida),

      estado_validacion:
        task.estadoValidacion || 'VALIDADA',

      motivo_invalidacion:
        task.motivoInvalidacion || null,

      detalle_invalidacion:
        task.detalleInvalidacion || null,

      url_foto_original:
        task.urlFotoOriginal || null,

      puntaje_base:
        Number(task.puntajeBase ?? 20),

      puntaje_obtenido:
        Number(task.puntajeObtenido ?? 0),

      estado_apelacion:
        task.estadoApelacion || 'SIN_APELAR',

      fecha_apelacion:
        task.fechaApelacion || null,

      motivo_apelacion:
        task.motivoApelacion || null,

      comentarios_vendedor:
        task.comentariosVendedor || null,

      evidencia_apelacion_url:
        task.evidenciaApelacionUrl || null,

      fecha_resolucion:
        task.fechaResolucion || null,

      supervisor_resolutor:
        task.supervisorResolutor || null,

      dictamen_resolucion:
        task.dictamenResolucion || null,

      comentario_resolucion:
        task.comentarioResolucion || null,

      puntaje_ajustado:
        task.puntajeAjustado === undefined
          ? null
          : Number(task.puntajeAjustado),
    }));

    // 5. Subir por bloques
    const CHUNK_SIZE = 500;

    let processedRows = 0;

    for (
      let i = 0;
      i < rowsToInsert.length;
      i += CHUNK_SIZE
    ) {
      const chunk = rowsToInsert.slice(
        i,
        i + CHUNK_SIZE
      );

      let uploadError = null;

      if (result.mode === 'merge') {
        const { error } = await supabase
          .from('tasks')
          .upsert(chunk, {
            onConflict: 'id',
          });

        uploadError = error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert(chunk);

        uploadError = error;
      }

      if (uploadError) {
        throw new Error(
          `Error en filas ${i + 1}-${Math.min(
            i + CHUNK_SIZE,
            rowsToInsert.length
          )}: ${uploadError.message}`
        );
      }

      processedRows += chunk.length;

      console.log(
        `📦 ${processedRows.toLocaleString()} / ${rowsToInsert.length.toLocaleString()}`
      );
    }

    // 6. Actualizar lote
    const insertedCount =
      result.mode === 'replace'
        ? processedRows
        : result.batch.insertedRows ?? processedRows;

    const updatedCount =
      result.mode === 'merge'
        ? result.batch.updatedRows ?? 0
        : 0;

    const { error: updateBatchError } =
      await supabase
        .from('import_batches')
        .update({
          inserted_rows: insertedCount,
          updated_rows: updatedCount,
          skipped_rows:
            result.batch.skippedRows ?? 0,
        })
        .eq('id', createdBatch.id);

    if (updateBatchError) {
      console.error(
        '⚠️ Error actualizando import_batches:',
        updateBatchError
      );
    }

    // 7. Volver a cargar todas las tareas desde Supabase
    const allRows: any[] = [];

    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('fecha_tarea', {
          ascending: false,
        })
        .range(from, from + pageSize - 1);

      if (error) {
        throw new Error(
          `Las tareas se guardaron pero no se pudieron recargar: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        break;
      }

      allRows.push(...data);

      if (data.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    // 8. Mapear Supabase a TaskRecord
    const refreshedTasks: TaskRecord[] =
      allRows.map((row) => ({
        id: row.id,

        importBatchId:
          row.import_batch_id ?? undefined,

        importDate:
          row.import_date ?? '',

        fechaTarea:
          row.fecha_tarea ?? '',

        vendedor:
          row.vendedor ?? '',

        codigoVendedor:
          row.codigo_vendedor ?? undefined,

        supervisor:
          row.supervisor ?? '',

        ruta:
          row.ruta ?? '',

        codigoPDV:
          row.codigo_pdv ?? '',

        nombrePDV:
          row.nombre_pdv ?? '',

        direccionPDV:
          row.direccion_pdv ?? undefined,

        categoriaTarea:
          row.categoria_tarea ?? '',

        nombreTarea:
          row.nombre_tarea ?? '',

        estadoValidacion:
          (row.estado_validacion ??
            'VALIDADA') as TaskRecord['estadoValidacion'],

        completada:
          Boolean(row.completada),

        justificada:
          Boolean(row.justificada),

        visitaValida:
          row.visita_valida === null ||
          row.visita_valida === undefined
            ? undefined
            : Boolean(row.visita_valida),

        motivoInvalidacion:
          row.motivo_invalidacion ??
          undefined,

        detalleInvalidacion:
          row.detalle_invalidacion ??
          undefined,

        urlFotoOriginal:
          row.url_foto_original ??
          undefined,

        puntajeBase:
          Number(row.puntaje_base ?? 20),

        puntajeObtenido:
          Number(
            row.puntaje_obtenido ?? 0
          ),

        estadoApelacion:
          (row.estado_apelacion ??
            'SIN_APELAR') as TaskRecord['estadoApelacion'],

        fechaApelacion:
          row.fecha_apelacion ??
          undefined,

        motivoApelacion:
          row.motivo_apelacion ??
          undefined,

        evidenciaApelacionUrl:
          row.evidencia_apelacion_url ??
          undefined,

        comentariosVendedor:
          row.comentarios_vendedor ??
          undefined,

        fechaResolucion:
          row.fecha_resolucion ??
          undefined,

        supervisorResolutor:
          row.supervisor_resolutor ??
          undefined,

        dictamenResolucion:
          row.dictamen_resolucion ??
          undefined,

        comentarioResolucion:
          row.comentario_resolucion ??
          undefined,

        puntajeAjustado:
          row.puntaje_ajustado === null ||
          row.puntaje_ajustado === undefined
            ? undefined
            : Number(
                row.puntaje_ajustado
              ),

        updatedAt:
          row.updated_at ?? undefined,
      }));

    setTasks(refreshedTasks);

    // 9. Crear lote para React
    const newBatchForReact: ImportBatch = {
      ...result.batch,

      id: createdBatch.id,

      fileName:
        createdBatch.file_name,

      importDate:
        createdBatch.import_date,

      totalRows:
        createdBatch.total_rows,

      insertedRows:
        insertedCount,

      updatedRows:
        updatedCount,

      skippedRows:
        createdBatch.skipped_rows ?? 0,
    };

    if (result.mode === 'replace') {
      setBatches([newBatchForReact]);
    } else {
      setBatches((prev) => [
        newBatchForReact,
        ...prev.filter(
          (batch) =>
            batch.id !== newBatchForReact.id
        ),
      ]);
    }

    // 10. Limpiar filtros
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

    const newSellers = new Set(
      refreshedTasks.map(
        (task) => task.vendedor
      )
    );

    if (
      userRole.role === 'VENDEDOR' &&
      (
        !userRole.selectedVendedor ||
        !newSellers.has(
          userRole.selectedVendedor
        )
      )
    ) {
      setUserRole({
        role: 'SUPERVISOR',
        name: 'Supervisor General OCD',
      });
    }

    setIsImportModalOpen(false);

    showToast(
      `Importación completada: ${processedRows.toLocaleString()} tareas guardadas en Supabase.`,
      'success'
    );

    console.log(
      `✅ Importación completada. ${refreshedTasks.length.toLocaleString()} tareas disponibles.`
    );
  } catch (error: any) {
    console.error(
      '❌ Error durante la importación:',
      error
    );

    showToast(
      `Error al importar: ${
        error?.message ||
        'Error desconocido'
      }`,
      'error'
    );
  }
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
        onLogout={handleLogout}
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
  onOpenAppeal={(task) =>
    setAppealModalTask(task)
  }
  onOpenResolution={(task) =>
    setResolutionModalTask(task)
  }
  onVendorReview={handleVendorReview}
  onSupervisorReview={handleSupervisorReview}
  onOpenImageViewer={(task, mode) =>
    setImageViewerState({
      task,
      initialMode: mode || 'original',
    })
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

