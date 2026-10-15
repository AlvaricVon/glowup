import { useCallback, useEffect, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { parseDateKey } from './todos';
import { todayKey } from './utils';

const STORAGE_KEY = 'glowup-noporn';

/** Target program: 6 bulan. */
export const REBOOT_GOAL_DAYS = 180;

export interface UrgeEvent {
  /** ISO timestamp. */
  t: string;
  /** Alternatif yang dipilih (id), kalau ada. */
  alt?: string;
}

export interface RebootState {
  startDate: string;
  /** ISO timestamp relapse terakhir, atau null kalau belum pernah (sejak start). */
  lastRelapse: string | null;
  /** Total relapse sejak program mulai. */
  relapseCount: number;
  /** Log keinginan yang berhasil dilewatin. */
  urgesBeaten: UrgeEvent[];
}

export interface RebootAlt {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  /** Package buat quick-launch, kalau ada. */
  pkg?: string;
}

export const REBOOT_ALTS: RebootAlt[] = [
  { id: 'game', emoji: '🎮', label: 'Main game', desc: 'Push rank / latihan Fanny', pkg: 'com.mobile.legends' },
  { id: 'sleep', emoji: '😴', label: 'Tidur', desc: 'Rebahan, tutup mata, istirahat' },
  { id: 'eat', emoji: '🍽️', label: 'Makan', desc: 'Makan secukupnya, minum air' },
  { id: 'spotify', emoji: '🎧', label: 'Spotify', desc: 'Putar musik, alihin pikiran', pkg: 'com.spotify.music' },
  { id: 'voskhod', emoji: '📋', label: 'Voskhod', desc: 'Cek habit / tulis to-do' },
];

export const REBOOT_MILESTONES = [1, 3, 7, 14, 30, 60, 90, 120, 150, 180];

function defaultState(): RebootState {
  return { startDate: todayKey(), lastRelapse: null, relapseCount: 0, urgesBeaten: [] };
}

function read(): RebootState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && typeof o.startDate === 'string') {
        return {
          startDate: o.startDate,
          lastRelapse: typeof o.lastRelapse === 'string' ? o.lastRelapse : null,
          relapseCount: Number.isFinite(o.relapseCount) ? o.relapseCount : 0,
          urgesBeaten: Array.isArray(o.urgesBeaten) ? o.urgesBeaten : [],
        };
      }
    }
  } catch {
    // ignore
  }
  return defaultState();
}

let state: RebootState = read();
const listeners = new Set<() => void>();

function setState(next: RebootState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

/** Hari bersih: dari relapse terakhir (atau start) sampai hari ini. */
export function cleanDays(s: RebootState): number {
  const from = s.lastRelapse ? new Date(s.lastRelapse) : parseDateKey(s.startDate);
  const d = differenceInCalendarDays(new Date(), from);
  return Math.max(0, d);
}

export function useReboot() {
  const [snap, setSnap] = useState<RebootState>(state);

  useEffect(() => {
    const fn = () => setSnap(state);
    listeners.add(fn);
    // Sync antar-instance / reload.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        state = read();
        setSnap(state);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const relapse = useCallback(() => {
    setState({ ...state, lastRelapse: new Date().toISOString(), relapseCount: state.relapseCount + 1 });
  }, []);

  const beatUrge = useCallback((alt?: string) => {
    setState({
      ...state,
      urgesBeaten: [...state.urgesBeaten, { t: new Date().toISOString(), alt }].slice(-200),
    });
  }, []);

  const reset = useCallback(() => {
    setState(defaultState());
  }, []);

  return { state: snap, days: cleanDays(snap), relapse, beatUrge, reset };
}
