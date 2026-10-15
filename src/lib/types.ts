export type Period = 'pagi' | 'siang' | 'sore' | 'mindset' | 'malam' | 'limit' | 'conditional';

export type ConditionalKey = never;

export interface HabitDef {
  id: string;
  label: string;
  description?: string;
  period: Period;
  priority: number;
  /** If set, habit only shows on these days of the week (0=Sun, 1=Mon, ..., 6=Sat). */
  days?: number[];
  /** If set, habit only shows when the matching conditional toggle in the day entry is true. */
  conditional?: ConditionalKey;
  /** If set, overrides `description` with a day-of-week aware string (0=Sun..6=Sat). */
  descriptionForDay?: (day: number) => string;
}

export interface HabitEntry {
  completed: boolean;
  /** ISO timestamp when the habit was last toggled to completed. */
  timestamp: string | null;
  /** Prayer intentionally skipped (triple-tap): counts as done for gating but must be covered by Sholat Taubat. */
  skipped?: boolean;
  /**
   * Habit sengaja di-excuse (mis. gak puasa hari ini / rest day): dianggap beres
   * (gak nge-lock, gak wajib Taubat, tetep dihitung buat progress 100%).
   */
  excused?: boolean;
  /** Alasan singkat yang ditampilin di checkbox (mis. "Gak puasa hari ini"). */
  excuseLabel?: string;
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
