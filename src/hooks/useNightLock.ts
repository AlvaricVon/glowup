import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { nativeIsDeviceOwner } from '../lib/lockdown';
import {
  applyGate,
  ensureNightLock,
  evaluateGate,
  gateDone,
  getNightLockState,
  isNightLockEnabled,
  releaseNightLock,
  subscribeNightLock,
} from '../lib/nightLock';

/**
 * Polls the gate rule for the whole app. A gate locks the phone (native LockTask
 * with the whitelist: Voskhod / WhatsApp / Spotify / Clock / Alquran) until its
 * period's habits for the day are all done:
 * - pagi  -> due at Subuh
 * - siang -> due at Dzuhur
 * - sore  -> due at Ashar
 * - night -> due at 22:00 (requires all pagi habits)
 * Re-asserts on every tick so it survives reboots/relaunches while still active.
 */
export function useNightLock() {
  const today = useAppStore((s) => s.today);
  const [, force] = useState(0);

  useEffect(() => subscribeNightLock(() => force((x) => x + 1)), []);

  useEffect(() => {
    if (!today) return;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      if (!(await nativeIsDeviceOwner())) return;
      const st = getNightLockState();
      if (st.active) {
        if (!isNightLockEnabled() || gateDone(today, st.gate ?? 'night')) {
          await releaseNightLock();
        } else {
          await ensureNightLock();
        }
        return;
      }
      if (!isNightLockEnabled()) return;
      const gate = evaluateGate(today, new Date());
      if (gate) {
        await applyGate(gate);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [today]);
}