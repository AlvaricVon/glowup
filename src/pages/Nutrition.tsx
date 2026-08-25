import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Info, Utensils } from 'lucide-react';

type Meal = {
  time: string;
  menu: string;
  notes: string;
  isOptional?: boolean;
};

type Principle = {
  title: string;
  description: string;
};

const DAILY_MEALS: Meal[] = [
  { time: 'Bangun tidur', menu: 'Air putih 2 gelas', notes: 'Udah rutin lu' },
  { time: 'Sarapan (abis mandi pagi)', menu: '2-3 telur (rebus/orak-arik minyak dikit) + oat/ubi rebus + buah', notes: 'Porsi sampai kenyang wajar, jangan dikurang-kurangin' },
  { time: 'Snack siang (opsional)', menu: 'Yogurt plain atau segenggam kacang', notes: 'Kalau lapar sebelum makan siang', isOptional: true },
  { time: 'Makan siang (abis Dzuhur)', menu: 'Ayam/ikan panggang-bakar + sayur banyak (tumis/rebus) + tahu/tempe', notes: 'Protein utama hari ini' },
  { time: 'Snack sore (abis Ashar)', menu: 'Telur rebus atau buah', notes: '' },
  { time: 'Makan malam (abis Maghrib)', menu: 'Ikan/ayam/daging + sayur banyak + ubi/kentang rebus', notes: '' },
  { time: 'Malam (abis Isya, kalau masih lapar)', menu: 'Susu atau yogurt plain', notes: 'Hindari camilan manis/gorengan larut malam' },
];

const FASTING_MEALS: Meal[] = [
  { time: 'Sahur', menu: 'Telur + ubi/oat + alpukat/kacang + sayur', notes: 'Biar tahan sampai maghrib, jangan sahur seadanya' },
  { time: 'Buka', menu: 'Air putih + kurma 2-3 → sholat → makan berat: protein (ayam/ikan/daging) + sayur banyak + karbo secukupnya (ubi/kentang)', notes: 'Porsi normal aja jangan ditahan-tahan' },
];

const PRINCIPLES: Principle[] = [
  {
    title: 'Protein tiap makan',
    description: 'Telur, ayam, ikan, tahu/tempe — ini yang bantu badan kebentuk seiring latihan calisthenics lu.',
  },
  {
    title: 'Sayur banyak, karbo dari ubi/oat/kentang',
    description: 'Bukan nasi, tapi bukan berarti dibatasi ketat.',
  },
  {
    title: 'Kurangi gorengan, minuman manis, mie instan/makanan tinggi garam',
    description: 'Bukan buat "cutting", tapi emang pola makan sehat umum.',
  },
  {
    title: 'Makan sampai kenyang wajar di tiap sesi',
    description: 'Jangan sengaja nahan lapar atau skip makan buat "ngebut" hasil. Badan lu masih butuh cukup asupan buat tumbuh.',
  },
  {
    title: 'Hasil "lean & kebentuk"',
    description: 'Lebih banyak datang dari konsistensi latihan (push/pull/leg) + tidur cukup, ketimbang dari ngerem makan.',
  },
];

function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white/70 overflow-hidden dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold dark:bg-brand-900/30 dark:text-brand-400">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{meal.time}</span>
              {meal.isOptional && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  Opsional
                </span>
              )}
            </div>
            <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">{meal.menu}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
      </button>
      {expanded && meal.notes && (
        <div className="border-t border-neutral-200/60 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800/50 dark:bg-neutral-800/30">
          <div className="flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0 text-neutral-400" />
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{meal.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PrincipleCard({ principle, index }: { principle: Principle; index: number }) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold dark:bg-brand-900/30 dark:text-brand-400">
          {index + 1}
        </div>
        <div>
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{principle.title}</h4>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{principle.description}</p>
        </div>
      </div>
    </div>
  );
}

export function Nutrition() {
  const currentDay = useMemo(() => new Date().getDay(), []);
  const isFastingDay = currentDay === 1 || currentDay === 4; // Senin = 1, Kamis = 4
  const meals = isFastingDay ? FASTING_MEALS : DAILY_MEALS;
  const dayLabel = isFastingDay ? 'Senin & Kamis (Puasa Sunnah)' : 'Hari Biasa (Non-Senin/Kamis)';

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          JADWAL MAKAN
        </p>
        <div className="flex items-center gap-2">
          <Utensils size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Nutrition</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Jadwal & prinsip makan harian</p>
      </header>

      {/* Day indicator */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900/30 dark:bg-brand-900/20">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} className="text-brand-500" />
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Hari ini: <span className="font-bold">{dayLabel}</span>
          </span>
        </div>
      </div>

      {/* Meals section */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
          <Utensils size={12} /> Jadwal Makan
        </h2>
        <div className="space-y-2">
          {meals.map((meal, i) => (
            <MealCard key={`${isFastingDay}-${i}`} meal={meal} index={i} />
          ))}
        </div>
      </section>

      {/* Principles section */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
          <Info size={12} /> Prinsip yang Tetap Dipegang
        </h2>
        <div className="space-y-3">
          {PRINCIPLES.map((p, i) => (
            <PrincipleCard key={i} principle={p} index={i} />
          ))}
        </div>
      </section>

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">
        GlowUp Nutrition · Read-only reference
      </p>
    </div>
  );
}