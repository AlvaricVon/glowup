import type { HabitDef, Period } from './types';

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'subuh-masjid', label: 'Sholat subuh ke masjid', description: 'Bangun + sholat berjamaah', period: 'pagi', priority: 1 },
  { id: 'mandi-pagi', label: 'Mandi pagi', description: 'Boleh sebelum/sesudah subuh', period: 'pagi', priority: 2 },
  { id: 'beresin-kamar', label: 'Beresin kamar', period: 'pagi', priority: 3 },
  { id: 'jogging', label: 'Jogging pagi', period: 'pagi', priority: 4 },
  { id: 'hang-dead', label: 'Hang dead', description: 'Pasif, postur, grip', period: 'pagi', priority: 5 },

  // Siang
  { id: 'dzuhur-masjid', label: 'Sholat dzuhur ke masjid', period: 'siang', priority: 6 },
  { id: 'makan-laper', label: 'Makan cuma pas laper', description: 'Gak ngemil', period: 'siang', priority: 7 },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar ke masjid', period: 'sore', priority: 8 },

  // Malam
  { id: 'mandi-malam', label: 'Mandi sore/malem', description: 'Sebelum tidur', period: 'malam', priority: 9 },
  { id: 'maghrib-masjid', label: 'Sholat maghrib ke masjid', period: 'malam', priority: 10 },
  { id: 'isya-masjid', label: 'Sholat isya ke masjid', period: 'malam', priority: 11 },
  { id: 'selesai-semua', label: 'Selesaikan semua kewajiban & masalah', description: 'To-do list harian, masalah, & kewajiban hari ini beres', period: 'malam', priority: 12 },
  { id: 'tidur-10', label: 'Tidur sebelum jam 10', period: 'malam', priority: 13 },

  // Limit
  { id: 'no-overeat', label: 'Makan secukupnya', description: 'Gak overeat', period: 'limit', priority: 14 },
  { id: 'no-porn', label: 'No porn', description: 'Seharian gak nonton/liat', period: 'limit', priority: 15 },
  { id: 'no-scroll', label: 'No scrolling sosmed', description: 'Buka utk keperluan spesifik OK', period: 'limit', priority: 16 },
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

/** Habits that always count toward the daily total (non-conditional). */
export const BASE_HABIT_COUNT = HABITS.filter((h) => !h.conditional).length;
