import { create } from 'zustand';
import * as db from '../lib/db';
import { DEFAULT_REMINDERS } from '../lib/notifications';
import { computeLongestStreak } from '../lib/streak';
import type { AppMeta, ConditionalKey, DayEntry } from '../lib/types';
import { buildEmptyDay, calcCompletionRate, todayKey } from '../lib/utils';

interface AppState {
  meta: AppMeta | null;
  today: DayEntry | null;
  history: DayEntry[]; // includes today
  loading: boolean;

  hydrate: () => Promise<void>;
  finishOnboarding: (name: string, notificationsEnabled: boolean) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  toggleConditional: (key: ConditionalKey) => Promise<void>;
  updateMeta: (patch: Partial<AppMeta>) => Promise<void>;
  resetAll: () => Promise<void>;
  importPayload: (payload: unknown) => Promise<void>;
}

function defaultMeta(): AppMeta {
  return {
    userName: '',
    onboarded: false,
    longestStreak: 0,
    freezeUsedDates: [],
    reminders: DEFAULT_REMINDERS,
    theme: 'auto',
    soundEnabled: true,
    notificationsEnabled: false,
    createdAt: new Date().toISOString(),
  };
}

async function ensureTodayEntry(): Promise<DayEntry> {
  const key = todayKey();
  let day = await db.getDay(key);
  if (!day) {
    day = buildEmptyDay(key);
    await db.putDay(day);
  }
  return day;
}

export const useAppStore = create<AppState>((set, get) => ({
  meta: null,
  today: null,
  history: [],
  loading: true,

  async hydrate() {
    set({ loading: true });
    let meta = await db.getMeta();
    if (!meta) {
      meta = defaultMeta();
      await db.putMeta(meta);
    }
    const today = await ensureTodayEntry();
    const history = await db.getAllDays();
    set({ meta, today, history, loading: false });
  },

  async finishOnboarding(name, notificationsEnabled) {
    const cur = get().meta ?? defaultMeta();
    const next: AppMeta = {
      ...cur,
      userName: name.trim() || 'kamu',
      onboarded: true,
      notificationsEnabled,
    };
    await db.putMeta(next);
    set({ meta: next });
  },

  async toggleHabit(habitId) {
    const cur = get().today;
    if (!cur) return;
    const existing = cur.habits[habitId] ?? { completed: false, timestamp: null };
    const completed = !existing.completed;
    const next: DayEntry = {
      ...cur,
      habits: {
        ...cur.habits,
        [habitId]: {
          completed,
          timestamp: completed ? new Date().toISOString() : null,
        },
      },
    };
    next.completionRate = calcCompletionRate(next);
    await db.putDay(next);

    // Update history list with this day swapped in.
    const history = get().history.filter((d) => d.date !== next.date);
    history.push(next);
    history.sort((a, b) => a.date.localeCompare(b.date));

    // Update longest streak if applicable.
    const meta = get().meta;
    if (meta) {
      const longest = computeLongestStreak(history);
      if (longest > meta.longestStreak) {
        const updated = { ...meta, longestStreak: longest };
        await db.putMeta(updated);
        set({ meta: updated });
      }
    }
    set({ today: next, history });
  },

  async toggleConditional(key) {
    const cur = get().today;
    if (!cur) return;
    const next: DayEntry = {
      ...cur,
      conditionals: { ...cur.conditionals, [key]: !cur.conditionals[key] },
    };
    next.completionRate = calcCompletionRate(next);
    await db.putDay(next);
    const history = get().history.filter((d) => d.date !== next.date);
    history.push(next);
    history.sort((a, b) => a.date.localeCompare(b.date));
    set({ today: next, history });
  },

  async updateMeta(patch) {
    const cur = get().meta;
    if (!cur) return;
    const next: AppMeta = { ...cur, ...patch };
    await db.putMeta(next);
    set({ meta: next });
  },

  async resetAll() {
    await db.clearAll();
    const meta = defaultMeta();
    await db.putMeta(meta);
    const today = buildEmptyDay(todayKey());
    await db.putDay(today);
    set({ meta, today, history: [today] });
  },

  async importPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('File invalid');
    }
    await db.importAll(payload as Parameters<typeof db.importAll>[0]);
    await get().hydrate();
  },
}));
