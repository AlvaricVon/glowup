import { Coffee, Moon, Sun, Sunrise, Sunset, ToggleLeft } from 'lucide-react';
import type { HabitDef, HabitEntry, Period } from '../lib/types';
import { HabitCheckbox } from './HabitCheckbox';

interface Props {
  period: Period;
  label: string;
  habits: HabitDef[];
  entries: Record<string, HabitEntry>;
  onToggle: (id: string, evt: React.MouseEvent<HTMLButtonElement>) => void;
}

const ICONS: Record<Period, typeof Sun> = {
  pagi: Sunrise,
  siang: Sun,
  sore: Sunset,
  malam: Moon,
  limit: Coffee,
  conditional: ToggleLeft,
};

export function HabitGroup({ period, label, habits, entries, onToggle }: Props) {
  if (habits.length === 0) return null;
  const Icon = ICONS[period];
  const done = habits.filter((h) => entries[h.id]?.completed).length;
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
          />
        ))}
      </div>
    </section>
  );
}
