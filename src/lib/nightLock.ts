import { useAppStore } from '../store/useAppStore';
import { calculateDayPrayers, type PrayerKey } from './prayer';
import { getCachedCoords } from './location';
import { readPrayerSettings } from './prayerSettings';
import type { DayEntry, Period } from './types';
import { activeHabitsForDay, todayKey } from './utils';
import {
  enterLockdown,
  exitLockdown,
  isNative,
  nativeActivateNightLock,
  nativeDeactivateNightLock,
  nativeScheduleNightAlarm,
} from './lockdown';

/**
 * Whitelist shared by every gate (night + day period gates). Apps the user is
 * still allowed to open while a gate is locked: this app, WhatsApp, Spotify,
 * the Clock/Timer, and the Qur'an app.
 */
export const NIGHT_WHITELIST = [
  'app.voskhod',
  'com.whatsapp',
  'com.spotify.music',
  'com.android.deskclock',
  'com.andi.alquran.id',
];
export const NIGHT_START_HOUR = 22;

/**
 * Gate periods. The gate for a period becomes due at its "start" time and stays
 * locked until every active habit of that period for the day is completed.
 *  - pagi  -> starts at Subuh
 *  - siang -> starts at Dzuhur
 *  - sore  -> starts at Ashar
 *  - night -> starts at 22.00 and requires all pagi habits done
 */
export type GatePeriod = 'pagi' | 'siang' | 'sore' | 'night';

const NIGHT_STATE_KEY = 'glowup-night-lock';
const NIGHT_ENABLED_KEY = 'glowup-night-enabled';

export interface NightLockState {
  active: boolean;
  date: string;
  /** Which gate is currently holding the lock. */
  gate?: GatePeriod;
}

const GATE_PERIODS: GatePeriod[] = ['pagi', 'siang', 'sore', 'night'];

function readState(): NightLockState {
  try {
    const raw = localStorage.getItem(NIGHT_STATE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === 'object' && 'active' in o) {
        const gate = GATE_PERIODS.includes(o.gate) ? (o.gate as GatePeriod) : undefined;
        return { active: !!o.active, date: typeof o.date === 'string' ? o.date : '', gate };
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

/** Every active habit of `period` for the day is completed. */
export function periodDone(day: DayEntry | null, period: Period): boolean {
  if (!day) return false;
  const hs = activeHabitsForDay(day).filter((h) => h.period === period);
  if (hs.length === 0) return true;
  return hs.every((h) => day.habits[h.id]?.completed === true);
}

export function allPagiDone(day: DayEntry | null): boolean {
  return periodDone(day, 'pagi');
}

export function pagiRemaining(day: DayEntry | null): number {
  if (!day) return 0;
  return activeHabitsForDay(day).filter((h) => h.period === 'pagi' && !day.habits[h.id]?.completed).length;
}

const DAY_GATE_DEFS: { period: 'pagi' | 'siang' | 'sore'; prayer: PrayerKey; fallbackHour: number }[] = [
  { period: 'pagi', prayer: 'subuh', fallbackHour: 5 },
  { period: 'siang', prayer: 'dzuhur', fallbackHour: 12 },
  { period: 'sore', prayer: 'ashar', fallbackHour: 15 },
];

/** When the given day gate becomes due (prayer time, or a fixed hour fallback). */
export function gateStartFor(period: 'pagi' | 'siang' | 'sore', now: Date): Date {
  const def = DAY_GATE_DEFS.find((g) => g.period === period);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), def?.fallbackHour ?? 5, 0, 0, 0);
  try {
    const coords = getCachedCoords();
    if (coords) {
      const times = calculateDayPrayers({
        latitude: coords.latitude,
        longitude: coords.longitude,
        method: readPrayerSettings().method,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      });
      const t = times.find((p) => p.key === def?.prayer)?.time;
      if (t) return new Date(t.getTime());
    }
  } catch {
    // fall back to the fixed hour
  }
  return start;
}

/** Whether the lock held by `gate` may be released (its habits are done). */
export function gateDone(day: DayEntry | null, gate: GatePeriod): boolean {
  if (gate === 'night') return periodDone(day, 'pagi');
  return periodDone(day, gate);
}

/**
 * The gate that should currently hold the lock, or null if the phone is free.
 * Day gates are checked earliest-first, so an undone earlier period keeps the
 * phone locked even once a later period has started.
 */
export function evaluateGate(day: DayEntry | null, now: Date): GatePeriod | null {
  if (!day) return null;
  if (now.getHours() >= NIGHT_START_HOUR) {
    return periodDone(day, 'pagi') ? null : 'night';
  }
  for (const g of DAY_GATE_DEFS) {
    if (now >= gateStartFor(g.period, now) && !periodDone(day, g.period)) return g.period;
  }
  return null;
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

/** Activate a gate: native whitelist switches to NIGHT_WHITELIST + LockTask. */
export async function applyGate(gate: GatePeriod): Promise<boolean> {
  if (!isNative()) return false;
  await nativeActivateNightLock();
  const res = await enterLockdown();
  setState({ active: true, date: todayKey(), gate });
  return !!(res && res.deviceOwner);
}

/** Re-assert an already-active gate (e.g. after reboot / re-entry to the app). */
export async function ensureGate(gate: GatePeriod): Promise<boolean> {
  if (!isNative()) return false;
  await nativeActivateNightLock();
  const res = await enterLockdown();
  setState({ active: true, date: state.date || todayKey(), gate });
  return !!(res && res.deviceOwner);
}

/** Activate the night gate (manual / legacy entry point). */
export async function applyNightLock(): Promise<boolean> {
  return applyGate('night');
}

/** Re-assert the currently-held gate. */
export async function ensureNightLock(): Promise<boolean> {
  return ensureGate(state.gate ?? 'night');
}

/** Release any gate: whitelist restored to the saved normal list, LockTask off. */
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
      currentGate: evaluateGate(useAppStore.getState().today ?? null, new Date()),
    }),
  };
}