import { useState } from 'react';
import { BookUser, Check, Coins, History as HistoryIcon, Info, Plus, Trash2, Wallet } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ALLOCATION_RULES, calculateAllocation, formatRupiah } from '../lib/finance';

interface AllocationEntry {
  amount: number;
  date: string;
}

interface DebtEntry {
  id: string;
  name: string;
  amount: number;
  note: string;
  paid: boolean;
  date: string;
}

const DEBT_KEY = 'glowup-debts';

const STORAGE_KEY = 'glowup-finance-history';

export function Finance() {
  const [history, setHistory] = useLocalStorage<AllocationEntry[]>(STORAGE_KEY, []);
  const [input, setInput] = useState('');
  const [current, setCurrent] = useState<number | null>(null);
  const [debts, setDebts] = useLocalStorage<DebtEntry[]>(DEBT_KEY, []);
  const [debtName, setDebtName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNote, setDebtNote] = useState('');

  const digits = (raw: string) => raw.replace(/[^0-9]/g, '');

  const handleInputChange = (raw: string) => {
    const value = digits(raw);
    setInput(value ? formatRupiah(parseInt(value, 10)).replace('Rp', '').trim() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(digits(input), 10);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setCurrent(amount);
    setHistory((prev) => [...prev, { amount, date: new Date().toISOString() }]);
    setInput('');
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(digits(debtAmount), 10);
    if (!debtName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const entry: DebtEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: debtName.trim(),
      amount,
      note: debtNote.trim(),
      paid: false,
      date: new Date().toISOString(),
    };
    setDebts((prev) => [entry, ...prev]);
    setDebtName('');
    setDebtAmount('');
    setDebtNote('');
  };

  const toggleDebt = (id: string) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, paid: !d.paid } : d)));
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDebtAmount = (raw: string) => {
    const value = digits(raw);
    setDebtAmount(value ? formatRupiah(parseInt(value, 10)).replace('Rp', '').trim() : '');
  };

  const handleDelete = (index: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const allocations = current !== null ? calculateAllocation(current) : [];
  const totalIncome = history.reduce((sum, entry) => sum + entry.amount, 0);
  const comparator = (a: AllocationEntry, b: AllocationEntry) => b.date.localeCompare(a.date);
  const totalUnpaid = debts.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Alokasi Otomatis
        </p>
        <div className="flex items-center gap-2">
          <Wallet size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Keuangan</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Masukkan pendapatan, dibagi otomatis ke {ALLOCATION_RULES.length} kantong
        </p>
      </header>

      {/* Allocation note */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900/30 dark:bg-brand-900/20">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="text-sm leading-relaxed text-brand-800 dark:text-brand-200">
          Alokasi ini dihitung dari <span className="font-semibold">sisa pendapatan setelah kebutuhan Nutrition sebulan</span>{' '}
          disisihkan dulu. Setiap abis gajian, wajib pisahkan budget Nutrition sebulan,
          sisanya baru dibagi ke {ALLOCATION_RULES.length} kantong di bawah.
        </p>
      </div>

      {/* Simpanan note */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-white/70 px-4 py-3 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <Wallet size={16} className="mt-0.5 shrink-0 text-neutral-400" />
        <div className="space-y-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">Things to buy</span> dipakai buat
            beli barang yang udah lo save / target yang mau lo beli — wishlist yang jelas, bukan asal checkout.
          </p>
          <p>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">Simpanan Bank Jago</span> gaboleh
            dipake kecuali urgent. Kalaupun kepake, cuma buat beli barang yang beneran dibutuhin buat jalanin
            progress di Voskhod. Selain itu, jangan disentuh.
          </p>
          <p>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">Dana Darurat</span> gak boleh dipake
            dalam keadaan apa pun. Titik.
          </p>
        </div>
      </div>

      {/* Income input */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60"
      >
        <label
          htmlFor="income-input"
          className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Pendapatan
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">Rp</span>
          <input
            id="income-input"
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Masukkan pendapatan"
            className="w-full rounded-xl border border-neutral-200 bg-cream-50 py-3 pl-10 pr-4 text-base font-semibold text-neutral-900 placeholder-neutral-400 placeholder:font-normal focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
        >
          <Coins size={18} />
          Alokasikan
        </button>
      </form>

      {/* Allocation breakdown */}
      {current !== null && (
        <section className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Detail Alokasi</h2>
            <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400">
              {formatRupiah(current)}
            </span>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            {allocations.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                className="h-full"
                style={{ width: `${a.percentage}%`, backgroundColor: a.color }}
              />
            ))}
          </div>

          <ul className="mt-4 space-y-3">
            {allocations.map((a) => (
              <li key={a.name} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="truncate text-sm text-neutral-700 dark:text-neutral-300">{a.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatRupiah(a.amount)}
                  </div>
                  <div className="text-xs text-neutral-400">{a.percentage}%</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Debts */}
      <section className="space-y-3 rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            <BookUser size={15} className="text-brand-500" /> Utang
          </h2>
          {totalUnpaid > 0 && (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Sisa: <span className="font-bold text-red-500">{formatRupiah(totalUnpaid)}</span>
            </span>
          )}
        </div>
        <form onSubmit={handleAddDebt} className="space-y-2">
          <input
            type="text"
            value={debtName}
            onChange={(e) => setDebtName(e.target.value)}
            placeholder="Utang ke siapa? cth: Budi"
            className="w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={debtAmount}
              onChange={(e) => handleDebtAmount(e.target.value)}
              placeholder="Berapa? cth: 500.000"
              className="w-full rounded-xl border border-neutral-200 bg-cream-50 py-2.5 pl-8 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
            />
          </div>
          <input
            type="text"
            value={debtNote}
            onChange={(e) => setDebtNote(e.target.value)}
            placeholder="Catatan (opsional) cth: pinjem buat bensin"
            className="w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
          />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <Plus size={15} /> Catat utang
          </button>
        </form>
        {debts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-5 text-center text-sm text-neutral-400 dark:border-neutral-800">
            Belum ada catatan utang. Aman.
          </p>
        ) : (
          <div className="space-y-2">
            {debts.map((d) => (
              <div
                key={d.id}
                className={`flex items-start gap-3 rounded-xl border p-3 ${d.paid ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/30 dark:bg-emerald-950/20' : 'border-neutral-200/80 bg-cream-50 dark:border-neutral-800 dark:bg-neutral-950/40'}`}
              >
                <button
                  type="button"
                  onClick={() => toggleDebt(d.id)}
                  aria-label={d.paid ? 'Tandai belum lunas' : 'Tandai lunas'}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${d.paid ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-300 text-transparent dark:border-neutral-600'}`}
                >
                  <Check size={12} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${d.paid ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-neutral-100'}`}>
                    {d.name}
                  </p>
                  <p className={`text-sm font-bold tabular-nums ${d.paid ? 'text-neutral-400' : 'text-red-500'}`}>
                    {formatRupiah(d.amount)}
                  </p>
                  {d.note && <p className="truncate text-xs text-neutral-400">{d.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteDebt(d.id)}
                  aria-label="Hapus utang"
                  className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-2 pt-1">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
            <HistoryIcon size={12} /> Riwayat
          </h2>
          {totalIncome > 0 && (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Total: <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatRupiah(totalIncome)}</span>
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white/50 px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
            <p className="text-sm text-neutral-400">Belum ada riwayat input.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...history].sort(comparator).map((entry, i) => {
              const originalIndex = history.length - 1 - i;
              return (
                <div
                  key={`${entry.date}-${entry.amount}`}
                  className="group relative rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60"
                >
                  <button
                    type="button"
                    onClick={() => handleDelete(originalIndex)}
                    aria-label="Hapus riwayat"
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="mb-3 flex items-baseline justify-between gap-2 pr-8">
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {formatRupiah(entry.amount)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(entry.date).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 gap-y-1.5">
                    {calculateAllocation(entry.amount).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {formatRupiah(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </section>

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">
        Voskhod Keuangan · {ALLOCATION_RULES.reduce((sum, r) => sum + r.percentage, 0)}% dari pendapatan dialokasikan
      </p>
    </div>
  );
}