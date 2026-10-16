import { useEffect, useSyncExternalStore } from 'react';
import { useAppStore } from '../store/useAppStore';
import { todayKey } from './utils';

export const YT_HABIT_ID = 'upload-konten-yt';

const KEY = 'glowup-yt-upload';

/** step 0 => 0%, 1 => 25%, 2 => 75%, 3 => 100% (uploaded). */
const STEPS = [0, 25, 75, 100];

interface YtState {
  step: number;
  /** Date (YYYY-MM-DD) langkah terakhir dinaikin — buat batas maks 1x/hari. */
  lastAdvance: string | null;
}

const INITIAL: YtState = { step: 0, lastAdvance: null };

function read(): YtState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return INITIAL;
    const o = JSON.parse(raw) as Partial<YtState> | null;
    const step = typeof o?.step === 'number' ? Math.min(3, Math.max(0, Math.floor(o.step))) : 0;
    const lastAdvance = typeof o?.lastAdvance === 'string' ? o.lastAdvance : null;
    return { step, lastAdvance };
  } catch {
    return INITIAL;
  }
}

let state: YtState = read();
const listeners = new Set<() => void>();

function persist(next: YtState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function subscribeYt(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getYtState(): YtState {
  return state;
}

export function ytProgress(): number {
  return STEPS[state.step] ?? 0;
}

/** Upload (step 3) di hari sebelumnya → mulai siklus baru dari 0%. */
function normalize(s: YtState): YtState {
  if (s.step >= 3 && s.lastAdvance && s.lastAdvance !== todayKey()) {
    return { step: 0, lastAdvance: null };
  }
  return s;
}

/** Normalize kalau hari udah ganti (dipanggil periodik + pas balik ke app). */
export function refreshYt(): void {
  const n = normalize(state);
  if (n !== state) persist(n);
}

/** Naikin 1 langkah (maks 1x/hari). Return progres baru (0/25/75/100). */
export function advanceYt(): number {
  const n = normalize(state);
  if (n !== state) {
    persist(n);
    return STEPS[n.step] ?? 0;
  }
  if (n.step >= 3 || n.lastAdvance === todayKey()) return STEPS[n.step] ?? 0;
  persist({ step: n.step + 1, lastAdvance: todayKey() });
  return STEPS[state.step] ?? 0;
}

/**
 * Progress upload YT (3 hari): tap naik 25% → 75% → 100%, maks 1x naik/hari,
 * auto-reset ke 0% besoknya setelah upload. Habit-nya auto ke-centang cuma
 * pas udah 100%.
 */
export function useYtUpload() {
  const today = useAppStore((s) => s.today);
  const snap = useSyncExternalStore(subscribeYt, getYtState, getYtState);
  const step = snap.step;

  // Sync habit "upload-konten-yt" completed = (udah 100%) + reset siklus kalau
  // hari udah ganti.
  useEffect(() => {
    const n = normalize(snap);
    if (n !== snap) {
      persist(n);
      return;
    }
    const entry = today?.habits?.[YT_HABIT_ID];
    if (entry && (step >= 3) !== !!entry.completed) {
      void useAppStore.getState().toggleHabit(YT_HABIT_ID);
    }
  }, [snap, step, today]);

  // Periodik: reset siklus begitu masuk hari baru walau app udah kebuka lama.
  useEffect(() => {
    const id = setInterval(refreshYt, 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshYt();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return {
    progress: STEPS[step] ?? 0,
    canAdvance: step < 3 && snap.lastAdvance !== todayKey(),
    advance: advanceYt,
  };
}
