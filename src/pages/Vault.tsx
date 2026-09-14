import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  avatarColor,
  generatePassword,
  generateVaultId,
  passwordStrength,
  type VaultEntry,
} from '../lib/vault';

const STORAGE_KEY = 'glowup-vault';

function maskPassword(pw: string): string {
  return '•'.repeat(Math.max(6, Math.min(18, pw.length)));
}

function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
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

export function Vault() {
  const [entries, setEntries] = useLocalStorage<VaultEntry[]>(STORAGE_KEY, []);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [revealed, setRevealed] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Generator state
  const [genLen, setGenLen] = useState(18);
  const [genUpper, setGenUpper] = useState(true);
  const [genNums, setGenNums] = useState(true);
  const [genSyms, setGenSyms] = useState(true);
  const [genPool, setGenPool] = useState('');

  const refreshGen = () => {
    setGenPool(generatePassword({ length: genLen, upper: genUpper, numbers: genNums, symbols: genSyms }));
  };

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
    setFormOpen(true);
  };

  const startEdit = (e: VaultEntry) => {
    setEditingId(e.id);
    setTitle(e.title);
    setUsername(e.username);
    setPassword(e.password);
    setNotes(e.notes ?? '');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
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
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setRevealed((prev) => prev.filter((r) => r !== id));
    flash('Hapus ✓');
  };

  const toggleReveal = (id: string) => {
    setRevealed((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? entries.filter((e) => `${e.title} ${e.username} ${e.notes ?? ''}`.toLowerCase().includes(q))
    : entries;
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  const toggleChip = (on: boolean, set: (v: boolean) => void) => (
    <button
      type="button"
      onClick={() => set(!on)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        on
          ? 'bg-brand-500 text-white'
          : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
      }`}
    >
      {on ? 'On' : 'Off'}
    </button>
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Manajemen Password
        </p>
        <div className="flex items-center gap-2">
          <KeyRound size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Vault</h1>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {entries.length}
          </span>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Simpan &amp; kelola password, cuma di perangkat kamu.
        </p>
      </header>

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
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            formOpen
              ? 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {formOpen ? <X size={16} /> : <Plus size={16} />}
          <span className="hidden sm:inline">{formOpen ? 'Batal' : 'Tambah password'}</span>
        </button>
      </div>

      {/* Add / edit form */}
      {formOpen && (
        <div className="space-y-3 rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
          <FormField label="Nama / website" value={title} onChange={setTitle} placeholder="e.g. Gmail, GitHub, Netflix" />
          <FormField label="Username / email" value={username} onChange={setUsername} placeholder="email@example.com" />
          <FormField label="Password" type="text" value={password} onChange={setPassword} placeholder="••••••••" />
          <StrengthBar value={password} />
          <FormField label="Catatan (opsional)" value={notes} onChange={setNotes} placeholder="Kode OTP, pertanyaan keamanan, dll..." />

          {/* Generator */}
          <div className="rounded-xl border border-neutral-200/60 bg-brand-50 p-3 dark:border-neutral-800/60 dark:bg-neutral-900/70">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
              <Wand2 size={13} className="text-brand-500" />
              Generator password
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-neutral-900 dark:text-neutral-100">{genPool}</span>
              <button type="button" onClick={refreshGen} aria-label="Generate baru" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400">
                <RefreshCw size={15} />
              </button>
              <button type="button" onClick={() => void copy(genPool)} aria-label="Copy password" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
                <Copy size={15} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Panjang:</span>
              <span className="tabular-nums text-xs font-bold text-neutral-700 dark:text-neutral-300">{genLen}</span>
              <input type="range" min={8} max={32} value={genLen} onChange={(e) => setGenLen(Number(e.target.value))} className="w-24 accent-brand-500" />
              {toggleChip(genUpper, setGenUpper)}
              {toggleChip(genNums, setGenNums)}
              {toggleChip(genSyms, setGenSyms)}
            </div>
            <button
              type="button"
              onClick={() => {
                const pw = generatePassword({ length: genLen, upper: genUpper, numbers: genNums, symbols: genSyms });
                setPassword(pw);
                setGenPool(pw);
                flash('Password kepakai ✓');
              }}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
            >
              <Sparkles size={13} />
              Pakai password ini
            </button>
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
        <div className="space-y-3">
          {sorted.map((e) => {
            const isOpen = revealed.includes(e.id);
            const editing = editingId === e.id && formOpen;
            return (
              <div
                key={e.id}
                className={`rounded-xl border p-3 transition-colors ${
                  editing
                    ? 'border-brand-300 bg-white/80 dark:border-brand-700 dark:bg-neutral-900/80'
                    : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
                }`}
              >
                <div className="flex w-full items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarColor(e.title)}`}>
                    {e.title.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{e.title}</p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{e.username || 'Tanpa username'}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`min-w-0 flex-1 truncate font-mono text-sm ${isOpen ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'}`}>
                        {isOpen ? e.password : maskPassword(e.password)}
                      </span>
                      <button type="button" aria-label={isOpen ? 'Sembunyikan' : 'Tampilkan'} onClick={() => toggleReveal(e.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                        {isOpen ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {e.notes && <p className="mt-0.5 truncate text-[11px] text-neutral-400">{e.notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" aria-label="Copy username" onClick={() => void copy(e.username)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                      <Copy size={14} />
                    </button>
                    <button type="button" aria-label="Copy password" onClick={() => void copy(e.password)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                      <Check size={14} />
                    </button>
                    <button type="button" aria-label="Edit" onClick={() => startEdit(e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200">
                      <Pencil size={14} />
                    </button>
                    <button type="button" aria-label="Hapus" onClick={() => removeEntry(e.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">
        GlowUp Vault · Disimpan hanya di perangkat kamu
      </p>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
          {toast}
        </div>
      )}
    </div>
  );
}