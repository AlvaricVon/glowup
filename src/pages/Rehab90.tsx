import { Check, ShieldOff } from 'lucide-react';
import { useRehab } from '../lib/rehab90';
import { todayKey } from '../lib/utils';

const RULES = [
  'Jaga batas diri',
  'Banyakin diam, ngomong seperlunya',
  'No scrolling sosmed',
  'Mandi pagi & grooming',
  'Mandi sore',
  'Workout Darebee',
  'Lanjutin / kembangin bisnis ortu',
  'Kalo lagi gak ngapa-ngapain: beresin badan atau lingkungan (kebersihan / kerapihan). Boleh juga nonton anime, baca komik, atau main game',
];

export function Rehab90() {
  const { state, markOk } = useRehab();
  const today = todayKey();
  const alreadyOk = state.lastOkDate === today;
  const pct = Math.min(100, Math.round((state.streak / state.targetDays) * 100));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center space-y-6 px-5 py-10">
      <header className="space-y-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <ShieldOff size={26} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Rehab 90 Hari</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Tiap malam klik tombolnya — cuma kalau lo jujur hari ini aman.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/70 p-6 text-center dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="text-6xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
          {state.streak}
          <span className="text-3xl font-bold text-neutral-400"> / {state.targetDays}</span>
        </div>
        <div className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Hari aman berturut-turut</div>
        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-xs text-neutral-400">{pct}%</div>
      </section>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Rules</div>
        <ul className="space-y-2">
          {RULES.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={markOk}
        disabled={alreadyOk}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-5 text-base font-bold transition-colors ${
          alreadyOk
            ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
            : 'bg-brand-500 text-white active:bg-brand-700'
        }`}
      >
        <Check size={20} strokeWidth={3} />
        {alreadyOk ? 'Udah dicatat hari ini' : 'Hari ini aman & jujur'}
      </button>

      <p className="text-center text-xs text-neutral-400">
        Kalo sehari aja nggak diklik, progress balik ke 0. Harus jujur.
      </p>
    </div>
  );
}
