import { useEffect } from 'react';
import { CUCI_BAJU_HABIT_ID } from './habits';
import { useAppStore } from '../store/useAppStore';

const KEY = 'glowup-laundry';

interface LaundryState {
  /** Tanggal (YYYY-MM-DD) terakhir nyuci. */
  lastWash: string;
}

function read(): LaundryState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { lastWash?: unknown };
    if (typeof o.lastWash === 'string') return { lastWash: o.lastWash };
  } catch {
    // ignore
  }
  return null;
}

function write(s: LaundryState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('glowup:local-storage', { detail: { key: KEY } }));
  } catch {
    // ignore
  }
}

/** Tanggal terakhir nyuci (YYYY-MM-DD), atau null kalau belum ada. */
export function getLastWash(): string | null {
  return read()?.lastWash ?? null;
}

/** Catat tanggal nyuci. */
export function markWashed(dateKey: string): void {
  write({ lastWash: dateKey });
}

/**
 * Jaga state 'Cuci baju':
 * - Seed pertama kali = tanggal hari ini (jadi check muncul lagi +2 hari).
 * - Begitu check 'Cuci baju' dicentang, catat tanggal nyuci = hari ini
 *   (biar sembunyi & muncul lagi 2 hari kemudian).
 */
export function useLaundry() {
  const today = useAppStore((s) => s.today);

  useEffect(() => {
    if (!today) return;
    const cur = read();
    if (!cur) {
      write({ lastWash: today.date });
      return;
    }
    const done = today.habits?.[CUCI_BAJU_HABIT_ID]?.completed ?? false;
    if (done && cur.lastWash !== today.date) {
      write({ lastWash: today.date });
    }
  }, [today]);
}
