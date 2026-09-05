import type { HabitDef, Period } from './types';

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const REST_DAYS = [0, 2, 3, 5, 6]; // Tuesday, Wednesday, Friday, Saturday, Sunday (Not Mon/Thu)

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'minum-pagi', label: 'Minum 2 gelas', description: 'Setelah bangun pagi', period: 'pagi', priority: 0.5 },
  { id: 'grooming-pagi', label: 'Sikat gigi & Cuci Muka', description: 'Pake sabun muka', period: 'pagi', priority: 1 },
  { id: 'subuh-masjid', label: 'Sholat subuh', period: 'pagi', priority: 2 },
  { id: 'baca-quran', label: 'Baca Quran 5 halaman', description: 'Setelah sholat subuh', period: 'pagi', priority: 2.5 },
  { id: 'beresin-kamar', label: 'Beresin kamar', description: 'Wajib setiap bangun tidur', period: 'pagi', priority: 3 },
  { id: 'physical-pagi', label: 'Hang dead + Skipping + Peregangan', description: 'Hang 30s+ (Target 3m -> Pull up), Skipping 5m, Stretching', period: 'pagi', priority: 4 },
  { id: 'jogging-pagi', label: '1 hour morning walk', period: 'pagi', priority: 6, days: REST_DAYS },
  { id: 'puasa-senin-kamis', label: 'Puasa Senin Kamis', period: 'pagi', priority: 7, days: [1, 4] },
  { id: 'mandi-pagi', label: 'Mandi pagi', description: 'Setelah olahraga pagi', period: 'pagi', priority: 8 },
  { id: 'baca-buku', label: 'Baca buku min 10 halaman', description: 'Setelah mandi pagi', period: 'pagi', priority: 8.5 },
  { id: 'push-mmr-ml', label: 'Push MMR hero ML', description: 'Sampe kalah 3x, kalo udah waktu tidur ya tidur', period: 'pagi', priority: 9 },

  // Siang
  { id: 'dzuhur-masjid', label: 'Sholat dzuhur', period: 'siang', priority: 8 },
  { id: 'minum-dzuhur', label: 'Minum 2 gelas', description: 'Setelah sholat dzuhur', period: 'siang', priority: 8.5, days: REST_DAYS },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar', period: 'sore', priority: 10 },
  { id: 'minum-ashar', label: 'Minum 2 gelas', description: 'Setelah sholat ashar', period: 'sore', priority: 10.5, days: REST_DAYS },
  { id: 'workout-sore', label: 'Workout', description: 'Progress workout sore (hari non-Senin/Kamis), sebelum mandi sore', period: 'sore', priority: 11.5, days: REST_DAYS },
  { id: 'mandi-sore', label: 'Mandi sore/malem', period: 'sore', priority: 12 },

  // Malam
  { id: 'maghrib-masjid', label: 'Sholat maghrib', period: 'malam', priority: 23 },
  { id: 'minum-maghrib', label: 'Minum 2 gelas', description: 'Setelah sholat maghrib', period: 'malam', priority: 23.5 },
  { id: 'isya-masjid', label: 'Sholat isya', period: 'malam', priority: 25 },
  { id: 'minum-isya', label: 'Minum 2 gelas', description: 'Setelah sholat isya', period: 'malam', priority: 25.5 },
  { id: 'selesai-semua', label: 'Selesaikan semua kewajiban & masalah', description: 'WA to-do list & masalah hari ini beres', period: 'malam', priority: 27 },
  { id: 'grooming-malam', label: 'Sikat gigi & Cuci Muka', description: 'Sebelum tidur', period: 'malam', priority: 28 },
  { id: 'tidur-10', label: 'Tidur sebelum jam 10', period: 'malam', priority: 29 },

  // Limit
  {
    id: 'upload-konten',
    label: 'Upload konten',
    description: 'OddlyLab · ML · TikTok',
    period: 'limit',
    priority: 19.5,
  },
  { id: 'no-overeat', label: 'Makan secukupnya', description: 'Gak overeat', period: 'limit', priority: 30 },
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
