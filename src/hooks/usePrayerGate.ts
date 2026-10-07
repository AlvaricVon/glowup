import { useCallback, useEffect, useRef, useState } from 'react';
import { playAdhan, stopAdhan, unlockAudio } from '../lib/adhanAudio';
import { PRAYER_NAMES, calculateDayPrayers, type PrayerKey, type PrayerTime } from '../lib/prayer';
import { getCachedCoords, getTimeZone, requestCoords, type Coords } from '../lib/location';
import { enterLockdown, exitLockdown, isNative, onNativeUnlock, showNativeLockScreen } from '../lib/lockdown';
import { getNightLockState } from '../lib/nightLock';
import { readPrayerSettings, usePrayerSettings } from '../lib/prayerSettings';
import { useAppStore } from '../store/useAppStore';

const PRAYER_HABIT: Record<PrayerKey, string> = {
  subuh: 'subuh-masjid',
  dzuhur: 'dzuhur-masjid',
  ashar: 'ashar-masjid',
  maghrib: 'maghrib-masjid',
  isya: 'isya-masjid',
};

export interface ActiveLock {
  prayerKey: PrayerKey;
  prayer: PrayerTime;
  startedAt: number;
}

const LOG_KEY = 'glowup-prayer-log';

function readLog(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return typeof o === 'object' && o !== null ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeLog(log: Record<string, string>) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // noop
  }
}

function dayKey(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function isConfirmed(log: Record<string, string>, key: string): boolean {
  const ts = log[key];
  if (!ts) return false;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 12 * 60 * 60 * 1000;
}

export function usePrayerGate() {
  const [activeLock, setActiveLock] = useState<ActiveLock | null>(null);
  const [now, setNow] = useState(new Date());
  const [coords, setCoords] = useState<Coords | null>(() => getCachedCoords());
  const prayersRef = useRef<PrayerTime[]>([]);
  const logRef = useRef<Record<string, string>>(readLog());

  const enabled = usePrayerSettings((s) => s.enabled);
  const method = usePrayerSettings((s) => s.method);
  const lockEnabled = usePrayerSettings((s) => s.lockEnabled);
  const autoCheckHabits = usePrayerSettings((s) => s.autoCheckHabits);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const maybeRefresh = async () => {
      if (cancelled || !navigator.geolocation) return;
      try {
        const cached = getCachedCoords();
        const tz = getTimeZone();
        if (cached && cached.tz === tz) return;
        const c = await requestCoords();
        if (!cancelled) setCoords(c);
      } catch {
        // keep old coords
      }
    };
    void maybeRefresh();
    const onVis = () => {
      if (document.visibilityState === 'visible') void maybeRefresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    prayersRef.current = [];
    if (!coords) return;
    void (async () => {
      try {
        prayersRef.current = calculateDayPrayers({
          latitude: coords.latitude,
          longitude: coords.longitude,
          method: readPrayerSettings().method,
        });
      } catch {
        // noop
      }
    })();
    const id = setInterval(() => {
      try {
        if (!coords) return;
        prayersRef.current = calculateDayPrayers({
          latitude: coords.latitude,
          longitude: coords.longitude,
          method: readPrayerSettings().method,
        });
      } catch {
        // noop
      }
    }, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [coords, method]);

  const release = useCallback(() => {
    stopAdhan();
    setActiveLock(null);
    // Don't kill the night-lock LockTask — releasing a prayer gate must not disarm it.
    if (!getNightLockState().active) void exitLockdown();
  }, []);

  /** Persist confirmations (+ auto-check the matching sholat habits). */
  const commitConfirm = useCallback(() => {
    const log = { ...logRef.current };
    const today = dayKey(new Date());
    const store = useAppStore.getState();
    for (const pr of prayersRef.current) {
      const key = today + '::' + pr.key;
      if (new Date() >= pr.time && !isConfirmed(log, key)) {
        log[key] = new Date().toISOString();
        if (autoCheckHabits) {
          const habitId = PRAYER_HABIT[pr.key];
          const entry = store.today?.habits?.[habitId];
          if (!entry?.completed) void store.toggleHabit(habitId);
        }
      }
    }
    logRef.current = log;
    writeLog(log);
    release();
  }, [release, autoCheckHabits]);

  // Native unlock event (user tapped the native lock screen button).
  useEffect(() => {
    void onNativeUnlock(() => commitConfirm());
  }, [commitConfirm]);

  const check = useCallback(() => {
    if (!enabled) {
      if (activeLock) release();
      return;
    }
    if (!coords) return;
    if (prayersRef.current.length === 0) {
      prayersRef.current = calculateDayPrayers({
        latitude: coords.latitude,
        longitude: coords.longitude,
        method,
      });
    }
    const today = dayKey(now);
    const log = logRef.current;

    for (const pr of prayersRef.current) {
      const key = today + '::' + pr.key;
      if (isConfirmed(log, key)) continue;
      if (now >= pr.time) {
        void unlockAudio().then(() => playAdhan()).catch(() => undefined);
        setActiveLock((cur) =>
          cur && cur.prayerKey === pr.key ? cur : { prayerKey: pr.key, prayer: pr, startedAt: Date.now() },
        );
        if (isNative() && lockEnabled && !getNightLockState().active) {
          void enterLockdown();
          void showNativeLockScreen(PRAYER_NAMES[pr.key]);
        }
        return;
      }
    }

    setActiveLock(null);
  }, [now, coords, enabled, method, lockEnabled, activeLock, release]);

  useEffect(() => {
    check();
  }, [check]);

  return { activeLock, now, confirm: commitConfirm, isNative: isNative() };
}