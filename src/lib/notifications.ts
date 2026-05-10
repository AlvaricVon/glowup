import type { ReminderConfig } from './types';

export const DEFAULT_REMINDERS: ReminderConfig[] = [
  { id: 'subuh', label: 'Subuh — masjid time', time: '04:30', enabled: true },
  { id: 'jogging', label: 'Jogging pagi', time: '05:30', enabled: true },
  { id: 'dzuhur', label: 'Dzuhur — masjid time', time: '12:00', enabled: true },
  { id: 'ashar', label: 'Ashar — masjid time', time: '15:15', enabled: true },
  { id: 'workout', label: 'Workout sore (Darebee)', time: '16:30', enabled: true },
  { id: 'maghrib', label: 'Maghrib — masjid time', time: '18:00', enabled: true },
  { id: 'isya', label: 'Isya — masjid time', time: '19:15', enabled: true },
  { id: 'tidur', label: 'Tidur — sebelum jam 12', time: '23:00', enabled: true },
];

export async function ensurePermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

/**
 * Show a local notification right now. Used by the in-page interval scheduler.
 * For background scheduling we'd need Push API + server, which is out of scope
 * for this local-first app — reminders fire while the app/SW is reachable.
 */
export async function showNotification(title: string, body: string, sound: boolean): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  const opts: NotificationOptions = {
    body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    silent: !sound,
    tag: 'glowup-reminder',
  };
  if (reg) {
    await reg.showNotification(title, opts);
  } else {
    new Notification(title, opts);
  }
}

interface ScheduleState {
  /** Map of "yyyy-mm-dd::reminderId" → true once fired today. */
  fired: Set<string>;
  intervalId: number | null;
}

const state: ScheduleState = { fired: new Set(), intervalId: null };

function todayKey(d: Date) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function tick(reminders: ReminderConfig[], soundEnabled: boolean) {
  const now = new Date();
  const key = todayKey(now);
  const minutes = now.getHours() * 60 + now.getMinutes();

  // Reset fired set for today only.
  for (const k of state.fired) {
    if (!k.startsWith(`${key}::`)) state.fired.delete(k);
  }

  for (const r of reminders) {
    if (!r.enabled) continue;
    const [hh, mm] = r.time.split(':').map(Number);
    const target = hh * 60 + mm;
    // Fire if we've crossed the target within the last 2 minutes window.
    if (minutes >= target && minutes < target + 2) {
      const k = `${key}::${r.id}`;
      if (!state.fired.has(k)) {
        state.fired.add(k);
        void showNotification('GlowUp', r.label, soundEnabled);
      }
    }
  }
}

export function startReminderLoop(reminders: ReminderConfig[], soundEnabled: boolean): void {
  stopReminderLoop();
  // Check every 30 seconds while app is open / SW alive.
  state.intervalId = window.setInterval(() => tick(reminders, soundEnabled), 30_000);
  // Run once immediately so just-passed reminders still fire.
  tick(reminders, soundEnabled);
}

export function stopReminderLoop(): void {
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}
