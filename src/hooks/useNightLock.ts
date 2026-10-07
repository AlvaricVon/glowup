import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { nativeIsDeviceOwner } from '../lib/lockdown';
import {
  allPagiDone,
  applyNightLock,
  ensureNightLock,
  getNightLockState,
  isNightLockEnabled,
  isNightWindow,
  releaseNightLock,
  subscribeNightLock,
} from '../lib/nightLock';

/**
 * Polls the night-lock rule for the whole app:
 * - Between 22:00 and the next morning, if all pagi habits are NOT done -> native LockTask with
 *   the night whitelist (WhatsApp / Clock / Alquran / Voskhod).
 * - As soon as all applicable pagi habits for the current day are done -> release the lock.
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
        if (allPagiDone(today)) {
          await releaseNightLock();
        } else {
          await ensureNightLock();
        }
        return;
      }
      if (!isNightLockEnabled()) return;
      const now = new Date();
      if (isNightWindow(now) && !allPagiDone(today)) {
        await applyNightLock();
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 30_000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [today]);
}