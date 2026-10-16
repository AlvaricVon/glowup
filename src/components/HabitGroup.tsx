import { Brain, Coffee, Moon, Sun, Sunrise, Sunset, ToggleLeft } from 'lucide-react';
import type { HabitDef, HabitEntry, Period } from '../lib/types';
import { HabitCheckbox } from './HabitCheckbox';

interface Props {
  period: Period;
  label: string;
  habits: HabitDef[];
  entries: Record<string, HabitEntry>;
  onToggle: (id: string, evt: React.MouseEvent<HTMLButtonElement>) => void;
  /** Habit id that opens a hidden panel when held. */
  longPressHabitId?: string;
  onHabitLongPress?: (id: string, evt: React.PointerEvent) => void;
  /** Habit ids locked by a rule (cannot be toggled). */
  disabledIds?: string[];
  /** Habit ids where 3 quick taps trigger onHabitTripleClick instead of toggling. */
  tripleClickHabitIds?: string[];
  onHabitTripleClick?: (id: string, evt: React.MouseEvent<HTMLButtonElement>) => void;
  /** Habit id → progress % (0..100) buat habit multi-hari (mis. upload YT). */
  progressById?: Record<string, number>;
  /** Habit ids where a double-tap triggers onHabitAltClick instead of toggling (excuse). */
  altClickHabitIds?: string[];
  onHabitAltClick?: (id: string, evt: React.MouseEvent<HTMLButtonElement>) => void;
}

const ICONS: Record<Period, typeof Sun> = {
  pagi: Sunrise,
  siang: Sun,
  sore: Sunset,
  malam: Moon,
  mindset: Brain,
  limit: Coffee,
  conditional: ToggleLeft,
};

export function HabitGroup({
  period,
  label,
  habits,
  entries,
  onToggle,
  longPressHabitId,
  onHabitLongPress,
  disabledIds,
  tripleClickHabitIds,
  onHabitTripleClick,
  altClickHabitIds,
  onHabitAltClick,
  progressById,
}: Props) {
  if (habits.length === 0) return null;
  const Icon = ICONS[period];
  const done = habits.filter((h) => entries[h.id]?.completed).length;
  const disabledSet = disabledIds && disabledIds.length > 0 ? new Set(disabledIds) : null;
  const tripleSet = tripleClickHabitIds && tripleClickHabitIds.length > 0 ? new Set(tripleClickHabitIds) : null;
  const altSet = altClickHabitIds && altClickHabitIds.length > 0 ? new Set(altClickHabitIds) : null;
  return (
    <section className="animate-slide-up">
      <header className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
            {label}
          </h3>
        </div>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
          {done}/{habits.length}
        </span>
      </header>
      <div className="space-y-2">
        {habits.map((h) => (
          <HabitCheckbox
            key={h.id}
            def={h}
            entry={entries[h.id] ?? { completed: false, timestamp: null }}
            onToggle={(e) => onToggle(h.id, e)}
            progress={progressById ? progressById[h.id] : undefined}
            disabled={disabledSet ? disabledSet.has(h.id) : false}
            onLongPress={
              longPressHabitId && h.id === longPressHabitId && onHabitLongPress
                ? (e) => onHabitLongPress(h.id, e)
                : undefined
            }
            onTripleClick={
              tripleSet && tripleSet.has(h.id) && onHabitTripleClick
                ? (e) => onHabitTripleClick(h.id, e)
                : undefined
            }
            onAltClick={
              altSet && altSet.has(h.id) && onHabitAltClick
                ? (e) => onHabitAltClick(h.id, e)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}