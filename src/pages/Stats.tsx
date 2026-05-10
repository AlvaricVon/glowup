import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Flame, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Heatmap } from '../components/Heatmap';
import { EmptyState } from '../components/EmptyState';
import { HABITS_BY_ID } from '../lib/habits';
import type { DayEntry } from '../lib/types';
import { activeHabitsForDay, formatShort } from '../lib/utils';
import { selectStreak, useAppStore } from '../store/useAppStore';

type Period = 7 | 30 | 90;

export function Stats() {
  const history = useAppStore((s) => s.history);
  const meta = useAppStore((s) => s.meta);
  const streak = useAppStore(selectStreak);
  const [period, setPeriod] = useState<Period>(30);

  const completedDays = history.filter((d) => d.completionRate > 0);

  const sliced = useMemo(() => {
    return history.slice(-period).map((d) => ({
      date: d.date,
      label: formatShort(d.date),
      pct: Math.round(d.completionRate * 100),
    }));
  }, [history, period]);

  const skipStats = useMemo(() => topSkipped(history, 5), [history]);
  const topConsistent = useMemo(() => topConsistent_(history, 1), [history]);
  const avgRate = useMemo(() => {
    if (completedDays.length === 0) return 0;
    const sum = completedDays.reduce((acc, d) => acc + d.completionRate, 0);
    return Math.round((sum / completedDays.length) * 100);
  }, [completedDays]);

  if (!meta || history.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-10">
        <EmptyState
          icon={Activity}
          title="Belum ada data"
          body="Mulai centangin habit lo di tab Today, nanti grafiknya muncul di sini."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Stats & Progress</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Track perkembangan lo dari waktu ke waktu.
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="text-orange-500" />}
          label="Current streak"
          value={`${streak.current} hari`}
        />
        <StatCard
          icon={<Sparkles className="text-yellow-500" />}
          label="Longest streak"
          value={`${meta.longestStreak} hari`}
        />
        <StatCard
          icon={<Activity className="text-brand-500" />}
          label="Hari aktif"
          value={`${completedDays.length}`}
        />
        <StatCard
          icon={<TrendingUp className="text-blue-500" />}
          label="Avg completion"
          value={`${avgRate}%`}
        />
      </div>

      {/* Period switcher + line chart */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Completion rate</h3>
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
            {([7, 30, 90] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  p === period
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {p}D
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={sliced} margin={{ top: 5, right: 8, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 50, 100]}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                formatter={(v: number) => [`${v}%`, 'Completion']}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <Heatmap days={history} weeks={12} />

      {/* Top skipped */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="mb-3 flex items-center gap-2">
          <TrendingDown className="text-red-500" size={16} />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Habit paling sering di-skip</h3>
        </div>
        {skipStats.length === 0 ? (
          <p className="text-xs text-neutral-500">Belum ada data cukup.</p>
        ) : (
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart
                layout="vertical"
                data={skipStats}
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none' }}
                  formatter={(v: number) => [`${v}x`, 'Di-skip']}
                />
                <Bar dataKey="count" fill="#f87171" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Best/worst */}
      <div className="grid grid-cols-1 gap-3">
        {topConsistent[0] && (
          <div className="flex items-center gap-3 rounded-2xl border border-brand-500/20 bg-brand-50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
            <Sparkles className="shrink-0 text-brand-500" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand-700 dark:text-brand-400">
                Habit paling konsisten
              </p>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {topConsistent[0].label}{' '}
                <span className="font-medium text-neutral-500">
                  ({topConsistent[0].rate}%)
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white/70 p-3 dark:border-neutral-800/70 dark:bg-neutral-900/60">
      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
        {icon}
      </div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="text-lg font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  );
}

function topSkipped(days: DayEntry[], n: number): { id: string; label: string; count: number }[] {
  const counter = new Map<string, number>();
  for (const d of days) {
    const active = activeHabitsForDay(d);
    for (const h of active) {
      const e = d.habits[h.id];
      if (!e?.completed) counter.set(h.id, (counter.get(h.id) ?? 0) + 1);
    }
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({
      id,
      label: HABITS_BY_ID[id]?.label ?? id,
      count,
    }));
}

function topConsistent_(days: DayEntry[], n: number) {
  const totals = new Map<string, { hit: number; total: number }>();
  for (const d of days) {
    const active = activeHabitsForDay(d);
    for (const h of active) {
      const cur = totals.get(h.id) ?? { hit: 0, total: 0 };
      cur.total += 1;
      if (d.habits[h.id]?.completed) cur.hit += 1;
      totals.set(h.id, cur);
    }
  }
  return [...totals.entries()]
    .filter(([, v]) => v.total >= 3)
    .map(([id, v]) => ({
      id,
      label: HABITS_BY_ID[id]?.label ?? id,
      rate: Math.round((v.hit / v.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, n);
}
