import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { nativeIsDeviceOwner, nativeSetAppLocked } from '../lib/lockdown';

/** Mobile Legends package. */
export const ML_PACKAGE = 'com.mobile.legends';
/** Habit that, once checked (kalah 3x / target harian kelar), locks ML. */
export const ML_HABIT_ID = 'push-mmr-ml';

/**
 * Kunci Mobile Legends selama habit "Push global Gusion" (kalah 3x) sudah
 * dicentang hari itu. Pakai penangguhan app bawaan device owner — app tetap
 * kelihatan di launcher tapi gak bisa dibuka sampai besok (habit reset).
 */
export function useMlLock() {
  const today = useAppStore((s) => s.today);
  const appliedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!today) return;
    let stopped = false;
    const apply = async () => {
      if (stopped) return;
      const wanted = today.habits[ML_HABIT_ID]?.completed === true;
      if (appliedRef.current === wanted) return;
      if (!(await nativeIsDeviceOwner())) return;
      const ok = await nativeSetAppLocked(ML_PACKAGE, wanted);
      if (ok && !stopped) appliedRef.current = wanted;
    };
    void apply();
    const id = setInterval(() => void apply(), 15_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') void apply();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [today]);
}
