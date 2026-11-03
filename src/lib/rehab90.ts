import { useCallback, useEffect, useState } from 'react';
import { todayKey } from './utils';
import { useAppStore } from '../store/useAppStore';

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
  /** Tanggal terakhir user klik "hari ini aman". Null = belum pernah. */
  lastOkDate: string | null;
  history: RehabHistoryItem[];
  completedAt: string | null;
}

/** Selisih hari (a - b), berbasis tengah malam lokal. */
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime()) / 86_400_000);
}

function defaultState(): RehabState {
  return {
    enabled: true,
    targetDays: 90,
    startDate: todayKey(),
    streak: 0,
    lastOkDate: null,
    history: [],
    completedAt: null,
  };
}

function read(): RehabState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== 'object') return defaultState();
    return {
      enabled: o.enabled !== false,
      targetDays: typeof o.targetDays === 'number' ? o.targetDays : 90,
      startDate: typeof o.startDate === 'string' ? o.startDate : todayKey(),
      streak: typeof o.streak === 'number' ? o.streak : 0,
      lastOkDate: typeof o.lastOkDate === 'string' ? o.lastOkDate : null,
      history: Array.isArray(o.history)
        ? (o.history as RehabHistoryItem[]).filter(
            (h) => !!h && typeof h === 'object' && typeof h.date === 'string',
          )
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
  const today = useAppStore((s) => s.today?.date) ?? todayKey();

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

  // Kalau ada hari yang kelewat tanpa diklik, streak reset ke 0.
  useEffect(() => {
    if (!state.lastOkDate) return;
    if (state.streak !== 0 && dayDiff(today, state.lastOkDate) >= 2) {
      setState({ ...state, streak: 0 });
    }
  }, [today]);

  const markOk = useCallback(() => {
    const d = todayKey();
    if (state.lastOkDate === d) return;
    const diff = state.lastOkDate ? dayDiff(d, state.lastOkDate) : null;
    const nextStreak = diff === 1 ? state.streak + 1 : 1;
    const now = new Date().toISOString();
    setState({
      ...state,
      streak: nextStreak,
      lastOkDate: d,
      history: [{ date: d, status: 'ok' as const, ts: now }, ...state.history].slice(0, 120),
      completedAt: nextStreak >= state.targetDays ? now : state.completedAt,
    });
  }, []);

  const restartFresh = useCallback(() => {
    setState({ ...defaultState(), enabled: true, startDate: todayKey() });
  }, []);

  const disable = useCallback(() => {
    setState({ ...state, enabled: false });
  }, []);

  return { state: snap, markOk, restartFresh, disable };
}
