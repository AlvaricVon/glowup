export type Period = 'pagi' | 'siang' | 'sore' | 'malam' | 'limit' | 'conditional';

export type ConditionalKey = never;

export interface HabitDef {
  id: string;
  label: string;
  description?: string;
  period: Period;
  priority: number;
  /** If set, habit only shows when the matching conditional toggle in the day entry is true. */
  conditional?: ConditionalKey;
}

export interface HabitEntry {
  completed: boolean;
  /** ISO timestamp when the habit was last toggled to completed. */
  timestamp: string | null;
}

export interface DayEntry {
  /** YYYY-MM-DD in local timezone. */
  date: string;
  habits: Record<string, HabitEntry>;
  /** 0..1, fraction of active habits completed. */
  completionRate: number;
  conditionals: Record<ConditionalKey, boolean>;
}

export interface ReminderConfig {
  id: string;
  label: string;
  /** "HH:mm" 24-hour. */
  time: string;
  enabled: boolean;
}

export interface AppMeta {
  userName: string;
  onboarded: boolean;
  longestStreak: number;
  /** Date string YYYY-MM-DD when freeze was last used. */
  freezeUsedDates: string[];
  reminders: ReminderConfig[];
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  meta: AppMeta;
  days: DayEntry[];
}
