import { CalculationMethod, Coordinates, Madhab, PrayerTimes, type CalculationParameters } from 'adhan';

export type PrayerKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';
export type PrayerMethodKey =
  | 'singapore'
  | 'muslimWorldLeague'
  | 'ummAlQura'
  | 'karachi'
  | 'egyptian';

export const PRAYER_METHODS: { key: PrayerMethodKey; label: string }[] = [
  { key: 'singapore', label: 'Indonesia / MUI (Singapura)' },
  { key: 'muslimWorldLeague', label: 'Muslim World League' },
  { key: 'ummAlQura', label: 'Umm al-Qura (Mekkah)' },
  { key: 'karachi', label: 'Karachi' },
  { key: 'egyptian', label: 'Egyptian' },
];

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

const ORDERED: PrayerKey[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

function paramsFor(method: PrayerMethodKey): CalculationParameters {
  switch (method) {
    case 'muslimWorldLeague':
      return CalculationMethod.MuslimWorldLeague();
    case 'ummAlQura':
      return CalculationMethod.UmmAlQura();
    case 'karachi':
      return CalculationMethod.Karachi();
    case 'egyptian':
      return CalculationMethod.Egyptian();
    case 'singapore':
    default:
      return CalculationMethod.Singapore();
  }
}

export interface PrayerCalculationOptions {
  latitude: number;
  longitude: number;
  method?: PrayerMethodKey;
  date?: Date;
}

export function calculateDayPrayers(opts: PrayerCalculationOptions): PrayerTime[] {
  const { latitude, longitude, method = 'singapore', date = new Date() } = opts;
  const coords = new Coordinates(latitude, longitude);
  const params = paramsFor(method);
  params.madhab = Madhab.Shafi;
  const pt = new PrayerTimes(coords, date, params);

  const times: Record<PrayerKey, Date> = {
    subuh: pt.fajr,
    dzuhur: pt.dhuhr,
    ashar: pt.asr,
    maghrib: pt.maghrib,
    isya: pt.isha,
  };

  return ORDERED.map((key) => ({ key, name: PRAYER_NAMES[key], time: times[key] }));
}

export function nextPrayer(
  prayers: PrayerTime[],
  now: Date = new Date(),
): { current: PrayerTime | null; next: PrayerTime | null } {
  let current: PrayerTime | null = null;
  let next: PrayerTime | null = null;
  for (const pr of prayers) {
    if (pr.time <= now) {
      current = pr;
    } else if (!next) {
      next = pr;
    }
  }
  return { current, next };
}

export function isInLockWindow(prayer: PrayerTime, now: Date = new Date(), lockMinutes: number = 25): boolean {
  if (lockMinutes <= 0) return false;
  const end = new Date(prayer.time.getTime() + lockMinutes * 60 * 1000);
  return now >= prayer.time && now < end;
}
