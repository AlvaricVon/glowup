import { useEffect, useState } from 'react';
import { Check, Gavel, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { nativeGetInstalledApps, nativeUninstallApp, type InstalledApp } from '../lib/lockdown';
import { CONSEQUENCE_ITEMS, CONSEQUENCE_WINDOW_DAYS, useConsequence } from '../lib/consequence';
import { useAppStore } from '../store/useAppStore';
import { formatShort, stepDay, todayKey } from '../lib/utils';

export function Consequence() {
  const history = useAppStore((s) => s.history);
  const { state, toggleItem, recordDeleted, restart } = useConsequence();
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
  const deletedCount = dates.filter((d) => state.days[d]?.deleted).length;

  const handleDelete = async (pkg: string, label: string) => {
    const dateKey = pickerDate;
    if (!dateKey) return;
    // Buka layar uninstall sistem — user konfirmasi sendiri.
    await nativeUninstallApp(pkg);
    recordDeleted(dateKey, pkg, label, new Date().toISOString());
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
          Gak 100% progress sehari? Wajib kelarin 3 konsekuensi: hapus 1 app, 100 push up non stop, mandi
          malam jam 20:30 ke atas.
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
          const outcome = state.days[d];
          const pct = Math.round(rate * 100);

          if (outcome?.deleted || (isPast && !done)) {
            const doneCount = CONSEQUENCE_ITEMS.filter((it) => outcome?.done?.[it.id]).length;
            const allDone = doneCount >= CONSEQUENCE_ITEMS.length;
            return (
              <div
                key={d}
                className={`rounded-2xl border p-4 ${
                  allDone
                    ? 'border-brand-500/30 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/10'
                    : 'border-red-200/70 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      allDone ? 'bg-brand-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {allDone ? <Check size={14} strokeWidth={3.5} /> : <X size={14} strokeWidth={3.5} />}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatShort(d)}
                  </span>
                  <span className="ml-auto text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                    {doneCount}/{CONSEQUENCE_ITEMS.length} beres
                  </span>
                </div>
                <p className={`mt-1 text-xs font-medium ${allDone ? 'text-brand-600 dark:text-brand-400' : 'text-red-600 dark:text-red-400'}`}>
                  {allDone ? 'Semua konsekuensi kelar' : `Gagal (${pct}%) — wajib kelarin:`}
                </p>

                <div className="mt-3 space-y-2">
                  {CONSEQUENCE_ITEMS.map((it) => {
                    const itemDone = outcome?.done?.[it.id] ?? false;

                    if (it.id === 'delete-app') {
                      const dRec = outcome?.deleted;
                      return (
                        <div
                          key={it.id}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                            itemDone
                              ? 'border-brand-500/30 bg-brand-50/70 dark:border-brand-500/20 dark:bg-brand-500/10'
                              : 'border-neutral-200 bg-white/70 dark:border-neutral-700 dark:bg-neutral-900/60'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                              itemDone ? 'bg-brand-500 text-white' : 'bg-neutral-300 dark:bg-neutral-700'
                            }`}
                          >
                            {itemDone && <Check size={12} strokeWidth={3.5} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {it.label}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {dRec ? `Dihapus: ${dRec.label}` : it.desc}
                            </div>
                          </div>
                          {!itemDone && (
                            <button
                              type="button"
                              onClick={() => setPickerDate(d)}
                              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                            >
                              <Trash2 size={13} /> Hapus
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => toggleItem(d, it.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          itemDone
                            ? 'border-brand-500/30 bg-brand-50/70 dark:border-brand-500/20 dark:bg-brand-500/10'
                            : 'border-neutral-200 bg-white/70 hover:border-brand-400 dark:border-neutral-700 dark:bg-neutral-900/60 dark:hover:border-brand-500/50'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                            itemDone ? 'bg-brand-500 text-white' : 'bg-neutral-300 dark:bg-neutral-700'
                          }`}
                        >
                          {itemDone && <Check size={12} strokeWidth={3.5} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-semibold ${
                              itemDone
                                ? 'text-neutral-500 line-through decoration-brand-500/40 dark:text-neutral-500'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {it.label}
                          </span>
                          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">{it.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div
              key={d}
              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                done
                  ? 'border-brand-500/30 bg-brand-50/60 dark:border-brand-500/20 dark:bg-brand-500/10'
                  : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-brand-500 text-white' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {done ? <Check size={14} strokeWidth={3.5} /> : <X size={14} strokeWidth={3.5} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatShort(d)} {isToday && <span className="text-xs text-neutral-400">(hari ini)</span>}
                </div>
                <div className={`text-xs font-medium ${done ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400'}`}>
                  {isToday
                    ? done
                      ? 'Hari ini 100% — aman'
                      : `Hari ini ${pct}% — belum 100%`
                    : done
                      ? `Aman (${pct}%)`
                      : 'Belum lewat'}
                </div>
              </div>
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
                      <Trash2 size={16} className="shrink-0 text-red-500" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{a.label}</span>
                        <span className="block text-[11px] text-neutral-400">{a.package}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPickerDate(null)}
              className="mt-4 rounded-2xl border border-neutral-200 py-3 text-sm font-bold text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={resetConfirm}
        title="Mulai tantangan 7 hari baru"
        body="Catatan hari-hari di tantangan sekarang bakal dihapus, mulai dari hari ini lagi. Yakin?"
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
