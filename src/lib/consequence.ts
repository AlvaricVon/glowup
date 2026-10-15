import { useCallback, useEffect, useState } from 'react';
import { todayKey } from './utils';

const STORAGE_KEY = 'glowup-consequence';
const EVENT = 'glowup:consequence';

/** Panjang tantangan (hari). */
export const CONSEQUENCE_WINDOW_DAYS = 7;

/** Konsekuensi yang wajib dikerjain tiap hari yang gagal (< 100%). */
export interface ConsequenceItem {
  id: string;
  label: string;
  desc: string;
}

export const CONSEQUENCE_ITEMS: ConsequenceItem[] = [
  {
    id: 'delete-app',
    label: 'Hapus 1 app',
    desc: 'Buka layar uninstall HP, pilih 1 app buat dihapus.',
  },
  {
    id: 'pushup-100',
    label: '100 push up non stop',
    desc: '100 rep beneran, non stop. Berhenti di tengah = ulang dari awal.',
  },
  {
    id: 'mandi-malam',
    label: 'Mandi malam (jam 20:30 atau lebih)',
    desc: 'Mandi tambahan — total 3x mandi hari ini.',
  },
];

export interface DeletedRecord {
  pkg: string;
  label: string;
  at: string;
}

export interface DayOutcome {
  deleted?: DeletedRecord;
  /** itemId → udah dikerjain atau belum. */
  done: Record<string, boolean>;
}

export interface ConsequenceState {
  /** Tanggal mulai tantangan 7 hari. */
  startDate: string;
  /** dateKey → hasil konsekuensi hari itu. */
  days: Record<string, DayOutcome>;
}

function defaultState(): ConsequenceState {
  return { startDate: todayKey(), days: {} };
}

/** Normalisasi 1 record hari (toleran ke bentuk lama: { pkg, label, at }). */
function normalizeDay(raw: unknown): DayOutcome {
  if (!raw || typeof raw !== 'object') return { done: {} };
  const o = raw as Record<string, unknown>;
  // Shape lama: { pkg, label, at } langsung = app yang dihapus.
  if (typeof o.pkg === 'string') {
    return {
      deleted: { pkg: o.pkg, label: String(o.label ?? o.pkg), at: String(o.at ?? '') },
      done: { 'delete-app': true },
    };
  }
  return {
    deleted:
      o.deleted && typeof o.deleted === 'object'
        ? (o.deleted as DeletedRecord)
        : undefined,
    done: o.done && typeof o.done === 'object' ? (o.done as Record<string, boolean>) : {},
  };
}

function read(): ConsequenceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && typeof o.startDate === 'string') {
        const days: Record<string, DayOutcome> = {};
        if (o.days && typeof o.days === 'object') {
          for (const [k, v] of Object.entries(o.days as Record<string, unknown>)) {
            days[k] = normalizeDay(v);
          }
        }
        return { startDate: o.startDate, days };
      }
    }
  } catch {
    // ignore
  }
  return defaultState();
}

let state: ConsequenceState = read();
const listeners = new Set<() => void>();

function setState(next: ConsequenceState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

function patchDay(dateKey: string, patch: Partial<DayOutcome>) {
  const cur = state.days[dateKey] ?? { done: {} };
  setState({
    ...state,
    days: { ...state.days, [dateKey]: { ...cur, ...patch, done: { ...cur.done, ...patch.done } } },
  });
}

export function useConsequence() {
  const [snap, setSnap] = useState<ConsequenceState>(state);

  useEffect(() => {
    const fn = () => setSnap(state);
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        state = read();
        setSnap(state);
      }
    };
    const onEvent = () => setSnap(state);
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT, onEvent);
    return () => {
      listeners.delete(fn);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT, onEvent);
    };
  }, []);

  const toggleItem = useCallback((dateKey: string, itemId: string) => {
    const cur = state.days[dateKey]?.done?.[itemId] ?? false;
    patchDay(dateKey, { done: { [itemId]: !cur } });
  }, []);

  const recordDeleted = useCallback(
    (dateKey: string, pkg: string, label: string, at: string) => {
      patchDay(dateKey, {
        deleted: { pkg, label, at },
        done: { 'delete-app': true },
      });
    },
    [],
  );

  const restart = useCallback(() => {
    setState({ startDate: todayKey(), days: {} });
  }, []);

  return { state: snap, toggleItem, recordDeleted, restart };
}
