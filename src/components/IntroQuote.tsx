import { Quote as QuoteIcon, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Quote } from '../lib/quotes';
import { vibrate } from '../lib/utils';

interface Props {
  quote: Quote;
  onClose: () => void;
}

/**
 * Full-screen intro quote overlay. Shown once per app open,
 * auto-dismisses after a few seconds or when tapped.
 */
export function IntroQuote({ quote, onClose }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(t);
  }, [onClose]);

  const dismiss = () => {
    vibrate(10);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quote hari ini"
      onClick={dismiss}
      className="fixed inset-0 z-50 flex animate-fade-in cursor-pointer items-center justify-center bg-neutral-950/80 px-6 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Tutup"
        className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:text-neutral-200"
      >
        <X size={20} />
      </button>

      <div className="w-full max-w-sm animate-slide-up rounded-3xl border border-brand-500/25 bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10">
          <QuoteIcon size={20} className="text-brand-500" />
        </div>
        <p className="text-lg font-semibold leading-relaxed text-neutral-900 dark:text-neutral-100">
          &ldquo;{quote.text}&rdquo;
        </p>
        {quote.source && (
          <p className="mt-3 text-xs font-medium text-brand-700 dark:text-brand-400">— {quote.source}</p>
        )}
        <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
          Tap di mana aja buat lanjut
        </p>
      </div>
    </div>
  );
}