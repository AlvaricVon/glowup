import { PRAYER_NAMES } from '../lib/prayer';
import { usePrayerGate } from '../hooks/usePrayerGate';

export function SholatGate() {
  const { activeLock, confirm } = usePrayerGate();

  if (!activeLock) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-neutral-800/70 bg-neutral-900 p-6 text-center shadow-2xl">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-400">Waktu Sholat</p>
          <h2 className="text-3xl font-extrabold text-neutral-100">
            {PRAYER_NAMES[activeLock.prayerKey]}
          </h2>
          <p className="text-xs text-neutral-400">
            {activeLock.prayer.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <p className="text-sm text-neutral-400">HP lo kekunci. Belum sholat = belum bisa dipake.</p>
        <button
          type="button"
          onClick={confirm}
          className="w-full rounded-2xl bg-brand-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-brand-600 active:scale-[0.995]"
        >
          gw udah sholat {PRAYER_NAMES[activeLock.prayerKey].toLowerCase()}, wallahi
        </button>
        <p className="text-xs text-neutral-500">Konfirmasi baru buka kunci</p>
      </div>
    </div>
  );
}
