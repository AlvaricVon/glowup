import { useCallback, useEffect, useRef, useState } from 'react';
import { playAdhan, stopAdhan, unlockAudio } from '../lib/adhanAudio';
import { calculateDayPrayers, type PrayerKey, type PrayerTime } from '../lib/prayer';
import { getCachedCoords } from '../lib/location';

export interface ActiveLock {
  prayerKey: PrayerKey;
  prayer: PrayerTime;
  startedAt: number;
  endsAt: number | null;
  durationMin: number;
}

export function usePrayerGate() {
  const [activeLock, setActiveLock] = useState<ActiveLock | null>(null);
  const [now, setNow] = useState(new Date());
  const coords = getCachedCoords();
  const prayersRef = useRef<PrayerTime[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function refresh() {
      try {
        if (!coords) return;
        prayersRef.current = calculateDayPrayers({ latitude: coords.latitude, longitude: coords.longitude });
      } catch {}
    }
    void refresh();
    const id = setInterval(() => void refresh(), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [coords]);

  const check = useCallback(async () => {
    if (!coords) return;
    const today = now.toISOString().split('T')[0];
    const prayers = prayersRef.current;
    if (prayers.length === 0) {
      prayersRef.current = calculateDayPrayers({ latitude: coords.latitude, longitude: coords.longitude });
    }
    const p = prayersRef.current;
    for (const pr of p) {
      const keyDay = today + '::' + pr.key;
      if (seenRef.current.has(keyDay)) continue;
      if (now >= pr.time) {
        const durationMin = 25;
        if (durationMin <= 0) {
          seenRef.current.add(keyDay);
          continue;
        }
        try {
          await unlockAudio();
          await playAdhan();
        } catch {}
        setActiveLock({
          prayerKey: pr.key,
          prayer: pr,
          startedAt: Date.now(),
          endsAt: durationMin === Infinity ? null : Date.now() + durationMin * 60 * 1000,
          durationMin,
        });
        seenRef.current.add(keyDay);
        break;
      }
    }
  }, [now, coords]);

  useEffect(() => {
    void check();
  }, [check]);

  const confirm = useCallback(() => {
    stopAdhan();
    setActiveLock(null);
  }, []);

  return { activeLock, now, confirm };
}

