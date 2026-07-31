import type { HabitDef, Period } from './types';

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const REST_DAYS = [0, 2, 3, 5, 6]; // Tuesday, Wednesday, Friday, Saturday, Sunday (Not Mon/Thu)

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'grooming-pagi', label: 'Sikat gigi & Cuci muka', description: 'Pake sabun muka', period: 'pagi', priority: 1 },
  { id: 'subuh-masjid', label: 'Sholat subuh', period: 'pagi', priority: 2 },
  { id: 'beresin-kamar', label: 'Beresin kamar', description: 'Wajib setiap bangun tidur', period: 'pagi', priority: 3 },
  { id: 'physical-pagi', label: 'Hang dead + Skipping + Peregangan', description: 'Hang 30s+ (Target 3m -> Pull up), Skipping 5m, Stretching', period: 'pagi', priority: 4 },
  { id: 'pushups-pagi', label: 'Push-ups (10-20x)', description: 'Sebelum jalan pagi', period: 'pagi', priority: 5, days: REST_DAYS },
  { id: 'jogging-pagi', label: 'Jalan pagi', period: 'pagi', priority: 6, days: REST_DAYS },
  { id: 'puasa-senin-kamis', label: 'Puasa Senin Kamis', period: 'pagi', priority: 7, days: [1, 4] },
  { id: 'mandi-pagi', label: 'Mandi pagi', description: 'Setelah olahraga pagi', period: 'pagi', priority: 8 },
  { id: 'push-mmr-ml', label: 'Push MMR hero ML', description: 'Sampe kalah 3x, kalo udah waktu tidur ya tidur', period: 'pagi', priority: 9 },

  // Siang
  { id: 'dzuhur-masjid', label: 'Sholat dzuhur', period: 'siang', priority: 8 },
  { id: 'pushups-dzuhur', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'siang', priority: 9, days: REST_DAYS },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar', period: 'sore', priority: 10 },
  { id: 'pushups-ashar', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'sore', priority: 11, days: REST_DAYS },
  { id: 'mandi-sore', label: 'Mandi sore/malem', period: 'sore', priority: 12 },

  // Malam
  { id: 'maghrib-masjid', label: 'Sholat maghrib', period: 'malam', priority: 13 },
  { id: 'pushups-maghrib', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'malam', priority: 14, days: REST_DAYS },
  { id: 'isya-masjid', label: 'Sholat isya', period: 'malam', priority: 15 },
  { id: 'pushups-isya', label: 'Push-ups (10-20x)', description: 'Habis sholat', period: 'malam', priority: 16, days: REST_DAYS },
  { id: 'selesai-semua', label: 'Selesaikan semua kewajiban & masalah', description: 'WA to-do list & masalah hari ini beres', period: 'malam', priority: 17 },
  { id: 'grooming-malam', label: 'Sikat gigi & Cuci muka', description: 'Sebelum tidur', period: 'malam', priority: 18 },
  { id: 'tidur-10', label: 'Tidur sebelum jam 10', period: 'malam', priority: 19 },

  // Limit
  { id: 'no-overeat', label: 'Makan secukupnya', description: 'Gak overeat', period: 'limit', priority: 20 },
  { id: 'no-porn', label: 'No porn', description: 'Seharian gak nonton/liat', period: 'limit', priority: 21 },
  { id: 'no-scroll', label: 'No scrolling sosmed', description: 'Buka utk keperluan spesifik OK', period: 'limit', priority: 22 },
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
