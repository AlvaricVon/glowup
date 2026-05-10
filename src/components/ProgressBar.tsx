interface Props {
  done: number;
  total: number;
}

export function ProgressBar({ done, total }: Props) {
  const pct = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Progress hari ini</span>
        <span className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {done}
          <span className="text-neutral-400 dark:text-neutral-600">/{total}</span>
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500 ease-out"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-1.5 text-right text-xs font-semibold text-brand-600 dark:text-brand-400">
        {Math.round(pct * 100)}%
      </div>
    </div>
  );
}
