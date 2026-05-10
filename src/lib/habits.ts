import type { HabitDef, Period } from './types';

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'subuh-masjid', label: 'Sholat subuh ke masjid', description: 'Bangun + sholat berjamaah', period: 'pagi', priority: 1 },
  { id: 'mandi-pagi', label: 'Mandi pagi', description: 'Boleh sebelum/sesudah subuh', period: 'pagi', priority: 2 },
  { id: 'sapu-kamar', label: 'Sapu kamar', period: 'pagi', priority: 3 },
  { id: 'pel-kamar', label: 'Pel kamar', period: 'pagi', priority: 4 },
  { id: 'jogging', label: 'Jogging pagi', period: 'pagi', priority: 5 },
  { id: 'minum-susu', label: 'Minum susu', period: 'pagi', priority: 6 },
  { id: 'hang-dead', label: 'Hang dead', description: 'Pasif, postur, grip', period: 'pagi', priority: 7 },

  // Siang
  { id: 'dzuhur-masjid', label: 'Sholat dzuhur ke masjid', period: 'siang', priority: 8 },
  { id: 'makan-laper', label: 'Makan cuma pas laper', description: 'Gak ngemil', period: 'siang', priority: 9 },
  { id: 'no-nasi', label: 'Gak makan nasi', period: 'siang', priority: 10 },
  { id: 'masak-sendiri', label: 'Masak sendiri', description: 'Kalo lagi mau makan', period: 'siang', priority: 11 },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar ke masjid', period: 'sore', priority: 12 },
  { id: 'workout-darebee', label: 'Workout Darebee Super Cut', description: 'Cardio sore', period: 'sore', priority: 13 },
  { id: 'permen-1', label: 'Ngunyah permen karet (1/2)', period: 'sore', priority: 14 },

  // Malam
  { id: 'mandi-malam', label: 'Mandi sore/malem', description: 'Sebelum tidur', period: 'malam', priority: 15 },
  { id: 'maghrib-masjid', label: 'Sholat maghrib ke masjid', period: 'malam', priority: 16 },
  { id: 'isya-masjid', label: 'Sholat isya ke masjid', period: 'malam', priority: 17 },
  { id: 'permen-2', label: 'Ngunyah permen karet (2/2)', period: 'malam', priority: 18 },
  { id: 'tidur-12', label: 'Tidur sebelum jam 12', period: 'malam', priority: 19 },

  // Limit
  { id: 'kopi-1x', label: 'Kopi maks 1x sehari', description: 'Centang kalo gak lebih dari 1', period: 'limit', priority: 20 },
  { id: 'no-overeat', label: 'Makan secukupnya', description: 'Gak overeat', period: 'limit', priority: 21 },
  { id: 'no-porn', label: 'No porn', description: 'Seharian gak nonton/liat', period: 'limit', priority: 22 },
  { id: 'no-scroll', label: 'No scrolling sosmed', description: 'Buka utk keperluan spesifik OK', period: 'limit', priority: 23 },

  // Conditional
  { id: 'bersih-kamar', label: 'Bersih-bersih kamar menyeluruh', period: 'conditional', priority: 24, conditional: 'kamarKotor' },
  { id: 'atasi-bau', label: 'Atasi bau badan', description: 'Ganti baju / mandi', period: 'conditional', priority: 25, conditional: 'bauBadan' },
  { id: 'rapiin-grooming', label: 'Rapiin grooming', description: 'Jembut, jambang, kumis, jenggot', period: 'conditional', priority: 26, conditional: 'grooming' },
];

export const HABITS_BY_ID: Record<string, HabitDef> = Object.fromEntries(
  HABITS.map((h) => [h.id, h]),
);

export const PERIOD_ORDER: Period[] = ['pagi', 'siang', 'sore', 'malam', 'limit', 'conditional'];

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
