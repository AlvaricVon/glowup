import { useMemo, useState } from 'react';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { HabitGroup } from '../components/HabitGroup';
import { ProgressBar } from '../components/ProgressBar';
import { QuoteCard } from '../components/QuoteCard';
import { StreakCounter } from '../components/StreakCounter';
import { HABITS, PERIOD_LABELS, PERIOD_ORDER } from '../lib/habits';
import { quoteForDate } from '../lib/quotes';
import { computeStreak } from '../lib/streak';
import { useAppStore } from '../store/useAppStore';
import {
  activeHabitCount,
  completedCount,
  formatPretty,
  greetingForHour,
  vibrate,
} from '../lib/utils';

export function Home() {
  const today = useAppStore((s) => s.today);
  const meta = useAppStore((s) => s.meta);
  const history = useAppStore((s) => s.history);
  const toggleHabit = useAppStore((s) => s.toggleHabit);

  // Compute streak via useMemo to avoid Zustand v5 infinite-loop:
  // selectors that return new objects on each call cause useSyncExternalStore
  // to think state changed every render → React error #185.
  const streak = useMemo(
    () =>
      meta
        ? computeStreak(history, meta.freezeUsedDates)
        : { current: 0, freezeUsedThisWeek: false, consumedFreezeDates: [] },
    [history, meta],
  );

  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiOrigin, setConfettiOrigin] = useState<{ x: number; y: number } | undefined>();

  const groups = useMemo(() => {
    if (!today) return [];
    return PERIOD_ORDER.map((p) => {
      const all = HABITS.filter((h) => h.period === p);
      const visible = all.filter((h) => {
        if (!h.conditional) return true;
        return today.conditionals[h.conditional];
      });
      return { period: p, label: PERIOD_LABELS[p], habits: visible };
    }).filter((g) => g.habits.length > 0);
  }, [today]);

  if (!today || !meta) return null;

  const total = activeHabitCount(today);
  const done = completedCount(today);
  const greeting = greetingForHour(new Date().getHours(), meta.userName || 'kamu');
  const quote = quoteForDate(today.date);

  const handleHabitToggle = (id: string, evt: React.MouseEvent<HTMLButtonElement>) => {
    const wasCompleted = today.habits[id]?.completed ?? false;
    if (!wasCompleted) {
      const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
      setConfettiOrigin({ x: rect.left + 24, y: rect.top + 24 });
      setConfettiKey((k) => k + 1);
      vibrate(15);
    }
    void toggleHabit(id);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          {formatPretty(today.date)}
        </p>
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">{greeting}</h1>
      </header>

      <StreakCounter
        current={streak.current}
        longest={meta.longestStreak}
        freezeUsedThisWeek={streak.freezeUsedThisWeek}
      />

      <ProgressBar done={done} total={total} />

      <div className="space-y-5">
        {groups.map((g) => (
          <HabitGroup
            key={g.period}
            period={g.period}
            label={g.label}
            habits={g.habits}
            entries={today.habits}
            onToggle={handleHabitToggle}
          />
        ))}
      </div>

      <QuoteCard quote={quote} />

      <ConfettiBurst trigger={confettiKey} origin={confettiOrigin} />
    </div>
  );
}
