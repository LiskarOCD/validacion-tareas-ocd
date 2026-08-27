import { TaskRecord, ImportBatch } from '../types';

import { initialSampleTasks } from './sampleData';

import {
  idbSaveTasks,
  idbLoadTasks,
  idbSaveBatches,
  idbLoadBatches,
  idbClearAll
} from './indexedDb';

const TASKS_STORAGE_KEY = 'ocd_tasks_records_v1';
const BATCHES_STORAGE_KEY = 'ocd_import_batches_v1';

/*
 * Cache en memoria.
 *
 * IMPORTANTE:
 * Las tareas grandes NO se guardan en localStorage.
 * IndexedDB es la fuente persistente principal.
 */
let inMemoryTasks: TaskRecord[] = [];

let inMemoryBatches: ImportBatch[] = [];


/*
 * --------------------------------------------------------------------------
 * TASKS
 * --------------------------------------------------------------------------
 */

/*
 * Esta función se mantiene síncrona porque App.tsx la utiliza
 * durante la inicialización.
 *
 * NO leemos localStorage para tareas.
 *
 * Esto evita que el navegador tenga que hacer:
 *
 * localStorage.getItem()
 * +
 * JSON.parse(40.000 registros)
 *
 * al abrir la aplicación.
 */
export function loadStoredTasks(): TaskRecord[] {
  return inMemoryTasks;
}


/*
 * Carga real desde IndexedDB.
 */
export async function loadStoredTasksAsync(): Promise<TaskRecord[]> {
  /*
   * Si ya tenemos datos en memoria, los reutilizamos.
   */
  if (inMemoryTasks.length > 0) {
    return inMemoryTasks;
  }

  try {
    const idbTasks = await idbLoadTasks();

    if (
      idbTasks &&
      Array.isArray(idbTasks)
    ) {
      inMemoryTasks = idbTasks;

      return idbTasks;
    }
  } catch (error) {
    console.warn(
      'No se pudieron cargar las tareas desde IndexedDB:',
      error
    );
  }

  return [];
}


/*
 * Guarda las tareas únicamente en memoria + IndexedDB.
 *
 * NO localStorage.
 */
export function saveStoredTasks(
  tasks: TaskRecord[]
): void {

  /*
   * Actualización inmediata de la interfaz.
   */
  inMemoryTasks = tasks;

  /*
   * Persistencia en IndexedDB.
   */
  idbSaveTasks(tasks).catch((error) => {
    console.warn(
      'Error guardando tareas en IndexedDB:',
      error
    );
  });

  /*
   * Deliberadamente NO hacemos:
   *
   * localStorage.setItem(...)
   *
   * porque 40.000 registros pueden ser demasiado pesados.
   */
}


/*
 * --------------------------------------------------------------------------
 * BATCHES
 * --------------------------------------------------------------------------
 *
 * Los batches son pequeños, por lo que sí pueden mantenerse en
 * localStorage como respaldo.
 */

export function loadStoredBatches(): ImportBatch[] {

  if (inMemoryBatches.length > 0) {
    return inMemoryBatches;
  }

  try {

    const raw =
      localStorage.getItem(
        BATCHES_STORAGE_KEY
      );

    if (!raw) {
      inMemoryBatches = [];
      return [];
    }

    const parsed = JSON.parse(raw);

    inMemoryBatches =
      Array.isArray(parsed)
        ? parsed
        : [];

    return inMemoryBatches;

  } catch (error) {

    console.error(
      'Error loading import batches:',
      error
    );

    inMemoryBatches = [];

    return [];
  }
}


/*
 * Guarda batches.
 */
export function saveStoredBatches(
  batches: ImportBatch[]
): void {

  inMemoryBatches = batches;

  /*
   * IndexedDB.
   */
  idbSaveBatches(batches).catch(
    (error) =>
      console.warn(
        'IndexedDB batch save error:',
        error
      )
  );

  /*
   * localStorage.
   *
   * Esto sí es pequeño y seguro.
   */
  try {

    localStorage.setItem(
      BATCHES_STORAGE_KEY,
      JSON.stringify(batches)
    );

  } catch (error) {

    console.warn(
      'Error saving batches to localStorage:',
      error
    );
  }
}


/*
 * --------------------------------------------------------------------------
 * CLEAR DATA
 * --------------------------------------------------------------------------
 */

export function clearAllStoredData(): void {

  inMemoryTasks = [];

  inMemoryBatches = [];

  /*
   * Eliminamos cualquier cache antigua.
   *
   * Esto es MUY importante porque tu versión anterior
   * podía haber guardado miles de tareas aquí.
   */
  try {

    localStorage.removeItem(
      TASKS_STORAGE_KEY
    );

    localStorage.removeItem(
      BATCHES_STORAGE_KEY
    );

  } catch (error) {

    console.warn(
      'Error clearing localStorage:',
      error
    );
  }

  /*
   * Limpieza de IndexedDB.
   */
  idbClearAll().catch(
    (error) =>
      console.warn(
        'Error clearing IndexedDB:',
        error
      )
  );
}


/*
 * --------------------------------------------------------------------------
 * DEMO DATA
 * --------------------------------------------------------------------------
 */

export function resetToSampleData(): TaskRecord[] {

  inMemoryTasks = initialSampleTasks;

  /*
   * Guardamos la demo en IndexedDB.
   */
  saveStoredTasks(
    initialSampleTasks
  );

  const initialBatch: ImportBatch = {

    id:
      'batch_demo_' +
      Date.now(),

    fileName:
      'Datos_Demostracion_OCD.xlsx',

    importDate:
      new Date().toISOString(),

    totalRows:
      initialSampleTasks.length,

    insertedRows:
      initialSampleTasks.length,

    updatedRows:
      0,

    skippedRows:
      0,
  };

  inMemoryBatches = [
    initialBatch
  ];

  saveStoredBatches([
    initialBatch
  ]);

  return initialSampleTasks;
}
