/**
 * IndexedDB storage engine for OCD task records and batches
 * Provides quota-free persistent client-side storage for high-resolution images & large task histories
 */

import { TaskRecord, ImportBatch } from '../types';

const DB_NAME = 'ocd_audit_database';
const DB_VERSION = 1;
const TASKS_STORE = 'tasks';
const BATCHES_STORE = 'batches';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BATCHES_STORE)) {
        db.createObjectStore(BATCHES_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveTasks(tasks: TaskRecord[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([TASKS_STORE], 'readwrite');
      const store = tx.objectStore(TASKS_STORE);

      // Clear existing and rewrite current collection
      store.clear();
      tasks.forEach((t) => store.put(t));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save tasks error, fallback active:', err);
  }
}

export async function idbLoadTasks(): Promise<TaskRecord[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([TASKS_STORE], 'readonly');
      const store = tx.objectStore(TASKS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        resolve(results && results.length > 0 ? results : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB load tasks error:', err);
    return null;
  }
}

export async function idbSaveBatches(batches: ImportBatch[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BATCHES_STORE], 'readwrite');
      const store = tx.objectStore(BATCHES_STORE);

      store.clear();
      batches.forEach((b) => store.put(b));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save batches error:', err);
  }
}

export async function idbLoadBatches(): Promise<ImportBatch[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BATCHES_STORE], 'readonly');
      const store = tx.objectStore(BATCHES_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as ImportBatch[];
        resolve(results && results.length > 0 ? results : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB load batches error:', err);
    return null;
  }
}

export async function idbClearAll(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([TASKS_STORE, BATCHES_STORE], 'readwrite');
      tx.objectStore(TASKS_STORE).clear();
      tx.objectStore(BATCHES_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }
}

