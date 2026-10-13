import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useLongPress } from '../hooks/useLongPress';
import type { HabitDef, HabitEntry } from '../lib/types';

interface Props {
  def: HabitDef;
  entry: HabitEntry;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onLongPress?: (e: React.PointerEvent) => void;
  /** Locked by a rule (e.g. sholat taubat mutual exclusion) — gak bisa di-toggle. */
  disabled?: boolean;
  /** Kalau diisi, 3 tap cepet bakal manggil ini (bukan nge-toggle) — dipake buat skip sholat. */
  onTripleClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function HabitCheckbox({ def, entry, onToggle, onLongPress, disabled = false, onTripleClick }: Props) {
  const checked = entry.completed;
  const skipped = !!entry.skipped;
  const suppressClickRef = useRef(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const longPress = useLongPress(
    (e) => {
      suppressClickRef.current = true;
      onLongPress?.(e);
    },
    800,
  );

  useEffect(
    () => () => {
      if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current);
    },
    [],
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!onTripleClick) {
      onToggle(e);
      return;
    }
    // Multi-tap: 3 taps cepet (<300ms) buat skip, selain itu toggle biasa (ditunda
    // sebentar biar triple-tap kebaca). currentTarget di-capture dulu karena React
    // nge-null-in currentTarget setelah handler selesai.
    const el = e.currentTarget;
    clickCountRef.current += 1;
    if (clickTimerRef.current !== null) window.clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onTripleClick(e);
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
      onToggle({ currentTarget: el } as unknown as React.MouseEvent<HTMLButtonElement>);
    }, 300);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      {...(onLongPress && !disabled ? longPress : {})}
      className={`group flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
        disabled
          ? 'cursor-not-allowed border-neutral-200/60 bg-neutral-100/60 opacity-50 dark:border-neutral-800/50 dark:bg-neutral-900/40'
          : skipped
            ? 'border-amber-500/40 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-500/10'
            : checked
              ? 'border-brand-500/30 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10'
              : 'border-neutral-200/80 bg-white hover:border-neutral-300 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:hover:border-neutral-700'
      }`}
      aria-pressed={checked}
      aria-disabled={disabled}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
          skipped
            ? 'border-amber-500 bg-amber-500'
            : checked
              ? 'border-brand-500 bg-brand-500 animate-check-pop'
              : 'border-neutral-300 bg-transparent dark:border-neutral-700'
        }`}
      >
        {skipped ? (
          <X size={15} strokeWidth={3.5} className="text-white" />
        ) : (
          checked && <Check size={16} strokeWidth={3.5} className="text-white" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[15px] font-semibold leading-snug ${
            skipped
              ? 'text-amber-700 dark:text-amber-400'
              : checked
                ? 'text-neutral-500 line-through decoration-brand-500/40 dark:text-neutral-500'
                : 'text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {def.label}
        </span>
        {skipped ? (
          <span className="mt-0.5 block text-xs font-medium text-amber-700/90 dark:text-amber-400/90">
            Sengaja di-skip — wajib Sholat Taubat
          </span>
        ) : (
          def.description && (
            <span
              className={`mt-0.5 block text-xs ${
                checked ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {def.description}
            </span>
          )
        )}
        {checked && entry.timestamp && (
          <span
            className={`mt-1 block text-[10px] font-medium ${
              skipped ? 'text-amber-600 dark:text-amber-400' : 'text-brand-600 dark:text-brand-400'
            }`}
          >
            {skipped ? '⊗' : '✓'} {format(parseISO(entry.timestamp), 'HH:mm', { locale: idLocale })}
          </span>
        )}
      </span>
    </button>
  );
}
