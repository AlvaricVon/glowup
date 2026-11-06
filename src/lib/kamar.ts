const KEY = 'glowup-kamar-checklist';

export interface KamarItem {
  id: string;
  label: string;
}

export const KAMAR_ITEMS: KamarItem[] = [
  { id: 'lemari', label: 'Lemari' },
  { id: 'meja', label: 'Meja' },
  { id: 'kasur', label: 'Kasur' },
  { id: 'lantai', label: 'Lantai' },
  { id: 'karpet', label: 'Karpet' },
  { id: 'kamar-mandi', label: 'Kamar mandi' },
  { id: 'server', label: 'Server' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'hp', label: 'HP' },
  { id: 'ruang-komputer', label: 'Ruang komputer' },
  { id: 'dapur', label: 'Dapur' },
  { id: 'halaman', label: 'Halaman' },
];

interface KamarState {
  /** Tanggal (YYYY-MM-DD) checklist ini berlaku. */
  date: string;
  checked: string[];
}

function readRaw(): KamarState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { date?: unknown; checked?: unknown };
    if (typeof o.date !== 'string') return null;
    const checked = Array.isArray(o.checked)
      ? o.checked.filter((x): x is string => typeof x === 'string')
      : [];
    return { date: o.date, checked };
  } catch {
    return null;
  }
}

function write(state: KamarState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('glowup:local-storage', { detail: { key: KEY } }));
  } catch {
    // ignore
  }
}

/** Item yang udah dicentang buat tanggal tertentu (kosong kalau udah ganti hari). */
export function readKamar(date: string): string[] {
  const s = readRaw();
  if (!s || s.date !== date) return [];
  return s.checked.filter((id) => KAMAR_ITEMS.some((i) => i.id === id));
}

export function writeKamar(date: string, checked: string[]): void {
  write({ date, checked });
}

/** Toggle 1 item, balikin daftar item yang sekarang dicentang. */
export function toggleKamarItem(date: string, id: string): string[] {
  const cur = readKamar(date);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  writeKamar(date, next);
  return next;
}

export function isKamarAllDone(checked: string[]): boolean {
  return checked.length >= KAMAR_ITEMS.length;
}
