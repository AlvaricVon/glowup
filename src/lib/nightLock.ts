import { useAppStore } from '../store/useAppStore';
import type { DayEntry } from './types';
import { activeHabitsForDay, todayKey } from './utils';
import {
  enterLockdown,
  exitLockdown,
  isNative,
  nativeActivateNightLock,
  nativeDeactivateNightLock,
  nativeScheduleNightAlarm,
} from './lockdown';

export const NIGHT_WHITELIST = ['app.voskhod', 'com.whatsapp', 'com.android.deskclock', 'com.andi.alquran.id'];
export const NIGHT_START_HOUR = 22;

const NIGHT_STATE_KEY = 'glowup-night-lock';
const NIGHT_ENABLED_KEY = 'glowup-night-enabled';

export interface NightLockState {
  active: boolean;
  date: string;
}

function readState(): NightLockState {
  try {
    const raw = localStorage.getItem(NIGHT_STATE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && 'active' in o) {
        return { active: !!o.active, date: typeof o.date === 'string' ? o.date : '' };
      }
    }
  } catch {
    // ignore
  }
  return { active: false, date: '' };
}

let state: NightLockState = readState();
const listeners = new Set<() => void>();

function setState(next: NightLockState) {
  state = next;
  try {
    localStorage.setItem(NIGHT_STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  for (const l of listeners) l();
}

export function getNightLockState(): NightLockState {
  return state;
}

export function subscribeNightLock(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function isNightWindow(d: Date): boolean {
  return d.getHours() >= NIGHT_START_HOUR;
}

export function allPagiDone(day: DayEntry | null): boolean {
  if (!day) return false;
  const pagi = activeHabitsForDay(day).filter((h) => h.period === 'pagi');
  if (pagi.length === 0) return true;
  return pagi.every((h) => day.habits[h.id]?.completed === true);
}

export function pagiRemaining(day: DayEntry | null): number {
  if (!day) return 0;
  return activeHabitsForDay(day).filter((h) => h.period === 'pagi' && !day.habits[h.id]?.completed).length;
}

export function isNightLockEnabled(): boolean {
  try {
    return localStorage.getItem(NIGHT_ENABLED_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setNightLockEnabled(v: boolean) {
  try {
    localStorage.setItem(NIGHT_ENABLED_KEY, v ? '1' : '0');
  } catch {
    // ignore
  }
}

/** Activate the night lock: native whitelist switches to NIGHT_WHITELIST + LockTask. */
export async function applyNightLock(): Promise<boolean> {
  if (!isNative()) return false;
  await nativeActivateNightLock();
  const res = await enterLockdown();
  setState({ active: true, date: todayKey() });
  return !!(res && res.deviceOwner);
}

/** Re-assert an already-active night lock (e.g. after reboot / re-entry to the app). */
export async function ensureNightLock(): Promise<boolean> {
  if (!isNative()) return false;
  await nativeActivateNightLock();
  const res = await enterLockdown();
  setState({ active: true, date: state.date || todayKey() });
  return !!(res && res.deviceOwner);
}

/** Release the night lock: whitelist restored to the saved normal list, LockTask off. */
export async function releaseNightLock(): Promise<boolean> {
  if (!isNative()) return false;
  await nativeDeactivateNightLock();
  await exitLockdown();
  setState({ active: false, date: '' });
  return true;
}

/** Dev/testing helper: complete every active pagi habit for today. */
export async function completeAllPagiHabits(): Promise<number> {
  const day = useAppStore.getState().today;
  if (!day) return 0;
  const pagi = activeHabitsForDay(day).filter((h) => h.period === 'pagi' && !day.habits[h.id]?.completed);
  for (const h of pagi) {
    // Await each one so the sequential store writes don't lose updates.
    await useAppStore.getState().toggleHabit(h.id);
  }
  return pagi.length;
}

if (isNative()) {
  window.__glowup = {
    ...(window.__glowup ?? {}),
    nightApply: () => applyNightLock().then(Boolean),
    nightRelease: () => releaseNightLock().then(Boolean),
    nightCompleteAllPagi: () => completeAllPagiHabits(),
    scheduleNightAlarm: () => nativeScheduleNightAlarm(),
    getNightState: () => ({
      ...getNightLockState(),
      pagiRemaining: pagiRemaining(useAppStore.getState().today ?? null),
    }),
  };
}