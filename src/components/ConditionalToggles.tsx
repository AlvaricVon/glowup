import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ConditionalKey, DayEntry } from '../lib/types';

interface Props {
  day: DayEntry;
  onToggle: (key: ConditionalKey) => void;
}

const ITEMS: { key: ConditionalKey; q: string }[] = [
  { key: 'kamarKotor', q: 'Kamar kotor hari ini?' },
  { key: 'bauBadan', q: 'Ngerasa bau hari ini?' },
  { key: 'grooming', q: 'Grooming udah berantakan?' },
];

export function ConditionalToggles({ day, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = ITEMS.filter((i) => day.conditionals[i.key]).length;

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white/70 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Toggle kondisional</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {activeCount === 0 ? 'Tap kalo ada yang relevan hari ini' : `${activeCount} aktif`}
          </p>
        </div>
        {open ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
      </button>
      {open && (
        <div className="border-t border-neutral-200/80 px-4 py-3 dark:border-neutral-800/80">
          <div className="space-y-2">
            {ITEMS.map((it) => {
              const on = day.conditionals[it.key];
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => onToggle(it.key)}
                  className="flex w-full items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 text-left dark:bg-neutral-800/60"
                >
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{it.q}</span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      on ? 'bg-brand-500' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        on ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
