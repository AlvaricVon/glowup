import { Check, ClipboardList, X } from 'lucide-react';
import { KAMAR_ITEMS } from '../lib/kamar';

interface Props {
  open: boolean;
  checked: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}

export function KamarChecklistModal({ open, checked, onToggle, onClose }: Props) {
  if (!open) return null;
  const done = checked.length;
  const total = KAMAR_ITEMS.length;
  const allDone = done >= total;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85dvh] w-full max-w-sm animate-slide-up flex-col rounded-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/15">
              <ClipboardList className="text-brand-600 dark:text-brand-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Beresin kamar</h2>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {done}/{total} beres{allDone ? ' — mantap, semua kelar!' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>

        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
          {KAMAR_ITEMS.map((item) => {
            const isChecked = checked.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
                  isChecked
                    ? 'border-brand-500/30 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10'
                    : 'border-neutral-200/80 bg-white hover:border-neutral-300 dark:border-neutral-800/80 dark:bg-neutral-900/60 dark:hover:border-neutral-700'
                }`}
                aria-pressed={isChecked}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                    isChecked
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-neutral-300 bg-transparent dark:border-neutral-700'
                  }`}
                >
                  {isChecked && <Check size={16} strokeWidth={3.5} className="text-white" />}
                </span>
                <span
                  className={`text-[15px] font-semibold ${
                    isChecked
                      ? 'text-neutral-500 line-through decoration-brand-500/40 dark:text-neutral-500'
                      : 'text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
