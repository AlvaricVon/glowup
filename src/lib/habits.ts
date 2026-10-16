import type { DayEntry, HabitDef, Period } from './types';

// Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const MON = 1;
const THU = 4;

/** Day-of-week (0=Sun..6=Sat) buat YYYY-MM-DD, dihitung lokal. */
function dowOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * Minum 2 gelas abis dzuhur/ashar: muncul tiap hari KECUALI Senin/Kamis yang
 * lagi puasa (biar gak dobel sama jadwal puasa). Tapi kalau puasa hari itu
 * di-excuse (gak puasa), minum-nya nongol lagi.
 */
function minumVisible(day: DayEntry): boolean {
  const dow = dowOf(day.date);
  const isMonThu = dow === MON || dow === THU;
  if (!isMonThu) return true;
  return !!day.habits[FASTING_HABIT_ID]?.excused;
}

/** The 5 daily wajib prayers. Sholat Taubat locks against these (mutual exclusion). */
export const PRAYER_HABIT_IDS = [
  'subuh-masjid',
  'dzuhur-masjid',
  'ashar-masjid',
  'maghrib-masjid',
  'isya-masjid',
] as const;

/** Pengganti sholat wajib yang sengaja ditinggalin. */
export const TAUBAT_HABIT_ID = 'taubat';

/** Habit puasa — bisa di-excuse (double-tap) kalau lagi gak puasa. */
export const FASTING_HABIT_ID = 'puasa-senin-kamis';

/** Habit workout — bisa di-excuse (double-tap) kalau hari ini rest day. */
export const WORKOUT_HABIT_ID = 'workout-sore';

/** Habit panasin motor & genset — bisa di-excuse (double-tap) kalau gak ada kendaraan. */
export const GENSET_HABIT_ID = 'panasi-kendaraan';

export const HABITS: HabitDef[] = [
  // Pagi
  { id: 'minum-pagi', label: 'Minum 2 gelas', description: 'Setelah bangun pagi', period: 'pagi', priority: 0.5 },
  { id: 'grooming-pagi', label: 'Sikat gigi & Cuci Muka', description: 'Pake sabun muka', period: 'pagi', priority: 1 },
  { id: 'subuh-masjid', label: 'Sholat subuh', period: 'pagi', priority: 2 },
  { id: 'baca-quran', label: 'Baca Quran 5 halaman', description: 'Setelah sholat subuh', period: 'pagi', priority: 2.5 },
  { id: 'beresin-kamar', label: 'Beresin kamar', description: 'Wajib setiap bangun tidur', period: 'pagi', priority: 3 },
  {
    id: 'nulis-todo',
    label: 'Tulis to-do hari ini',
    description: 'Buka Tools → To-Do, tulis rencana hari ini. Auto-centang kalau udah ada to-do tanggal hari ini.',
    period: 'pagi',
    priority: 3.5,
  },
  { id: 'physical-pagi', label: 'Hang dead + Skipping + Peregangan', description: 'Hang 30s+ (Target 3m -> Pull up), Skipping 5m, Stretching', period: 'pagi', priority: 4 },
  {
    id: 'puasa-senin-kamis',
    label: 'Puasa Senin Kamis',
    description: 'Kalau hari ini lagi GAK puasa, double-tap (2x cepet) checkbox-nya → pilih "gak puasa" biar HP gak kekunci.',
    period: 'pagi',
    priority: 7,
    days: [1, 4],
  },
  { id: 'mandi-pagi', label: 'Mandi pagi', description: 'Setelah olahraga pagi', period: 'pagi', priority: 8 },
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
    visible: minumVisible,
  },

  // Sore
  { id: 'ashar-masjid', label: 'Sholat ashar', period: 'sore', priority: 10 },
  {
    id: 'minum-ashar',
    label: 'Minum 2 gelas',
    description: 'Setelah sholat ashar',
    period: 'sore',
    priority: 10.5,
    visible: minumVisible,
  },
  {
    id: 'workout-sore',
    label: 'Workout',
    description: 'Tiap hari ikut program Darebee. Kalau hari ini rest day, double-tap (2x cepet) buat tandai rest day.',
    period: 'sore',
    priority: 11.5,
  },
  { id: 'mandi-sore', label: 'Mandi sore/malem', period: 'sore', priority: 12 },

  // Malam
  { id: 'maghrib-masjid', label: 'Sholat maghrib', period: 'malam', priority: 23 },
  { id: 'minum-maghrib', label: 'Minum 2 gelas', description: 'Setelah sholat maghrib', period: 'malam', priority: 23.5 },
  { id: 'isya-masjid', label: 'Sholat isya', period: 'malam', priority: 25 },
  {
    id: TAUBAT_HABIT_ID,
    label: 'Sholat Taubat',
    description:
      'Cuma buat nutup sholat wajib yang SENGAJA ditinggalin — niat beneran tobat, bukan cari aman. Harus serius, gak main-main. Kalau 5 sholat wajib hari ini udah lengkap, ini gak perlu & gak bisa diisi.',
    period: 'malam',
    priority: 25.2,
  },
  { id: 'minum-isya', label: 'Minum 2 gelas', description: 'Setelah sholat isya', period: 'malam', priority: 25.5 },
  { id: 'grooming-malam', label: 'Sikat gigi & Cuci Muka', description: 'Sebelum tidur', period: 'malam', priority: 28 },
  {
    id: 'tidur-10',
    label: 'Tidur sebelum jam 10',
    description:
      'Jam 21.00 (jam 9): lampu udah mati dan udah posisi rebahan siap tidur. Jam 21.00–22.00: sesi refreshing — baca komik, nonton anime, atau nonton donghua (bukan scroll HP), tapi cuma yang udah lo simpen (watchlist/readlist) aja. Jam 22.00 (jam 10): taruh HP, langsung tidur.',
    period: 'malam',
    priority: 29,
  },

  // Limit
  {
    id: 'selesai-semua',
    label: 'Selesaikan semua kewajiban & masalah',
    description: 'WA to-do list & masalah hari ini beres — sebelum upload konten',
    period: 'limit',
    priority: 19.45,
  },
  {
    id: 'upload-konten',
    label: 'Upload konten',
    description: 'OddlyLab · ML · TikTok & Shorts',
    period: 'limit',
    priority: 19.5,
  },
  {
    id: 'upload-clipping-3-sosmed',
    label: 'Upload konten clipping',
    description: 'Upload ke 3 sosmed langsung: YouTube, IG, TikTok — kalo udah, submit ke whoap jg',
    period: 'limit',
    priority: 19.55,
  },
  {
    id: 'upload-konten-yt',
    label: 'Upload konten YT',
    description:
      'Upload ke YouTube (Shorts & video panjang), langsung publish. Progress 3 hari: tap naik 25% → 75% → 100% (maks 1x naik per hari). Baru 100% pas udah beneran ke-upload.',
    period: 'limit',
    priority: 19.6,
  },
  {
    id: 'push-mmr-ml',
    label: 'Push global Gusion',
    description:
      'Sebelum main: tiap baru login, latihan Fanny dulu sampai sesi training-nya kelar (end), baru boleh main. Tiap main wajib sambil live, target push global Gusion, sambil kencengin musik biar have fun. Sampe kalah 3x, kalo udah waktu tidur ya tidur. Begitu dicentang (kalah 3x), ML langsung KEKUNCI — gak bisa dibuka lagi sampai besok.',
    period: 'limit',
    priority: 19.7,
  },
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
