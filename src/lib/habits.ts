import type { HabitDef, Period } from './types';

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const REST_DAYS = [0, 2, 3, 5, 6]; // Tuesday, Wednesday, Friday, Saturday, Sunday (Not Mon/Thu)

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'grooming-pagi', label: 'Sikat gigi & Cuci muka', description: 'Pake sabun muka', period: 'pagi', priority: 1 },
  { id: 'physical-pagi', label: 'Hang dead + Skipping + Peregangan', description: 'Hang 30s+ (Target 3m -> Pull up), Skipping 5m, Stretching', period: 'pagi', priority: 2 },
  { id: 'jogging-pagi', label: 'Jogging pagi', period: 'pagi', priority: 3, days: REST_DAYS },
  { id: 'subuh-masjid', label: 'Sholat subuh ke masjid', period: 'pagi', priority: 4 },
  { id: 'beresin-kamar', label: 'Beresin kamar', description: 'Wajib setiap bangun tidur', period: 'pagi', priority: 5 },

  // Siang
  { id: 'dzuhur-masjid', label: 'Sholat dzuhur ke masjid', period: 'siang', priority: 6 },
  { id: 'pushups-dzuhur', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'siang', priority: 7, days: REST_DAYS },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar ke masjid', period: 'sore', priority: 8 },
  { id: 'pushups-ashar', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'sore', priority: 9, days: REST_DAYS },
  { id: 'mandi-sore', label: 'Mandi sore/malem', period: 'sore', priority: 10 },

  // Malam
  { id: 'maghrib-masjid', label: 'Sholat maghrib ke masjid', period: 'malam', priority: 11 },
  { id: 'pushups-maghrib', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'malam', priority: 12, days: REST_DAYS },
  { id: 'isya-masjid', label: 'Sholat isya ke masjid', period: 'malam', priority: 13 },
  { id: 'pushups-isya', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'malam', priority: 14, days: REST_DAYS },
  { id: 'selesai-semua', label: 'Selesaikan semua kewajiban & masalah', description: 'WA to-do list & masalah hari ini beres', period: 'malam', priority: 15 },
  { id: 'grooming-malam', label: 'Sikat gigi & Cuci muka', description: 'Sebelum tidur', period: 'malam', priority: 16 },
  { id: 'tidur-10', label: 'Tidur sebelum jam 10', period: 'malam', priority: 17 },

  // Limit
  { id: 'no-overeat', label: 'Makan secukupnya', description: 'Gak overeat', period: 'limit', priority: 18 },
  { id: 'no-porn', label: 'No porn', description: 'Seharian gak nonton/liat', period: 'limit', priority: 19 },
  { id: 'no-scroll', label: 'No scrolling sosmed', description: 'Buka utk keperluan spesifik OK', period: 'limit', priority: 20 },
];

export const HABITS_BY_ID: Record<string, HabitDef> = Object.fromEntries(
  HABITS.map((h) => [h.id, h]),
);

export const PERIOD_ORDER: Period[] = ['pagi', 'siang', 'sore', 'malam', 'limit'];

export const PERIOD_LABELS: Record<Period, string> = {
  pagi: 'Pagi',
  siang: 'Siang',
  sore: 'Sore',
  malam: 'Malam',
  limit: 'Limit Harian',
  conditional: 'Kondisional',
};
