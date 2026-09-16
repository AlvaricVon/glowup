import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Info, LineChart, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  ASSETS,
  computeSignal,
  formatPrice,
  pct,
  SIGNAL_FALLBACK,
  type AssetData,
  type AssetKey,
  type PricePoint,
  type SignalKind,
} from '../lib/invest';
import { todayKey } from '../lib/utils';

const STORAGE_KEY = 'glowup-invest-alerts';

const SIGNAL_STYLE: Record<SignalKind, string> = {
  'beli-kuat': 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  beli: 'bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400',
  wait: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  hold: 'bg-neutral-200/60 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  nodata: 'bg-neutral-200/40 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500',
};

function sortedPoints(points: PricePoint[]): PricePoint[] {
  return [...points].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.createdAt.localeCompare(b.createdAt);
  });
}

function Sparkline({ points, color }: { points: PricePoint[]; color: string }) {
  if (points.length < 2) {
    return <div className="h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900" />;
  }
  const last = points.slice(-20);
  const values = last.map((p) => p.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 260;
  const h = 40;
  const coords = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 3 - ((v - min) / range) * (h - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function InvestAlerts() {
  const [data, setData] = useLocalStorage<AssetData>(STORAGE_KEY, {});
  const [activeInput, setActiveInput] = useState<AssetKey | null>(null);
  const [price, setPrice] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Migration: strip legacy emas & pasaruang points saved before they were removed.
  useEffect(() => {
    if (data && ('emas' in data || 'pasaruang' in data)) {
      const { emas: _emas, pasaruang: _pasaruang, ...rest } = data as AssetData & {
        emas?: unknown;
        pasaruang?: unknown;
      };
      setData(rest as AssetData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  const formatInput = (raw: string): string => {
    const cleaned = raw.replace(/[^0-9.,]/g, '');
    const num = parseFloat(cleaned.replace(/\./g, '').replace(/,/g, '.'));
    if (!Number.isFinite(num)) return cleaned;
    return num.toLocaleString('id-ID', { maximumFractionDigits: 8 });
  };

  const parseValue = (raw: string): number => {
    return parseFloat(raw.replace(/\./g, '').replace(/,/g, '.'));
  };

  const addPrice = (key: AssetKey) => {
    const value = parseValue(price);
    if (!Number.isFinite(value) || value <= 0) {
      flash('Isi harga yang valid dulu');
      return;
    }
    const point: PricePoint = {
      date: todayKey(),
      price: value,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), point] }));
    setPrice('');
    setActiveInput(null);
    flash('Harga tercatat ✓');
  };

  const removeLast = (key: AssetKey) => {
    const pts = data[key];
    if (!pts || pts.length === 0) return;
    setData((prev) => ({ ...prev, [key]: (prev[key] ?? []).slice(0, -1) }));
    flash('Entry terakhir dihapus ✓');
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Prediksi timing beli
        </p>
        <div className="flex items-center gap-2">
          <LineChart size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Invest Alerts</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Catat harga harian, biar tau kapan bagusnya beli BTC &amp; ETH.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900/30 dark:bg-brand-900/20">
        <Info size={16} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="text-sm leading-relaxed text-brand-800 dark:text-brand-200">
          Sinyal dihitung dari data harga yang lo update berkala. Makin sering lo catat, makin valid prediksinya.
          Emas Dana & Pasar Uang langsung beli aja pas gajian, gak perlu tunggu sinyal.
          Ini alat bantu, bukan nasihat finansial — tetep bijak pas mutusin.
        </p>
      </div>

      <div className="space-y-4">
        {ASSETS.map((a) => {
          const rawPoints = data[a.key] ?? [];
          const points = sortedPoints(rawPoints);
          const sig = computeSignal(a.key, rawPoints);
          const meta = SIGNAL_FALLBACK[sig.signal];
          const isEditing = activeInput === a.key;
          const up = sig.change1 !== null && sig.change1 > 0;
          return (
            <section key={a.key} className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60">
              <div className="flex items-center gap-3 px-4 pt-4">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{a.name}</p>
                  <p className="text-[11px] text-neutral-400">{sig.count} titik data</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${SIGNAL_STYLE[sig.signal]}`}>
                  {meta.label}
                </span>
                {points.length > 0 && (
                  <button type="button" aria-label="Hapus entry terakhir" onClick={() => removeLast(a.key)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-end justify-between gap-3 px-4 pt-3">
                <span className="text-2xl font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {sig.latest !== null ? formatPrice(sig.latest) : '—'}
                </span>
                <div className="flex items-center gap-2">
                  {sig.change1 !== null && (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                      {pct(sig.change1)}
                    </span>
                  )}
                  {sig.drawdown !== null && (
                    <span className="text-[11px] font-medium text-neutral-400">
                      -{pct(sig.drawdown, false)} dari peak
                    </span>
                  )}
                </div>
              </div>

              <p className="px-4 pb-3 pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{meta.hint}</p>

              <div className="px-4 pb-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400">Rp</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => setPrice(formatInput(e.target.value))}
                        placeholder="Harga hari ini"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addPrice(a.key);
                          if (e.key === 'Escape') setActiveInput(null);
                        }}
                        autoFocus
                        className="w-full rounded-xl border border-neutral-200 bg-cream-50 py-2.5 pl-8 pr-3 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => addPrice(a.key)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600">
                        <Plus size={13} /> Simpan harga
                      </button>
                      <button type="button" onClick={() => setActiveInput(null)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInput(a.key);
                      setPrice('');
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:border-neutral-700 dark:text-brand-400 dark:hover:bg-neutral-800"
                  >
                    <Plus size={13} />
                    Update harga
                  </button>
                )}
              </div>

              <div className="border-t border-neutral-200/70 px-4 py-3 dark:border-neutral-800/70">
                <Sparkline points={points} color={a.color} />
              </div>
            </section>
          );
        })}
      </div>

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">
        Voskhod Invest Alerts · Data cuma di perangkat lo
      </p>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900">
          {toast}
        </div>
      )}
    </div>
  );
}