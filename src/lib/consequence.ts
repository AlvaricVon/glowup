import { useCallback, useEffect, useState } from 'react';
import { todayKey } from './utils';

const STORAGE_KEY = 'glowup-consequence';
const EVENT = 'glowup:consequence';

/** Panjang tantangan (hari). */
export const CONSEQUENCE_WINDOW_DAYS = 7;

export interface DeletedRecord {
  pkg: string;
  label: string;
  at: string;
}

export interface ConsequenceState {
  /** Tanggal mulai tantangan 7 hari. */
  startDate: string;
  /** dateKey → app yang udah dihapus buat hari itu. */
  days: Record<string, DeletedRecord>;
}

function defaultState(): ConsequenceState {
  return { startDate: todayKey(), days: {} };
}

function read(): ConsequenceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && typeof o.startDate === 'string') {
        return { startDate: o.startDate, days: o.days && typeof o.days === 'object' ? o.days : {} };
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
    const onEvent = () => {
      state = read();
      setSnap(state);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT, onEvent);
    return () => {
      listeners.delete(fn);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT, onEvent);
    };
  }, []);

  const recordDeleted = useCallback((dateKey: string, pkg: string, label: string) => {
    setState({
      ...state,
      days: { ...state.days, [dateKey]: { pkg, label, at: new Date().toISOString() } },
    });
  }, []);

  const restart = useCallback(() => {
    setState(defaultState());
  }, []);

  return { state: snap, recordDeleted, restart };
}
