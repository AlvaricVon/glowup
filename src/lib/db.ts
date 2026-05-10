import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppMeta, DayEntry, ExportPayload } from './types';

const DB_NAME = 'glowup-db';
const DB_VERSION = 1;

interface GlowUpDB extends DBSchema {
  days: {
    key: string;
    value: DayEntry;
    indexes: { 'by-date': string };
  };
  meta: {
    key: 'app';
    value: AppMeta;
  };
}

let dbPromise: Promise<IDBPDatabase<GlowUpDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GlowUpDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('days')) {
          const days = db.createObjectStore('days', { keyPath: 'date' });
          days.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export async function getDay(date: string): Promise<DayEntry | undefined> {
  const db = await getDB();
  return db.get('days', date);
}

export async function putDay(entry: DayEntry): Promise<void> {
  const db = await getDB();
  await db.put('days', entry);
}

export async function getAllDays(): Promise<DayEntry[]> {
  const db = await getDB();
  const all = await db.getAll('days');
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDaysInRange(start: string, end: string): Promise<DayEntry[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(start, end);
  const all = await db.getAll('days', range);
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMeta(): Promise<AppMeta | undefined> {
  const db = await getDB();
  return db.get('meta', 'app');
}

export async function putMeta(meta: AppMeta): Promise<void> {
  const db = await getDB();
  await db.put('meta', meta, 'app');
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['days', 'meta'], 'readwrite');
  await Promise.all([tx.objectStore('days').clear(), tx.objectStore('meta').clear()]);
  await tx.done;
}

export async function exportAll(): Promise<ExportPayload> {
  const [meta, days] = await Promise.all([getMeta(), getAllDays()]);
  if (!meta) {
    throw new Error('Belum ada data buat di-export');
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    meta,
    days,
  };
}

export async function importAll(payload: ExportPayload): Promise<void> {
  if (payload.version !== 1) {
    throw new Error(`Versi backup gak didukung: ${payload.version}`);
  }
  const db = await getDB();
  const tx = db.transaction(['days', 'meta'], 'readwrite');
  await tx.objectStore('days').clear();
  await tx.objectStore('meta').clear();
  for (const day of payload.days) {
    await tx.objectStore('days').put(day);
  }
  await tx.objectStore('meta').put(payload.meta, 'app');
  await tx.done;
}
