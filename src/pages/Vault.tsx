import { useEffect, useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ScanFace,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  avatarColor,
  generatePassword,
  generateVaultId,
  passwordStrength,
  type VaultEntry,
} from '../lib/vault';
import {
  authenticateBiometric,
  clearStoredCredential,
  getStoredCredentialId,
  isPlatformAuthAvailable,
  isSecureContext,
  isWebAuthnSupported,
  registerBiometric,
} from '../lib/webauthn';

const STORAGE_KEY = 'glowup-vault';

function maskPassword(pw: string): string {
  return '•'.repeat(Math.max(6, Math.min(18, pw.length)));
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

const STRENGTH_DOTS = ['bg-red-500', 'bg-amber-500', 'bg-brand-500', 'bg-emerald-500'];
const STRENGTH_CHIPS = [
  'bg-red-500/10 text-red-600 dark:text-red-400',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
];

function VaultHeader({ count, locked, onLock }: { count: number; locked: boolean; onLock?: () => void }) {
  return (
    <header className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
        Manajemen Password
      </p>
      <div className="flex items-center gap-2">
        <KeyRound size={28} className="shrink-0 text-brand-500" />
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Vault</h1>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {count}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {locked ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={12} />
              Terkunci biometrik
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <ShieldAlert size={12} />
              Tanpa kunci
            </span>
          )}
          {locked && onLock && (
            <button
              type="button"
              onClick={onLock}
              aria-label="Kunci sekarang"
              title="Kunci sekarang"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            >
              <Lock size={14} />
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Simpan &amp; kelola password, cuma di perangkat kamu.
      </p>
    </header>
  );
}

function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100 ${mono ? 'font-mono' : ''}`}
      />
    </label>
  );
}

function StrengthBar({ value }: { value: string }) {
  const strength = passwordStrength(value);
  const width = value ? Math.min(100, 20 + value.length * 4) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
        <div className={`h-full ${strength.color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-neutral-500">{value ? strength.label : ''}</span>
    </div>
  );
}

export function Vault({ active = true }: { active?: boolean }) {
  const [entries, setEntries] = useLocalStorage<VaultEntry[]>(STORAGE_KEY, []);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  // Generator state
  const [genLen, setGenLen] = useState(18);
  const [genUpper, setGenUpper] = useState(true);
  const [genNums, setGenNums] = useState(true);
  const [genSyms, setGenSyms] = useState(true);
  const [genPool, setGenPool] = useState('');

  // 🔐 Kunci biometrik (WebAuthn: sidik jari / wajah / PIN perangkat)
  const [credId, setCredId] = useState<string | null>(() => getStoredCredentialId());
  const [unlocked, setUnlocked] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [bioCapable, setBioCapable] = useState<boolean | null>(null);
  const secureOk = isSecureContext();
  const webAuthnOk = isWebAuthnSupported();

  const refreshGen = () => {
    setGenPool(generatePassword({ length: genLen, upper: genUpper, numbers: genNums, symbols: genSyms }));
  };

  // Cek apakah perangkat punya sensor biometrik platform (sidik jari / wajah).
  useEffect(() => {
    let alive = true;
    void isPlatformAuthAvailable().then((v) => {
      if (alive) setBioCapable(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Kunci otomatis setiap Vault dibuka / ditutup & setiap kredensial berubah.
  // Artinya: tiap masuk Vault selalu lewat verifikasi dulu kalau biometrik aktif.
  useEffect(() => {
    if (active) setCredId(getStoredCredentialId());
    setUnlocked(false);
    setRevealed([]);
    setFormOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Kunci otomatis juga kalau tab / aplikasi disembunyikan.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        setUnlocked(false);
        setRevealed([]);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (formOpen && !genPool) refreshGen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash('Copy ✓');
    } catch {
      flash('Copy gagal');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setUsername('');
    setPassword('');
    setNotes('');
    setGenOpen(false);
    setFormOpen(true);
    window.setTimeout(() => {
      document.getElementById('vault-form-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const startEdit = (e: VaultEntry) => {
    setEditingId(e.id);
    setTitle(e.title);
    setUsername(e.username);
    setPassword(e.password);
    setNotes(e.notes ?? '');
    setFormOpen(true);
    window.setTimeout(() => {
      document.getElementById('vault-form-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setGenOpen(false);
  };

  const saveEntry = () => {
    const t = title.trim();
    if (!t) return;
    const now = new Date().toISOString();
    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, title: t, username: username.trim(), password, notes: notes.trim(), updatedAt: now }
            : e,
        ),
      );
    } else {
      setEntries((prev) => [
        ...prev,
        { id: generateVaultId(), title: t, username: username.trim(), password, notes: notes.trim(), createdAt: now, updatedAt: now },
      ]);
    }
    flash(editingId ? 'Simpan ✓' : 'Tambah ✓');
    closeForm();
    setExpanded((prev) => (editingId && !prev.includes(editingId) ? [...prev, editingId] : prev));
  };

  const toggleReveal = (id: string) => {
    setRevealed((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const askDelete = (id: string) => setConfirmId(id);

  const doDelete = () => {
    if (!confirmId) return;
    setEntries((prev) => prev.filter((e) => e.id !== confirmId));
    setRevealed((prev) => prev.filter((r) => r !== confirmId));
    setExpanded((prev) => prev.filter((x) => x !== confirmId));
    setConfirmId(null);
    flash('Hapus ✓');
  };

  const handleUnlock = async () => {
    if (!credId) return;
    setGateBusy(true);
    setGateMsg(null);
    try {
      await authenticateBiometric(credId);
      setUnlocked(true);
    } catch (e) {
      setGateMsg(e instanceof Error ? e.message : 'Verifikasi gagal, coba lagi ya.');
    } finally {
      setGateBusy(false);
    }
  };

  const handleRegister = async () => {
    setGateBusy(true);
    setGateMsg(null);
    try {
      const id = await registerBiometric();
      setCredId(id);
      flash('Biometrik aktif ✓');
      // Verifikasi sekali biar yakin, terus langsung masuk.
      await authenticateBiometric(id);
      setUnlocked(true);
    } catch (e) {
      setGateMsg(e instanceof Error ? e.message : 'Pendaftaran gagal, coba lagi ya.');
    } finally {
      setGateBusy(false);
    }
  };

  const handleDisableBio = () => {
    clearStoredCredential();
    setCredId(null);
    setGateMsg(null);
    flash('Kunci biometrik dimatikan');
  };

  const handleLockNow = () => {
    setRevealed([]);
    setFormOpen(false);
    setUnlocked(false);
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? entries.filter((e) => `${e.title} ${e.username} ${e.notes ?? ''}`.toLowerCase().includes(q))
    : entries;
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  const needsGate = !!credId && !unlocked;
  const confirmEntry = confirmId ? entries.find((e) => e.id === confirmId) : undefined;

  const toggleChip = (label: string, on: boolean, set: (v: boolean) => void) => (
    <button
      type="button"
      onClick={() => set(!on)}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
        on
          ? 'bg-brand-500 text-white'
          : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="opacity-60">{label}</span> {on ? 'On' : 'Off'}
    </button>
  );

  const lockCard = (
    <div className="animate-slide-up rounded-3xl border border-neutral-200/80 bg-white/80 p-6 text-center shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900/70">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 dark:text-brand-400">
        {bioCapable === false ? <Lock size={38} /> : <Fingerprint size={42} />}
      </div>
      <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">Vault Terkunci</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
        {bioCapable === false
          ? 'Perangkat ini sepertinya tidak punya sensor sidik jari / wajah, tapi kunci tetap aktif. Verifikasi dengan PIN perangkat untuk buka.'
          : 'Buka dengan sidik jari, wajah, atau PIN perangkat kamu untuk masuk.'}
      </p>
      {!secureOk && (
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Kamu lagi buka lewat koneksi non-aman — browser memblokir biometrik. Buka lewat HTTPS atau localhost biar bisa verifikasi.
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleUnlock()}
        disabled={gateBusy || !secureOk}
        className="mx-auto mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
      >
        {gateBusy ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <Fingerprint size={18} />
        )}
        {gateBusy ? 'Memverifikasi...' : 'Buka dengan biometrik'}
      </button>
      {gateMsg && (
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {gateMsg}
        </p>
      )}
      <button
        type="button"
        onClick={handleDisableBio}
        className="mt-4 text-xs font-semibold text-neutral-400 underline-offset-2 transition-colors hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
      >
        Matikan kunci biometrik
      </button>
    </div>
  );

  const registerCard = (
    <div className="animate-slide-up rounded-3xl border border-neutral-200/80 bg-white/80 p-6 text-center shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900/70">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 dark:text-brand-400">
        {bioCapable === false ? <ShieldAlert size={38} /> : <ScanFace size={40} />}
      </div>
      <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">Amankan Vault kamu</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
        Daftarin sidik jari / wajah / PIN perangkat sekali aja — setelah itu tiap buka Vault harus verifikasi dulu.
      </p>
      {!webAuthnOk && (
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
          Browser ini tidak mendukung kunci biometrik (WebAuthn). Update browser atau pakai Chrome / Edge / Safari terbaru.
        </p>
      )}
      {webAuthnOk && !secureOk && (
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Biometrik butuh koneksi aman — buka lewat HTTPS atau localhost untuk daftar.
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleRegister()}
        disabled={gateBusy || !webAuthnOk || !secureOk}
        className="mx-auto mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
      >
        {gateBusy ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <Fingerprint size={18} />
        )}
        {gateBusy ? 'Mendaftarkan...' : 'Aktifkan sidik jari / wajah'}
      </button>
      {gateMsg && (
        <p className="mx-auto mt-3 max-w-xs rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {gateMsg}
        </p>
      )}
      <div className="mx-auto mt-4 flex max-w-xs items-start gap-2 rounded-xl bg-neutral-100/70 px-3 py-2.5 text-left dark:bg-neutral-950/60">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Tanpa server, tanpa password tambahan. Kunci cuma di perangkat ini — kalau ganti browser / HP, daftar ulang lagi.
        </p>
      </div>
    </div>
  );

  // ── 🔐 Gate: kunci / registrasi biometrik ──────────────────
  if (needsGate) {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
        <VaultHeader count={entries.length} locked={!!credId} />
        {lockCard}
        <p className="px-2 text-center text-[11px] text-neutral-400">
          Voskhod Vault · Kunci tersimpan di perangkat ini aja
        </p>
        {toast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
            {toast}
          </div>
        )}
      </div>
    );
  }

  if (!credId) {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
        <VaultHeader count={entries.length} locked={false} />
        {registerCard}
        <p className="px-2 text-center text-[11px] text-neutral-400">
          Voskhod Vault · Disimpan hanya di perangkat kamu
        </p>
        {toast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
            {toast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <VaultHeader count={entries.length} locked={!!credId} onLock={credId ? handleLockNow : undefined} />

      {/* Search + add */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari password..."
            className="w-full rounded-xl border border-neutral-200 bg-cream-50 py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
          />
        </div>
        <button
          type="button"
          onClick={formOpen ? closeForm : openAdd}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
            formOpen
              ? 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />}
          {formOpen ? 'Batal' : 'Tambah'}
        </button>
      </div>

      {/* Add / edit form */}
      {formOpen && (
        <div id="vault-form-top" className="animate-slide-up scroll-mt-24 space-y-3 rounded-2xl border border-brand-200/70 bg-white p-4 shadow-sm dark:border-brand-900/40 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              {editingId ? <Pencil size={16} /> : <Plus size={16} />}
            </span>
            <p className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
              {editingId ? 'Edit password' : 'Password baru'}
            </p>
          </div>
          <FormField label="Nama / website" value={title} onChange={setTitle} placeholder="e.g. Gmail, GitHub, Netflix" />
          <FormField label="Username / email" value={username} onChange={setUsername} placeholder="email@example.com" />
          <FormField label="Password" type="text" value={password} onChange={setPassword} placeholder="••••••••" mono />
          <StrengthBar value={password} />
          <FormField label="Catatan (opsional)" value={notes} onChange={setNotes} placeholder="Kode OTP, pertanyaan keamanan, dll..." />

          {/* Generator — collapsible biar form tetap pendek */}
          <div className="overflow-hidden rounded-xl border border-neutral-200/70 bg-brand-50/70 dark:border-neutral-800/60 dark:bg-neutral-950/60">
            <button
              type="button"
              onClick={() => setGenOpen((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
            >
              <Wand2 size={14} className="shrink-0 text-brand-500" />
              <span className="flex-1 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Generator password
              </span>
              <ChevronDown size={15} className={`shrink-0 text-neutral-400 transition-transform ${genOpen ? 'rotate-180' : ''}`} />
            </button>
            {genOpen && (
              <div className="space-y-2 border-t border-neutral-200/70 px-3 py-3 dark:border-neutral-800/60">
                <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 dark:bg-neutral-900">
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-neutral-900 dark:text-neutral-100">{genPool}</span>
                  <button type="button" onClick={refreshGen} aria-label="Generate baru" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400">
                    <RefreshCw size={14} />
                  </button>
                  <button type="button" onClick={() => void copy(genPool)} aria-label="Copy hasil generate" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Panjang <strong className="tabular-nums text-neutral-800 dark:text-neutral-100">{genLen}</strong>
                  </span>
                  <input type="range" min={8} max={32} value={genLen} onChange={(e) => { setGenLen(Number(e.target.value)); refreshGen(); }} className="min-w-0 flex-1 accent-brand-500" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {toggleChip('ABC', genUpper, setGenUpper)}
                  {toggleChip('123', genNums, setGenNums)}
                  {toggleChip('#$!', genSyms, setGenSyms)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const pw = generatePassword({ length: genLen, upper: genUpper, numbers: genNums, symbols: genSyms });
                    setPassword(pw);
                    setGenPool(pw);
                    flash('Password kepakai ✓');
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                >
                  <Sparkles size={13} />
                  Pakai password ini
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={saveEntry} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
              <Save size={15} />
              {editingId ? 'Simpan' : 'Tambah'}
            </button>
            <button type="button" onClick={closeForm} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
              <X size={15} />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={entries.length === 0 ? 'Belum ada password' : 'Nggak ada hasil'}
          body={entries.length === 0 ? 'Tambah password pertamamu, atau pakai generator buat bikin kata sandi yang kuat.' : 'Nggak ada yang cocok dengan kata kunci kamu.'}
          cta={formOpen ? undefined : { label: 'Tambah password', onClick: openAdd }}
        />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((e) => {
            const isOpen = revealed.includes(e.id);
            const isWide = expanded.includes(e.id);
            const editing = editingId === e.id && formOpen;
            const strength = passwordStrength(e.password);
            return (
              <div
                key={e.id}
                className={`rounded-2xl border transition-all ${
                  editing
                    ? 'border-brand-300 bg-white shadow-sm dark:border-brand-700 dark:bg-neutral-900'
                    : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
                }`}
              >
                {/* Baris utama: selalu pendek & konsisten — tap buat bentangin */}
                <button
                  type="button"
                  onClick={() => toggleExpand(e.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                  aria-expanded={isWide}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarColor(e.title)}`}>
                    {e.title.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">{e.title}</span>
                    <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{e.username || 'Tanpa username'}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5" title={`Kekuatan: ${strength.label}`}>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-1.5 w-3.5 rounded-full ${i <= strength.score ? STRENGTH_DOTS[strength.score] : 'bg-neutral-200 dark:bg-neutral-700'}`} />
                    ))}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-neutral-400 transition-transform ${isWide ? 'rotate-180' : ''}`} />
                </button>
                {/* Detail: cuma kelihatan kalau dibentangin */}
                {isWide && (
                  <div className="animate-slide-up space-y-2.5 border-t border-neutral-100 px-3 py-3 dark:border-neutral-800/60">
                    <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100/70 px-2.5 py-2 dark:bg-neutral-950/60">
                      <span className={`min-w-0 flex-1 truncate font-mono text-[13px] ${isOpen ? 'text-neutral-800 dark:text-neutral-100' : 'text-neutral-400'}`}>
                        {isOpen ? e.password : maskPassword(e.password)}
                      </span>
                      <button type="button" aria-label={isOpen ? 'Sembunyikan' : 'Tampilkan'} onClick={() => toggleReveal(e.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                        {isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button type="button" aria-label="Copy password" title="Copy password" onClick={() => void copy(e.password)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                        <Copy size={14} />
                      </button>
                    </div>
                    {e.username && (
                      <button
                        type="button"
                        onClick={() => void copy(e.username)}
                        title="Tap buat copy username"
                        className="flex w-full items-center gap-1.5 rounded-xl border border-neutral-200/60 px-2.5 py-2 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/40"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-300">{e.username}</span>
                        <Copy size={13} className="shrink-0 text-neutral-400" />
                      </button>
                    )}
                    {/* Info: kekuatan + tanggal update */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STRENGTH_CHIPS[strength.score]}`}>
                        {strength.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <CalendarClock size={11} />
                        {formatDate(e.updatedAt)}
                      </span>
                    </div>
                    {e.notes && (
                      <p className="break-words text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{e.notes}</p>
                    )}
                    {/* Aksi: satu baris horizontal — hemat tempat */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button type="button" onClick={() => void copy(e.username)} disabled={!e.username} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 py-1.5 text-[11px] font-bold text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                        <Copy size={12} />
                        User
                      </button>
                      <button type="button" onClick={() => void copy(e.password)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-200 py-1.5 text-[11px] font-bold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                        <Copy size={12} />
                        Pass
                      </button>
                      <button type="button" aria-label="Edit" title="Edit" onClick={() => startEdit(e)} className="flex h-7 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-brand-500/10 hover:text-brand-600 dark:border-neutral-700 dark:hover:text-brand-400">
                        <Pencil size={13} />
                      </button>
                      <button type="button" aria-label="Hapus" title="Hapus" onClick={() => askDelete(e.id)} className="flex h-7 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-neutral-700 dark:hover:bg-red-950/40">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleDisableBio}
        className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-600 dark:border-neutral-800 dark:hover:bg-neutral-800/40 dark:hover:text-neutral-300"
      >
        Matikan kunci biometrik
      </button>

      <p className="px-2 pt-1 text-center text-[11px] text-neutral-400">
        Voskhod Vault · Disimpan hanya di perangkat kamu
      </p>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
          {toast}
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        title="Hapus password?"
        body={confirmEntry ? `"${confirmEntry.title}" bakal dihapus permanen dari Vault.` : 'Password ini bakal dihapus permanen dari Vault.'}
        confirmLabel="Hapus"
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}