import { TaskRecord, ImportBatch } from '../types';
import { initialSampleTasks } from './sampleData';
import { idbSaveTasks, idbLoadTasks, idbSaveBatches, idbLoadBatches, idbClearAll } from './indexedDb';

const TASKS_STORAGE_KEY = 'ocd_tasks_records_v1';
const BATCHES_STORAGE_KEY = 'ocd_import_batches_v1';

// In-memory runtime cache
let inMemoryTasks: TaskRecord[] = [];
let inMemoryBatches: ImportBatch[] = [];

export function loadStoredTasks(): TaskRecord[] {
  if (inMemoryTasks.length > 0) {
    return inMemoryTasks;
  }

  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      inMemoryTasks = [];
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryTasks = parsed;
      return parsed;
    }
    inMemoryTasks = [];
    return [];
  } catch (err) {
    console.error('Error loading stored tasks from localStorage:', err);
    inMemoryTasks = [];
    return [];
  }
}

export async function loadStoredTasksAsync(): Promise<TaskRecord[]> {
  try {
    const idbTasks = await idbLoadTasks();
    if (idbTasks && Array.isArray(idbTasks) && idbTasks.length > 0) {
      inMemoryTasks = idbTasks;
      return idbTasks;
    }
  } catch (e) {
    console.warn('Could not load from IndexedDB, falling back to synchronous store:', e);
  }
  return loadStoredTasks();
}

export function saveStoredTasks(tasks: TaskRecord[]): void {
  inMemoryTasks = tasks;
  
  // Asynchronously save full dataset (including base64 images) to IndexedDB
  idbSaveTasks(tasks).catch((err) => {
    console.warn('Error persisting tasks to IndexedDB:', err);
  });

  // Also update localStorage with safe stripped/compressed payload if needed
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('LocalStorage quota reached. Saving lightweight cache without heavy images:', err);
    try {
      // Create lightweight version for localStorage (strip heavy base64 strings if quota exceeded)
      const lightweightTasks = tasks.map((t) => {
        if (t.evidenciaApelacionBase64 && t.evidenciaApelacionBase64.length > 50000) {
          const { evidenciaApelacionBase64, ...rest } = t;
          return { ...rest, evidenciaApelacionUrl: t.evidenciaApelacionUrl || '[Foto guardada en IndexedDB]' };
        }
        return t;
      });
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(lightweightTasks));
    } catch (innerErr) {
      console.warn('Could not write to localStorage cache. IndexedDB holds full state.', innerErr);
    }
  }
}

export function loadStoredBatches(): ImportBatch[] {
  if (inMemoryBatches.length > 0) {
    return inMemoryBatches;
  }

  try {
    const raw = localStorage.getItem(BATCHES_STORAGE_KEY);
    if (!raw) {
      inMemoryBatches = [];
      return [];
    }
    const parsed = JSON.parse(raw);
    inMemoryBatches = Array.isArray(parsed) ? parsed : [];
    return inMemoryBatches;
  } catch (err) {
    console.error('Error loading import batches:', err);
    return [];
  }
}

export function saveStoredBatches(batches: ImportBatch[]): void {
  inMemoryBatches = batches;
  idbSaveBatches(batches).catch((e) => console.warn('IndexedDB batch save error:', e));

  try {
    localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error('Error saving batches to storage:', err);
  }
}

export function clearAllStoredData(): void {
  inMemoryTasks = [];
  inMemoryBatches = [];
  try {
    localStorage.removeItem(TASKS_STORAGE_KEY);
    localStorage.removeItem(BATCHES_STORAGE_KEY);
  } catch (err) {
    console.warn('Error clearing localStorage:', err);
  }
  idbClearAll().catch((err) => console.warn('Error clearing IndexedDB:', err));
}

export function resetToSampleData(): TaskRecord[] {
  inMemoryTasks = initialSampleTasks;
  saveStoredTasks(initialSampleTasks);
  const initialBatch: ImportBatch = {
    id: 'batch_demo_' + Date.now(),
    fileName: 'Datos_Demostracion_OCD.xlsx',
    importDate: new Date().toISOString(),
    totalRows: initialSampleTasks.length,
    insertedRows: initialSampleTasks.length,
    updatedRows: 0,
    skippedRows: 0,
  };
  inMemoryBatches = [initialBatch];
  saveStoredBatches([initialBatch]);
  return initialSampleTasks;
}

