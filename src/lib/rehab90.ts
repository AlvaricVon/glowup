import { useCallback, useEffect, useState } from 'react';
import { todayKey } from './utils';

const STORAGE_KEY = 'glowup-rehab-mode';
const EVENT = 'glowup:rehab-mode';

export interface RehabHistoryItem {
  date: string;
  status: 'ok' | 'fail';
  ts: string;
}

export interface RehabState {
  enabled: boolean;
  targetDays: number;
  startDate: string;
  streak: number;
  lastActionDate: string | null;
  history: RehabHistoryItem[];
  completedAt: string | null;
}

function defaultState(): RehabState {
  return {
    enabled: true,
    targetDays: 90,
    startDate: todayKey(),
    streak: 0,
    lastActionDate: null,
    history: [],
    completedAt: null,
  };
}

function read(): RehabState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const o = JSON.parse(raw) as Partial<RehabState>;
    if (!o || typeof o !== 'object') return defaultState();
    return {
      enabled: o.enabled !== false,
      targetDays: typeof o.targetDays === 'number' ? o.targetDays : 90,
      startDate: typeof o.startDate === 'string' ? o.startDate : todayKey(),
      streak: typeof o.streak === 'number' ? o.streak : 0,
      lastActionDate: typeof o.lastActionDate === 'string' ? o.lastActionDate : null,
      history: Array.isArray(o.history)
        ? o.history.filter((h): h is RehabHistoryItem => !!h && typeof h === 'object' && typeof (h as any).date === 'string')
        : [],
      completedAt: typeof o.completedAt === 'string' ? o.completedAt : null,
    };
  } catch {
    return defaultState();
  }
}

let state: RehabState = read();
const listeners = new Set<() => void>();

function setState(next: RehabState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function getRehabState(): RehabState {
  return state;
}

export function useRehab() {
  const [snap, setSnap] = useState<RehabState>(state);

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

  const markFail = useCallback(() => {
    const now = new Date().toISOString();
    const d = todayKey();
    if (state.lastActionDate === d) return;
    setState({
      ...state,
      streak: 0,
      lastActionDate: d,
      history: [{ date: d, status: 'fail' as const, ts: now }, ...state.history].slice(0, 60),
    });
  }, []);

  const restartFresh = useCallback(() => {
    setState({ ...defaultState(), enabled: true, startDate: todayKey() });
  }, []);

  const disable = useCallback(() => {
    setState({ ...state, enabled: false });
  }, []);

  return { state: snap, markFail, restartFresh, disable };
}
