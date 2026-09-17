import type { DayEntry } from './types';
import {
  STREAK_THRESHOLD,
  activeHabitsForDay,
  completedCount,
  stepDay,
  todayKey,
} from './utils';

export interface StreakResult {
  current: number;
  /** Whether today's freeze (or recent week's freeze) was used to keep the streak alive. */
  freezeUsedThisWeek: boolean;
  /** Date strings (yyyy-mm-dd) where freeze was consumed during this calculation. */
  consumedFreezeDates: string[];
}

/** Live completion rate for a day, recomputed from the CURRENT habit list
 *  (stored `completionRate` can go stale when habits are added/removed). */
export function liveRate(day: DayEntry): number {
  const total = activeHabitsForDay(day).length;
  if (total === 0) return 0;
  return completedCount(day) / total;
}

function stepBack(dateKey: string): string {
  return stepDay(dateKey, -1);
}

/**
 * Calculate current streak walking back from today.
 *
 * Rules (strict, no auto-freeze):
 * - A day "passes" if live completion rate >= 80% of active habits that day.
 * - Today is allowed to be "in progress" — it doesn't break or add to the
 *   streak, we just look at yesterday.
 * - Any missed day (<80%) breaks the streak immediately → 0 (no magic freeze).
 * - Missing entries (no DayEntry at all) for yesterday or earlier also break
 *   the streak, except before the user ever opened the app.
 */
export function computeStreak(
  days: DayEntry[],
  _freezeUsedDates: string[] = [],
  today: string = todayKey(),
): StreakResult {
  const map = new Map(days.map((d) => [d.date, d]));

  // Don't break the streak for days before the user ever opened the app.
  const earliest = days.length
    ? [...days].sort((a, b) => a.date.localeCompare(b.date))[0].date
    : today;

  let current = 0;
  let cursor = today;
  let isFirst = true;

  while (true) {
    const day = map.get(cursor);
    const passed = day ? liveRate(day) >= STREAK_THRESHOLD : false;

    if (passed) {
      current += 1;
    } else if (isFirst && cursor === today) {
      // Today not yet complete — don't break or count, just look at yesterday.
    } else if (cursor < earliest) {
      // Before any recorded history — stop.
      break;
    } else {
      // Missed day (<80% atau gak ada entry) → stop. Run yang udah
      // kehitung (hari lulus berurutan dari kemarin ke belakang) tetap,
      // tapi kalo yang miss itu kemarin ya current tetap 0.
      break;
    }

    isFirst = false;
    cursor = stepBack(cursor);

    // Safety: don't walk forever.
    if (current > 3650) break;
  }

  return {
    current,
    freezeUsedThisWeek: false,
    consumedFreezeDates: [],
  };
}

export function computeLongestStreak(days: DayEntry[]): number {
  if (days.length === 0) return 0;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    const passed = liveRate(d) >= STREAK_THRESHOLD;
    if (!passed) {
      run = 0;
      prev = d.date;
      continue;
    }
    if (prev === null) {
      run = 1;
    } else {
      const expected = stepDay(prev, 1);
      run = d.date === expected ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    prev = d.date;
  }
  return longest;
}
