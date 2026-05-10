import { useRef, useState } from 'react';
import {
  Bell,
  Download,
  Moon,
  Palette,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { exportAll } from '../lib/db';
import { ensurePermission } from '../lib/notifications';
import type { ReminderConfig } from '../lib/types';
import { downloadJSON, readFileAsText } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export function Settings() {
  const meta = useAppStore((s) => s.meta);
  const updateMeta = useAppStore((s) => s.updateMeta);
  const resetAll = useAppStore((s) => s.resetAll);
  const importPayload = useAppStore((s) => s.importPayload);

  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!meta) return null;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleExport = async () => {
    try {
      const payload = await exportAll();
      downloadJSON(payload, `glowup-backup-${payload.exportedAt.slice(0, 10)}.json`);
      flash('Berhasil export ✓');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal export');
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text);
      await importPayload(data);
      flash('Berhasil import ✓');
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Gagal import');
    }
    setImporting(false);
  };

  const handleReset = async () => {
    setConfirm1(false);
    setConfirm2(false);
    await resetAll();
    flash('Semua data udah di-reset');
  };

  const setReminder = (id: string, patch: Partial<ReminderConfig>) => {
    void updateMeta({
      reminders: meta.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const askNotif = async () => {
    const result = await ensurePermission();
    void updateMeta({ notificationsEnabled: result === 'granted' });
    flash(result === 'granted' ? 'Notifikasi aktif ✓' : 'Notifikasi ditolak');
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Settings</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Atur reminder, theme, sama data lo.</p>
      </header>

      {/* Profile */}
      <Section title="Profile">
        <Row label="Nama">
          <input
            value={meta.userName}
            onChange={(e) => void updateMeta({ userName: e.target.value })}
            className="w-32 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-right text-sm font-semibold text-neutral-900 outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </Row>
      </Section>

      {/* Theme */}
      <Section title="Tampilan">
        <Row
          icon={<Palette size={16} />}
          label="Theme"
          hint={meta.theme === 'auto' ? 'Ikut sistem' : meta.theme === 'dark' ? 'Dark' : 'Light'}
        >
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
            {(['light', 'auto', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => void updateMeta({ theme: t })}
                className={`rounded-lg p-1.5 text-xs font-semibold ${
                  meta.theme === t
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500'
                }`}
                aria-label={t}
              >
                {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : 'auto'}
              </button>
            ))}
          </div>
        </Row>
        <Row
          icon={meta.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          label="Sound notifikasi"
        >
          <Toggle
            value={meta.soundEnabled}
            onChange={(v) => void updateMeta({ soundEnabled: v })}
          />
        </Row>
      </Section>

      {/* Notifications */}
      <Section
        title="Notifikasi"
        right={
          <button
            type="button"
            onClick={askNotif}
            className="rounded-lg bg-brand-500/10 px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-500/20 dark:text-brand-400"
          >
            {meta.notificationsEnabled ? 'Aktif' : 'Aktifin'}
          </button>
        }
      >
        <p className="mb-3 px-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Reminder fire pas app/SW alive. Buat reliability max, install ke home screen biar SW tetep
          jalan di background.
        </p>
        <div className="space-y-1">
          {meta.reminders.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 odd:bg-neutral-50/50 dark:odd:bg-neutral-800/30"
            >
              <Bell size={14} className="text-neutral-400" />
              <span className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">{r.label}</span>
              <input
                type="time"
                value={r.time}
                onChange={(e) => setReminder(r.id, { time: e.target.value })}
                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs tabular-nums dark:border-neutral-700 dark:bg-neutral-900"
              />
              <Toggle value={r.enabled} onChange={(v) => setReminder(r.id, { enabled: v })} />
            </div>
          ))}
        </div>
      </Section>

      {/* Data */}
      <Section title="Data">
        <ButtonRow icon={<Download size={16} />} label="Export data" onClick={handleExport} />
        <ButtonRow
          icon={<Upload size={16} />}
          label={importing ? 'Importing...' : 'Import data'}
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
            e.target.value = '';
          }}
        />
        <ButtonRow
          icon={<RefreshCw size={16} />}
          label="Reset semua data"
          danger
          onClick={() => setConfirm1(true)}
        />
      </Section>

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">
        GlowUp v1.0 · local-first · made with intention
      </p>

      <ConfirmModal
        open={confirm1}
        title="Reset semua data?"
        body="Ini bakal hapus SEMUA progress, streak, dan history lo. Action ini gak bisa di-undo. Yakin?"
        confirmLabel="Lanjut"
        onConfirm={() => {
          setConfirm1(false);
          setConfirm2(true);
        }}
        onCancel={() => setConfirm1(false)}
      />
      <ConfirmModal
        open={confirm2}
        title="Beneran yakin nih?"
        body="Last call. Pencet Hapus = semua hilang. Atau Batal kalo masih ragu."
        confirmLabel="Hapus"
        onConfirm={handleReset}
        onCancel={() => setConfirm2(false)}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between px-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
          {title}
        </h2>
        {right}
      </div>
      <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-2 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  hint,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      {icon && <span className="text-neutral-500">{icon}</span>}
      <div className="flex-1">
        <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
        {hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ButtonRow({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-500/10 dark:text-red-400'
          : 'text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
      }`}
    >
      {icon}
      {label}
      {danger && <Trash2 size={14} className="ml-auto" />}
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        value ? 'bg-brand-500' : 'bg-neutral-300 dark:bg-neutral-700'
      }`}
      aria-pressed={value}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          value ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}
