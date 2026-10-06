import { create } from 'zustand';
import type { PrayerMethodKey } from './prayer';

const STORAGE_KEY = 'glowup-prayer-settings';

export interface PrayerSettings {
  /** Master switch for the sholat gate. */
  enabled: boolean;
  /** Enter native LockTask (hard lock) vs. only the in-app overlay. */
  lockEnabled: boolean;
  /** Auto-tick the matching sholat habit when the user confirms. */
  autoCheckHabits: boolean;
  method: PrayerMethodKey;
}

export const DEFAULT_SETTINGS: PrayerSettings = {
  enabled: true,
  lockEnabled: true,
  autoCheckHabits: true,
  method: 'singapore',
};

function load(): PrayerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PrayerSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
      lockEnabled: parsed.lockEnabled ?? DEFAULT_SETTINGS.lockEnabled,
      autoCheckHabits: parsed.autoCheckHabits ?? DEFAULT_SETTINGS.autoCheckHabits,
      method: parsed.method ?? DEFAULT_SETTINGS.method,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

interface SettingsState extends PrayerSettings {
  set: (patch: Partial<PrayerSettings>) => void;
  reset: () => void;
}

export const usePrayerSettings = create<SettingsState>((set, get) => ({
  ...load(),
  set: (patch) => {
    const next = { ...get(), ...patch };
    const toSave: PrayerSettings = {
      enabled: next.enabled,
      lockEnabled: next.lockEnabled,
      autoCheckHabits: next.autoCheckHabits,
      method: next.method,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // noop
    }
    set(patch);
  },
  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
    set({ ...DEFAULT_SETTINGS });
  },
}));

/** Non-reactive read for code that must not subscribe (timers, refs). */
export function readPrayerSettings(): PrayerSettings {
  const s = usePrayerSettings.getState();
  return {
    enabled: s.enabled,
    lockEnabled: s.lockEnabled,
    autoCheckHabits: s.autoCheckHabits,
    method: s.method,
  };
}