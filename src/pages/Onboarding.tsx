import { useState } from 'react';
import { ArrowRight, Bell, BellOff, Check, Flame, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ensurePermission } from '../lib/notifications';

const STEPS = ['welcome', 'name', 'about', 'notif', 'go'] as const;
type Step = (typeof STEPS)[number];

export function Onboarding() {
  const finish = useAppStore((s) => s.finishOnboarding);
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [notifGranted, setNotifGranted] = useState(false);
  const [busy, setBusy] = useState(false);

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };

  const handleAskNotif = async () => {
    setBusy(true);
    const result = await ensurePermission();
    setBusy(false);
    setNotifGranted(result === 'granted');
    next();
  };

  const handleStart = async () => {
    setBusy(true);
    await finish(name, notifGranted);
    setBusy(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-50 to-white px-6 py-8 dark:from-neutral-950 dark:to-neutral-900">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                STEPS.indexOf(step) >= i ? 'bg-brand-500' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          {step === 'welcome' && (
            <div className="animate-fade-in text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-xl shadow-brand-500/30">
                <span className="text-5xl font-extrabold text-white">G</span>
              </div>
              <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">GlowUp</h1>
              <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
                Tracker harian buat program self-improvement lo. Local-first. Offline. Privacy by default.
              </p>
              <button
                type="button"
                onClick={next}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600"
              >
                Mulai <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'name' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Nama lo siapa?</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Buat sapa lo tiap buka app. Bisa nama panggilan / nickname.
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Kamil"
                className="mt-5 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <button
                type="button"
                onClick={next}
                disabled={!name.trim()}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 disabled:opacity-40"
              >
                Lanjut <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'about' && (
            <div className="animate-fade-in">
              <Sparkles className="mb-3 text-brand-500" size={32} />
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                Cara pake-nya
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
                <li className="flex gap-3">
                  <Check className="mt-0.5 shrink-0 text-brand-500" size={18} />
                  <span>Tiap pagi buka app, centangin habit yang udah lo lakuin.</span>
                </li>
                <li className="flex gap-3">
                  <Flame className="mt-0.5 shrink-0 text-brand-500" size={18} />
                  <span>
                    Selesain min 80% habit harian buat ngejaga streak. Ada freeze 1x/minggu kalo bolong.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check className="mt-0.5 shrink-0 text-brand-500" size={18} />
                  <span>Data semua di HP lo. Gak ada server, gak ada login. Aman.</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={next}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600"
              >
                OK gas <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 'notif' && (
            <div className="animate-fade-in">
              <Bell className="mb-3 text-brand-500" size={32} />
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                Reminder buat sholat & workout?
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Default ke jadwal sholat Jakarta. Nanti bisa lo atur di Settings.
              </p>
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={handleAskNotif}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 disabled:opacity-50"
                >
                  <Bell size={18} /> Aktifin notifikasi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotifGranted(false);
                    next();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <BellOff size={16} /> Skip dulu
                </button>
              </div>
            </div>
          )}

          {step === 'go' && (
            <div className="animate-fade-in text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <Flame size={36} />
              </div>
              <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                Siap, {name || 'kamu'}.
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Bismillah. 1% lebih baik tiap hari.
              </p>
              <button
                type="button"
                onClick={handleStart}
                disabled={busy}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 disabled:opacity-50"
              >
                Bismillah, mulai!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
