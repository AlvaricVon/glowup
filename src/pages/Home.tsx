import { useEffect, useMemo, useState } from 'react';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { ConfirmModal } from '../components/ConfirmModal';
import { HabitGroup } from '../components/HabitGroup';
import { KamarChecklistModal } from '../components/KamarChecklistModal';
import { ProgressBar } from '../components/ProgressBar';
import { QuoteCard } from '../components/QuoteCard';
import { StreakCounter } from '../components/StreakCounter';
import {
  GENSET_HABIT_ID,
  HABITS,
  KAMAR_HABIT_ID,
  PERIOD_LABELS,
  PERIOD_ORDER,
  WORKOUT_HABIT_ID,
} from '../lib/habits';
import { isKamarAllDone, readKamar, toggleKamarItem } from '../lib/kamar';
import { quoteForDate } from '../lib/quotes';
import { computeStreak } from '../lib/streak';
import { useAppStore } from '../store/useAppStore';
import {
  activeHabitCount,
  completedCount,
  formatPretty,
  greetingForHour,
  vibrate,
  weekdayOf,
} from '../lib/utils';

export function Home() {
  const today = useAppStore((s) => s.today);
  const meta = useAppStore((s) => s.meta);
  const history = useAppStore((s) => s.history);
  const toggleHabit = useAppStore((s) => s.toggleHabit);
  const excuseHabit = useAppStore((s) => s.excuseHabit);

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
  const [excuseTarget, setExcuseTarget] = useState<string | null>(null);
  const [kamarOpen, setKamarOpen] = useState(false);
  const [kamarChecked, setKamarChecked] = useState<string[]>([]);

  const todayDate = today?.date ?? '';

  const syncKamarHabit = (checked: string[]) => {
    if (!today) return;
    const done = today.habits[KAMAR_HABIT_ID]?.completed ?? false;
    const all = isKamarAllDone(checked);
    if (all && !done) {
      setConfettiOrigin({ x: window.innerWidth / 2, y: 160 });
      setConfettiKey((k) => k + 1);
      vibrate(15);
      void toggleHabit(KAMAR_HABIT_ID);
    } else if (!all && done) {
      void toggleHabit(KAMAR_HABIT_ID);
    }
  };

  // Muat checklist kamar tiap ganti hari + sinkronin ke habit kalau semua beres.
  useEffect(() => {
    if (!today) return;
    const cur = readKamar(today.date);
    setKamarChecked(cur);
    const done = today.habits[KAMAR_HABIT_ID]?.completed ?? false;
    const all = isKamarAllDone(cur);
    if (all && !done) void toggleHabit(KAMAR_HABIT_ID);
    else if (!all && done) void toggleHabit(KAMAR_HABIT_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDate]);

  const groups = useMemo(() => {
    if (!today) return [];
    const currentDay = weekdayOf(today.date);
    return PERIOD_ORDER.map((p) => {
      const visible = HABITS.filter((h) => h.period === p)
        .filter((h) => {
          if (h.days && !h.days.includes(currentDay)) return false;
          if (h.visible && !h.visible(today)) return false;
          if (!h.conditional) return true;
          return today.conditionals[h.conditional];
        })
        .map((h) => (h.descriptionForDay ? { ...h, description: h.descriptionForDay(currentDay) } : h));
      return { period: p, label: PERIOD_LABELS[p], habits: visible };
    }).filter((g) => g.habits.length > 0);
  }, [today]);

  if (!today || !meta) return null;

  const total = activeHabitCount(today);
  const done = completedCount(today);
  const greeting = greetingForHour(new Date().getHours(), meta.userName || 'kamu');
  const quote = quoteForDate(today.date);

  const applyToggle = (id: string, evt?: React.MouseEvent<HTMLButtonElement>) => {
    const wasCompleted = today.habits[id]?.completed ?? false;
    if (!wasCompleted) {
      if (evt) {
        const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
        setConfettiOrigin({ x: rect.left + 24, y: rect.top + 24 });
      }
      setConfettiKey((k) => k + 1);
      vibrate(15);
    }
    void toggleHabit(id);
  };

  const openKamar = () => {
    const cur = readKamar(today.date);
    setKamarChecked(cur);
    syncKamarHabit(cur);
    setKamarOpen(true);
  };

  const handleKamarToggle = (id: string) => {
    const next = toggleKamarItem(today.date, id);
    setKamarChecked(next);
    syncKamarHabit(next);
  };

  const handleHabitToggle = (id: string, evt: React.MouseEvent<HTMLButtonElement>) => {
    if (id === KAMAR_HABIT_ID) {
      openKamar();
      return;
    }
    applyToggle(id, evt);
  };

  // Double-tap di checkbox workout/genset = excuse.
  const handleHabitAltClick = (id: string) => {
    if (today.habits[id]?.completed) return;
    setExcuseTarget(id);
  };

  const excuseCopy =
    excuseTarget === GENSET_HABIT_ID
      ? {
          title: 'Gak ada genset/motor hari ini?',
          body: 'Konfirmasi: hari ini gak ada genset/motor/mobil yang perlu dipanasin. Check ini dianggap beres buat hari ini.',
          confirm: 'Ya, gak ada',
          label: 'Gak ada genset/motor hari ini',
        }
      : {
          title: 'Hari ini rest day?',
          body: 'Konfirmasi: hari ini rest day (sesuai program Darebee). Workout dianggap beres buat hari ini dan ditandai rest day, jadi HP gak kekunci gara-gara workout.',
          confirm: 'Ya, rest day',
          label: 'Rest day (Darebee)',
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
            altClickHabitIds={[WORKOUT_HABIT_ID, GENSET_HABIT_ID]}
            onHabitAltClick={handleHabitAltClick}
          />
        ))}
      </div>

      <QuoteCard quote={quote} />

      <ConfirmModal
        open={excuseTarget !== null}
        title={excuseCopy.title}
        body={excuseCopy.body}
        confirmLabel={excuseCopy.confirm}
        cancelLabel="Batal"
        onConfirm={() => {
          const t = excuseTarget;
          setExcuseTarget(null);
          if (t) void excuseHabit(t, excuseCopy.label);
        }}
        onCancel={() => setExcuseTarget(null)}
      />

      <KamarChecklistModal
        open={kamarOpen}
        checked={kamarChecked}
        onToggle={handleKamarToggle}
        onClose={() => setKamarOpen(false)}
      />

      <ConfettiBurst trigger={confettiKey} origin={confettiOrigin} />
    </div>
  );
}
