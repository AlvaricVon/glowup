import { useEffect, useMemo } from 'react';
import { stopAdhan } from '../lib/adhanAudio';
import { PRAYER_NAMES } from '../lib/prayer';
import { usePrayerGate } from '../hooks/usePrayerGate';

export function SholatGate() {
  const { activeLock, now, confirm } = usePrayerGate();

  useEffect(() => {
    if (!activeLock) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [activeLock]);

  const remaining = useMemo(() => {
    if (!activeLock || !activeLock.endsAt) return null;
    const diff = Math.max(0, Math.floor((activeLock.endsAt - now.getTime()) / 1000));
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return diff === 0 ? '00:00' : m + ':' + s;
  }, [activeLock, now]);

  if (!activeLock) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/95 p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-neutral-800/70 bg-neutral-900/90 p-6 text-center shadow-2xl backdrop-blur-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-400">Waktu Sholat</p>
          <h2 className="text-3xl font-extrabold text-neutral-100">{PRAYER_NAMES[activeLock.prayerKey]}</h2>
          <p className="text-xs text-neutral-400">
            {activeLock.prayer.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {remaining && (
          <div className="text-5xl font-bold tabular-nums text-neutral-100">{remaining}</div>
        )}
        <button
          type="button"
          onClick={confirm}
          className="w-full rounded-2xl bg-brand-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-brand-600 active:scale-[0.995]"
        >
          gw udah sholat {PRAYER_NAMES[activeLock.prayerKey].toLowerCase()}, wallahi
        </button>
        <p className="text-xs text-neutral-500">Gate akan tertutup otomatis setelah lo konfirmasi</p>
      </div>
    </div>
  );
}

