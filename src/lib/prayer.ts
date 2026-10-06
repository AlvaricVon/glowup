import { CalculationMethod, Coordinates, Madhab, PrayerTimes, type Prayer } from 'adhan';
import { parseLocalDay } from './utils';

export type PrayerKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export interface PrayerTime {
  key: PrayerKey;
  name: string;
  time: Date;
}

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  subuh: 'Subuh',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
};

const PRAYER_MAP: Record<Prayer, PrayerKey> = {
  fajr: 'subuh',
  dhuhr: 'dzuhur',
  asr: 'ashar',
  maghrib: 'maghrib',
  isha: 'isya',
};

export interface PrayerCalculationOptions {
  latitude: number;
  longitude: number;
  calculationMethod?: any;
  madhab?: any;
  date?: Date;
}

export function calculateDayPrayers(opts: PrayerCalculationOptions): PrayerTime[] {
  const { latitude, longitude, calculationMethod = CalculationMethod.Singapore(), madhab = Madhab.Shafi, date = new Date() } = opts;
  const coords = new Coordinates(latitude, longitude);
  const params = calculationMethod();
  params.madhab = madhab;
  const pt = new PrayerTimes(coords, date, params);
  const prayers: PrayerTime[] = [];
  (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as Prayer[]).forEach((p) => {
    const key = PRAYER_MAP[p];
    if (key) {
      prayers.push({ key, name: PRAYER_NAMES[key], time: pt[p] });
    }
  });
  return prayers;
}

export function nextPrayer(prayers: PrayerTime[], now: Date = new Date()): { current: PrayerTime | null; next: PrayerTime | null } {
  let next: PrayerTime | null = null;
  let current: PrayerTime | null = null;
  for (const pr of prayers) {
    if (pr.time <= now) {
      current = pr;
    } else if (!next) {
      next = pr;
    }
  }
  return { current, next };
}



export function isInLockWindow(prayer: PrayerTime, now: Date = new Date(), lockMinutes: number = 0): boolean {
  if (lockMinutes <= 0) return false;
  const end = new Date(prayer.time.getTime() + lockMinutes * 60 * 1000);
  return now >= prayer.time && now < end;
}

