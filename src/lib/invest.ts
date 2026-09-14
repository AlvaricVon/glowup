export type AssetKey = 'emas' | 'emaspluang' | 'btc' | 'eth' | 'pasaruang';

export interface AssetInfo {
  key: AssetKey;
  name: string;
  short: string;
  color: string;
}

export const ASSETS: readonly AssetInfo[] = [
  { key: 'emas', name: 'EMAS', short: 'EMAS', color: '#f59e0b' },
  { key: 'emaspluang', name: 'Emas Pluang (Dana & Pluang)', short: 'Emas Pluang', color: '#d97706' },
  { key: 'btc', name: 'BTC (Indodax)', short: 'BTC', color: '#f7931a' },
  { key: 'eth', name: 'ETH (Indodax)', short: 'ETH', color: '#6366f1' },
  { key: 'pasaruang', name: 'Pasar Uang (Bibit - Syariah)', short: 'Pasar Uang', color: '#10b981' },
];

export interface PricePoint {
  date: string; // YYYY-MM-DD
  price: number;
  createdAt: string;
}

export type AssetData = Partial<Record<AssetKey, PricePoint[]>>;

export type SignalKind = 'beli' | 'beli-kuat' | 'wait' | 'hold' | 'nodata';

export interface AssetSignal {
  key: AssetKey;
  signal: SignalKind;
  count: number;
  latest: number | null;
  change1: number | null; // fraction change vs previous point
  drawdown: number | null; // fraction below recent peak (0..1)
  peak: number | null;
}

export const SIGNAL_FALLBACK: Readonly<Record<SignalKind, { label: string; hint: string }>> = {
  beli: { label: 'BELI', hint: 'Harga udah turun dari peak terakhir. Timing cukup ok buat beli.' },
  'beli-kuat': { label: 'BELI (Kuat)', hint: 'Harga turun jauh dari peak. Timing bagus buat beli.' },
  wait: { label: 'Gak beli dulu', hint: 'Harga lagi naik. Tahan dulu, jangan keburu beli.' },
  hold: { label: 'Jaga', hint: 'Harga masih naik/turun tipis. Posisi jaga, beli pas ada hasil jelas.' },
  nodata: { label: 'Gak ada data', hint: 'Tambah minimal 2 harga biar sinyal beli bisa dihitung.' },
};

function fraction(a: number, b: number): number {
  if (b === 0) return 0;
  return (a - b) / b;
}

/** Heuristic buy signal based on a drop from the recent peak and momentum. */
export function computeSignal(key: AssetKey, points: PricePoint[]): AssetSignal {
  if (!points || points.length < 2) {
    return {
      key,
      signal: 'nodata',
      count: points?.length ?? 0,
      latest: points?.length ? points[points.length - 1].price : null,
      change1: null,
      drawdown: null,
      peak: null,
    };
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const window = sorted.slice(-30);
  const latest = window[window.length - 1].price;
  const prev = window[window.length - 2].price;
  const peak = Math.max(...window.map((p) => p.price));
  const drawdown = peak > 0 ? (peak - latest) / peak : 0;
  const change1 = fraction(latest, prev);

  // Medium trend: avg of second half compared to first half of window.
  const mid = Math.floor(window.length / 2);
  const firstHalf = window.slice(0, mid).reduce((s, p) => s + p.price, 0) / mid;
  const secondHalf = window.slice(mid).reduce((s, p) => s + p.price, 0) / Math.max(1, window.length - mid);
  const trend = fraction(secondHalf, firstHalf);

  let signal: SignalKind;
  if (drawdown >= 0.1) {
    signal = 'beli-kuat';
  } else if (drawdown >= 0.05) {
    signal = 'beli';
  } else if (trend > 0.02 || change1 > 0.005) {
    signal = 'wait';
  } else {
    signal = 'hold';
  }

  return { key, signal, count: window.length, latest, change1, drawdown, peak };
}

export function formatPrice(value: number): string {
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export function pct(value: number | null, plusSign = true): string {
  if (value === null || value === undefined) return '—';
  const s = `${value * 100 >= 0 && plusSign ? '+' : ''}${(value * 100).toFixed(1)}%`;
  return s;
}