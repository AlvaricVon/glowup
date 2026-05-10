import { Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { HabitDef, HabitEntry } from '../lib/types';

interface Props {
  def: HabitDef;
  entry: HabitEntry;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function HabitCheckbox({ def, entry, onToggle }: Props) {
  const checked = entry.completed;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
        checked
          ? 'border-brand-500/30 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10'
          : 'border-neutral-200/80 bg-white hover:border-neutral-300 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:hover:border-neutral-700'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
          checked
            ? 'border-brand-500 bg-brand-500 animate-check-pop'
            : 'border-neutral-300 bg-transparent dark:border-neutral-700'
        }`}
      >
        {checked && <Check size={16} strokeWidth={3.5} className="text-white" />}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[15px] font-semibold leading-snug ${
            checked
              ? 'text-neutral-500 line-through decoration-brand-500/40 dark:text-neutral-500'
              : 'text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {def.label}
        </span>
        {def.description && (
          <span
            className={`mt-0.5 block text-xs ${
              checked ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {def.description}
          </span>
        )}
        {checked && entry.timestamp && (
          <span className="mt-1 block text-[10px] font-medium text-brand-600 dark:text-brand-400">
            ✓ {format(parseISO(entry.timestamp), 'HH:mm', { locale: idLocale })}
          </span>
        )}
      </span>
    </button>
  );
}
