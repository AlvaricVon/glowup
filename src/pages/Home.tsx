import { useMemo, useState } from 'react';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { ConfirmModal } from '../components/ConfirmModal';
import { HabitGroup } from '../components/HabitGroup';
import { ProgressBar } from '../components/ProgressBar';
import { PrayerPanel } from '../components/PrayerPanel';
import { QuoteCard } from '../components/QuoteCard';
import { StreakCounter } from '../components/StreakCounter';
import { HABITS, PERIOD_LABELS, PERIOD_ORDER, PRAYER_HABIT_IDS, TAUBAT_HABIT_ID } from '../lib/habits';
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
  const [prayerPanelOpen, setPrayerPanelOpen] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState<{ x: number; y: number } | undefined>();
  const [taubatConfirmOpen, setTaubatConfirmOpen] = useState(false);

  // Sholat Taubat <-> 5 sholat wajib saling eksklusif:
  // - semua sholat wajib kelar  -> taubat kekunci (gak perlu tobat).
  // - taubat dicentang          -> sholat wajib yang belum kelar kekunci (yang sengaja di-skip).
  const taubatDone = today?.habits?.[TAUBAT_HABIT_ID]?.completed ?? false;
  const prayersAllDone = PRAYER_HABIT_IDS.every((id) => today?.habits?.[id]?.completed);
  const disabledIds = useMemo(() => {
    if (!today) return [] as string[];
    const out: string[] = [];
    if (taubatDone) {
      for (const id of PRAYER_HABIT_IDS) {
        if (!today.habits[id]?.completed) out.push(id);
      }
    } else if (prayersAllDone) {
      out.push(TAUBAT_HABIT_ID);
    }
    return out;
  }, [today, taubatDone, prayersAllDone]);

  const groups = useMemo(() => {
    if (!today) return [];
    const currentDay = weekdayOf(today.date);
    return PERIOD_ORDER.map((p) => {
      const all = HABITS.filter((h) => h.period === p);
      const visible = all
        .filter((h) => {
          if (h.days && !h.days.includes(currentDay)) return false;
          if (!h.conditional) return true;
          return today.conditionals[h.conditional];
        })
        .map((h) =>
          h.descriptionForDay
            ? { ...h, description: h.descriptionForDay(currentDay) }
            : h,
        );
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

  const handleHabitToggle = (id: string, evt: React.MouseEvent<HTMLButtonElement>) => {
    if (disabledIds.includes(id)) return;
    // Centang Sholat Taubat wajib lewat konfirmasi serius dulu.
    if (id === TAUBAT_HABIT_ID && !(today.habits[id]?.completed ?? false)) {
      setTaubatConfirmOpen(true);
      return;
    }
    applyToggle(id, evt);
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
            disabledIds={disabledIds}
            longPressHabitId="subuh-masjid"
            onHabitLongPress={() => setPrayerPanelOpen(true)}
          />
        ))}
      </div>

      <QuoteCard quote={quote} />

      {prayerPanelOpen && <PrayerPanel onClose={() => setPrayerPanelOpen(false)} />}

      <ConfirmModal
        open={taubatConfirmOpen}
        title="Sholat Taubat — serius ya"
        body="Sholat Taubat cuma buat nutup sholat wajib yang SENGAJA kamu tinggalin. Centang ini artinya kamu ngaku & beneran niat tobat, gak main-main. Begitu dicentang, sholat wajib yang belum kelar hari ini bakal kekunci (gak bisa dicentang lagi). Yakin mau lanjut?"
        confirmLabel="Ya, gw serius"
        cancelLabel="Batal"
        onConfirm={() => {
          setTaubatConfirmOpen(false);
          applyToggle(TAUBAT_HABIT_ID);
        }}
        onCancel={() => setTaubatConfirmOpen(false)}
      />

      <ConfettiBurst trigger={confettiKey} origin={confettiOrigin} />
    </div>
  );
}
