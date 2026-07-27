import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { HABITS } from './habits';
import type { DayEntry, HabitDef } from './types';

export const STREAK_THRESHOLD = 0.8;

export function todayKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

export function formatPretty(date: string): string {
  return format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale });
}

export function formatShort(date: string): string {
  return format(parseISO(date), 'd MMM', { locale: idLocale });
}

export function greetingForHour(hour: number, name: string): string {
  if (hour < 4) return `Tidur dulu sana, ${name}`;
  if (hour < 11) return `Selamat pagi, ${name}`;
  if (hour < 15) return `Selamat siang, ${name}`;
  if (hour < 18) return `Selamat sore, ${name}`;
  return `Selamat malam, ${name}`;
}

/** Build a fresh DayEntry with all habits unchecked. Conditionals default to false. */
export function buildEmptyDay(date: string): DayEntry {
  const habits: DayEntry['habits'] = {};
  for (const h of HABITS) {
    habits[h.id] = { completed: false, timestamp: null };
  }
  return {
    date,
    habits,
    completionRate: 0,
    conditionals: {} as Record<never, boolean>,
  };
}

/** Active habits for the day = base habits (filtered by day) + active conditionals. */
export function activeHabitsForDay(day: DayEntry): HabitDef[] {
  const currentDay = new Date(day.date).getDay();
  return HABITS.filter((h) => {
    if (h.days && !h.days.includes(currentDay)) return false;
    if (!h.conditional) return true;
    return day.conditionals[h.conditional];
  });
}

export function activeHabitCount(day: DayEntry): number {
  return activeHabitsForDay(day).length;
}

export function completedCount(day: DayEntry): number {
  const active = activeHabitsForDay(day);
  return active.filter((h) => day.habits[h.id]?.completed).length;
}

export function calcCompletionRate(day: DayEntry): number {
  const total = activeHabitCount(day);
  if (total === 0) return 0;
  return completedCount(day) / total;
}

/** Get Monday-based week key for a date string. Used to track per-week freezes. */
export function weekKey(date: string): string {
  const monday = startOfWeek(parseISO(date), { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

export function dateRangeBack(daysBack: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    out.push(todayKey(addDays(end, -i)));
  }
  return out;
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop — some browsers throw if vibration is disabled by policy */
    }
  }
}

export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
    reader.readAsText(file);
  });
}
