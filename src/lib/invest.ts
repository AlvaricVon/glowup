export type AssetKey = 'btc' | 'eth';

export interface AssetInfo {
  key: AssetKey;
  name: string;
  short: string;
  color: string;
}

export const ASSETS: readonly AssetInfo[] = [
  { key: 'btc', name: 'BTC (Indodax)', short: 'BTC', color: '#f7931a' },
  { key: 'eth', name: 'ETH (Indodax)', short: 'ETH', color: '#6366f1' },
];

export interface PricePoint {
  date: string;
  price: number;
  createdAt: string;
}

export type AssetData = Partial<Record<AssetKey, PricePoint[]>> & { [legacy: string]: PricePoint[] | undefined };

export type SignalKind = 'beli' | 'beli-kuat' | 'wait' | 'hold' | 'nodata';

export interface AssetSignal {
  key: AssetKey;
  signal: SignalKind;
  count: number;
  latest: number | null;
  change1: number | null;
  drawdown: number | null;
  peak: number | null;
}

export interface StaleInfo {
  daysSinceUpdate: number | null;
  daysSinceBuy: number | null;
  showStaleWarning: boolean;
  showDcaNudge: boolean;
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

function parseDay(s: string): Date {
  const parts = s.split('-').map(Number);
  return new Date(parts[0], parts[1]-1, parts[2]);
}

function localKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+dd;
}

function diffDays(from: string, to: string): number {
  const a = parseDay(from);
  const b = parseDay(to);
  return Math.round((b.getTime()-a.getTime())/86400000);
}

function drawdownOf(prices: number[]): number {
  if (prices.length < 2) return 0;
  const peak = Math.max.apply(null, prices);
  const last = prices[prices.length-1];
  return peak > 0 ? (peak-last)/peak : 0;
}

export function computeSignal(key: AssetKey, points: PricePoint[]): AssetSignal {
  if (!points || points.length < 2) {
    return { key, signal: 'nodata', count: points ? points.length : 0, latest: points && points.length ? points[points.length-1].price : null, change1: null, drawdown: null, peak: null };
  }
  const sorted = points.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const window = sorted.slice(-30);
  const latest = window[window.length-1].price;
  const prev = window[window.length-2].price;
  const peak = Math.max.apply(null, window.map(p=>p.price));
  const drawdown = peak > 0 ? (peak-latest)/peak : 0;
  const change1 = fraction(latest, prev);
  const mid = Math.floor(window.length/2);
  const firstHalf = window.slice(0,mid).reduce((s,p)=>s+p.price,0)/mid;
  const secondHalf = window.slice(mid).reduce((s,p)=>s+p.price,0)/Math.max(1,window.length-mid);
  const trend = fraction(secondHalf, firstHalf);
  let signal: SignalKind;
  if (drawdown >= 0.1) signal = 'beli-kuat';
  else if (drawdown >= 0.05) signal = 'beli';
  else if (trend > 0.02 || change1 > 0.005) signal = 'wait';
  else signal = 'hold';
  return { key, signal, count: window.length, latest, change1, drawdown, peak };
}

export function getStaleInfo(points: PricePoint[], signal: SignalKind): StaleInfo {
  if (!points || points.length < 2) return { daysSinceUpdate: null, daysSinceBuy: null, showStaleWarning: false, showDcaNudge: false };
  const sorted = points.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const today = localKey(new Date());
  const lastDate = sorted[sorted.length-1].date;
  const daysSinceUpdate = Math.max(0, diffDays(lastDate, today));
  const isBuy = signal === 'beli' || signal === 'beli-kuat';
  if (isBuy) return { daysSinceUpdate, daysSinceBuy: 0, showStaleWarning: daysSinceUpdate > 7, showDcaNudge: false };
  let lastBuyDate: string | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const slice = sorted.slice(0, i+1);
    if (slice.length < 2) continue;
    if (drawdownOf(slice.map(p=>p.price)) >= 0.05) lastBuyDate = sorted[i].date;
  }
  const daysSinceBuy = lastBuyDate === null ? null : Math.max(0, diffDays(lastBuyDate, today));
  const effective = lastBuyDate === null ? 999 : daysSinceBuy as number;
  const showStaleWarning = daysSinceUpdate > 7;
  const showDcaNudge = !showStaleWarning && (signal === 'hold' || signal === 'wait') && effective >= 30;
  return { daysSinceUpdate, daysSinceBuy, showStaleWarning, showDcaNudge };
}

export function formatPrice(value: number): string {
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export function pct(value: number | null, plusSign = true): string {
  if (value === null || value === undefined) return '-';
  return (value*100 >= 0 && plusSign ? '+' : '') + (value*100).toFixed(1) + '%';
}
