import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useMemo } from 'react';
import type { DayEntry } from '../lib/types';

interface Props {
  days: DayEntry[];
  weeks?: number;
}

const DAY_LABELS = ['S', 'S', 'R', 'K', 'J', 'S', 'M']; // Sen-Min (id), starts Mon

function colorFor(rate: number | null): string {
  if (rate === null) return 'bg-neutral-200/60 dark:bg-neutral-800/60';
  if (rate < 0.2) return 'bg-brand-200 dark:bg-brand-900/50';
  if (rate < 0.4) return 'bg-brand-300 dark:bg-brand-800/70';
  if (rate < 0.6) return 'bg-brand-400 dark:bg-brand-700';
  if (rate < 0.8) return 'bg-brand-500 dark:bg-brand-600';
  return 'bg-brand-600 dark:bg-brand-500';
}

export function Heatmap({ days, weeks = 12 }: Props) {
  const grid = useMemo(() => {
    const map = new Map(days.map((d) => [d.date, d.completionRate]));
    const today = new Date();
    const startMonday = startOfWeek(addDays(today, -(weeks - 1) * 7), { weekStartsOn: 1 });
    const cols: { date: string; rate: number | null; future: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: { date: string; rate: number | null; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = addDays(startMonday, w * 7 + d);
        const key = format(dt, 'yyyy-MM-dd');
        const future = dt > today;
        const rate = future ? null : map.has(key) ? (map.get(key) as number) : null;
        col.push({ date: key, rate, future });
      }
      cols.push(col);
    }
    return cols;
  }, [days, weeks]);

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Activity heatmap</h3>
        <span className="text-[11px] text-neutral-500">{weeks} minggu terakhir</span>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5" style={{ minWidth: weeks * 18 }}>
          <div className="flex flex-col gap-1.5 pt-0.5">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="h-3 text-[9px] font-semibold leading-3 text-neutral-400">
                {i % 2 === 0 ? d : ''}
              </span>
            ))}
          </div>
          {grid.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1.5">
              {col.map((cell) => (
                <div
                  key={cell.date}
                  className={`h-3 w-3 rounded-sm ${colorFor(cell.future ? null : cell.rate)} ${
                    cell.future ? 'opacity-30' : ''
                  }`}
                  title={`${format(parseISO(cell.date), 'd MMM', { locale: idLocale })}${
                    cell.rate !== null ? ` — ${Math.round(cell.rate * 100)}%` : ''
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-medium text-neutral-500">
        <span>kurang</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <span key={r} className={`h-2.5 w-2.5 rounded-sm ${colorFor(r)}`} />
        ))}
        <span>banyak</span>
      </div>
    </div>
  );
}
