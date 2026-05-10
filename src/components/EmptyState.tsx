import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, body, cta }: Props) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 bg-white/40 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <Icon size={28} strokeWidth={2} />
      </div>
      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{body}</p>
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
