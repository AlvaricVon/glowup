import { useState } from 'react';
import { Flame, RotateCcw, ShieldCheck, Swords, TriangleAlert, Trophy, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { nativeOpenApp } from '../lib/lockdown';
import { REBOOT_ALTS, REBOOT_GOAL_DAYS, REBOOT_MILESTONES, useReboot } from '../lib/reboot';
import { formatPretty } from '../lib/utils';

export function NoPorn() {
  const { state, days, relapse, beatUrge, reset } = useReboot();
  const [urgeOpen, setUrgeOpen] = useState(false);
  const [relapseConfirm, setRelapseConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const pct = Math.min(100, Math.round((days / REBOOT_GOAL_DAYS) * 100));
  const nextMilestone = REBOOT_MILESTONES.find((m) => m > days) ?? REBOOT_GOAL_DAYS;

  const launchAlt = (pkg?: string) => () => {
    if (pkg) void nativeOpenApp(pkg);
    beatUrge(pkg ?? undefined);
    setUrgeOpen(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Program 6 Bulan
        </p>
        <div className="flex items-center gap-2">
          <ShieldCheck size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Bebas Porn</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ganti porn sama: main game, tidur, makan, Spotify, Voskhod. Target 6 bulan bersih.
        </p>
      </header>

      {/* Counter hari bersih */}
      <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-50 to-cream-50 p-5 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-neutral-900">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <Flame size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Hari bersih</span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl font-black leading-none text-neutral-900 dark:text-neutral-100">{days}</span>
          <span className="pb-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">hari</span>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            <span>Hari ke-{days} dari {REBOOT_GOAL_DAYS}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-400">Milestone berikut: {nextMilestone} hari</p>
        </div>
      </div>

      {/* Actions */}
      <button
        type="button"
        onClick={() => setUrgeOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-brand-600 active:scale-[0.99]"
      >
        <Swords size={18} />
        Gw lagi pengen — alihin sekarang
      </button>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Relapse">{state.relapseCount}</Stat>
        <Stat label="Urge dilewatin">{state.urgesBeaten.length}</Stat>
        <Stat label="Mulai">
          <span className="text-sm font-bold">{formatPretty(state.startDate).split(',')[0]}</span>
        </Stat>
      </div>

      {/* Milestones */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-neutral-100">
          <Trophy size={15} className="text-amber-500" /> Milestone
        </div>
        <div className="flex flex-wrap gap-2">
          {REBOOT_MILESTONES.map((m) => {
            const done = days >= m;
            return (
              <span
                key={m}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  done
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    : 'border border-neutral-200 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500'
                }`}
              >
                {done ? '★' : '·'} {m} hari
              </span>
            );
          })}
        </div>
      </section>

      {/* Danger zone */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRelapseConfirm(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <TriangleAlert size={15} /> Gw relapse (jujur)
        </button>
        <button
          type="button"
          onClick={() => setResetConfirm(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>

      <p className="px-2 text-center text-[11px] text-neutral-400">
        Jujur itu bagian dari proses. Relapse bukan akhir — mulai lagi dari hari 0.
      </p>

      {/* Urge modal */}
      {urgeOpen && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md animate-slide-up rounded-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                  Pilih penggantinya
                </h2>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Jangan dilawan kosong — alihin. Pilih satu, langsung lakuin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUrgeOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {REBOOT_ALTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={launchAlt(a.pkg)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/60 dark:border-neutral-700 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">{a.label}</span>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">{a.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                beatUrge();
                setUrgeOpen(false);
              }}
              className="mt-4 w-full rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
            >
              Gw udah lewatin keinginannya ✓
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={relapseConfirm}
        title="Relapse? Jujur ya"
        body="Waktu bersih bakal balik ke 0. Ini bukan buat nyalahin diri — ini catatan biar ketauan pemicunya. Lanjut lagi dari hari 0. Yakin mau catat relapse?"
        confirmLabel="Ya, gw relapse"
        cancelLabel="Batal"
        onConfirm={() => {
          setRelapseConfirm(false);
          relapse();
        }}
        onCancel={() => setRelapseConfirm(false)}
      />

      <ConfirmModal
        open={resetConfirm}
        title="Reset program?"
        body="Semua data (hari bersih, relapse, log urge) bakal dihapus dan mulai dari hari 0. Yakin?"
        confirmLabel="Ya, reset"
        cancelLabel="Batal"
        onConfirm={() => {
          setResetConfirm(false);
          reset();
        }}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-3 text-center dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <div className="text-lg font-black text-neutral-900 dark:text-neutral-100">{children}</div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
    </div>
  );
}
