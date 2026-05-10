import { Quote as QuoteIcon } from 'lucide-react';
import type { Quote } from '../lib/quotes';

interface Props {
  quote: Quote;
}

export function QuoteCard({ quote }: Props) {
  return (
    <div className="relative rounded-2xl border border-brand-500/20 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
      <QuoteIcon size={18} className="mb-2 text-brand-500" />
      <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
        &ldquo;{quote.text}&rdquo;
      </p>
      {quote.source && (
        <p className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-400">— {quote.source}</p>
      )}
    </div>
  );
}
