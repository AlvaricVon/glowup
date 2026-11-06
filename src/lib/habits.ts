import type { HabitDef, Period } from './types';

/** The 5 daily wajib prayers. */
export const PRAYER_HABIT_IDS = [
  'subuh-masjid',
  'dzuhur-masjid',
  'ashar-masjid',
  'maghrib-masjid',
  'isya-masjid',
] as const;

/** Habit workout — bisa di-excuse (double-tap) kalau hari ini rest day. */
export const WORKOUT_HABIT_ID = 'workout-sore';

/** Habit panasin motor & genset — bisa di-excuse (double-tap) kalau gak ada kendaraan. */
export const GENSET_HABIT_ID = 'panasi-kendaraan';

/** Habit beresin kamar — klik buat buka sub-checklist kebersihan. */
export const KAMAR_HABIT_ID = 'beresin-kamar';

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'minum-pagi', label: 'Minum 2 gelas', description: 'Setelah bangun pagi', period: 'pagi', priority: 0.5 },
  { id: 'grooming-pagi', label: 'Sikat gigi, kumur Listerine & cuci muka', description: 'Pake sabun muka', period: 'pagi', priority: 1 },
  { id: 'subuh-masjid', label: 'Sholat subuh', period: 'pagi', priority: 2 },
  { id: 'baca-quran', label: 'Baca Quran 5 halaman', description: 'Setelah sholat subuh', period: 'pagi', priority: 2.5 },
  { id: KAMAR_HABIT_ID, label: 'Beresin kamar', description: 'Klik buat buka checklist kebersihan kamar.', period: 'pagi', priority: 3 },
  {
    id: 'nulis-todo',
    label: 'Tulis to-do hari ini',
    description: 'Buka Tools → To-Do, tulis rencana hari ini. Auto-centang kalau udah ada to-do tanggal hari ini.',
    period: 'pagi',
    priority: 3.5,
  },
  {
    id: 'physical-pagi',
    label: 'Skipping 5mnt nonstop + Hang dead 1mnt',
    description: 'Skipping 5 menit non stop (variasi gerakan tiap menit) + Hang dead 1 menit. Tanpa peregangan.',
    period: 'pagi',
    priority: 4,
  },
  {
    id: 'mandi-pagi',
    label: 'Mandi pagi',
    description: 'Setelah olahraga pagi. Sekalian grooming jembut & cukur ketek.',
    period: 'pagi',
    priority: 8,
  },
  {
    id: 'grooming-wangian',
    label: 'Grooming & pake wangian',
    description: 'Makarizo, sea salt spray, minyak wangi, + bersihin pusar & telinga pake korek kuping.',
    period: 'pagi',
    priority: 8.2,
  },
  { id: 'baca-buku', label: 'Baca buku min 10 halaman', description: 'Setelah mandi pagi', period: 'pagi', priority: 8.5 },
  {
    id: GENSET_HABIT_ID,
    label: 'Panasin motor & genset',
    description:
      'Panasin motor (dan genset kalo ada) sebelum dipakai hari ini. Kalau hari ini lagi gak ada genset/motor/mobil, double-tap (2x cepet) buat tandai.',
    period: 'pagi',
    priority: 8.7,
  },

  // Siang
  { id: 'dzuhur-masjid', label: 'Sholat dzuhur', period: 'siang', priority: 8 },
  {
    id: 'minum-dzuhur',
    label: 'Minum 2 gelas',
    description: 'Setelah sholat dzuhur',
    period: 'siang',
    priority: 8.5,
  },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar', period: 'sore', priority: 10 },
  {
    id: 'minum-ashar',
    label: 'Minum 2 gelas',
    description: 'Setelah sholat ashar',
    period: 'sore',
    priority: 10.5,
  },
  {
    id: 'workout-sore',
    label: 'Workout',
    description: 'Tiap hari ikut program Darebee. Kalau hari ini rest day, double-tap (2x cepet) buat tandai rest day.',
    period: 'sore',
    priority: 11.5,
  },
  { id: 'mandi-sore', label: 'Mandi sore/malem', period: 'sore', priority: 12 },
  {
    id: 'cuci-sempak',
    label: 'Cuci sempak',
    description: 'Setelah mandi sore/malem',
    period: 'sore',
    priority: 12.2,
  },

  // Malam
  { id: 'maghrib-masjid', label: 'Sholat maghrib', period: 'malam', priority: 23 },
  { id: 'minum-maghrib', label: 'Minum 2 gelas', description: 'Setelah sholat maghrib', period: 'malam', priority: 23.5 },
  { id: 'isya-masjid', label: 'Sholat isya', period: 'malam', priority: 25 },
  { id: 'minum-isya', label: 'Minum 2 gelas', description: 'Setelah sholat isya', period: 'malam', priority: 25.5 },
  { id: 'grooming-malam', label: 'Sikat gigi, kumur Listerine & cuci muka', description: 'Sebelum tidur', period: 'malam', priority: 28 },

  // Limit
  { id: 'no-porn', label: 'No porn', description: 'Seharian gak nonton/liat', period: 'limit', priority: 31 },
  { id: 'no-scroll', label: 'No scrolling sosmed', description: 'Buka utk keperluan spesifik OK', period: 'limit', priority: 32 },
];

export const HABITS_BY_ID: Record<string, HabitDef> = Object.fromEntries(
  HABITS.map((h) => [h.id, h]),
);

export const PERIOD_ORDER: Period[] = ['pagi', 'siang', 'sore', 'malam', 'limit'];

export const PERIOD_LABELS: Record<Period, string> = {
  pagi: 'Pagi',
  siang: 'Siang',
  sore: 'Sore',
  mindset: 'Mindset',
  malam: 'Malam',
  limit: 'Target Harian',
  conditional: 'Kondisional',
};
