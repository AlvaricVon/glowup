import { useEffect, useState } from 'react';
import { Check, Gavel, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { nativeGetInstalledApps, nativeUninstallApp, type InstalledApp } from '../lib/lockdown';
import { CONSEQUENCE_WINDOW_DAYS, useConsequence } from '../lib/consequence';
import { useAppStore } from '../store/useAppStore';
import { formatShort, stepDay, todayKey } from '../lib/utils';

export function Consequence() {
  const history = useAppStore((s) => s.history);
  const { state, recordDeleted, restart } = useConsequence();
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const today = todayKey();
  const dates = Array.from({ length: CONSEQUENCE_WINDOW_DAYS }, (_, i) => stepDay(state.startDate, i));

  useEffect(() => {
    if (pickerDate === null) return;
    setLoading(true);
    void nativeGetInstalledApps().then((list) => {
      setApps(list);
      setLoading(false);
    });
  }, [pickerDate]);

  const rateFor = (dateKey: string): number => {
    const day = history.find((d) => d.date === dateKey);
    return day?.completionRate ?? 0;
  };

  const failedCount = dates.filter((d) => d < today && rateFor(d) < 0.999).length;
  const deletedCount = dates.filter((d) => state.days[d]).length;

  const handleDelete = async (pkg: string, label: string) => {
    const dateKey = pickerDate;
    if (!dateKey) return;
    // Buka layar uninstall sistem — user konfirmasi sendiri.
    await nativeUninstallApp(pkg);
    recordDeleted(dateKey, pkg, label);
    setPickerDate(null);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Tantangan 7 Hari
        </p>
        <div className="flex items-center gap-2">
          <Gavel size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Konsekuensi</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Gak 100% progress sehari? Hapus 1 app. Tiap hari yang gagal, satu app kena.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-red-200/70 bg-red-50/60 p-4 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <div className="text-3xl font-black text-red-600 dark:text-red-400">{failedCount}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500/80">Hari gagal</div>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 text-center dark:border-neutral-800/70 dark:bg-neutral-900/60">
          <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{deletedCount}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">App dihapus</div>
        </div>
      </div>

      <section className="space-y-2">
        {dates.map((d) => {
          const rate = rateFor(d);
          const done = rate >= 0.999;
          const isPast = d < today;
          const isToday = d === today;
          const deleted = state.days[d];
          const pct = Math.round(rate * 100);

          let status: React.ReactNode;
          let action: React.ReactNode = null;

          if (deleted) {
            status = (
              <span className="text-red-600 dark:text-red-400">
                Gagal — dihapus: <b>{deleted.label}</b>
              </span>
            );
          } else if (isToday) {
            status = done ? (
              <span className="text-brand-600 dark:text-brand-400">Hari ini 100% — aman</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">Hari ini {pct}% — belum 100%</span>
            );
          } else if (isPast) {
            status = done ? (
              <span className="text-brand-600 dark:text-brand-400">Aman ({pct}%)</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">Gagal ({pct}%) — wajib hapus 1 app</span>
            );
            if (!done) {
              action = (
                <button
                  type="button"
                  onClick={() => setPickerDate(d)}
                  className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 size={13} /> Hapus 1 app sekarang
                </button>
              );
            }
          } else {
            status = <span className="text-neutral-400">Belum lewat</span>;
          }

          return (
            <div
              key={d}
              className={`rounded-2xl border p-4 ${
                deleted || (isPast && !done)
                  ? 'border-red-200/70 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                  : done
                    ? 'border-brand-500/30 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/10'
                    : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      deleted || (isPast && !done)
                        ? 'bg-red-500 text-white'
                        : done
                          ? 'bg-brand-500 text-white'
                          : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {done && !deleted ? <Check size={14} strokeWidth={3.5} /> : <X size={14} strokeWidth={3.5} />}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatShort(d)} {isToday && <span className="text-xs text-neutral-400">(hari ini)</span>}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs font-medium">{status}</div>
              {action}
            </div>
          );
        })}
      </section>

      <button
        type="button"
        onClick={() => setResetConfirm(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <RotateCcw size={15} /> Mulai tantangan 7 hari baru
      </button>

      <p className="px-2 text-center text-[11px] text-neutral-400">
        Tantangan mulai {formatShort(state.startDate)}. Progress dihitung dari checklist harian.
      </p>

      {/* App picker */}
      {pickerDate !== null && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col animate-slide-up rounded-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">Pilih 1 app buat dihapus</h2>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Konsekuensi hari {formatShort(pickerDate)} yang gak 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerDate(null)}
                aria-label="Tutup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-neutral-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : apps.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">Gak ada app yang kebaca.</p>
              ) : (
                <div className="space-y-1.5">
                  {apps.map((a) => (
                    <button
                      key={a.package}
                      type="button"
                      onClick={() => void handleDelete(a.package, a.label)}
                      className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-left transition-colors hover:border-red-400 hover:bg-red-50/60 dark:border-neutral-700 dark:hover:border-red-500/50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={15} className="shrink-0 text-red-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {a.label}
                        </span>
                        <span className="block truncate text-[11px] text-neutral-400">{a.package}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPickerDate(null)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <X size={15} /> Batal
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={resetConfirm}
        title="Mulai tantangan baru?"
        body="Riwayat hapus app di tantangan ini bakal direset dan window 7 hari mulai dari hari ini. Yakin?"
        confirmLabel="Ya, mulai baru"
        cancelLabel="Batal"
        onConfirm={() => {
          setResetConfirm(false);
          restart();
        }}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  );
}
