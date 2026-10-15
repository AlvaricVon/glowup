import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { todayKey } from '../lib/utils';

const TODOS_KEY = 'glowup-todos';
const HABIT_ID = 'nulis-todo';

/** Ada minimal 1 to-do bertanggal hari ini di Tools → To-Do. */
function hasTodoToday(): boolean {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    if (!raw) return false;
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return false;
    const today = todayKey();
    return arr.some(
      (t) => t && typeof t === 'object' && (t as { date?: unknown }).date === today,
    );
  } catch {
    return false;
  }
}

/**
 * Auto-centang habit pagi "Tulis to-do hari ini" kalau di Tools → To-Do ada
 * minimal 1 to-do bertanggal hari ini, dan uncheck lagi kalau kosong.
 * Habit yang di-excuse/skip gak diganggu.
 */
export function useTodoHabit() {
  const today = useAppStore((s) => s.today);

  useEffect(() => {
    if (!today) return;
    const sync = () => {
      const entry = useAppStore.getState().today?.habits?.[HABIT_ID];
      if (!entry) return;
      if (entry.excused || entry.skipped) return;
      const want = hasTodoToday();
      if (want !== !!entry.completed) {
        void useAppStore.getState().toggleHabit(HABIT_ID);
      }
    };
    sync();
    const onEvent = (e: Event) => {
      const key = (e as StorageEvent).key ?? (e as CustomEvent<{ key?: string }>).detail?.key;
      if (!key || key === TODOS_KEY) sync();
    };
    window.addEventListener('glowup:local-storage', onEvent);
    window.addEventListener('storage', onEvent);
    const id = setInterval(sync, 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('glowup:local-storage', onEvent);
      window.removeEventListener('storage', onEvent);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(id);
    };
  }, [today]);
}
