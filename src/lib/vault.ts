export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function generateVaultId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface GenOptions {
  length: number;
  upper: boolean;
  numbers: boolean;
  symbols: boolean;
}

const LOWERS = 'abcdefghijkmnopqrstuvwxyz';
const UPPERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMS = '23456789';
const SYMBOLS = '!@#$%^&*()-_=+';

function secureInt(max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function pick(chars: string, n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += chars[secureInt(chars.length)];
  return out;
}

function shuffle(s: string): string {
  const arr = s.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr.join('');
}

/** Generate a strong random password. Guarantees at least one char from each enabled set. */
export function generatePassword(opts: GenOptions): string {
  const length = Math.max(4, Math.min(64, opts.length));
  const sets: string[] = [LOWERS];
  if (opts.upper) sets.push(UPPERS);
  if (opts.numbers) sets.push(NUMS);
  if (opts.symbols) sets.push(SYMBOLS);

  const base = sets.map((s) => pick(s, 1)).join('');
  const rest = pick(sets.join(''), Math.max(0, length - base.length));
  return shuffle(base + rest);
}

export interface Strength {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
}

const STRENGTH_LABELS = ['Lemah', 'Panta', 'Bagus', 'Sangar'];
const STRENGTH_COLORS = [
  'bg-red-500 text-red-600 dark:text-red-400',
  'bg-amber-500 text-amber-600 dark:text-amber-400',
  'bg-brand-500 text-brand-600 dark:text-brand-400',
  'bg-emerald-500 text-emerald-600 dark:text-emerald-400',
];

/** Simple heuristic strength: length + charset variety. */
export function passwordStrength(pw: string): Strength {
  const len = pw.length;
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/[0-9]/.test(pw)) variety++;
  if (/[^a-zA-Z0-9]/.test(pw)) variety++;

  let score: 0 | 1 | 2 | 3 = 0;
  if (len >= 8) score = 1;
  if (len >= 12 && variety >= 2) score = 2;
  if (len >= 16 && variety >= 3) score = 3;

  return { score, label: STRENGTH_LABELS[score], color: STRENGTH_COLORS[score] };
}

const AVATAR_COLORS = [
  'bg-red-500/15 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  'bg-amber-500/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-sky-500/15 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  'bg-violet-500/15 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  'bg-pink-500/15 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
  'bg-brand-500/15 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}