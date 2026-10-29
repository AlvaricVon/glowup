import { AlertTriangle, RotateCcw, ShieldOff } from 'lucide-react';
import { useRehab } from '../lib/rehab90';
import { todayKey } from '../lib/utils';

const RULES = [
  'Jaga batasan pribadi',
  'Makan sesuai budget yang udah disisain. Kalo ada keperluan, potong dari uang makan, sisanya ditabung buat wishlist',
  'No scrolling sosmed kecuali liat postingan yang udah lo save',
];

export function Rehab90() {
  const { state, markFail, restartFresh } = useRehab();
  const today = todayKey();
  const alreadyActed = state.lastActionDate === today;
  const pct = Math.min(100, Math.round((state.streak / state.targetDays) * 100));

  if (state.enabled === false && state.completedAt) {
    // Sudah kelar 90 hari -> balikin normal via logic App
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          FOKUS HILANGIN HABIT BURUK
        </p>
        <div className="flex items-center gap-2">
          <ShieldOff size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Rehab 90 Hari</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Cuma fokus ke 4 hal di bawah. 1 tombol gagal aja.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/70 p-5 text-center dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="text-5xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
          {state.streak}
          <span className="text-2xl font-bold text-neutral-400"> / {state.targetDays}</span>
        </div>
        <div className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Hari aman berturut-turut</div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-xs text-neutral-400">{pct}%</div>
      </section>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Aturan</div>
        <ul className="space-y-2">
          {RULES.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={markFail}
          disabled={alreadyActed}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-colors ${
            alreadyActed
              ? 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600'
              : 'bg-red-600 text-white active:bg-red-700'
          }`}
        >
          <AlertTriangle size={18} />
          {alreadyActed ? 'Udah dicatat buat hari ini' : 'Aku gagal hari ini'}
        </button>
        <p className="text-center text-xs text-neutral-400">
          Kalo kamu gagal -&gt; streak reset jadi 0, mulai dari awal lagi.
        </p>
      </section>

      {state.history.length > 0 && (
        <section className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
          <div className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Riwayat</div>
          <ul className="space-y-1.5">
            {state.history.slice(0, 14).map((h, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">{h.date}</span>
                <span className={`font-semibold ${h.status === 'ok' ? 'text-brand-600 dark:text-brand-400' : 'text-red-500'}`}>
                  {h.status === 'ok' ? 'AMAN' : 'GAGAL'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        type="button"
        onClick={restartFresh}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <RotateCcw size={15} /> Mulai ulang dari 0
      </button>
    </div>
  );
}
